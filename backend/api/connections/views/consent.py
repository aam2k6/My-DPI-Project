
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
    ConnectionType
)
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from datetime import datetime


@extend_schema(
    summary="Give consent for a connection",
    description="Update the consent status for a specific connection and record the consent date.",
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "connection_type_id": {"type": "integer"},
                "guest_username": {"type": "string"},
                "guest_lockername": {"type": "string"},
                "host_username": {"type": "string"},
                "host_lockername": {"type": "string"},
                "consent": {"type": "string", "description": "Boolean-like string (true, 1, yes)"},
            },
            "required": ["connection_name", "connection_type_id", "guest_username", "guest_lockername", "host_username", "host_lockername", "consent"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Consent status updated successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "consent_given_date": {"type": "string"},
                    "valid_until": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid data or missing fields"),
        403: OpenApiResponse(description="Permission denied (not guest user)"),
        404: OpenApiResponse(description="Connection, user, or locker not found"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def give_consent(request):
    """
    Give consent for a connection and store consent date in the database.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_id: The ID of the connection type.
    - guest_username: The username of the guest user.
    - guest_lockername: The name of the guest locker.
    - host_username: The username of the host user.
    - host_lockername: The name of the host locker.
    - consent: Boolean indicating the consent status.

    Returns:
    - JsonResponse: A JSON object containing a success message or an error message.

    Response Codes:
    - 200: Successful update of the consent status.
    - 400: Bad request (if data is invalid or connection not found).
    - 401: Request User not authenticated.
    - 403: Permission denied.
    - 404: Specified connection or user or locker not found.
    - 405: Request method not allowed (if not POST).
    """
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    connection_name = request.POST.get("connection_name")
    connection_type_id = request.POST.get("connection_type_id")
    guest_username = request.POST.get("guest_username")
    guest_lockername = request.POST.get("guest_lockername")
    host_username = request.POST.get("host_username")
    host_lockername = request.POST.get("host_lockername")
    consent = request.POST.get("consent")

    if None in [
        connection_name,
        connection_type_id,
        guest_username,
        guest_lockername,
        host_username,
        host_lockername,
        consent,
    ]:
        return JsonResponse(
            {"success": False, "error": "All fields are required"}, status=400
        )

    try:
        guest_user = CustomUser.objects.get(username=guest_username)
        guest_locker = Locker.objects.get(name=guest_lockername, user=guest_user)
        host_user = CustomUser.objects.get(username=host_username)
        host_locker = Locker.objects.get(name=host_lockername, user=host_user)

        # Fetch the connection type
        try:
            connection_type = ConnectionType.objects.get(
                pk=connection_type_id
            )
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "error": f"Connection type not found: {connection_type_id}",
                },
                status=404,
            )

        # Fetch the connection using the connection name, connection type, guest user, and host user
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

        # Check if the requesting user is the guest user
        if request.user != guest_user:
            return JsonResponse(
                {"success": False, "error": "Permission denied"}, status=403
            )

        # Update the consent status and save consent date
        consent_status = consent.lower() in ["true", "1", "t", "y", "yes"]
        connection.requester_consent = consent_status

        if consent_status:
            # Set the consent given date to now
            connection.consent_given = datetime.now()

            # Use the validity_time already set in the connection model
            validity_date = connection_type.validity_time

        # Save the connection after updating
        connection.save()

        return JsonResponse(
            {
                "success": True,
                "message": "Consent status updated successfully",
                "consent_given_date": connection.consent_given.strftime(
                    "%B %d, %Y, %I:%M %p"
                ),
                "valid_until": validity_date.strftime("%B %d, %Y, %I:%M %p"),
            },
            status=200,
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
    summary="Get consent status",
    description="Retrieve the current requester consent status and validity information for a specific connection.",
    parameters=[
        OpenApiParameter("connection_name", OpenApiTypes.STR, description="Name of the connection"),
        OpenApiParameter("connection_type_id", OpenApiTypes.INT, description="ID of the connection type"),
        OpenApiParameter("guest_username", OpenApiTypes.STR, description="Username of the guest user"),
        OpenApiParameter("guest_lockername", OpenApiTypes.STR, description="Name of the guest locker"),
        OpenApiParameter("host_username", OpenApiTypes.STR, description="Username of the host user"),
        OpenApiParameter("host_lockername", OpenApiTypes.STR, description="Name of the host locker"),
    ],
    responses={
        200: OpenApiResponse(
            description="Consent status retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connection_name": {"type": "string"},
                    "connection_type_name": {"type": "string"},
                    "consent_status": {"type": "boolean"},
                    "consent_given": {"type": "string"},
                    "valid_until": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Missing required parameters"),
        404: OpenApiResponse(description="Connection, user, or locker not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_consent_status(request):
    """
    Get consent status for a specific connection.

    Query Parameters:
    - connection_name: The name of the connection.
    - connection_type_id: The ID of the connection type.
    - guest_username: The username of the guest user.
    - guest_lockername: The name of the guest locker.
    - host_username: The username of the host user.
    - host_lockername: The name of the host locker.

    Returns:
    - JsonResponse: A JSON object containing consent status, consent given date, and validity date.

    Response Codes:
    - 200: Successful retrieval of consent status.
    - 400: Bad request (if data is invalid or connection not found).
    - 401: Request User not authenticated.
    - 404: Specified connection, user, or locker not found.
    - 405: Request method not allowed (if not GET).
    """
    if request.method != "GET":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    connection_name = request.GET.get("connection_name")
    connection_type_id = request.GET.get("connection_type_id")
    guest_username = request.GET.get("guest_username")
    guest_lockername = request.GET.get("guest_lockername")
    host_username = request.GET.get("host_username")
    host_lockername = request.GET.get("host_lockername")

    if None in [
        connection_name,
        connection_type_id,
        guest_username,
        guest_lockername,
        host_username,
        host_lockername,
    ]:
        return JsonResponse(
            {"success": False, "error": "All fields are required"}, status=400
        )

    try:
        guest_user = CustomUser.objects.get(username=guest_username)
        guest_locker = Locker.objects.get(name=guest_lockername, user=guest_user)
        host_user = CustomUser.objects.get(username=host_username)
        host_locker = Locker.objects.get(name=host_lockername, user=host_user)

        # Fetch the connection type
        try:
            connection_type = ConnectionType.objects.get(
                connection_type_id=connection_type_id
            )
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection type not found"}, status=404
            )

        # Fetch the connection
        try:
            connection = Connection.objects.get(
                connection_name=connection_name,
                connection_type=connection_type,
                guest_user=guest_user,
                host_user=host_user,
            )
        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found"}, status=404
            )

        consent_status = connection.requester_consent
        consent_given = connection.consent_given
        validity_date = connection.validity_time

        return JsonResponse(
            {
                "success": True,
                "connection_name": connection_name,
                "connection_type_name": connection_type.connection_type_name,
                "consent_status": consent_status,
                "consent_given": (
                    consent_given.strftime("%B %d, %Y, %I:%M %p")
                    if consent_given
                    else "Not provided"
                ),
                "valid_until": (
                    validity_date.strftime("%B %d, %Y, %I:%M %p")
                    if validity_date
                    else "Not provided"
                ),
            },
            status=200,
        )

    except CustomUser.DoesNotExist as e:
        return JsonResponse(
            {"success": False, "error": "User not found: {}".format(str(e))}, status=404
        )
    except Locker.DoesNotExist as e:
        return JsonResponse(
            {"success": False, "error": "Locker not found: {}".format(str(e))},
            status=404,
        )
    except Exception as e:
        return JsonResponse(
            {"success": False, "error": "An error occurred: {}".format(str(e))},
            status=400,
        )

