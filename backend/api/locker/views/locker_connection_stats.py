import os
import json
from django.http import JsonResponse, HttpRequest

from rest_framework.decorators import api_view, authentication_classes, permission_classes

from rest_framework.permissions import IsAuthenticated


from api.models import Locker, Resource, CustomUser, Connection ,Notification , ConnectionType


from rest_framework_simplejwt.authentication import JWTAuthentication


from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

@extend_schema(
    description="Get statistics for a locker including incoming/outgoing connections.",
    parameters=[
        OpenApiParameter(name="locker_id", description="ID of the locker to get stats for", required=False, type=int),
    ],
    responses={
        200: OpenApiResponse(
            description="Locker statistics retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "incoming": {
                        "type": "object",
                        "properties": {
                            "total_users": {"type": "integer"},
                            "live": {"type": "integer"},
                            "established": {"type": "integer"},
                            "closed": {"type": "integer"},
                            "total_connections_type": {"type": "integer"}
                        }
                    },
                    "outgoing": {
                        "type": "object",
                        "properties": {
                            "total_connections": {"type": "integer"},
                            "live": {"type": "integer"},
                            "established": {"type": "integer"},
                            "closed": {"type": "integer"}
                        }
                    }
                },
                "example": {
                    "incoming": {
                        "total_users": 5,
                        "live": 2,
                        "established": 3,
                        "closed": 0,
                        "total_connections_type": 1
                    },
                    "outgoing": {
                        "total_connections": 2,
                        "live": 1,
                        "established": 1,
                        "closed": 0
                    }
                }
            }
        )
    }
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_locker_status(request):
    user = request.user
    locker_id = request.GET.get("locker_id")

    incoming_filter = {"host_user": user}
    outgoing_filter = {"guest_user": user}

    if locker_id:
        incoming_filter["host_locker_id"] = locker_id
        outgoing_filter["guest_locker_id"] = locker_id

    incoming = Connection.objects.filter(**incoming_filter)
    outgoing = Connection.objects.filter(**outgoing_filter)

    incoming_active = incoming.exclude(connection_status="revoked")
    outgoing_active = outgoing.exclude(connection_status="revoked")

    connection_type_filter = {"owner_user": user}
    if locker_id:
        connection_type_filter["owner_locker_id"] = locker_id

    total_connection_types = ConnectionType.objects.filter(
        **connection_type_filter
    ).count()

    stats = {
        "incoming": {
            "total_users": incoming_active.count(),
            "live": incoming.filter(connection_status="live").count(),
            "established": incoming.filter(connection_status="established").count(),
            "closed": incoming.filter(connection_status="closed").count(),
            "total_connections_type": total_connection_types,
        },
        "outgoing": {
            "total_connections": outgoing_active.count(),
            "live": outgoing_active.filter(connection_status="live").count(),
            "established": outgoing_active.filter(connection_status="established").count(),
            "closed": outgoing_active.filter(connection_status="closed").count(),
        }
    }

    return JsonResponse(stats, status=200)