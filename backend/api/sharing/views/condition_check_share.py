import json
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from api.models import (
    ConnectionType,ConnectionTerms,Connection
)



from api.model.xnode_model import Xnode_V2
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes


@extend_schema(
    summary="Check sharing conditions",
    description="Check if a specific sharing mechanism (Share, Transfer, Confer, Collateral) is permitted for a given connection type and Xnode.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_type_id": {"type": "integer"},
                "type_of_share": {"type": "string", "enum": ["Share", "Transfer", "Confer", "Collateral"]},
                "xnode_id": {"type": "integer"},
            },
            "required": ["connection_type_id", "type_of_share", "xnode_id"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Condition check result",
            response={
                "type": "object",
                "properties": {
                    "possible": {"type": "boolean"},
                    "message": {"type": "string"},
                    "connection_post_conditions": {"type": "object"},
                    "xnode_post_conditions": {"type": "object"},
                },
                "example": {
                    "possible": False,
                    "message": "Share is not permitted",
                    "connection_post_conditions": {"Share": True, "Transfer": False},
                    "xnode_post_conditions": {"Share": False, "Transfer": False}
                }
            },
        ),
        400: OpenApiResponse(description="Invalid request or missing fields"),
        404: OpenApiResponse(description="Connection type or Xnode not found"),
    },
)
@csrf_exempt
@require_http_methods(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def check_conditions(request):
    """
    Checks if sharing mechanism is possible or not.

    Request Body:
    {
        "connection_id": "Connection ID",
        "type_of_share": "Sharing Mechanism",
        "xnode_id": "Xnode ID"
    }
    """
    if request.method != "GET":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    # Extract required fields from the request
    connection_type_id = data.get("connection_type_id")
    type_of_share = data.get("type_of_share")
    xnode_id = data.get("xnode_id")

    # Validate required fields
    if not all(
        [
            connection_type_id,
            type_of_share,
            xnode_id
        ]
    ):
        return JsonResponse({"error": "All fields are required"}, status=400)
    
    try:
        # Fetch host and guest users, lockers, and the connection
        connection_type = ConnectionType.objects.get(id=connection_type_id)
        xnode = Xnode_V2.objects.get(xnode_id=xnode_id)
    except (ConnectionType.DoesNotExist, Xnode_V2.DoesNotExist) as e:
        return JsonResponse({"error": str(e)}, status=404)
    
    # helper to format response
    def make_response(possible, message=""):
        return JsonResponse({
            "possible": possible,
            "message": message,
            "connection_post_conditions": connection_type.post_conditions,
            "xnode_post_conditions": xnode.post_conditions
        }, status=200)

    if type_of_share == "Share":
        if connection_type.post_conditions.get("Share") == True and xnode.post_conditions.get("Share") == True:
            return make_response(True)
        else:  
            return make_response(False, "Share is not permitted")

    if type_of_share == "Transfer":
        if connection_type.post_conditions.get("Transfer") == True:
            if xnode.post_conditions.get("Transfer") == True:
                if xnode.node_information.get("primary_owner") == xnode.node_information.get("current_owner"):
                    return make_response(True)
                else:
                    return make_response(False, "Transfer is not permitted (Ownership mismatch)")
            else:
                return make_response(False, "Transfer is not permitted (Xnode restriction)")
        else:
            return make_response(False, "Transfer is not permitted (Connection type restriction)")

    if type_of_share == "Confer":
        if connection_type.post_conditions.get("Confer") == True:
            if xnode.post_conditions.get("Confer") == True:
                if xnode.node_information.get("primary_owner") == xnode.node_information.get("current_owner"):
                    return make_response(True)
                else:
                    return make_response(False, "Confer is not permitted (Ownership mismatch)")
            else:
                return make_response(False, "Confer is not permitted (Xnode restriction)")
        else:
            return make_response(False, "Confer is not permitted (Connection type restriction)")

    if type_of_share == "Collateral":
        if connection_type.post_conditions.get("Collateral") == True:
            if xnode.post_conditions.get("Collateral") == True:
                if xnode.node_information.get("primary_owner") == xnode.node_information.get("current_owner"):
                    return make_response(True)
                else:
                    return make_response(False, "Collateral is not permitted (Ownership mismatch)")
            else:
                return make_response(False, "Collateral is not permitted (Xnode restriction)")
        else:
            return make_response(False, "Collateral is not permitted (Connection type restriction)")
    
    return JsonResponse({"possible": False, "message": "Invalid type_of_share"}, status=400)
        

@extend_schema(
    summary="Check reshare permission",
    description="Check if resharing is allowed for a given connection.",
    parameters=[
        OpenApiParameter(
            name="connection_id",
            description="ID of the connection to check",
            required=True,
            type=str,
            location=OpenApiParameter.QUERY,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Reshare permission status",
            response={
                "type": "object",
                "properties": {
                    "boolean_value": {"type": "boolean"},
                    "message": {"type": "string"},
                },
            },
        ),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def reshare_Allowed_Or_Not(request: HttpRequest) -> JsonResponse:
    """
    {
        "connection_id": value
    }
    """
    connection_id = request.GET.get("connection_id")
    connections = Connection.objects.filter(connection_id=connection_id)
    if connections.exists():
        connection = connections.first()
        terms = ConnectionTerms.objects.filter(conn_type=connection.connection_type)
        if terms.exists():
            term = terms.first()
            if "reshare" in term.host_permissions:
                return JsonResponse({"boolean_value": True})
            return JsonResponse({"boolean_value": False})
        return JsonResponse(
            {
                "message": f"Connection terms do not exist for connection type = {connection.connection_type.connection_type_name}"
            }
        )
    return JsonResponse(
        {"message": f"Connection with ID = {connection_id} does not exist."}
    )

