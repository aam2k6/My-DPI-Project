
from django.http import JsonResponse, HttpRequest
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.conf import settings
from api.models import Locker, Resource, CustomUser, Connection ,Notification , ConnectionType
from api.model.xnode_model import Xnode_V2
from api.serializers import ResourceSerializer, XnodeV2Serializer
from api.serializers import ConnectionSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import StreamingHttpResponse, HttpResponse, JsonResponse
from api.utils.resource_helper.access_resource_helper import access_Resource
from api.utils.resource_helper.access_resource_helper import build_access_path_from_nodes,is_xnode_approved,format_access_path

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes

#stream access_resource api for drive file access
@extend_schema(
    summary="Access Resource API",
    description="Get access details and stream URL for a resource Xnode.",
    parameters=[
        OpenApiParameter(
            name="xnode_id",
            description="ID of the Xnode to access",
            required=True,
            type=int,
            location=OpenApiParameter.QUERY,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Access granted",
            response={
                "type": "object",
                "properties": {
                    "xnode": {"type": "object"},
                    "link_To_File": {"type": "string"},
                },
                "example": {
                    "xnode": {
                        "id": 1,
                        "resource_name": "My Doc"
                    },
                    "link_To_File": "https://example.com/resource/stream/?xnode_id=1"
                }
            },
        ),
        400: OpenApiResponse(description="Invalid request or missing xnode_id"),
        403: OpenApiResponse(description="Permission denied or connection expired"),
        404: OpenApiResponse(description="Resource or Xnode not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def access_Resource_API(request: HttpRequest) -> JsonResponse:
    if request.method != "GET":
        return JsonResponse({"message": f"Expected request method is GET but got {request.method}."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    xnode_id = request.GET.get("xnode_id", None)
    if xnode_id is None:
        return JsonResponse({"message": "xnode_id cannot be none."}, status=status.HTTP_400_BAD_REQUEST)

    xnode_List = Xnode_V2.objects.filter(id=xnode_id)
    if not xnode_List.exists():
        return JsonResponse({"message": f"Consent artefact access has been removed by the owner."}, status=status.HTTP_404_NOT_FOUND)

    xnode = xnode_List.first()

    # 1. Trace back to the original Inode (Resource Pointer)
    original_Xnode = access_Resource(xnode_id=xnode.id)
    if original_Xnode is None:
        print("Could not find the original resource destination access chain is break somewhere for:",xnode.id)
        return JsonResponse({
            "message": f"Consent artefact access has been removed by the owner."
        }, status=status.HTTP_404_NOT_FOUND)

    # 2. Get Resource Details from Resource Model
    resource_id = original_Xnode.node_information.get("resource_id")
    if not resource_id:
        return JsonResponse({"message": "Resource information is Missing."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        resource_Particular = Resource.objects.get(resource_id=resource_id)
    except Resource.DoesNotExist:
        return JsonResponse({"message": f"Resource does not exist."}, status=status.HTTP_404_NOT_FOUND)

    file_id = resource_Particular.i_node_pointer
    owner_user = resource_Particular.owner

    if not file_id:
        return JsonResponse({"message": "Resource is not linked to a Google Drive file (missing i_node_pointer)."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ---------- NOTE: We DO NOT require requester's Google token here ----------
    # Access rights are determined by  app chain logic (connections / post_conditions)
    # The streaming fetch will be done using the INODE owner token (or anonymously if resource is public).

    # Prepare Xnode data for final response
    xnodeserializer = XnodeV2Serializer(xnode)
    xnode_data = xnodeserializer.data
    xnode_data["resource_name"] = resource_Particular.document_name

    # ------------------------------------------------------------------
    # Case 1: Direct access (No connection)
    # ------------------------------------------------------------------
    if xnode.connection is None:
        stream_url = f"{settings.SITE_DOMAIN.rstrip('/')}/resource/stream/?xnode_id={xnode.id}"
        return JsonResponse({
            "xnode": xnode_data,
            "link_To_File": stream_url
        })

    # ------------------------------------------------------------------
    # Case 2: Access via connection (keep your existing checks + notifications)
    # ------------------------------------------------------------------
    else:
        connection: Connection = xnode.connection

        # 1. Connection Validation (Consent and Validity)
        if connection.requester_consent is False:
            return JsonResponse({
                "message": f"The requester consent for the connection associated with Consent artefect is False."
            }, status=status.HTTP_403_FORBIDDEN)

        if connection.validity_time and connection.validity_time < timezone.now():
            return JsonResponse({
                "message": f"Connection associated with Consent artefect has expired on {connection.validity_time}."
            }, status=status.HTTP_403_FORBIDDEN)

        # 2. Notification and Access Path Logic (unchanged)
        if request.user != owner_user:
            try:
                access_path = build_access_path_from_nodes(xnode)
                formatted_path = format_access_path(
                    access_path=access_path,
                    accessing_user=request.user.username,
                    resource_name=resource_Particular.document_name,
                    accessed_locker=getattr(xnode.locker, 'name', 'unknown'),
                    final_connection_name=connection.connection_type
                )
                message = formatted_path

                def make_serializable(val):
                    if hasattr(val, 'pk'): return val.pk
                    if hasattr(val, '__str__') and not isinstance(val, (str, int, float, bool, type(None))): return str(val)
                    return val

                rich_access_path = []
                for step in access_path:
                    from_user_obj = CustomUser.objects.filter(username=step['from_user']).first()
                    to_user_obj = CustomUser.objects.filter(username=step['to_user']).first()
                    from_locker_obj = Locker.objects.filter(name=step['from_locker']).first()
                    to_locker_obj = Locker.objects.filter(name=step['to_locker']).first()
                    conn_obj = ConnectionType.objects.filter(connection_type_name=step['connection_type']).first() if step['connection_type'] != 'Direct' else None
                    rich_access_path.append({
                        'from_user': step['from_user'], 'from_user_id': from_user_obj.user_id if from_user_obj else None,
                        'from_locker': step['from_locker'], 'from_locker_id': from_locker_obj.locker_id if from_locker_obj else None,
                        'to_user': step['to_user'], 'to_user_id': to_user_obj.user_id if to_user_obj else None,
                        'to_locker': step['to_locker'], 'to_locker_id': to_locker_obj.locker_id if to_locker_obj else None,
                        'connection_type': step['connection_type'], 'connection_type_id': conn_obj.connection_type_id if conn_obj else None,
                        'via_node_type': step['via_node_type'],
                    })

                serializable_rich_access_path = [{k: make_serializable(v) for k, v in step.items()} for step in rich_access_path]

                serializable_extra_data = {
                    "resource_id": resource_Particular.resource_id,
                    "resource_name": resource_Particular.document_name,
                    "guest_user": {"id": request.user.user_id, "username": request.user.username, "description": getattr(request.user, "description", ""), "user_type": getattr(request.user, "user_type", "user")},
                    "host_user": {"id": owner_user.user_id, "username": owner_user.username, "description": getattr(owner_user, "description", ""), "user_type": getattr(owner_user, "user_type", "user")},
                    "guest_locker": {"id": connection.guest_locker.locker_id, "name": connection.guest_locker.name, "description": getattr(connection.guest_locker, "description", "")},
                    "host_locker": {"id": connection.host_locker.locker_id, "name": connection.host_locker.name, "description": getattr(connection.host_locker, "description", "")},
                    "connection": {"id": connection.connection_id, "name": connection.connection_name},
                    "connection_type": {"id": connection.connection_type.connection_type_id, "name": connection.connection_type.connection_type_name, "description": getattr(connection.connection_type, "description", "")},
                    "access_path": serializable_rich_access_path,
                    "connection_info": ConnectionSerializer(connection).data,
                }

                Notification.objects.create(
                    connection=connection, guest_user=request.user, host_user=owner_user,
                    guest_locker=connection.guest_locker, host_locker=connection.host_locker,
                    connection_type=connection.connection_type, created_at=timezone.now(),
                    message=message, notification_type="resource_accessed",
                    target_type="resource", target_id=str(resource_Particular.resource_id),
                    extra_data=serializable_extra_data
                )

            except Exception as e:
                print(f"Error during notification/path creation: {e}")
                pass  # Fail silently on notification errors, but allow file access

        stream_url = f"{settings.SITE_DOMAIN.rstrip('/')}/resource/stream/?xnode_id={xnode.id}"
        return JsonResponse({
            "xnode": xnode_data,
            "link_To_File": stream_url
        })


#The access_resource_submitted API allows a user to access a resource that has been shared via a connection (Xnode), provided they are within the scope of that connection.
@extend_schema(
    summary="Access Submitted Resource",
    description="Access a resource shared via a connection (Xnode). Checks for scope and approvals.",
    parameters=[
        OpenApiParameter(
            name="xnode_id",
            description="ID of the Xnode to access",
            required=True,
            type=int,
            location=OpenApiParameter.QUERY,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Access granted",
            response={
                "type": "object",
                "properties": {
                    "xnode": {"type": "object"},
                    "link_To_File": {"type": "string"},
                    "success": {"type": "boolean"},
                },
                "example": {
                    "xnode": {
                        "id": 2,
                        "resource_name": "Shared Doc"
                    },
                    "link_To_File": "https://example.com/resource/stream/?xnode_id=2",
                    "success": True
                }
            },
        ),
        400: OpenApiResponse(description="Invalid request or missing xnode_id"),
        403: OpenApiResponse(description="Permission denied or connection expired"),
        404: OpenApiResponse(description="Resource or Xnode not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def access_res_submitted(request: HttpRequest) -> JsonResponse:
    if request.method != "GET":
        return JsonResponse({"message": f"Expected request method is GET but got {request.method}."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    xnode_id = request.GET.get("xnode_id", None)
    if xnode_id is None:
        return JsonResponse({"message": "xnode_id cannot be none."}, status=status.HTTP_400_BAD_REQUEST)

    xnode_List = Xnode_V2.objects.filter(id=xnode_id)
    if not xnode_List.exists():
        return JsonResponse({"message": f"Consent artefact access has been removed by the owner."}, status=status.HTTP_404_NOT_FOUND)

    xnode = xnode_List.first()

    # --TRACE TO RESOURCE (Inode) ---
    original_Xnode = access_Resource(xnode_id=xnode.id)
    if original_Xnode is None:
        return JsonResponse({"message": f"Consent artefact access has been removed by the owner or the artefact itself has been deleted."}, status=status.HTTP_404_NOT_FOUND)

    resource_id = original_Xnode.node_information.get("resource_id")
    if not resource_id:
        return JsonResponse({"message": "Resource information is Missing."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        resource_Particular = Resource.objects.get(resource_id=resource_id)
    except Resource.DoesNotExist:
        return JsonResponse({
            "message": f"Resource does not exist."
        }, status=status.HTTP_404_NOT_FOUND)

    # --- GET DRIVE DETAILS & CHECK AUTH ---
    file_id = resource_Particular.i_node_pointer 
    inode_owner = resource_Particular.owner
    # requester_email = request.user.email
    # requester_google_token = request.user.get_google_access_token()

    if not file_id:
        return JsonResponse({"message": "Resource is not linked to a Google Drive file (missing i_node_pointer)."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # if not requester_google_token:
    #     # Check if Google token is available (needed for Drive access check)
    #     return JsonResponse(
    #         {"success": False, "error": "Google token required for this resource is missing. Please log in with Google."},
    #         status=status.HTTP_401_UNAUTHORIZED
    #     )

    # # CHECK DRIVE ACCESS PERMISSION ---
    # allowed, reason = user_has_drive_access(
    #     owner_user, 
    #     file_id, 
    #     requester_email, 
    #     request.user
    # )
    
    # if not allowed:
    #     return JsonResponse(
    #         {"success": False, "error": "Access restricted for your Google account.", "reason": reason}, 
    #         status=status.HTTP_403_FORBIDDEN
    #     )

    # # CONSTRUCT FINAL RELIABLE URL ---
    # file_url = f"https://drive.google.com/file/d/{file_id}/preview"

    # Prepare serialized Xnode data (used in both return paths)
    serializer = XnodeV2Serializer(xnode)
    xnode_data = serializer.data
    xnode_data["resource_name"] = resource_Particular.document_name

    # --- Case 1: Direct access (No connection) ---
    if xnode.connection is None:
        stream_url = f"{settings.SITE_DOMAIN.rstrip('/')}/resource/stream/?xnode_id={xnode.id}"
        return JsonResponse({
            "xnode": xnode_data, 
            "link_To_File": stream_url, 
            "success": True
        })

    # --- Case 2: Access via a connection (Consent/Validity Check & Notification) ---
    else:
        connection: Connection = xnode.connection

        if connection.requester_consent is False:
            return JsonResponse({
                "message": f"The requester consent for the connection associated with Consent artefect is False."
            }, status=status.HTTP_403_FORBIDDEN)

        if connection.validity_time and connection.validity_time < timezone.now():
            return JsonResponse({
                "message": f"Connection associated with Consent artefect has expired on {connection.validity_time}."
            }, status=status.HTTP_403_FORBIDDEN)

        # --- Notification Logic ---
        inode_owner = resource_Particular.owner 
        
        if request.user != inode_owner:
            try:
                access_path = build_access_path_from_nodes(xnode)
                formatted_path = format_access_path(
                    access_path=access_path,
                    accessing_user=request.user.username,
                    resource_name=resource_Particular.document_name,
                    accessed_locker=getattr(xnode.locker, 'name', 'unknown'),
                    final_connection_name=connection.connection_type
                )
                is_approved = is_xnode_approved(connection, xnode.id)

                message = formatted_path if is_approved else f"User '{request.user.username}' accessed the resource '{resource_Particular.document_name}' for verification before approval."

                # --- Utility to make values serializable  ---
                def make_serializable(val):
                    if hasattr(val, 'pk'): return val.pk
                    if hasattr(val, '__str__') and not isinstance(val, (str, int, float, bool, type(None))): return str(val)
                    return val

                # --- Build rich access path and extra data for Notification  ---
                rich_access_path = []
                for step in access_path:
                    from_user_obj = CustomUser.objects.filter(username=step['from_user']).first()
                    to_user_obj = CustomUser.objects.filter(username=step['to_user']).first()
                    from_locker_obj = Locker.objects.filter(name=step['from_locker']).first()
                    to_locker_obj = Locker.objects.filter(name=step['to_locker']).first()
                    conn_obj = ConnectionType.objects.filter(connection_type_name=step['connection_type']).first() if step['connection_type'] != 'Direct' else None
                    rich_access_path.append({
                        'from_user': step['from_user'], 'from_user_id': from_user_obj.user_id if from_user_obj else None,
                        'from_locker': step['from_locker'], 'from_locker_id': from_locker_obj.locker_id if from_locker_obj else None,
                        'to_user': step['to_user'], 'to_user_id': to_user_obj.user_id if to_user_obj else None,
                        'to_locker': step['to_locker'], 'to_locker_id': to_locker_obj.locker_id if to_locker_obj else None,
                        'connection_type': step['connection_type'], 'connection_type_id': conn_obj.connection_type_id if conn_obj else None,
                        'via_node_type': step['via_node_type'],
                    })
                
                serializable_rich_access_path = [{k: make_serializable(v) for k, v in step.items()} for step in rich_access_path]

                serializable_extra_data = {
                    "resource_id": resource_Particular.resource_id,
                    "resource_name": resource_Particular.document_name,
                    "guest_user": {"id": request.user.user_id, "username": request.user.username, "description": getattr(request.user, "description", ""), "user_type": getattr(request.user, "user_type", "user")},
                    "host_user": {"id": inode_owner.user_id, "username": inode_owner.username, "description": getattr(inode_owner, "description", ""), "user_type": getattr(inode_owner, "user_type", "user")},
                    "guest_locker": {"id": connection.guest_locker.locker_id, "name": connection.guest_locker.name, "description": getattr(connection.guest_locker, "description", "")},
                    "host_locker": {"id": connection.host_locker.locker_id, "name": connection.host_locker.name, "description": getattr(connection.host_locker, "description", "")},
                    "connection": {"id": connection.connection_id, "name": connection.connection_name},
                    "connection_type": {"id": connection.connection_type.connection_type_id, "name": connection.connection_type.connection_type_name, "description": getattr(connection.connection_type, "description", "")},
                    "access_path": serializable_rich_access_path,
                    "connection_info": ConnectionSerializer(connection).data,
                }
                
                serializable_extra_data["access_type"] = "pre_approval" if not is_approved else "post_approval"
                notification_type = "resource_pre_accessed" if not is_approved else "resource_accessed"

                Notification.objects.create(
                    connection=connection, guest_user=request.user, host_user=inode_owner,
                    guest_locker=connection.guest_locker, host_locker=connection.host_locker,
                    connection_type=connection.connection_type, created_at=timezone.now(),
                    message=message, notification_type=notification_type,
                    target_type="resource", target_id=str(resource_Particular.resource_id),
                    extra_data=serializable_extra_data
                )

            except Exception as e:
                # Handle potential errors during path building or notification creation gracefully
                print(f"Error during notification/path creation: {e}")
                pass # Fail silently on notification errors, but allow file access

        # Final return for case 2
        stream_url = f"{settings.SITE_DOMAIN.rstrip('/')}/resource/stream/?xnode_id={xnode.id}"
        return JsonResponse({
            "xnode": xnode_data,
            "link_To_File": stream_url,  
            "success": True
        })

