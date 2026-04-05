
import json
from django.db import models
from django.utils import timezone
from api.utils.xnode.xnode_helper import compute_terms_status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes
from api.models import (
    Locker,
    CustomUser,
    Connection,

)
from django.http import HttpRequest, JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication



@extend_schema(
    summary="Update connection status if expired",
    description="Check and update connections to 'closed' if their validity time has passed, filtered by user and locker.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "user_id": {"type": "integer"},
                "locker_id": {"type": "integer"},
            },
            "required": ["user_id", "locker_id"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Status check completed",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "updated_connection_ids": {"type": "array", "items": {"type": "integer"}},
                    "total_checked": {"type": "integer"},
                },
            },
        ),
        400: OpenApiResponse(description="Missing user_id or locker_id"),
        404: OpenApiResponse(description="User or locker not found"),
        500: OpenApiResponse(description="Internal server error"),
    },
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_status_if_expired(request):
    """
    POST API to check and update connection_status to 'closed' for connections
    where validity_time has passed, based on user_id and locker_id.
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        locker_id = data.get("locker_id")

        if not user_id or not locker_id:
            return JsonResponse({"success": False, "error": "Missing user_id or locker_id"}, status=400)

        # Validate user and locker
        user = CustomUser.objects.get(user_id=user_id)
        locker = Locker.objects.get(locker_id=locker_id, user=user)

        # Find matching connections
        now = timezone.now()
        connections = Connection.objects.filter(
            ((models.Q(host_user=user) & models.Q(host_locker=locker)) |
             (models.Q(guest_user=user) & models.Q(guest_locker=locker)))
        )

        updated_connections = []

        for connection in connections:
            if connection.validity_time and now > connection.validity_time:
                if connection.connection_status != "closed":
                    connection.connection_status = "closed"
                    connection.save()
                    updated_connections.append(connection.connection_id)

        return JsonResponse({
            "success": True,
            "updated_connection_ids": updated_connections,
            "total_checked": connections.count()
        })

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)
    except Locker.DoesNotExist:
        return JsonResponse({"success": False, "error": "Locker not found for the given user"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
    

@extend_schema(
    summary="Update connection status if expired on login",
    description="Check and update connections to 'closed' if their validity time has passed for the logged-in user. Also updates status to 'live' if all obligations are met.",
    request=None,
    responses={
        200: OpenApiResponse(
            description="Status check completed",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "updated_connection_ids": {"type": "array", "items": {"type": "integer"}},
                    "total_checked": {"type": "integer"},
                },
            },
        ),
        401: OpenApiResponse(description="Unauthorized"),
        500: OpenApiResponse(description="Internal server error"),
    },
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_status_if_expired_onlogin(request):
    """
    POST API to check and update connection_status to 'closed' for connections
    where validity_time has passed, based on user_id
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)

    try:
        if request.user.is_authenticated:
            user_id=request.user.user_id
        else:
            return JsonResponse({"error": "User not authenticated"}, status=401)    


        if not user_id :
            return JsonResponse({"success": False, "error": "Missing user_id"}, status=400)
        
        
        now = timezone.now()
        connections = Connection.objects.filter(
            ((models.Q(host_user_id=user_id)) | (models.Q(guest_user_id=user_id)))
        )

        updated_connections = []

        for connection in connections:
            if connection.validity_time and now > connection.validity_time:
                if connection.connection_status != "closed":
                    connection.connection_status = "closed"
                    connection.save()
                    updated_connections.append(connection.connection_id)
            else:
                if (
                    connection.connection_status == "revoked"
                    or (
                        connection.connection_status == "closed"
                        and (connection.close_guest or connection.close_host )
                    )
                ):
                    continue


                terms_value = connection.terms_value or {}
                terms_value_reverse = connection.terms_value_reverse or {}

                
                summary = compute_terms_status(terms_value)
                summary_reverse = compute_terms_status(terms_value_reverse)

                count_T = summary["count_T"]
                count_F = summary["count_F"]
                count_R = summary["count_R"]

                count_T_rev = summary_reverse["count_T"]
                count_F_rev = summary_reverse["count_F"]
                count_R_rev = summary_reverse["count_R"]

                total_obligations = count_T + count_F + count_R
                total_obligations_rev = count_T_rev + count_F_rev + count_R_rev

                
                if (
                    count_T == total_obligations and count_R == 0 and
                    count_T_rev == total_obligations_rev and count_R_rev == 0
                ):
                    connection.connection_status = "live"
                else:
                    connection.connection_status = "established"

                connection.save()

        return JsonResponse({
            "success": True,
            "updated_connection_ids": updated_connections,
            "total_checked": connections.count()
        })

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
        


@extend_schema(
    summary="Update connection status to live",
    description="Update connection status to 'live' if all required terms and obligations are met.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "host_locker_name": {"type": "string"},
                "guest_locker_name": {"type": "string"},
                "host_user_username": {"type": "string"},
                "guest_user_username": {"type": "string"},
            },
            "required": ["connection_name", "host_locker_name", "guest_locker_name", "host_user_username", "guest_user_username"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Status update completed",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "status": {"type": "string"},
                    "host_terms_summary": {"type": "object"},
                    "guest_terms_summary": {"type": "object"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid JSON or missing fields"),
        404: OpenApiResponse(description="Connection, user, or locker not found"),
    },
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_status_tolive(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"success": False, "error": "Invalid JSON format."}, status=400
            )

        connection_name = data.get("connection_name")
        host_locker_name = data.get("host_locker_name")
        guest_locker_name = data.get("guest_locker_name")
        host_user_username = data.get("host_user_username")
        guest_user_username = data.get("guest_user_username")

        if not all([
            connection_name,
            host_locker_name,
            guest_locker_name,
            host_user_username,
            guest_user_username,
        ]):
            return JsonResponse(
                {"success": False, "error": "All fields are required."}, status=400
            )

        try:
            host_user = CustomUser.objects.get(username=host_user_username)
            guest_user = CustomUser.objects.get(username=guest_user_username)
        except CustomUser.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"User not found: {e}"}, status=404
            )

        try:
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
        except Locker.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"Locker not found: {e}"}, status=404
            )

        try:
            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                guest_locker=guest_locker,
                host_user=host_user,
                guest_user=guest_user,
            )
        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found."}, status=404
            )
        
       # Don't overwrite if already closed
        if connection.connection_status in ["closed", "revoked"]:
            return JsonResponse({
                "success": True,
                "message": f"Connection is already {connection.connection_status}. No changes made.",
                "status": connection.connection_status,
            })

        terms_value = connection.terms_value or {}
        terms_value_reverse = connection.terms_value_reverse or {}

        summary = compute_terms_status(terms_value)
        summary_reverse = compute_terms_status(terms_value_reverse)

        count_T = summary["count_T"]
        count_F = summary["count_F"]
        count_R = summary["count_R"]

        count_T_rev = summary_reverse["count_T"]
        count_F_rev = summary_reverse["count_F"]
        count_R_rev = summary_reverse["count_R"]

        total_obligations = count_T + count_F + count_R
        total_obligations_rev = count_T_rev + count_F_rev + count_R_rev

        if (
            count_T == total_obligations and count_R == 0 and
            count_T_rev == total_obligations_rev and count_R_rev == 0
        ):
            connection.connection_status = 'live'
        else:
            connection.connection_status = 'established'

        connection.save()

        return JsonResponse({
            "success": True,
            "message": "Connection status updated successfully.",
            "status": connection.connection_status,
            "host_terms_summary": summary,
            "guest_terms_summary": summary_reverse,
        })