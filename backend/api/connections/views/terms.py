
import json
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes
from api.models import (
    ConnectionTerms,
    Connection,
    Locker,
    CustomUser,

)

from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse

from rest_framework_simplejwt.authentication import JWTAuthentication
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from api.model.xnode_model import Xnode_V2



@extend_schema(
    summary="Update connection term fields only",
    description="Directly update specific fields of a ConnectionTerms entry by its ID.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "terms_id": {"type": "integer"},
                "modality": {"type": "string"},
                "host_permissions": {"type": "array", "items": {"type": "string"}},
                "sharing_type": {"type": "string"},
                "data_type": {"type": "string"},
                "data_element_name": {"type": "string"},
            },
            "required": ["terms_id"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Connection term updated successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connection_term": {
                        "type": "object",
                        "properties": {
                            "terms_id": {"type": "integer"},
                            "modality": {"type": "string"},
                            "host_permissions": {"type": "array", "items": {"type": "string"}},
                            "sharing_type": {"type": "string"},
                            "data_type": {"type": "string"},
                            "data_element_name": {"type": "string"},
                        }
                    },
                },
            },
        ),
        400: OpenApiResponse(description="Invalid JSON or missing terms_id"),
        404: OpenApiResponse(description="ConnectionTerms entry not found"),
    },
)
@csrf_exempt
@api_view(["PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_termsONLY(request):
    """
    Update specific fields in ConnectionTerms.

    Request Body:
    {
        "terms_id": 60,
        "modality": "obligatory",
        "host_permissions":["reshare","download"],
        "sharing_type":"Transfer",
        "data_type": "file",
        "data_element_name":"markscard"
    }

    Returns:
    - JsonResponse: A JSON object containing the updated ConnectionTerms data or an error message.
    """
    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)

        terms_id = data.get("terms_id")
        if not terms_id:
            return JsonResponse(
                {"success": False, "error": "terms_id is required"}, status=400
            )

        try:
            connection_term = ConnectionTerms.objects.get(terms_id=terms_id)
        except ConnectionTerms.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "ConnectionTerms entry not found"},
                status=404,
            )

        # Update only the fields provided in the request
        if "modality" in data:
            connection_term.modality = data.get("modality")
        if "host_permissions" in data:
            connection_term.host_permissions = data.get("host_permissions")
        if "sharing_type" in data:
            connection_term.sharing_type = data.get("sharing_type")
        if "data_type" in data:
            connection_term.data_type = data.get("data_type")
        if "data_element_name" in data:
            connection_term.data_element_name = data.get("data_element_name")

        connection_term.save()

        # Prepare the response
        response_data = {
            "terms_id": connection_term.terms_id,
            "modality": connection_term.modality,
            "host_permissions": connection_term.host_permissions,
            "sharing_type": connection_term.sharing_type,
            "data_type": connection_term.data_type,
            "data_element_name": connection_term.data_element_name,
        }

        return JsonResponse(
            {"success": True, "connection_term": response_data}, status=200
        )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@extend_schema(
    summary="Update connection terms values",
    description="Update terms_value, terms_value_reverse, and resources for a connection.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "host_locker_name": {"type": "string"},
                "guest_locker_name": {"type": "string"},
                "host_user_username": {"type": "string"},
                "guest_user_username": {"type": "string"},
                "terms_value": {"type": "object"},
                "terms_value_reverse": {"type": "object"},
                "resources": {"type": "object"},
            },
            "required": ["connection_name", "host_locker_name", "guest_locker_name", "host_user_username", "guest_user_username"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Connection terms updated successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid JSON or missing fields"),
        404: OpenApiResponse(description="Connection, user, or locker not found"),
    },
)
@csrf_exempt
@api_view(["PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_terms(request):
    """
    Updates terms_value or terms_value_reverse independently.

    Request Body:
    {
        "connection_name": "Connection Name",
        "host_locker_name": "Host Locker",
        "guest_locker_name": "Guest Locker",
        "host_user_username": "Host Username",
        "guest_user_username": "Guest Username",
        "terms_value": { ... },  # Optional for Guest-to-Host terms
        "terms_value_reverse": { ... },  # Optional for Host-to-Guest terms
        "resources": { ... }  # Optional resources
    }
    """
    if request.method != "PATCH":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Extract required fields from the request
    connection_name = data.get("connection_name")
    host_locker_name = data.get("host_locker_name")
    guest_locker_name = data.get("guest_locker_name")
    host_user_username = data.get("host_user_username")
    guest_user_username = data.get("guest_user_username")
    connection_terms_json = data.get("terms_value")  # Guest-to-Host terms (optional)
    connection_terms_reverse_json = data.get(
        "terms_value_reverse"
    )  # Host-to-Guest terms (optional)
    resources_json = data.get("resources")  # Optional resources

    # Validate required fields
    if not all(
        [
            connection_name,
            host_locker_name,
            guest_locker_name,
            host_user_username,
            guest_user_username,
        ]
    ):
        return JsonResponse({"error": "All fields are required"}, status=400)

    try:
        # Fetch host and guest users, lockers, and the connection
        host_user = CustomUser.objects.get(username=host_user_username)
        host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
        guest_user = CustomUser.objects.get(username=guest_user_username)
        guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
        connection = Connection.objects.get(
            connection_name=connection_name,
            host_locker=host_locker,
            host_user=host_user,
            guest_locker=guest_locker,
            guest_user=guest_user,
        )
    except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
        return JsonResponse({"error": str(e)}, status=404)

    # Helper function to process terms (handles both terms_value and terms_value_reverse)
    def process_terms(terms_json):
        if not terms_json:  # Return an empty dictionary if terms_json is None
            return {}

        processed_terms = {}
        for term_key, term_value in terms_json.items():
            if term_key != "canShareMoreData":
                xnode_from_to = term_value.split(";")[0].strip()
                parts = xnode_from_to.split(",")

                if len(parts) == 4:
                    document_name, xnode_id, from_page, to_page = parts
                    status = term_value.split(";")[-1].strip()
                    try:
                        xnode = Xnode_V2.objects.get(id=xnode_id)
                        processed_terms[term_key] = (
                            f"{document_name}|{xnode_id}; {status}"
                        )
                    except Xnode_V2.DoesNotExist:
                        processed_terms[term_key] = term_value
                else:
                    processed_terms[term_key] = term_value
            else:
                processed_terms[term_key] = term_value
        return processed_terms

    # Process terms_value and terms_value_reverse independently if they are provided
    if connection_terms_json is not None:
        connection.terms_value = process_terms(connection_terms_json)

    if connection_terms_reverse_json is not None:
        connection.terms_value_reverse = process_terms(connection_terms_reverse_json)

    if resources_json is not None:
        connection.resources = resources_json

    connection.save()

    return JsonResponse(
        {"success": True, "message": "Connection terms successfully updated."},
        status=200,
    )