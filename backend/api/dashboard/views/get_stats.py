from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from api.serializers import (
    ConnectionTypeSerializer
)
from api.models import (
    Connection,
    ConnectionType
)
from django.http import JsonResponse

from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import extend_schema, OpenApiResponse

@extend_schema(
    summary="Get connection statistics",
    description=(
        "Returns statistics for the authenticated user, including incoming and "
        "outgoing connections categorized by status (live, established, closed)."
    ),
    responses={
        200: {
            "type": "object",
            "properties": {
                "incoming": {
                    "type": "object",
                    "properties": {
                        "total_Users": {"type": "integer"},
                        "live": {"type": "integer"},
                        "established": {"type": "integer"},
                        "closed": {"type": "integer"},
                        "total_connections_type": {"type": "integer"},
                    }
                },
                "outgoing": {
                    "type": "object",
                    "properties": {
                        "total_Connections": {"type": "integer"},
                        "live": {"type": "integer"},
                        "established": {"type": "integer"},
                        "closed": {"type": "integer"},
                    }
                }
            }
        },
        401: OpenApiResponse(description="Authentication credentials were not provided or invalid"),
    },
)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_stats(request):
    """
    Fetches statistics about the authenticated user's total connections,
    live connections, and closed connections
    """
    user = request.user

    #Incoming: Where the user is the host
    incoming = Connection.objects.filter(host_user=user)
    incoming_total = incoming.count()
    incoming_live = incoming.filter(connection_status="live").count()
    incoming_established = incoming.filter(connection_status="established").count()
    incoming_closed = incoming.filter(connection_status="closed").count()
    total_connection_types = ConnectionType.objects.filter(owner_user=user).count()

    #Outgoing: Where the user is the guest
    outgoing = Connection.objects.filter(guest_user=user)
    outgoing_total=outgoing.count()
    outgoing_live=outgoing.filter(connection_status="live").count()
    outgoing_established=outgoing.filter(connection_status="established").count()
    outgoing_closed=outgoing.filter(connection_status="closed").count()

    stats = {
        "incoming":{
            "total_Users": incoming_total,
            "live": incoming_live,
            "established": incoming_established,
            "closed": incoming_closed,
            "total_connections_type": total_connection_types,
        },
        "outgoing":{
            "total_Connections": outgoing_total,
            "live": outgoing_live,
            "established": outgoing_established,
            "closed": outgoing_closed,
        }
    }
    return JsonResponse(stats, status=200)

