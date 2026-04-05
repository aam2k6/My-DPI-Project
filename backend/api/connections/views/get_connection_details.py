
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from api.serializers import (
    ResourceSerializer,
    ConnectionSerializer,
    ConnectionTypeSerializer,
    ConnectionFilterSerializer,

    
)
from api.models import (
    Resource,
    Locker,
    CustomUser,
    Connection,
    ConnectionType
)
from api.serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse
from collections import defaultdict


#google
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import inline_serializer
from rest_framework import serializers


@extend_schema(
    summary="Get connection details",
    description="Retrieve specific connection details based on connection type, host locker, guest locker, host user, and guest user.",
    parameters=[
        OpenApiParameter("connection_type_name", str, description="Name of the connection type"),
        OpenApiParameter("host_locker_name", str, description="Name of the host locker"),
        OpenApiParameter("guest_locker_name", str, description="Name of the guest locker"),
        OpenApiParameter("host_user_username", str, description="Username of the host user"),
        OpenApiParameter("guest_user_username", str, description="Username of the guest user"),
    ],
    responses={
        200: ConnectionSerializer,  # <- just put the serializer here
        400: OpenApiResponse(description="Missing fields or invalid data"),
        404: OpenApiResponse(description="Connection type not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_details(request):
    if request.method == "GET":
        connection_type_name = request.GET.get("connection_type_name")
        host_locker_name = request.GET.get("host_locker_name")
        guest_locker_name = request.GET.get("guest_locker_name")
        host_user_username = request.GET.get("host_user_username")
        guest_user_username = request.GET.get("guest_user_username")

        if not all(
            [
                connection_type_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
            ]
        ):
            return JsonResponse(
                {"success": False, "error": "All fields are required"}, status=400
            )

        try:
            # Fetch host user, locker, guest user, and locker
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)

            # Get the connection type and associated connection
            connection_type = ConnectionType.objects.get(
                connection_type_name=connection_type_name,
                owner_locker=host_locker,
                owner_user=host_user,
            )
            connection = Connection.objects.get(
                connection_type=connection_type,
                host_locker=host_locker,
                guest_locker=guest_locker,
                host_user=host_user,
                guest_user=guest_user,
            )

            # Use serializer to serialize connection data
            serializer = ConnectionSerializer(connection)
            connection_data = serializer.data

            # Populate terms_value_reverse explicitly if needed
            if hasattr(connection, "terms_value_reverse"):
                connection_data["terms_value_reverse"] = connection.terms_value_reverse

            return JsonResponse({"connections": connection_data, "post_conditions": connection_type.post_conditions,}, status=200)

        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Requested Connection type not found"},
                status=404,
            )
        except Locker.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"Locker not found: {e}"}, status=400
            )
        except CustomUser.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"User not found: {e}"}, status=400
            )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )



@extend_schema(
    summary="Get connections by user",
    description="Retrieve all connections where the specified user is the host user.",
    parameters=[
        OpenApiParameter(
            name="username",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Username of the user",
            required=True,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Connections retrieved successfully",
            response=inline_serializer(
                name="GetConnectionsByUserResponse",
                fields={
                    "connections": ConnectionSerializer(many=True),
                },
            ),
        ),
        400: OpenApiResponse(
            description="Username parameter is required",
            response=inline_serializer(
                name="GetConnectionsByUserBadRequest",
                fields={
                    "error": serializers.CharField(),
                },
            ),
        ),
        404: OpenApiResponse(
            description="User not found or no connections found",
            response=inline_serializer(
                name="GetConnectionsByUserNotFound",
                fields={
                    "error": serializers.CharField(),
                },
            ),
        ),
        405: OpenApiResponse(
            description="Invalid request method",
            response=inline_serializer(
                name="GetConnectionsByUserMethodNotAllowed",
                fields={
                    "error": serializers.CharField(),
                },
            ),
        ),
    },
)
@csrf_exempt
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_connections_by_user(request):
    """
    Retrieve connections for a specific user.

    This view handles GET requests to fetch connections for a specific user,
    identified by a 'username' query parameter.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username: The username of the user whose connections are to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of connections or an error message.

    Response Codes:
        - 200: Successful retrieval of connections.
        - 401: User is not authenticated.
        - 404: Specified user not found or no connections found.
        - 405: Request method not allowed (if not GET).
        - 400: Bad request (missing parameters or other errors).

    """
    if request.method == 'GET':
        username = request.GET.get('username')
        if not username:
            return JsonResponse({'error': 'Username parameter is required'}, status=400)

        try:
            user = CustomUser.objects.get(username=username)
            connections = Connection.objects.filter(
                host_user=user
            ).distinct()

            if not connections.exists():
                return JsonResponse({'error': 'No connections found for the specified user'}, status=404)

            serializer = ConnectionSerializer(connections, many=True)
            return JsonResponse({'connections': serializer.data}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)

    return JsonResponse({'error': 'Invalid request method'}, status=405)



@extend_schema(
    summary="Get connections by user and locker",
    description="Retrieves all incoming and outgoing connections for a specific locker and user.",
    parameters=[
        OpenApiParameter(
            name="locker_name",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Name of the locker",
            required=True,
        ),
        OpenApiParameter(
            name="username",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Username of the user (optional, defaults to current user)",
            required=False,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Connections retrieved successfully",
            response=inline_serializer(
                name="GetConnectionsByUserByLockerResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "connections": inline_serializer(
                        name="ConnectionsSummary",
                        fields={
                            "incoming_connections": ConnectionSerializer(many=True),
                            "outgoing_connections": ConnectionSerializer(many=True),
                            "total_number_of_users_in_incoming_connections": serializers.IntegerField(),
                            "connection_type_counts": serializers.DictField(
                                child=serializers.IntegerField()
                            ),
                        },
                    ),
                },
            ),
        ),
        401: OpenApiResponse(
            description="Unauthorized",
            response=inline_serializer(
                name="GetConnectionsByUserByLockerUnauthorized",
                fields={"error": serializers.CharField()},
            ),
        ),
        404: OpenApiResponse(
            description="Locker not found",
            response=inline_serializer(
                name="GetConnectionsByUserByLockerNotFound",
                fields={
                    "success": serializers.BooleanField(),
                    "message": serializers.CharField(),
                },
            ),
        ),
        400: OpenApiResponse(
            description="Bad request",
            response=inline_serializer(
                name="GetConnectionsByUserByLockerBadRequest",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(),
                },
            ),
        ),
        405: OpenApiResponse(
            description="Invalid request method",
            response=inline_serializer(
                name="GetConnectionsByUserByLockerMethodNotAllowed",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(),
                },
            ),
        ),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_by_user_by_locker(request):
    """
    Retrieves all the connections of the logged-in user and the associated locker.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - locker_name : The name of the locker of the currently logged-in user whose incoming and
                    outgoing connections have to be fetched / The name of the locker that is owned by some other
                    user that the logged-in user is currently viewing.
        - username : The username of the user whose locker the current logged-in user is currently viewing.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of connections.
        - 401: User is not authenticated.
        - 404: Specified locker not found.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        try:
            locker_name = request.GET.get("locker_name")
            username = request.GET.get("username")

            if not request.user.is_authenticated:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            # Determine the user and locker based on whether 'username' is provided
            if username:
                user = CustomUser.objects.get(username=username)
            else:
                user = request.user

            locker = Locker.objects.filter(user=user, name=locker_name).first()

            if not locker:
                return JsonResponse(
                    {"success": False, "message": "No such locker found for this user"},
                    status=404,
                )

            # Fetch incoming connections
            incoming_connections = Connection.objects.filter(
                host_user=user, host_locker=locker
            )
            incoming_serializer = ConnectionSerializer(incoming_connections, many=True)

            # Count the number of unique guest users in incoming connections
            guest_users_count = (
                incoming_connections.values("guest_user").distinct().count()
            )

            # Fetch outgoing connections
            outgoing_connections = Connection.objects.filter(
                guest_user=request.user, guest_locker=locker
            )
            outgoing_serializer = ConnectionSerializer(outgoing_connections, many=True)

            # Count the number of unique users in each incoming connection type
            connection_type_counts = defaultdict(int)
            for connection in incoming_connections:
                # Ensure the connection_type is converted to a string
                connection_type_str = str(connection.connection_type)
                connection_type_counts[connection_type_str] += 1

            connections = {
                "incoming_connections": incoming_serializer.data,
                "outgoing_connections": outgoing_serializer.data,
                "total_number_of_users_in_incoming_connections": guest_users_count,
                "connection_type_counts": dict(
                    connection_type_counts
                ),  # Add the counts here
            }

            return JsonResponse(
                {
                    "success": True,
                    "connections": connections,
                },
                status=200,
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    else:
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )
    

@extend_schema(
    summary="Get outgoing connections by current user",
    description="Retrieves all connections where the logged-in user is the guest.",
    responses={
        200: OpenApiResponse(
            description="Outgoing connections retrieved successfully",
            response=inline_serializer(
                name="GetOutgoingConnectionsByUserResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "outgoing_connections": ConnectionSerializer(many=True),
                },
            ),
        ),
        401: OpenApiResponse(
            description="Unauthorized",
            response=inline_serializer(
                name="GetOutgoingConnectionsByUserUnauthorized",
                fields={
                    "error": serializers.CharField(),
                },
            ),
        ),
        400: OpenApiResponse(
            description="Bad request",
            response=inline_serializer(
                name="GetOutgoingConnectionsByUserBadRequest",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(),
                },
            ),
        ),
        405: OpenApiResponse(
            description="Invalid request method",
            response=inline_serializer(
                name="GetOutgoingConnectionsByUserMethodNotAllowed",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(),
                },
            ),
        ),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connections_by_user(request):
    """
    Retrieves all outgoing connections of the logged-in user.

    Returns:
        - JsonResponse: A JSON object containing a list of outgoing connections or an error message.
    Response Codes:
        - 200: Success
        - 401: Unauthorized
        - 405: Invalid Method
    """
    if request.method == "GET":
        try:
            if not request.user.is_authenticated:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            # Get all connections where the logged-in user is the guest
            outgoing_connections = Connection.objects.filter(guest_user=request.user)
            outgoing_serializer = ConnectionSerializer(outgoing_connections, many=True)

            return JsonResponse(
                {
                    "success": True,
                    "outgoing_connections": outgoing_serializer.data,
                },
                status=200,
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    else:
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

@extend_schema(
    summary="Get all connections",
    description="Retrieves a list of all connections in the system with basic details.",
    responses={
        200: OpenApiResponse(
            description="All connections retrieved successfully",
            response=inline_serializer(
                name="GetAllConnectionsResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "connections": serializers.ListField(
                        child=inline_serializer(
                            name="ConnectionSummary",
                            fields={
                                "connection_name": serializers.CharField(),
                                "host_user_locker": serializers.CharField(),
                                "guest_user_locker": serializers.CharField(),
                                "is_frozen": serializers.BooleanField(),
                                "connection_id": serializers.IntegerField(),
                            },
                        )
                    ),
                },
            ),
        ),
        401: OpenApiResponse(
            description="Unauthorized",
            response=inline_serializer(
                name="GetAllConnectionsUnauthorized",
                fields={
                    "error": serializers.CharField(),
                },
            ),
        ),
        400: OpenApiResponse(
            description="Bad request",
            response=inline_serializer(
                name="GetAllConnectionsBadRequest",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(),
                },
            ),
        ),
        405: OpenApiResponse(
            description="Invalid request method",
            response=inline_serializer(
                name="GetAllConnectionsMethodNotAllowed",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(),
                },
            ),
        ),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_all_connections(request):
    """
    Retrieves all connections, both incoming and outgoing.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Returns:
        - JsonResponse: A JSON object containing a list of all connections or an error message.

    Response Codes:
        - 200: Successful retrieval of connections.
        - 401: User is not authenticated.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        try:
            # Fetch all connections
            all_connections = Connection.objects.all()

            connections = [
                {
                    "connection_name": conn.connection_name,
                    "host_user_locker": conn.host_locker.name,
                    "guest_user_locker": conn.guest_locker.name,
                    "is_frozen": conn.is_frozen,
                    "connection_id": conn.connection_id,
                }
                for conn in all_connections
            ]

            return JsonResponse(
                {"success": True, "connections": connections}, status=200
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )



@extend_schema(
    summary="Get resources by user and locker",
    description="Retrieves all resources within a specific locker owned by the logged-in user.",
    parameters=[
        OpenApiParameter(
            name="locker_name",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Name of the locker",
            required=True,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Resources retrieved successfully",
            response=inline_serializer(
                name="GetResourceByUserByLockerResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "resources": ResourceSerializer(many=True),
                },
            ),
        ),
        401: OpenApiResponse(description="Unauthorized"),
        404: OpenApiResponse(description="Locker not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_resource_by_user_by_locker(request):
    """
    Retrieves all the resources of a particular locker of the logged-in user.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - locker_name : The name of the locker whose resources have to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of resources.
        - 401: User is not authenticated.
        - 404: Specified user not found, Specified locker not found.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        try:
            locker_name = request.GET.get("locker_name")
            if request.user.is_authenticated:
                user = request.user
            else:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            locker = Locker.objects.filter(user=user, name=locker_name).first()

            # If the current user does not have the given locker with "locker_name"
            if not locker:
                return JsonResponse(
                    {"success": False, "message": "No such locker found for this user"},
                    status=404,
                )

            resources = Resource.objects.filter(locker=locker)
            serializer = ResourceSerializer(resources, many=True)

            return JsonResponse(
                {"success": True, "resources": serializer.data}, status=200
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

    
@extend_schema(
    summary="Get guest user connection by names",
    description="Filters connections based on connection type name, host locker name, and host user username.",
    parameters=[
        OpenApiParameter(
            name="connection_type_name",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Name of the connection type",
            required=True,
        ),
        OpenApiParameter(
            name="host_locker_name",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Name of the host locker",
            required=True,
        ),
        OpenApiParameter(
            name="host_user_username",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Username of the host user",
            required=True,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Connections filtered successfully",
            response=inline_serializer(
                name="GetGuestUserConnectionResponse",
                fields={
                    "connections": ConnectionFilterSerializer(many=True),
                },
            ),
        ),
        400: OpenApiResponse(description="Missing required fields"),
        404: OpenApiResponse(description="Connection type or connections not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_guest_user_connection(request):
    if request.method == "GET":
        connection_type_name = request.GET.get("connection_type_name")
        host_locker_name = request.GET.get("host_locker_name")
        host_user_username = request.GET.get("host_user_username")

        if not all([connection_type_name, host_locker_name, host_user_username]):
            return JsonResponse(
                {"success": False, "error": "All fields are required"}, status=400
            )

        try:
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            connection_type = ConnectionType.objects.get(
                connection_type_name=connection_type_name,
                owner_locker=host_locker,
                owner_user=host_user,
            )
            print("==========================================", host_user.user_id)
            print("==========================================", host_locker.locker_id)
           
            connection = Connection.objects.filter(connection_type=connection_type)
            print("==========================================ddd", connection_type.connection_type_id)
            if not connection:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "No Connections found for this Connection Type",
                    },
                    status=404,
                )

            serializer = ConnectionFilterSerializer(connection, many=True)
            return JsonResponse({"connections": serializer.data}, status=200)

        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "No such Connection Type found"}, status=404
            )
        except Locker.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"Locker not found: {e}"}, status=400
            )
        except CustomUser.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"User not found: {e}"}, status=400
            )
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@extend_schema(
    summary="Get guest user connection by IDs",
    description="Filters connections based on connection type ID, locker ID, and user ID.",
    parameters=[
        OpenApiParameter(
            name="connection_type_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="ID of the connection type",
            required=True,
        ),
        OpenApiParameter(
            name="locker_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="ID of the locker",
            required=True,
        ),
        OpenApiParameter(
            name="user_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="ID of the user",
            required=True,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Connections filtered successfully",
            response=inline_serializer(
                name="GetGuestUserConnectionByIdResponse",
                fields={
                    "connections": ConnectionFilterSerializer(many=True),
                },
            ),
        ),
        400: OpenApiResponse(description="Missing required fields"),
        404: OpenApiResponse(description="Connection type or connections not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_guest_user_connection_id(request):
    if request.method == "GET":
        connection_type_id = request.GET.get("connection_type_id")
        locker_id = request.GET.get("locker_id")
        user_id = request.GET.get("user_id")

        if not all([connection_type_id, locker_id, user_id]):
            return JsonResponse(
                {"success": False, "error": "All fields (IDs) are required"}, status=400
            )

        try:
            host_user = CustomUser.objects.get(pk=user_id)
            host_locker = Locker.objects.get(pk=locker_id, user=host_user)
            connection_type = ConnectionType.objects.get(
                pk=connection_type_id,
                owner_locker=host_locker,
                owner_user=host_user,
            )

            print("=========== user_id:", host_user.pk)
            print("=========== locker_id:", host_locker.pk)
            print("=========== connection_type_id:", connection_type.pk)

            connection = Connection.objects.filter(connection_type=connection_type)

            if not connection.exists():
                return JsonResponse(
                    {
                        "success": False,
                        "error": "No Connections found for this Connection Type",
                    },
                    status=404,
                )

            serializer = ConnectionFilterSerializer(connection, many=True)
            return JsonResponse({"connections": serializer.data}, status=200)

        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "No such Connection Type found"}, status=404
            )
        except Locker.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"Locker not found: {e}"}, status=400
            )
        except CustomUser.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"User not found: {e}"}, status=400
            )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

@extend_schema(
    summary="Get outgoing connections to specific locker",
    description="Retrieves connections where the logged-in user is the guest and matches a specific host locker.",
    parameters=[
        OpenApiParameter(
            name="host_username",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Username of the host user",
            required=True,
        ),
        OpenApiParameter(
            name="host_locker_name",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Name of the host locker",
            required=True,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Connections retrieved successfully",
            response=inline_serializer(
                name="GetOutgoingConnectionsToLockerResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "connections": ConnectionSerializer(many=True),
                },
            ),
        ),
        400: OpenApiResponse(description="Missing required parameters"),
        500: OpenApiResponse(description="Internal server error"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connections_to_locker(request):
    try:
        guest_username = request.user.username  # the user is authenticated
        host_username = request.query_params.get("host_username")
        host_locker_name = request.query_params.get("host_locker_name")

        if not host_username or not host_locker_name:
            return Response(
                {"success": False, "message": "Missing required parameters"}, status=400
            )

        # Filter connections where guest is the current user and host matches the given locker
        connections = Connection.objects.filter(
            guest_user__username=guest_username,
            host_user__username=host_username,
            host_locker__name=host_locker_name,
            connection_status__in=["established", "live"]
        )

        # Serialize the data
        serializer = ConnectionSerializer(connections, many=True)

        return Response({"success": True, "connections": serializer.data}, status=200)

    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)

@extend_schema(
    summary="Get extra data from connection terms",
    description="Retrieves terms stored under 'canShareMoreData' from both host and guest terms.",
    parameters=[
        OpenApiParameter(
            name="connection_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="ID of the connection",
            required=True,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Extra data retrieved successfully",
            response=inline_serializer(
                name="GetExtraDataResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "shared_more_data_terms": serializers.JSONField(
                        required=False, allow_null=True
                    ),
                    "shared_more_data_terms_reverse": serializers.JSONField(
                        required=False, allow_null=True
                    ),
                },
            ),
        ),
        400: OpenApiResponse(description="connection_id is required"),
        404: OpenApiResponse(description="Connection or terms not found"),
        500: OpenApiResponse(description="Internal server error"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_extra_data(request):
    """
    API to get the terms stored under the 'canShareMoreData' key in the terms_value of a connection.

    Query Parameters:
    - connection_id: ID of the connection

    Returns:
    - JsonResponse: Contains the terms under the 'canShareMoreData' key from both host and guest.
    """
    # Get the connection_id from the request query parameters
    connection_id = request.GET.get("connection_id", None)
    print("connection id", connection_id)

    if not connection_id:
        return JsonResponse({"error": "connection_id is required"}, status=400)

    try:
        # Fetch the connection object
        connection = Connection.objects.get(connection_id=connection_id)

        print("connection", connection)

        # Extract the terms_value from the connection
        terms_value = connection.terms_value or {}  # Default to empty dict if None
        terms_value_reverse = connection.terms_value_reverse or {}  # Default to empty dict if None
        print("terms_value:", terms_value)
        print("terms_value_reverse:", terms_value_reverse)

        # Extract 'canShareMoreData' from both dictionaries if it exists
        shared_more_data_terms = terms_value.get("canShareMoreData", None)
        shared_more_data_terms_reverse = terms_value_reverse.get("canShareMoreData", None)

        # If both are missing, return an error
        if shared_more_data_terms is None and shared_more_data_terms_reverse is None:
            return JsonResponse(
                {"error": "'canShareMoreData' not found in both terms_value and terms_value_reverse"},
                status=404,
            )

        # Return the terms, even if one is None
        return JsonResponse(
            {
                "success": True,
                "shared_more_data_terms": shared_more_data_terms,
                "shared_more_data_terms_reverse": shared_more_data_terms_reverse,
            },
            status=200,
        )

    except Connection.DoesNotExist:
        return JsonResponse({"error": "Connection not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@extend_schema(
    summary="Get outgoing connections by guest username",
    description="Retrieves all outgoing connections for a specific guest user.",
    parameters=[
        OpenApiParameter(
            name="guest_username",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Username of the guest user",
            required=True,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Outgoing connections retrieved successfully",
            response=inline_serializer(
                name="OutgoingConnectionsByGuestResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "outgoing_connections": serializers.ListField(
                        child=serializers.DictField()
                    ),
                },
            ),
        ),
        400: OpenApiResponse(description="guest_username is required"),
        404: OpenApiResponse(description="Guest user or connections not found"),
        405: OpenApiResponse(description="Invalid request method"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connections_user(request):
    """
    Retrieve all outgoing connections of the user where the user is the guest.
    Query Parameters:
    - guest_username: The username of the guest user.
    Returns:
    - JsonResponse: A JSON object containing the outgoing connections or an error message.
    Response Codes:
    - 200: Successful retrieval of outgoing connections.
    - 401: User is not authenticated.
    - 404: No outgoing connections found.
    - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        guest_username = request.GET.get("guest_username")
        if not guest_username:
            return JsonResponse(
                {"success": False, "error": "guest_username is required"}, 
                status=400
            )

        try:
            # Get the guest user based on the username
            guest_user = CustomUser.objects.get(username=guest_username)

            # Get all outgoing connections where the guest_user is the specified user
            connections = Connection.objects.filter(guest_user=guest_user)
            
            if not connections.exists():
                return JsonResponse(
                    {"success": False, "message": "No outgoing connections found."},
                    status=404,
                )

            # Fetch all lockers for the guest user
            guest_lockers = Locker.objects.filter(user=guest_user)

            # Accumulate outgoing connections data
           # all_locker_connections = []
            
            for locker in guest_lockers:
                # Get outgoing connections for each locker
                outgoing_connections = Connection.objects.filter(
                    guest_user=guest_user,  # Changed from request.user to guest_user
                    guest_locker=locker
                )
                
                # Only add to response if there are connections for this locker
                if outgoing_connections.exists():
                    outgoing_serializer = ConnectionSerializer(outgoing_connections, many=True)

                    # Return all accumulated data
                    return JsonResponse(
                        {
                            "success": True, 
                            "outgoing_connections": outgoing_serializer.data
                        },
                        status=200,
                    )
        
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Guest user not found"}, 
                status=404
            )
        except Exception as e:
            return JsonResponse(
                {"success": False, "error": str(e)}, 
                status=400
            )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, 
        status=405
    )
