import json
from django.utils import timezone
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from api.models import (
    Resource,
    Notification,
    Locker,
    CustomUser,
    Connection,
)

from api.serializers import ConnectionSerializer ,ConnectionTypeSerializer
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication


from drf_spectacular.utils import extend_schema, OpenApiResponse

@csrf_exempt
@extend_schema(
    description="Reject a resource notification.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'connection_name': {'type': 'string'},
                'host_locker_name': {'type': 'string'},
                'guest_locker_name': {'type': 'string'},
                'host_user_username': {'type': 'string'},
                'guest_user_username': {'type': 'string'},
                'rejection_reason': {'type': 'string'},
                'resource_name': {'type': 'string'}
            },
            'required': ['connection_name', 'host_locker_name', 'guest_locker_name', 'host_user_username', 'guest_user_username', 'rejection_reason', 'resource_name']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Resource rejection processed",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"}
                },
                "example": {
                    "success": True,
                    "message": "Rejection notification sent to guest."
                }
            }
        ),
        400: OpenApiResponse(description="Invalid request or missing fields"),
        403: OpenApiResponse(description="Unauthorized"),
        404: OpenApiResponse(description="Resource or connection not found")
    }
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def reject_resource_notification(request):
    try:
        body = json.loads(request.body)

        required_fields = [
            "connection_name",
            "host_locker_name",
            "guest_locker_name",
            "host_user_username",
            "guest_user_username",
            "rejection_reason",
            "resource_name"
        ]

        for field in required_fields:
            if not body.get(field):
                return JsonResponse(
                    {"success": False, "error": f"{field} is required"}, status=400
                )

        # Extract users and lockers
        host_user = CustomUser.objects.get(username=body["host_user_username"])
        guest_user = CustomUser.objects.get(username=body["guest_user_username"])
        host_locker = Locker.objects.get(name=body["host_locker_name"], user=host_user)
        guest_locker = Locker.objects.get(name=body["guest_locker_name"], user=guest_user)
        rejection_reason = body["rejection_reason"]
        resource_name = body["resource_name"]

        # Get connection
        connection = Connection.objects.get(
            connection_name=body["connection_name"],
            host_user=host_user,
            guest_user=guest_user,
            host_locker=host_locker,
            guest_locker=guest_locker,
        )

        if request.user == host_user:
            rejector_role = "Host"
            if (connection.terms_value):
                # Notify guest
                resource = Resource.objects.get(document_name=resource_name)
                # Build rich, serializable extra_data for the notification
                extra_data = {
                    "resource_id": resource.resource_id,
                    "resource_name": resource.document_name,
                    "rejection_reason": rejection_reason,
                    "rejector_role": rejector_role,
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
                    # "connection_type": {
                    #     "id": connection.connection_type.connection_type_id,
                    #     "name": connection.connection_type.connection_type_name,
                    #     "description": getattr(connection.connection_type, "description", ""),
                    # }
                    "connection_type": ConnectionTypeSerializer(connection.connection_type).data,
                    "connection_info": ConnectionSerializer(connection).data,
                }
                Notification.objects.create(
                    connection=connection,
                    guest_user=guest_user,
                    host_user=guest_user,
                    guest_locker=guest_locker,
                    host_locker=guest_locker,
                    connection_type=connection.connection_type,
                    created_at=timezone.now(),
                    message=(
                        f"{rejector_role} '{request.user.username}' has rejected the resource '{resource_name}' "
                        f"from the connection '{connection.connection_type}'. Reason: {rejection_reason}"
                    ),
                    notification_type="resource_rejected",
                    target_type="resource",
                    target_id=str(resource.resource_id),
                    extra_data=extra_data,
                )
                return JsonResponse({"success": True, "message": "Rejection notification sent to guest."}, status=200)
            else:
                return JsonResponse({
                    "success": False,
                    "message": "rejection skipped data is approved or pending"
                }, status=200)

        elif request.user == guest_user:
            rejector_role = "Guest"
            if (connection.terms_value_reverse):
                # Notify host
                resource = Resource.objects.get(document_name=resource_name)
                # Build rich, serializable extra_data for the notification
                extra_data = {
                    "resource_id": resource.resource_id,
                    "resource_name": resource.document_name,
                    "rejection_reason": rejection_reason,
                    "rejector_role": rejector_role,
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
                    # "connection_type": {
                    #     "id": connection.connection_type.connection_type_id,
                    #     "name": connection.connection_type.connection_type_name,
                    #     "description": getattr(connection.connection_type, "description", ""),
                    # }
                    "connection_type": ConnectionTypeSerializer(connection.connection_type).data,
                    "connection_info": ConnectionSerializer(connection).data,
                }
                Notification.objects.create(
                    connection=connection,
                    guest_user=guest_user,
                    host_user=host_user,
                    guest_locker=guest_locker,
                    host_locker=host_locker,
                    connection_type=connection.connection_type,
                    created_at=timezone.now(),
                    message=(
                        f"{rejector_role} '{request.user.username}' has rejected the resource '{resource_name}' "
                        f"from the connection '{connection.connection_type}'. Reason: {rejection_reason}"
                    ),
                    notification_type="resource_rejected",
                    target_type="resource",
                    target_id=str(resource.resource_id),
                    extra_data=extra_data,
                )
                return JsonResponse({"success": True, "message": "Rejection notification sent to host."}, status=200)
            else:
                return JsonResponse({
                    "success": False,
                    "message": "rejection skipped data is approved or pending"
                }, status=200)

        else:
            return JsonResponse({
                "success": False,
                "error": "You are not authorized to reject this request"
            }, status=403)

    except (CustomUser.DoesNotExist, Locker.DoesNotExist, Connection.DoesNotExist) as e:
        return JsonResponse({"success": False, "error": str(e)}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)
    except Exception as e:
        return JsonResponse({"success": False, "error": f"Internal error: {str(e)}"}, status=500)
