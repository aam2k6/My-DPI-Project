from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from api.serializers import (
    ConnectionTypeSerializer,
    ConnectionSerializer
)
from api.models import (
    Connection,
    ConnectionType,
    Notification
)
from django.http import JsonResponse

#google
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q

from drf_spectacular.utils import extend_schema, OpenApiResponse

# =======================Get Notifications===============================
@extend_schema(
    description="Get all notifications for the authenticated user, with latest connection data.",
    responses={
        200: OpenApiResponse(
            description="Notifications retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "notifications": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "integer"},
                                "is_read": {"type": "boolean"},
                                "message": {"type": "string"},
                                "notification_type": {"type": "string"}
                            }
                        }
                    }
                },
                "example": {
                    "success": True,
                    "notifications": [
                        {
                            "id": 1,
                            "is_read": False,
                            "message": "New connection request",
                            "notification_type": "request"
                        }
                    ]
                }
            }
        ),
        400: OpenApiResponse(description="Error retrieving notifications")
    }
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """
    Get all notifications for the authenticated user, with latest connection data.
    """
    try:
        curr_user = request.user
        notifications = Notification.objects.filter(host_user=curr_user).order_by(
            "-created_at"
        )

        notifications_data = []

        for notification in notifications:
            connection_data = None
            connection_type_data = None

            # Safely get the connection info from extra_data
            extra_data = notification.extra_data or {}

            connection_id = extra_data.get("connection_id")
            connection_type_id = extra_data.get("connection_type_id")

            # Fetch current connection and connection type info
            if connection_id:
                try:
                    connection = Connection.objects.get(connection_id=connection_id)
                    connection_data = ConnectionSerializer(connection).data
                except Connection.DoesNotExist:
                    connection_data = None

            if connection_type_id:
                try:
                    connection_type = ConnectionType.objects.get(connection_type_id=connection_type_id)
                    connection_type_data = ConnectionTypeSerializer(connection_type).data
                except ConnectionType.DoesNotExist:
                    connection_type_data = None

            extra_data_info = {
                **extra_data,
                "connection_info": connection_data,
                "connection_type_info": connection_type_data,
            }

            notifications_data.append(
                {
                    "id": notification.id,
                    "is_read": notification.is_read,
                    "message": notification.message,
                    "created_at": notification.created_at,
                    "notification_type": notification.notification_type,
                    "target_type": notification.target_type,
                    "target_id": notification.target_id,
                    "extra_data": extra_data_info,
                    "connection_info": connection_data,  
                    "connection_type_info": connection_type_data,
                }
            )

        return JsonResponse(
            {"success": True, "notifications": notifications_data}, status=200
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
    
    
# ===================Mark Notifications as Read=======================
@extend_schema(
    description="Mark specific notifications as read. Body: {'notification_id': id}",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'notification_id': {'type': 'integer'}
            },
            'required': ['notification_id']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Notification marked as read",
            response={
                "type": "object",
                "properties": {"success": {"type": "boolean"}},
                "example": {"success": True}
            }
        ),
        400: OpenApiResponse(description="Invalid request"),
        404: OpenApiResponse(description="Notification not found")
    }
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    """
    Mark specific notifications as read for the authenticated user.
    {
    "notification_id": = id
    }
    """
    
    try:
        curr_user = request.user
        notification_id = request.data.get("notification_id")  

        if not notification_id:
            return JsonResponse({"success": False, "error": "Notification ID is required."}, status=400)

        notification = Notification.objects.get(
            Q(id=notification_id) & Q(host_user=curr_user)
        )

        if not notification.is_read:
            notification.is_read = True
            notification.save()

        return JsonResponse({"success": True}, status=200)

    except Notification.DoesNotExist:
        return JsonResponse({"success": False, "error": "Notification not found."}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
