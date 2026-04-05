import json
from django.http import JsonResponse
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from api.models import (
    CustomUser,
    ConnectionTerms,
    GlobalConnectionTypeTemplate,
)
from django.views.decorators.csrf import csrf_exempt

#google
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import extend_schema, OpenApiResponse

@csrf_exempt
@extend_schema(
    description="Create global connection terms. Only for system admins.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'connectionName': {'type': 'string'},
                'connectionDescription': {'type': 'string'},
                'globaltype': {'type': 'string'},
                'domain': {'type': 'string'},
                'directions': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'from': {'type': 'string'},
                            'to': {'type': 'string'},
                            'obligations': {'type': 'array', 'items': {'type': 'object'}},
                            'permissions': {'type': 'object'},
                            'forbidden': {'type': 'array', 'items': {'type': 'string'}}
                        }
                    }
                }
            },
            'required': ['connectionName', 'connectionDescription', 'globaltype', 'domain', 'directions']
        }
    },
    responses={
        201: OpenApiResponse(
            description="Global connection terms created successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connection_type_message": {"type": "string"},
                    "connection_terms_message": {"type": "string"}
                },
                "example": {
                    "success": True,
                    "connection_type_message": "Global Connection Type successfully created",
                    "connection_terms_message": "Global connection terms added for all directions."
                }
            }
        ),
        400: OpenApiResponse(description="Invalid request"),
        403: OpenApiResponse(description="Permission denied"),
    }
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_Global_Connection_Terms(request):
    if request.method == "POST":
        requesting_user: CustomUser = request.user
        if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
            return JsonResponse(
                {
                    "message": f"User must be a system admin to hit this API endpoint. Current user has {requesting_user.user_type} type"
                },
                status=403,
            )

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        # Extract general data
        connection_type_name = data.get("connectionName")
        connection_description = data.get("connectionDescription")
        globaltype = data.get("globaltype")
        domain = data.get("domain")
        directions = data.get("directions", [])

        if not all([connection_type_name, globaltype, domain, connection_description, directions]):
            return JsonResponse(
                {"success": False, "error": "All fields are required including directions"}, status=400
            )

        # Check if the connection type exists
        existing_connection = GlobalConnectionTypeTemplate.objects.filter(
            global_connection_type_name=connection_type_name,
        ).first()

        if existing_connection:
            for direction in directions:
                from_Type = direction.get("from")
                to_Type = direction.get("to")
                if ConnectionTerms.objects.filter(
                    global_conn_type=existing_connection,
                    from_Type=from_Type,
                    to_Type=to_Type
                ).exists():
                    return JsonResponse(
                        {
                            "success": False,
                            "error": f"Direction from {from_Type} to {to_Type} already exists for '{connection_type_name}'"
                        },
                        status=400,
                    )

        # Create or retrieve the connection type
        new_global_connection_type, _ = GlobalConnectionTypeTemplate.objects.get_or_create(
            global_connection_type_name=connection_type_name,
            global_connection_type_description=connection_description,
            globaltype=globaltype,
            domain=domain,
        )

        # Helper function
        def create_terms_for_direction(obligations, permissions, forbidden, direction_from, direction_to):
            for obligation in obligations:
                global_conn_type_id = obligation.get("global_conn_type_id")
                ConnectionTerms.objects.create(
                    global_conn_type=new_global_connection_type,
                    modality="obligatory",
                    data_element_name=obligation["labelName"],
                    data_type=obligation["typeOfAction"],
                    sharing_type=obligation["typeOfSharing"],
                    purpose=obligation.get("purpose", ""),
                    description=obligation["labelDescription"],
                    host_permissions=obligation.get("hostPermissions", []),
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if permissions.get("canShareMoreData", False):
                ConnectionTerms.objects.create(
                    global_conn_type=new_global_connection_type,
                    modality="permissive",
                    description="They can share more data.",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if permissions.get("canDownloadData", False):
                ConnectionTerms.objects.create(
                    global_conn_type=new_global_connection_type,
                    modality="permissive",
                    description="They can download data.",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

            if forbidden and "Cannot close unilaterally" in forbidden:
                ConnectionTerms.objects.create(
                    global_conn_type=new_global_connection_type,
                    modality="forbidden",
                    description="You cannot unilaterally close the connection",
                    from_Type=direction_from,
                    to_Type=direction_to,
                )

        # Loop through each direction and create terms
        for direction in directions:
            from_Type = direction.get("from")
            to_Type = direction.get("to")
            obligations = direction.get("obligations", [])
            permissions = direction.get("permissions", {})
            forbidden = direction.get("forbidden", [])

            if not (from_Type and to_Type):
                return JsonResponse({"success": False, "error": "Each direction must include 'from' and 'to'"}, status=400)

            create_terms_for_direction(obligations, permissions, forbidden, from_Type, to_Type)

        return JsonResponse(
            {
                "success": True,
                "connection_type_message": "Global Connection Type successfully created",
                "connection_terms_message": "Global connection terms added for all directions.",
            },
            status=201,
        )
