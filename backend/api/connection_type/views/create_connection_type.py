
import json
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated

from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
)
from api.serializers import (
    ConnectionTypeSerializer,
    
)
from api.models import (
    Locker,
    CustomUser,
    ConnectionTerms,
    ConnectionType
 
)
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse
from django.utils.dateparse import parse_datetime

from rest_framework_simplejwt.authentication import JWTAuthentication




@extend_schema(
    summary="Create connection type and terms",
    description="Create a new connection type and its associated terms for one or more directions (e.g., GUEST to HOST, HOST to GUEST).",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connectionName": {"type": "string"},
                "connectionDescription": {"type": "string"},
                "lockerName": {"type": "string"},
                "validity": {"type": "string", "format": "date-time"},
                "postConditions": {"type": "object"},
                "directions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "from": {"type": "string", "enum": ["GUEST", "HOST"]},
                            "to": {"type": "string", "enum": ["GUEST", "HOST"]},
                            "obligations": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "labelName": {"type": "string"},
                                        "typeOfAction": {"type": "string"},
                                        "typeOfSharing": {"type": "string"},
                                        "purpose": {"type": "string"},
                                        "labelDescription": {"type": "string"},
                                        "hostPermissions": {"type": "array", "items": {"type": "string"}},
                                        "global_conn_type_id": {"type": "integer"},
                                    },
                                    "required": ["labelName", "typeOfAction", "typeOfSharing", "labelDescription"],
                                }
                            },
                            "permissions": {
                                "type": "object",
                                "properties": {
                                    "canShareMoreData": {"type": "boolean"},
                                    "canDownloadData": {"type": "boolean"},
                                }
                            },
                            "forbidden": {"type": "array", "items": {"type": "string"}},
                        },
                        "required": ["from", "to"],
                    }
                },
            },
            "required": ["connectionName", "connectionDescription", "lockerName", "validity", "directions"],
        }
    },
    responses={
        201: OpenApiResponse(
            description="Connection type and terms created successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connection_type_message": {"type": "string"},
                    "connection_terms_message": {"type": "string"},
                },
                "example": {
                    "success": True,
                    "connection_type_message": "Connection Type successfully created",
                    "connection_terms_message": "Connection Terms created for all provided directions"
                }
            },
        ),
        400: OpenApiResponse(description="Invalid request, missing fields, or duplicate direction"),
        401: OpenApiResponse(description="Unauthorized"),
        404: OpenApiResponse(description="Locker or user not found"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_connection_type_and_connection_terms(request):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated"}, status=401)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Extract basic info
    connection_type_name = data.get("connectionName")
    connection_description = data.get("connectionDescription")
    owner_locker_name = data.get("lockerName")
    validity_time_str = data.get("validity")
    post_conditions = data.get("postConditions", {})
    directions = data.get("directions", [])

    if not all([connection_type_name, connection_description, owner_locker_name, validity_time_str, directions]):
        return JsonResponse({"success": False, "error": "Missing required fields"}, status=400)

    try:
        owner_user = CustomUser.objects.get(username=request.user)
        owner_locker = Locker.objects.filter(name=owner_locker_name, user=owner_user).first()

        if not owner_locker:
            return JsonResponse({"success": False, "error": "Owner locker not found"}, status=404)

        # Parse validity
        validity_time = parse_datetime(validity_time_str)
        if validity_time is None:
            raise ValueError("Invalid date format")

        # Create or get connection type
        new_connection_type, created = ConnectionType.objects.get_or_create(
            connection_type_name=connection_type_name,
            owner_user=owner_user,
            owner_locker=owner_locker,
            post_conditions=post_conditions,
            defaults={
                "connection_description": connection_description,
                "validity_time": validity_time,
            },
        )

        # Helper function to create terms
        def create_terms_for_direction(obligations, permissions, forbidden, direction_from, direction_to):
            for obligation in obligations:
                global_conn_type_id = obligation.get("global_conn_type_id")
                ConnectionTerms.objects.create(
                    conn_type=new_connection_type,
                    modality="obligatory",
                    data_element_name=obligation["labelName"],
                    data_type=obligation["typeOfAction"],
                    sharing_type=obligation["typeOfSharing"],
                    purpose=obligation.get("purpose", ""),
                    description=obligation["labelDescription"],
                    host_permissions=obligation.get("hostPermissions", []),
                    global_conn_type_id=global_conn_type_id,
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if permissions.get("canShareMoreData"):
                ConnectionTerms.objects.create(
                    conn_type=new_connection_type,
                    modality="permissive",
                    description="They can share more data.",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if permissions.get("canDownloadData"):
                ConnectionTerms.objects.create(
                    conn_type=new_connection_type,
                    modality="permissive",
                    description="They can download data.",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if forbidden and "Cannot close unilaterally" in forbidden:
                ConnectionTerms.objects.create(
                    conn_type=new_connection_type,
                    modality="forbidden",
                    description="You cannot unilaterally close the connection",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

        # Loop through both directions
        for direction in directions:
            from_Type = direction.get("from")
            to_Type = direction.get("to")
            obligations = direction.get("obligations", [])
            permissions = direction.get("permissions", {})
            forbidden = direction.get("forbidden", [])

            if not (from_Type and to_Type):
                return JsonResponse({"success": False, "error": "Direction must include both 'from' and 'to'"}, status=400)
            
                        
            # Check if connection type with the same direction already exists
            if ConnectionType.objects.filter(
                connection_type_name=connection_type_name,
                owner_user=owner_user,
                owner_locker=owner_locker,
                connectionterms__from_Type=from_Type,
                connectionterms__to_Type=to_Type,
            ).exists():
                return JsonResponse(
                    {
                        "success": False,
                        "error": f"Connection type '{connection_type_name}' with the same direction already exists in '{owner_locker_name}'.",
                    },
                    status=400,
                )


            if ConnectionTerms.objects.filter(conn_type=new_connection_type, from_Type=from_Type, to_Type=to_Type).exists():
                continue  # skip or handle update logic

            create_terms_for_direction(obligations, permissions, forbidden, from_Type, to_Type)

        return JsonResponse(
            {
                "success": True,
                "connection_type_message": "Connection Type successfully created",
                "connection_terms_message": "Connection Terms created for all provided directions"
            },
            status=201,
        )

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "error": "Owner user not found"}, status=404)
    except ValueError as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


