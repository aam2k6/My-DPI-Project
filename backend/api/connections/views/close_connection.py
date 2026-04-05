
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
from api.serializers import (
    ConnectionTypeSerializer,
    
)
from api.models import (
    Locker,
    CustomUser,
    Connection,
    ConnectionTerms,
    ConnectionType
)

from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse


#google
from rest_framework_simplejwt.authentication import JWTAuthentication



@extend_schema(
    summary="Close connection consent",
    description="Mark host and/or guest consent as closed for a specific connection. If both sides close, the connection status becomes 'closed'.",
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "connection_type_name": {"type": "string"},
                "guest_username": {"type": "string"},
                "guest_lockername": {"type": "string"},
                "host_username": {"type": "string"},
                "host_lockername": {"type": "string"},
                "close_host": {"type": "string", "description": "Boolean-like string (true, 1, yes)"},
                "close_guest": {"type": "string", "description": "Boolean-like string (true, 1, yes)"},
            },
            "required": ["connection_name", "connection_type_name", "guest_username", "guest_lockername", "host_username", "host_lockername"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Consent closed successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid data or missing fields"),
        403: OpenApiResponse(description="Permission denied"),
        404: OpenApiResponse(description="Connection, user, or locker not found"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def close_connection_consent(request):
    """
    Close consent for a connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_name: The name of the connection type.
    - guest_username: The username of the guest user.
    - guest_lockername: The name of the guest locker.
    - host_username: The username of the host user.
    - host_lockername: The name of the host locker.
    - close_host: Boolean indicating if the host user is closing consent.
    - close_guest: Boolean indicating if the guest user is closing consent.

    Returns:
    - JsonResponse: A JSON object containing a success message or an error message.

    Response Codes:
    - 200: Successful closing of consent.
    - 400: Bad request (if data is invalid or connection not found).
    - 401: User not authenticated.
    - 403: Permission denied.
    - 404: Connection or user or locker not found.
    - 405: Request method not allowed (if not POST).
    """
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    if not request.user.is_authenticated:
        return JsonResponse(
            {"success": False, "error": "User not authenticated"}, status=401
        )

    # Extract form data
    connection_name = request.POST.get("connection_name")
    connection_type_name = request.POST.get("connection_type_name")
    guest_username = request.POST.get("guest_username")
    guest_lockername = request.POST.get("guest_lockername")
    host_username = request.POST.get("host_username")
    host_lockername = request.POST.get("host_lockername")
    close_guest = request.POST.get("close_host", "false").lower() in [
        "true",
        "1",
        "t",
        "y",
        "yes",
    ]
    close_host = request.POST.get("close_guest", "false").lower() in [
        "true",
        "1",
        "t",
        "y",
        "yes",
    ]

    # Check if all required fields are present
    if None in [
        connection_name,
        connection_type_name,
        guest_username,
        guest_lockername,
        host_username,
        host_lockername,
    ]:
        return JsonResponse(
            {"success": False, "error": "All fields are required"}, status=400
        )

    try:
        # Retrieve the guest user and guest locker
        guest_user = CustomUser.objects.get(username=guest_username)
        guest_locker = Locker.objects.get(name=guest_lockername, user=guest_user)

        # Retrieve the host user and host locker
        host_user = CustomUser.objects.get(username=host_username)
        host_locker = Locker.objects.get(name=host_lockername, user=host_user)

        # Retrieve the connection type
        try:
            connection_type = ConnectionType.objects.get(
                connection_type_name__iexact=connection_type_name
            )
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "error": f"Connection type not found: {connection_type_name}",
                },
                status=404,
            )

        # Retrieve the connection
        try:
            connection = Connection.objects.get(
                connection_name=connection_name,
                connection_type_id=connection_type,
                guest_user=guest_user,
                host_user=host_user,
            )
        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found"}, status=404
            )

        # Check if the requesting user is either the host or guest user
        if request.user != host_user and request.user != guest_user:
            return JsonResponse(
                {"success": False, "error": "Permission denied"}, status=403
            )

        # Update the close connection status based on the provided flags
        if close_host:
            connection.close_host = True

        if close_guest:
            connection.close_guest = True

        # Save the connection
        if connection.close_host and connection.close_guest:
            connection.connection_status = "closed"
        connection.save()

        return JsonResponse(
            {"success": True, "message": "Consent closed successfully"}, status=200
        )

    except CustomUser.DoesNotExist as e:
        return JsonResponse(
            {"success": False, "error": f"User not found: {str(e)}"}, status=404
        )
    except Locker.DoesNotExist as e:
        return JsonResponse(
            {"success": False, "error": f"Locker not found: {str(e)}"}, status=404
        )
    except Exception as e:
        return JsonResponse(
            {"success": False, "error": f"An error occurred: {str(e)}"}, status=400
        )


@extend_schema(
    summary="Close connection from guest side",
    description="Mark connection as closed from the guest's perspective. Handles unilateral and non-unilateral cases based on connection terms.",
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "connection_id": {"type": "integer"},
            },
            "required": ["connection_id"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Status updated or connection closed",
            response={
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Connection ID is required"),
        404: OpenApiResponse(description="Connection not found"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def close_connection_guest(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse(
            {"message": f"Request method {request.method} is not allowed. Only POST is accepted."},
            status=405,
        )

    connection_id = request.POST.get("connection_id")
    if not connection_id:
        return JsonResponse({"message": "Connection ID cannot be None."}, status=400)

    connection = Connection.objects.filter(connection_id=connection_id).first()
    if not connection:
        return JsonResponse({"message": f"Connection with ID = {connection_id} does not exist."}, status=404)

    if connection.close_guest:
        return JsonResponse({"message": "Guest has already closed this connection."}, status=200)

    # Mark guest as closed
    connection.close_guest = True
    connection.save()
    # Check modality
    terms = ConnectionTerms.objects.filter(conn_type=connection.connection_type)
    forbidden = any(term.modality.lower() == "forbidden" for term in terms)

    if forbidden:
        if connection.close_host==False:
            return  JsonResponse({"message":"Guest has closed. Waiting for Host to close."},status=200)
        # Wait for host if not yet closed
        if connection.close_host==True:
            connection.connection_status = "closed"
            connection.save()
            return JsonResponse({"message": "connection closed successfully (non_unilateral)."}, status=200)
    else:
        # Close from guest side in unilateral case
        connection.close_host = True
        connection.connection_status = "closed"
        connection.save()
        return JsonResponse({"message": "Connection closed successfully (unilateral)."}, status=200)



@extend_schema(
    summary="Close connection from host side",
    description="Mark connection as closed from the host's perspective. Handles unilateral and non-unilateral cases based on connection terms.",
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "connection_id": {"type": "integer"},
            },
            "required": ["connection_id"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Status updated or connection closed",
            response={
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Connection ID is required"),
        404: OpenApiResponse(description="Connection not found"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def close_connection_host(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse(
            {"message": f"Request method {request.method} is not allowed. Only POST is accepted."},
            status=405,
        )

    connection_id = request.POST.get("connection_id")
    if not connection_id:
        return JsonResponse({"message": "Connection ID cannot be None."}, status=400)

    connection = Connection.objects.filter(connection_id=connection_id).first()
    if not connection:
        return JsonResponse({"message": f"Connection with ID = {connection_id} does not exist."}, status=404)

    if connection.close_host:
        return JsonResponse({"message": "Host has already closed this connection."}, status=200)

    # Mark host as closed
    connection.close_host = True
    connection.save()

    # Check modality
    terms = ConnectionTerms.objects.filter(conn_type=connection.connection_type)
    forbidden = any(term.modality.lower() == "forbidden" for term in terms)

    if forbidden:
        if connection.close_guest==False:
            return JsonResponse({"message":"Host has closed. Waiting for Guest to close."},status=200)
        # Wait for guest if not yet closed
        if connection.close_guest==True:
            connection.connection_status = "closed"
            connection.save()
            return JsonResponse({"message": "connection closed successfully (non_unilateral)."}, status=200)
    else:
        # Close from host side in unilateral case
        connection.close_guest = True
        connection.connection_status = "closed"
        connection.save()
        return JsonResponse({"message": "Connection closed successfully (unilateral)."}, status=200)

