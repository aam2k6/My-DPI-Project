import os
import json
from django.http import JsonResponse, HttpRequest
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.conf import settings
from pypdf import PdfReader,PdfWriter
from api.models import Locker, Resource, CustomUser, Connection ,Notification , ConnectionType
from api.model.xnode_model import Xnode_V2
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import StreamingHttpResponse, HttpResponse, JsonResponse
from api.utils.resource_helper.access_resource_helper import access_Resource

from drf_spectacular.utils import extend_schema, OpenApiResponse

@csrf_exempt
@extend_schema(
    description="Check and update status of all XNodes for the user's lockers.",
    request=None,
    responses={
        200: OpenApiResponse(
            description="Status updated successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "updated_xnode_ids": {
                        "type": "array",
                        "items": {"type": "integer"}
                    },
                    "total_checked": {"type": "integer"}
                },
                "example": {
                    "success": True,
                    "updated_xnode_ids": [101, 102],
                    "total_checked": 50
                }
            }
        ),
        401: OpenApiResponse(description="User not authenticated"),
        404: OpenApiResponse(description="User not found")
    }
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def xnode_v2_status(request):
    if request.method!="POST":
        return JsonResponse({"success":False,"error":"Invalid request method"},status=405)
    try:
        if request.user.is_authenticated:
            user_id=request.user.user_id
        else:
            return JsonResponse({"error":"user not authenticated"},status=401)
        
        if not user_id :
            return JsonResponse({"success": False, "error": "Missing user_id"}, status=400)
        
        now=timezone.now()
        lockers=Locker.objects.filter(user_id=user_id)
        updated_xnodes=[]
        for locker in lockers:
            locker_id=locker.locker_id
            xnodes=Xnode_V2.objects.filter(locker_id=locker_id)
            for xnode in xnodes:
                if xnode.validity_until and now>xnode.validity_until and xnode.status!="closed":
                    xnode.status="closed"
                    xnode.save()
                    updated_xnodes.append(xnode.id)

        return JsonResponse({
            "success": True,
            "updated_xnode_ids": updated_xnodes,
            "total_checked": xnodes.count()
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)            



@csrf_exempt
@extend_schema(
    description="Update Xnode connection and validity.",
    request={
        'application/x-www-form-urlencoded': {
            'type': 'object',
            'properties': {
                'xnode_id': {'type': 'integer'},
                'connection_id': {'type': 'integer'},
                'validity_until': {'type': 'string', 'format': 'date-time'},
            },
            'required': ['xnode_id', 'connection_id', 'validity_until']
        }
    },
    responses={200: dict}
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_Xnode_Inode(request: HttpRequest) -> JsonResponse:
    """
    "xnode_id": value,
    "connection_id": value,
    "validity_until": value
    """
    if request.method == "POST":
        xnode_id = request.POST.get("xnode_id", None)
        connection_id = request.POST.get("connection_id", None)
        validity_until = request.POST.get("validity_until", None)
        if xnode_id is None:
            return JsonResponse({"message": "Xnode ID cannot be None."})
        if connection_id is None:
            return JsonResponse({"message": "Connection ID cannot be None."})
        if validity_until is None:
            return JsonResponse({"message": "Validity until cannot be None."})
        try:
            xnode = Xnode_V2.objects.get(id=xnode_id)
            try:
                connection = Connection.objects.get(connection_id=connection_id)
                xnode.connection = connection
                xnode.validity_until = validity_until
                xnode.save()
                return JsonResponse(
                    {"message": f"Xnode with ID = {xnode.id} updated successfully."},
                    status=status.HTTP_200_OK,
                )
            except Connection.DoesNotExist:
                return JsonResponse(
                    {"message": f"Connection with ID = {connection_id} does not exist."}
                )
        except Xnode_V2.DoesNotExist:
            return JsonResponse(
                {"message": f"Xnode with ID = {xnode_id} does not exist."}
            )
    else:
        return JsonResponse(
            {"message": f"Request method should be POST but got {request.method}."}
        )
    

@csrf_exempt
@extend_schema(
    description="Fix invalid XNodes for user connections.",
    request=None,
    responses={200: dict}
)
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def fix_invalid_xnodes(request):
    try:
        from django.db.models import Q

        connections = Connection.objects.filter(
            Q(host_user=request.user) | Q(guest_user=request.user)
        )

        updated_count = 0
        updated_connections = []

        def validate_and_fix_value(val):
            if isinstance(val, str) and "|" in val and ";" in val:
                try:
                    _, rest = val.split("|", 1)
                    xnode_id_str, flag = rest.split(";", 1)
                    xnode_id = int(xnode_id_str)

                    xnode = Xnode_V2.objects.filter(id=xnode_id).first()
                    print("xnode:", xnode)
                    if not xnode or xnode.connection_id is None:
                        return ";F", True
                except Exception:
                    pass
            return val, False

        def deep_fix(data_dict):
            updated = False
            for key, value in data_dict.items():
                if isinstance(value, str):
                    new_val, changed = validate_and_fix_value(value)
                    if changed:
                        data_dict[key] = new_val
                        updated = True

                elif isinstance(value, dict):
                    for sub_key, sub_val in value.items():
                        if isinstance(sub_val, dict):
                            # check for "enter_value"
                            enter_val = sub_val.get("enter_value")
                            if enter_val:
                                new_val, changed = validate_and_fix_value(enter_val)
                                if changed:
                                    sub_val["enter_value"] = new_val
                                    updated = True
            return updated

        for conn in connections:
            updated = False

            # Handle terms_value
            terms = conn.terms_value or {}
            if isinstance(terms, str):
                try:
                    terms = json.loads(terms)
                except json.JSONDecodeError:
                    terms = {}
            elif not isinstance(terms, dict):
                terms = {}

            if deep_fix(terms):
                updated = True

            # Handle terms_value_reverse
            terms_rev = conn.terms_value_reverse or {}
            if isinstance(terms_rev, str):
                try:
                    terms_rev = json.loads(terms_rev)
                except json.JSONDecodeError:
                    terms_rev = {}
            elif not isinstance(terms_rev, dict):
                terms_rev = {}

            if deep_fix(terms_rev):
                updated = True

            if updated:
                conn.terms_value = terms
                conn.terms_value_reverse = terms_rev
                conn.save()
                updated_count += 1
                updated_connections.append({
                    "connection_id": conn.connection_id,
                    "terms_value": terms,
                    "terms_value_reverse": terms_rev,
                })

        return JsonResponse({
            "message": f"{updated_count} connection(s) updated successfully.",
            "updated_connections": updated_connections
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
        
