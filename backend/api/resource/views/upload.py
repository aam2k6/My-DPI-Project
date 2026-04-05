
import os
import json
from django.http import JsonResponse, HttpRequest
from django.utils import timezone
from django.core import serializers
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import make_aware
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from django.conf import settings
from pypdf import PdfReader,PdfWriter
import shutil
from django.http import FileResponse, Http404

from api.models import Locker, Resource, CustomUser, Connection ,Notification , ConnectionType
from api.model.xnode_model import Xnode_V2
from api.serializers import ResourceSerializer, XnodeV2Serializer
from django.db import models
from django.db.models import Q
from api.serializers import ConnectionSerializer

from rest_framework_simplejwt.authentication import JWTAuthentication
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from rest_framework_simplejwt.tokens import RefreshToken
from api.utils.google_drive_helper.drive_helper import user_has_drive_access,make_drive_file_public,get_or_refresh_google_token

import math
import requests
from django.http import StreamingHttpResponse, HttpResponse, JsonResponse
from django.utils.http import http_date
from django.utils.decorators import method_decorator
from api.utils.resource_helper.access_resource_helper import access_Resource

from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiResponse
from rest_framework import serializers

@csrf_exempt
@extend_schema(
    description="Creates a resource for a particular locker...",
    request={
        'application/x-www-form-urlencoded': inline_serializer(
            name='UploadResourceRequest',
            fields={
                'resource_name': serializers.CharField(),
                'locker_name': serializers.CharField(),
                'type': serializers.ChoiceField(choices=['Public', 'Private']),
                'validity_time': serializers.DateTimeField(),
                # This defines the fields inside your JSON string
                'post_conditions': inline_serializer(
                    name='PostConditions',
                    fields={
                        'download': serializers.BooleanField(default=True),
                        'share': serializers.BooleanField(default=True),
                        'confer': serializers.BooleanField(default=True),
                        'transfer': serializers.BooleanField(default=True),
                        'collateral': serializers.BooleanField(default=True),
                        'subset': serializers.BooleanField(default=True),
                    }
                ),
                'drive_file_id': serializers.CharField(),
                'drive_file_name': serializers.CharField(),
                'drive_mime_type': serializers.CharField(),
                'drive_owner_email': serializers.EmailField(),
            }
        )
    },
    responses={
        201: OpenApiResponse(
            description="Resource uploaded successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "document_name": {"type": "string"},
                    "type": {"type": "string"},
                    "resource_url": {"type": "string"},
                    "ID_Of_Xnode_Created": {"type": "integer"},
                    "validity_until": {"type": "string", "format": "date-time"},
                    "primary_owner": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "username": {"type": "string"}
                        }
                    },
                    "current_owner": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "username": {"type": "string"}
                        }
                    }
                },
                "example": {
                    "success": True,
                    "document_name": "My Document",
                    "type": "Private",
                    "resource_url": "https://drive.google.com/file/d/123/preview",
                    "ID_Of_Xnode_Created": 10,
                    "validity_until": "2025-12-31T23:59:59Z",
                    "primary_owner": {"id": 1, "username": "user1"},
                    "current_owner": {"id": 1, "username": "user1"}
                }
            }
        ),
        400: OpenApiResponse(description="Invalid request or file already exists")
    }
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def upload_resource(request):
    """
    Creates a resource for a particular locker of the authenticated user using a Google Drive file.
    """
    if request.method == "POST":
        try:
            # Get form data
            document_name = request.POST.get("resource_name")
            locker_name = request.POST.get("locker_name")
            resource_type = request.POST.get("type")  # Public or Private
            validity_time = request.POST.get("validity_time")
            post_conditions = request.POST.get("post_conditions")
            drive_file_id = request.POST.get("drive_file_id")
            drive_file_name = request.POST.get("drive_file_name")
            drive_mime_type = request.POST.get("drive_mime_type")
            drive_owner_email = request.POST.get("drive_owner_email")

            if not all(
                [document_name, locker_name, resource_type, validity_time, post_conditions, drive_file_id, drive_file_name, drive_mime_type, drive_owner_email]
            ):
                return JsonResponse({"error": "Missing required fields"}, status=400)
            
            #drive_file_id exists in resource table
            if Resource.objects.filter(i_node_pointer=drive_file_id).exists():
                return JsonResponse({"error": "Drive file already exists"}, status=400)
            
            # If user selects PUBLIC → make the Google Drive file public
            print("drive_file_id", drive_file_id)
            print("resource_type", resource_type)
            user = request.user
            if resource_type.lower() == "public":
                try:
                    make_drive_file_public(user, drive_file_id)
                    print(f"Drive file {drive_file_id} made public successfully.")
                    print("User:", user.username)
                    print("User email:", user.email)
                except Exception as e:
                    return JsonResponse(
                        {"success": False, "error": f"Failed to make Drive file public: {str(e)}"},
                        status=400
                    )

            post_conditions = json.loads(post_conditions)

            transformed_post_conditions = {
                "creator_conditions": {
                    "download": post_conditions.get("download", True),
                    "share": post_conditions.get("share", True),
                    "confer": post_conditions.get("confer", True),
                    "transfer": post_conditions.get("transfer", True),
                    "collateral": post_conditions.get("collateral", True),
                    "subset": post_conditions.get("subset", True)
                },
                "download": post_conditions.get("download", True),
                "share": post_conditions.get("share", True),
                "confer": post_conditions.get("confer", True),
                "transfer": post_conditions.get("transfer", True),
                "collateral": post_conditions.get("collateral", True),
                "subset": post_conditions.get("subset", True)
            }

            parsed_validity_time = parse_datetime(validity_time)
            if parsed_validity_time is None:
                return JsonResponse(
                    {"error": "Invalid validity_time format. Use ISO 8601 (e.g., 2025-01-27T00:00:00)"},
                    status=400,
                )

            # Ensure the datetime is timezone-aware
            parsed_validity_time = make_aware(parsed_validity_time)

            # Check user authentication
            if not request.user.is_authenticated:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            user = request.user

            # Get locker
            locker = Locker.objects.get(user=user, name=locker_name)

            # Create a resource entry in the Resource table
            resource = Resource.objects.create(
                document_name=document_name,
                i_node_pointer=drive_file_id,  # Store Drive file ID here
                drive_file_name=drive_file_name,
                drive_mime_type=drive_mime_type,
                drive_owner_email=drive_owner_email,
                locker=locker,
                owner=user,
                type=resource_type,  # Visibility stored in the Resource table
                validity_time=parsed_validity_time,
            )

            # Generate a Google Drive view link
            resource_url = f"https://drive.google.com/file/d/{drive_file_id}/preview"
            # resource_url = drive_file_id

            # Create Xnode_V2 (visibility is not stored here)
            xnode_default = Xnode_V2.objects.create(
                locker=locker,
                created_at=timezone.now(),
                validity_until=parsed_validity_time.isoformat(),
                xnode_Type=Xnode_V2.XnodeType.INODE,
                creator=user.user_id,
                provenance_stack=[],
                post_conditions=transformed_post_conditions,
                snode_list=[],
                vnode_list=[],
                node_information={
                    "resource_id": resource.resource_id,
                    "method_name": "",
                    "method_params": {},
                    "resourse_link": resource_url,
                    "resource_name": resource.document_name,
                    "primary_owner": resource.owner.user_id,
                    "current_owner": resource.owner.user_id,
                    "remarks": None
                },
            )

            return JsonResponse(
                {
                    "success": True,
                    "document_name": document_name,
                    "type": resource_type,
                    "resource_url": resource_url,
                    "ID_Of_Xnode_Created": xnode_default.id,
                    "validity_until": parsed_validity_time.isoformat(),
                    "primary_owner": {
                        "id": resource.owner.user_id,
                        "username": resource.owner.username
                    },
                    "current_owner": {
                        "id": resource.owner.user_id,
                        "username": resource.owner.username,
                    },
                },
                status=201,
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Locker not found"}, status=400
            )
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Owner not found"}, status=400
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


#create the subset of resource(make the small pdf)
#create the subset of resource(make the small pdf)
@extend_schema(
    description="Creates a new resource from a subset of a PDF and registers it like an uploaded resource.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'xnode_id': {'type': 'string'},
                'from_page': {'type': 'integer'},
                'to_page': {'type': 'integer'},
                'resource_name': {'type': 'string'}
            },
            'required': ['xnode_id', 'from_page', 'to_page', 'resource_name']
        }
    },
    responses={
        201: OpenApiResponse(
            description="Subset resource created successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "document_name": {"type": "string"},
                    "resource_url": {"type": "string"},
                    "ID_Of_Xnode_Created": {"type": "integer"},
                    "validity_until": {"type": "string", "format": "date-time"},
                    "primary_owner": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "username": {"type": "string"}
                        }
                    },
                    "current_owner": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "username": {"type": "string"}
                        }
                    }
                },
                "example": {
                    "success": True,
                    "document_name": "Subset Document",
                    "resource_url": "/media/documents/subset.pdf",
                    "ID_Of_Xnode_Created": 11,
                    "validity_until": "2025-12-31T23:59:59Z",
                    "primary_owner": {"id": 1, "username": "user1"},
                    "current_owner": {"id": 1, "username": "user1"}
                }
            }
        ),
        400: OpenApiResponse(description="Invalid request or page range"),
        404: OpenApiResponse(description="Original resource not found")
    }
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_subset_resource(request):
    """
    Creates a new resource from a subset of a PDF and registers it like an uploaded resource.
    
    Request JSON:
    {
        "xnode_id": "<xnode_id>",
        "from_page": from_page INTEGER,
        "to_page": to_page INTEGER,
        "resource_name": "resource name"
    }

    Returns:
    - New Xnode ID for the subset resource.
    """
    try:
        data = request.data
        xnode_id = data.get("xnode_id")
        from_page = data.get("from_page")
        to_page = data.get("to_page")
        resource_name = data.get("resource_name")

        if any(val is None for val in [xnode_id, from_page, to_page, resource_name]):
            return JsonResponse({"error": "Missing required fields"}, status=400)


        if from_page < 1 or to_page < from_page:
            return JsonResponse({"error": "Invalid page range"}, status=400)

        # Fetch original resource
        original_inode = access_Resource(xnode_id=xnode_id)
        if not original_inode:
            return JsonResponse({"error": f"No INODE found for xnode_id: {xnode_id}"}, status=404)

        resource_id = original_inode.node_information.get("resource_id")
        if not resource_id:
            return JsonResponse({"error": "No resource_id found in INODE"}, status=404)

        resource = Resource.objects.get(resource_id=resource_id)
        original_pdf_path = os.path.join(settings.MEDIA_ROOT, resource.i_node_pointer)

        if not os.path.exists(original_pdf_path):
            return JsonResponse({"error": "Original PDF not found"}, status=404)

        # Read the original PDF
        reader = PdfReader(original_pdf_path)
        total_pages = len(reader.pages)

        if to_page > total_pages:
            return JsonResponse({"error": f"Invalid page range. Document has {total_pages} pages."}, status=400)

        if from_page == 1 and to_page == total_pages:
            return JsonResponse({"error": "The selected page range matches the original document."}, status=400)
        
        if Resource.objects.filter(document_name=resource_name, locker=resource.locker).exists():
            return JsonResponse({"error": "A resource with this name already exists in this locker."}, status=400)


        # Create a new PDF with selected pages
        writer = PdfWriter()
        for i in range(from_page - 1, to_page):
            writer.add_page(reader.pages[i])

        
        # Handle file upload and save it to MEDIA_ROOT/documents/
    

        # Naming Convention
        relative_path = os.path.join("documents", f"{resource_name.replace(' ', '_')}.pdf") 
        print("realtive_path", relative_path)
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path) 
        print("file_path", file_path)

        

        # Save the subset PDF
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as output_file:
            writer.write(output_file)

        # Create a new Resource entry
        subset_resource = Resource.objects.create(
            document_name=resource_name,
            i_node_pointer=relative_path,
            locker=resource.locker,
            owner=resource.owner,
            type=resource.type,
            validity_time=resource.validity_time,
        )

        resource_url = os.path.join(settings.MEDIA_URL, relative_path)

        # Create Xnode_V2 (INODE)
        subset_xnode = Xnode_V2.objects.create(
            locker=resource.locker,
            created_at=timezone.now(),
            validity_until=resource.validity_time.isoformat(),
            xnode_Type=Xnode_V2.XnodeType.INODE,
            creator=resource.owner.user_id,
            provenance_stack=[],
            post_conditions=original_inode.post_conditions,
            snode_list=[],
            vnode_list=[],
            node_information={
                "resource_id": subset_resource.resource_id,
                "method_name": "subset",
                "method_params": {},
                "resourse_link": resource_url,
                "resource_name": subset_resource.document_name,
                "primary_owner": subset_resource.owner.user_id,
                "current_owner": subset_resource.owner.user_id
            },
        )

        return JsonResponse(
            {
                "success": True,
                "document_name": resource_name,
                "resource_url": resource_url,
                "ID_Of_Xnode_Created": subset_xnode.id,
                "validity_until": subset_resource.validity_time.isoformat(),
                "primary_owner": {
                    "id": subset_resource.owner.user_id,
                    "username": subset_resource.owner.username
                },
                "current_owner": {
                    "id": subset_resource.owner.user_id,
                    "username": subset_resource.owner.username,
                }
            },
            status=201,
        )

    except Resource.DoesNotExist:
        return JsonResponse({"error": f"Resource with ID {resource_id} not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

