import base64
import os
import json
from django.conf import settings
from django.contrib.auth import login, authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils import timezone
from django.utils.timezone import now
from django.utils.timezone import make_aware
import shutil
from rest_framework import status
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from api.serializers import (
    ResourceSerializer,
    ConnectionTypeSerializer,
    ConnectionSerializer,
    ConnectionTermsSerializer,
    ConnectionFilterSerializer,
    GlobalConnectionTypeTemplateGetSerializer,
    GlobalConnectionTypeTemplatePostSerializer,
    ConnectionTypeRegulationLinkTableGetSerializer,
    ConnectionTypeRegulationLinkTablePostSerializer,
    
)
from api.models import (
    Resource,
    Locker,
    CustomUser,
    Connection,
    ConnectionTerms,
    ConnectionType,
    GlobalConnectionTypeTemplate,
    ConnectionTypeRegulationLinkTable,
    Notification,
    GoogleAuthToken
)
from api.serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse
from django.db import models
from rest_framework.parsers import JSONParser
from django.views.decorators.http import require_POST
from django.core.exceptions import ObjectDoesNotExist
from django.utils.dateparse import parse_datetime
from datetime import datetime
from collections import defaultdict
from pypdf import PdfReader, PdfWriter
from IPython.display import FileLink
from django.db.models import Q

#google
from rest_framework_simplejwt.authentication import JWTAuthentication
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialAccount
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes

from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
import requests
from api.model.xnode_model import Xnode_V2
from django.db import transaction 


@extend_schema(
    summary="Create a new connection",
    description="Create a new connection between two lockers with pre-populated terms based on the connection type directionality.",
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "connection_type_id": {"type": "integer"},
                "connection_name": {"type": "string"},
                "connection_description": {"type": "string"},
                "host_locker_name": {"type": "string"},
                "guest_locker_name": {"type": "string"},
                "host_user_username": {"type": "string"},
                "guest_user_username": {"type": "string"},
            },
            "required": ["connection_type_id", "connection_name", "host_locker_name", "guest_locker_name", "host_user_username", "guest_user_username"],
        }
    },
    responses={
        201: OpenApiResponse(
            description="Connection created successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "id": {"type": "integer"},
                },
            },
        ),
        400: OpenApiResponse(description="Missing fields or invalid data"),
        404: OpenApiResponse(description="Required resources not found"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_new_connection(request):
    """
    Create a new connection with terms_value for host-to-guest and
    terms_value_reverse for guest-to-host.

    Parameters:
    - Form data: connection_name, connection_type_id, host_locker_name,
                 guest_locker_name, host_user_username, guest_user_username,
                 connection_description (optional)
    """
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated"}, status=401)

    # Extract form data
    connection_type_id = request.POST.get("connection_type_id")
    connection_name = request.POST.get("connection_name")
    connection_description = request.POST.get("connection_description", "")
    host_locker_name = request.POST.get("host_locker_name")
    guest_locker_name = request.POST.get("guest_locker_name")
    host_user_username = request.POST.get("host_user_username")
    guest_user_username = request.POST.get("guest_user_username")

    if not all(
        [
            connection_type_id,
            connection_name,
            host_locker_name,
            guest_locker_name,
            host_user_username,
            guest_user_username,
        ]
    ):
        return JsonResponse(
            {"success": False, "error": "All fields are required"}, status=400
        )

    try:
        # Retrieve host and guest user and locker data
        host_user = CustomUser.objects.get(username=host_user_username)
        host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
        guest_user = CustomUser.objects.get(username=guest_user_username)
        guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
        connection_type = ConnectionType.objects.get(
            connection_type_id=connection_type_id,
            owner_locker=host_locker,
            owner_user=host_user,
        )
    except (
        ConnectionType.DoesNotExist,
        Locker.DoesNotExist,
        CustomUser.DoesNotExist,
    ) as e:
        return JsonResponse({"success": False, "error": f"{str(e)}"}, status=404)

    # Separate terms for each direction
    terms_host_to_guest = ConnectionTerms.objects.filter(
        conn_type=connection_type,
        from_Type=ConnectionTerms.TermFromTo.HOST,
        to_Type=ConnectionTerms.TermFromTo.GUEST,
        modality="obligatory",
    )
    terms_guest_to_host = ConnectionTerms.objects.filter(
        conn_type=connection_type,
        from_Type=ConnectionTerms.TermFromTo.GUEST,
        to_Type=ConnectionTerms.TermFromTo.HOST,
        modality="obligatory",
    )

    # Populate terms_value for host-to-guest and terms_value_reverse for guest-to-host
    terms_value = {term.data_element_name: "; F" for term in terms_guest_to_host}
    terms_value_reverse = {
        term.data_element_name: "; F" for term in terms_host_to_guest
    }

    # Populate resource_json for file-sharing terms
    resource_json = {}
    for term in terms_host_to_guest | terms_guest_to_host:  # Include both directions
        if term.data_type == "Upload File":
            resource_json.setdefault(term.sharing_type, [])

    # Debugging output
    print("guest-to-host terms_value:", terms_value)
    print("host-to-guest terms_value_reverse:", terms_value_reverse)
    print("Resource JSON:", resource_json)

    # Save the connection with populated fields
    try:
        connection = Connection(
            connection_name=connection_name,
            connection_type=connection_type,
            host_locker=host_locker,
            guest_locker=guest_locker,
            host_user=host_user,
            guest_user=guest_user,
            connection_description=connection_description,
            requester_consent=False,
            connection_status="established",
            revoke_host=False,
            revoke_guest=False,
            
            terms_value=terms_value,
            terms_value_reverse=terms_value_reverse,
            resources=resource_json,
            validity_time=connection_type.validity_time,
        )
        connection.save()

        notification_message = f"{guest_user.username} has connected to the connection type '{connection_type.connection_type_name}' associated with Locker '{host_locker.name}'."

        # Build rich, serializable extra_data for the notification
        extra_data = {
            "connection_id": connection.connection_id,
            "connection_name": connection.connection_name,
            "connection_type_id": connection_type.connection_type_id,
            "connection_type_name": connection_type.connection_type_name,
            "guest_user": {
                "id": guest_user.user_id,
                "username": guest_user.username,
                "description": getattr(guest_user, "description", ""),
                "user_type": getattr(guest_user, "user_type", "user"),
            },
            "host_user": {
                "id": host_user.user_id,
                "username": host_user.username,
                "description": getattr(host_user, "description", ""),
                "user_type": getattr(host_user, "user_type", "user"),
            },
            "guest_locker": {
                "id": guest_locker.locker_id,
                "name": guest_locker.name,
                "description": getattr(guest_locker, "description", ""),
            },
            "host_locker": {
                "id": host_locker.locker_id,
                "name": host_locker.name,
                "description": getattr(host_locker, "description", ""),
            },
            "connection": {
                "id": connection.connection_id,
                "name": connection.connection_name,
            },
            "connection_type": ConnectionTypeSerializer(connection.connection_type).data,
            "connection_info": ConnectionSerializer(connection).data,
        }
        # Create a notification for the new connection
        Notification.objects.create(
            connection=connection,
            connection_type=connection_type,
            host_user=host_user,
            guest_user=guest_user,
            host_locker=host_locker,
            guest_locker=guest_locker,
            message=notification_message,
            created_at=timezone.now(),
            notification_type="connection_created",
            target_type="connection",
            target_id=str(connection.connection_id),
            extra_data=extra_data,
        )

        return JsonResponse(
            {"success": True, "id": connection.connection_id}, status=201
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)



@extend_schema(
    summary="Update extra data for a connection",
    description="Append extra data under 'canShareMoreData' in the connection terms for both host and guest roles.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "host_locker_name": {"type": "string"},
                "guest_locker_name": {"type": "string"},
                "host_user_username": {"type": "string"},
                "guest_user_username": {"type": "string"},
                "extra_data": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "labelName": {"type": "string"},
                            "enter_value": {"type": "string", "description": "Format: document_name|xnode_id"},
                            "purpose": {"type": "string"},
                            "typeOfShare": {"type": "string"},
                        },
                        "required": ["labelName", "enter_value", "purpose", "typeOfShare"],
                    }
                },
            },
            "required": ["connection_name", "host_locker_name", "guest_locker_name", "host_user_username", "guest_user_username", "extra_data"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Extra data updated successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "terms_value": {"type": "object"},
                    "terms_value_reverse": {"type": "object"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid user or data format"),
        404: OpenApiResponse(description="Connection or related entities not found"),
    },
)
@csrf_exempt
@api_view(["PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_extra_data(request):
    """
    Append extra data under 'canShareMoreData' for a specific connection with additional fields such as:
    'labelName', 'enter_value' (file), 'purpose', and 'typeOfShare'.
    """
    if request.method == "PATCH":
        data = request.data

        connection_name = data.get("connection_name")
        host_locker_name = data.get("host_locker_name")
        guest_locker_name = data.get("guest_locker_name")
        host_user_username = data.get("host_user_username")
        guest_user_username = data.get("guest_user_username")
        extra_data = data.get("extra_data")

        if not all(
            [
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
                extra_data,
            ]
        ):
            return JsonResponse({"error": "All fields are required"}, status=400)

        try:
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )
        except (
            Connection.DoesNotExist,
            Locker.DoesNotExist,
            CustomUser.DoesNotExist,
        ) as e:
            return JsonResponse({"error": str(e)}, status=404)

        # Determine the user's role and set the appropriate data
        request_user = request.user

        if request_user == host_user:
            can_share_more_data = connection.terms_value_reverse.get("canShareMoreData", {})
        elif request_user == guest_user:
            can_share_more_data = connection.terms_value.get("canShareMoreData", {})
        else:
            return JsonResponse({"error": "Invalid user"}, status=400)

        # Process and append extra data to 'canShareMoreData'
        for item in extra_data:
            label_name = item.get("labelName")
            enter_value = item.get("enter_value")  # Expecting a resource or file
            purpose = item.get("purpose")
            type_of_share = item.get("typeOfShare")  # New field for type of share

            if not all([label_name, enter_value, purpose, type_of_share]):
                return JsonResponse(
                    {
                        "error": "All fields in extra_data (labelName, enter_value, purpose, typeOfShare) are required"
                    },
                    status=400,
                )

            # Ensure the enter_value is in the correct format
            try:
                # document_info = enter_value.split(";")[0].strip()  # Extract the file information
                # document_name = document_info.split("|")[0]
                # xnode_id = document_info.split("|")[1].split(",")[0].strip()

                # from_to_str = document_info.split("|")[1].split(",")[1].strip()
                # from_page = int(from_to_str.split(":")[0].replace("(", "").strip())
                # to_page = int(from_to_str.split(":")[1].replace(")", "").strip())

                document_info = enter_value.split(";")[0].strip()  # Extract the file information
                document_name, xnode_id = document_info.split("|")[:2]

                # Fetch the Xnode to ensure it exists
                xnode = Xnode_V2.objects.get(id=xnode_id)

                # Append the extra data in the desired format for file
                can_share_more_data[label_name] = {
                    "enter_value": f"{document_name}|{xnode_id}",
                    "purpose": purpose,
                    "typeOfShare": type_of_share,
                }

            except (ValueError, Xnode_V2.DoesNotExist) as e:
                return JsonResponse(
                    {"error": f"Invalid data for label {label_name}: {str(e)}"},
                    status=400,
                )

        # Save the updated data
        if request_user == host_user:
            updated_terms_value_reverse = connection.terms_value_reverse
            updated_terms_value_reverse["canShareMoreData"] = can_share_more_data
            connection.terms_value_reverse = updated_terms_value_reverse
        elif request_user == guest_user:
            updated_terms_value = connection.terms_value
            updated_terms_value["canShareMoreData"] = can_share_more_data
            connection.terms_value = updated_terms_value

        connection.save()

        return JsonResponse(
            {
                "success": True,
                "message": "Extra data successfully appended.",
                "terms_value": connection.terms_value,
                "terms_value_reverse": connection.terms_value_reverse,
            },
            status=200,
        )

    return JsonResponse({"error": "Invalid request method"}, status=405)

