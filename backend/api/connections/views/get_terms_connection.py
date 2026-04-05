
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
    ConnectionTermsSerializer,
)
from api.models import (
    Locker,
    CustomUser,
    Connection,
    ConnectionTerms,
    ConnectionType
)
from api.serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse
from rest_framework_simplejwt.authentication import JWTAuthentication



@extend_schema(
    summary="Show connection terms",
    description="Retrieve categorized terms (obligations, permissions, forbidden) for a connection, specifically from guest-to-host perspective.",
    parameters=[
        OpenApiParameter("username", OpenApiTypes.STR, description="Username of the user"),
        OpenApiParameter("locker_name", OpenApiTypes.STR, description="Name of the locker"),
        OpenApiParameter("connection_name", OpenApiTypes.STR, description="Name of the connection"),
    ],
    responses={
        200: OpenApiResponse(
            description="Terms retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "terms": {"type": "object"},
                },
            },
        ),
        401: OpenApiResponse(description="Unauthorized"),
        404: OpenApiResponse(description="User, locker, or connection not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def show_terms(request):
    """
    Retrieve terms associated with a specific user.

    This view handles GET requests to fetch terms for a specific user,
    identified by a 'username' query parameter, and optionally filtered by 'term_id'.

    Query Parameters:
        - username: The username of the user whose terms are to be fetched.
        - locker_name: The locker name of the user to be fetched.
        - connection_name: Name of the active connection for which terms are to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of terms or an error message.
    """
    if request.method == "GET":

        username = request.GET.get("username")
        locker_name = request.GET.get("locker_name")
        connection_name = request.GET.get("connection_name")

        try:
            # Get the user
            if username:
                user = CustomUser.objects.get(username=username)
            else:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse(
                        {"success": False, "error": "User not authenticated"},
                        status=401,
                    )

            # Get the locker
            locker = Locker.objects.filter(
                name=locker_name, user_id=user.user_id
            ).first()
            if not locker:
                return JsonResponse(
                    {"success": False, "error": "Locker not found"}, status=404
                )

            # Get the connection
            conn = Connection.objects.filter(connection_name=connection_name).first()
            if not conn:
                return JsonResponse(
                    {"success": False, "error": "Connection not found"}, status=404
                )

            # Get the connection type and associated terms
            connection_types = ConnectionType.objects.filter(
                connection_type_id=conn.connection_type_id
            )

            if not connection_types.exists():
                return JsonResponse(
                    {"success": False, "message": "No terms found for this user"},
                    status=404,
                )

            terms = ConnectionTerms.objects.filter(conn_type__in=connection_types)
            serializer = ConnectionTermsSerializer(terms, many=True)

            # Prepare response data
            filtered_data = {}
            filtered_data["connectionName"] = conn.connection_name
            filtered_data["connectionDescription"] = conn.connection_description
            filtered_data["lockerName"] = locker_name

            obligations = []
            permissions = {"canShareMoreData": False, "canDownloadData": False}
            forbidden = []

            for term in serializer.data:
                if (term["to_Type"] == "Host" or term["to_Type"] == "HOST") and (
                    term["from_Type"] == "Guest" or term["from_Type"] == "GUEST"
                ):
                    term_data = {
                        "labelName": term["data_element_name"],
                        "typeOfAction": term["data_type"],
                        "typeOfSharing": term["sharing_type"],
                        "purpose": term.get("purpose", ""),
                        "labelDescription": term["description"],
                        "hostPermissions": term["host_permissions"],
                    }

                    if term["modality"] == "obligatory":
                        obligations.append(term_data)
                    elif term["modality"] == "forbidden":
                        forbidden.append(term_data)
                    else:
                        if term["description"] == "They can share more data.":
                            permissions["canShareMoreData"] = True
                        if term["description"] == "They can download data.":
                            permissions["canDownloadData"] = True

            filtered_data["obligations"] = obligations
            filtered_data["permissions"] = permissions
            filtered_data["forbidden"] = forbidden  # Add forbidden terms

            return JsonResponse({"success": True, "terms": filtered_data}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

@extend_schema(
    summary="Show connection terms reverse",
    description="Retrieve categorized terms (obligations, permissions, forbidden) for a connection, specifically from host-to-guest perspective.",
    parameters=[
        OpenApiParameter("username", OpenApiTypes.STR, description="Username of the user"),
        OpenApiParameter("locker_name", OpenApiTypes.STR, description="Name of the locker"),
        OpenApiParameter("connection_name", OpenApiTypes.STR, description="Name of the connection"),
    ],
    responses={
        200: OpenApiResponse(
            description="Terms retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "terms": {"type": "object"},
                },
            },
        ),
        401: OpenApiResponse(description="Unauthorized"),
        404: OpenApiResponse(description="User, locker, or connection not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def show_terms_reverse(request):
    """
    Retrieve terms associated with a specific user from the host's perspective.

    This view handles GET requests to fetch terms where the host is sharing data with the guest,
    identified by a 'username' query parameter, and optionally filtered by 'locker_name' and 'connection_name'.

    Query Parameters:
        - username: The username of the user whose terms are to be fetched.
        - locker_name: The locker name of the user to be fetched.
        - connection_name: Name of the active connection for which terms are to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of terms or an error message.
    """
    if request.method == "GET":

        username = request.GET.get("username")
        locker_name = request.GET.get("locker_name")
        connection_name = request.GET.get("connection_name")

        try:
            # Get the user
            if username:
                user = CustomUser.objects.get(username=username)
            else:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse(
                        {"success": False, "error": "User not authenticated"},
                        status=401,
                    )

            # Get the locker
            locker = Locker.objects.filter(
                name=locker_name, user_id=user.user_id
            ).first()
            if not locker:
                return JsonResponse(
                    {"success": False, "error": "Locker not found"}, status=404
                )

            # Get the connection
            conn = Connection.objects.filter(connection_name=connection_name).first()
            if not conn:
                return JsonResponse(
                    {"success": False, "error": "Connection not found"}, status=404
                )

            # Get the connection type and associated terms
            connection_types = ConnectionType.objects.filter(
                connection_type_id=conn.connection_type_id
            )

            if not connection_types.exists():
                return JsonResponse(
                    {"success": False, "message": "No terms found for this user"},
                    status=404,
                )

            terms = ConnectionTerms.objects.filter(conn_type__in=connection_types)
            serializer = ConnectionTermsSerializer(terms, many=True)

            # Prepare response data
            filtered_data = {}
            filtered_data["connectionName"] = conn.connection_name
            filtered_data["connectionDescription"] = conn.connection_description
            filtered_data["lockerName"] = locker_name

            obligations = []
            permissions = {"canShareMoreData": False, "canDownloadData": False}
            forbidden = []

            # Loop through serialized terms and categorize based on modality
            for term in serializer.data:
                if (term["from_Type"].lower() == "host") and (
                    term["to_Type"].lower() == "guest"
                ):
                    term_data = {
                        "labelName": term["data_element_name"],
                        "typeOfAction": term["data_type"],
                        "typeOfSharing": term["sharing_type"],
                        "purpose": term.get("purpose", ""),
                        "labelDescription": term["description"],
                        "hostPermissions": term["host_permissions"],
                    }

                    # Classify term based on modality
                    if term["modality"].lower() == "obligatory":
                        obligations.append(term_data)
                    elif term["modality"].lower() == "forbidden":
                        forbidden.append(term_data)
                    else:
                        if term["description"] == "They can share more data.":
                            permissions["canShareMoreData"] = True
                        if term["description"] == "They can download data.":
                            permissions["canDownloadData"] = True

            # Add categorized terms to the response
            filtered_data["obligations"] = obligations
            filtered_data["permissions"] = permissions
            filtered_data["forbidden"] = forbidden  # Add forbidden terms

            return JsonResponse({"success": True, "terms": filtered_data}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )



@extend_schema(
    summary="Get terms status",
    description="Retrieve counts of filled, empty, and specific term status flags (T, F, R) for guest-to-host terms.",
    parameters=[
        OpenApiParameter("connection_name", OpenApiTypes.STR, description="Name of the connection"),
        OpenApiParameter("host_locker_name", OpenApiTypes.STR, description="Name of the host locker"),
        OpenApiParameter("guest_locker_name", OpenApiTypes.STR, description="Name of the guest locker"),
        OpenApiParameter("host_user_username", OpenApiTypes.STR, description="Username of the host user"),
        OpenApiParameter("guest_user_username", OpenApiTypes.STR, description="Username of the guest user"),
    ],
    responses={
        200: OpenApiResponse(
            description="Status retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "count_T": {"type": "integer"},
                    "count_F": {"type": "integer"},
                    "count_R": {"type": "integer"},
                    "empty": {"type": "integer"},
                    "filled": {"type": "integer"},
                },
            },
        ),
        400: OpenApiResponse(description="Missing required fields or locker/user not found"),
        404: OpenApiResponse(description="Connection not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_terms_status(request):
    """
    Request Parameters:
    - connection_name
    - host_locker_name
    - guest_locker_name
    - host_user_username
    - guest_user_username
    """
    if request.method == "GET":
        connection_name = request.GET.get("connection_name")
        host_locker_name = request.GET.get("host_locker_name")
        guest_locker_name = request.GET.get("guest_locker_name")
        host_user_username = request.GET.get("host_user_username")
        guest_user_username = request.GET.get("guest_user_username")

        if not all(
            [
                connection_name,
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
        except Connection.DoesNotExist:
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

        count_T = 0
        count_F = 0
        count_R = 0
        filled = 0
        empty = 0

        terms_value = connection.terms_value

        # Handle case when terms_value is empty
        if terms_value:
            # Exclude 'canShareMoreData' from terms_value
            filtered_terms = {
                key: value
                for key, value in terms_value.items()
                if key != "canShareMoreData"
            }

            for key, value in filtered_terms.items():
                value = value.strip()
                if value.endswith("; T") or value.endswith(";T"):
                    count_T += 1
                elif value.endswith("; F") or value.endswith(";F"):
                    count_F += 1
                elif value.endswith("; R") or value.endswith(";R"):
                    count_R += 1

                stripped_value = (
                    value.rstrip("; T")
                    .rstrip(";T")
                    .rstrip("; F")
                    .rstrip(";F")
                    .rstrip("; R")
                    .rstrip(";R")
                    .strip()
                )
                if stripped_value:
                    filled += 1
                else:
                    empty += 1

            # Calculate the number of empty terms based on the total count
            total_terms = count_T + count_F + count_R
            if total_terms > 0:
                empty = total_terms - filled
        else:
            # If terms_value is empty, assume all expected terms are empty
            total_terms = count_T + count_F + count_R
            empty = total_terms
            filled = 0

        return JsonResponse(
            {
                "success": True,
                "count_T": count_T,
                "count_F": count_F,
                "count_R": count_R,
                "empty": empty,
                "filled": filled,
            },
            status=200,
        )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@extend_schema(
    summary="Get terms status reverse",
    description="Retrieve counts of filled, empty, and specific term status flags (T, F, R) for host-to-guest terms.",
    parameters=[
        OpenApiParameter("connection_name", OpenApiTypes.STR, description="Name of the connection"),
        OpenApiParameter("host_locker_name", OpenApiTypes.STR, description="Name of the host locker"),
        OpenApiParameter("guest_locker_name", OpenApiTypes.STR, description="Name of the guest locker"),
        OpenApiParameter("host_user_username", OpenApiTypes.STR, description="Username of the host user"),
        OpenApiParameter("guest_user_username", OpenApiTypes.STR, description="Username of the guest user"),
    ],
    responses={
        200: OpenApiResponse(
            description="Status retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "count_T": {"type": "integer"},
                    "count_F": {"type": "integer"},
                    "count_R": {"type": "integer"},
                    "empty": {"type": "integer"},
                    "filled": {"type": "integer"},
                },
            },
        ),
        400: OpenApiResponse(description="Missing required fields or locker/user not found"),
        404: OpenApiResponse(description="Connection not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_terms_status_reverse(request):
    """
    Request Parameters:
    - connection_name
    - host_locker_name
    - guest_locker_name
    - host_user_username
    - guest_user_username
    """
    if request.method == "GET":
        connection_name = request.GET.get("connection_name")
        host_locker_name = request.GET.get("host_locker_name")
        guest_locker_name = request.GET.get("guest_locker_name")
        host_user_username = request.GET.get("host_user_username")
        guest_user_username = request.GET.get("guest_user_username")

        if not all(
            [
                connection_name,
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
        except Connection.DoesNotExist:
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

        count_T = 0
        count_F = 0
        count_R = 0
        filled = 0
        empty = 0

        terms_value = connection.terms_value_reverse

        # Handle case when terms_value is empty
        if terms_value:
            # Exclude 'canShareMoreData' from terms_value
            filtered_terms = {
                key: value
                for key, value in terms_value.items()
                if key != "canShareMoreData"
            }

            for key, value in filtered_terms.items():
                value = value.strip()
                if value.endswith("; T") or value.endswith(";T"):
                    count_T += 1
                elif value.endswith("; F") or value.endswith(";F"):
                    count_F += 1
                elif value.endswith("; R") or value.endswith(";R"):
                    count_R += 1

                stripped_value = (
                    value.rstrip("; T")
                    .rstrip(";T")
                    .rstrip("; F")
                    .rstrip(";F")
                    .rstrip("; R")
                    .rstrip(";R")
                    .strip()
                )
                if stripped_value:
                    filled += 1
                else:
                    empty += 1

            # Calculate the number of empty terms based on the total count
            total_terms = count_T + count_F + count_R
            if total_terms > 0:
                empty = total_terms - filled
        else:
            # If terms_value is empty, assume all expected terms are empty
            total_terms = count_T + count_F + count_R
            empty = total_terms
            filled = 0

        return JsonResponse(
            {
                "success": True,
                "count_T": count_T,
                "count_F": count_F,
                "count_R": count_R,
                "empty": empty,
                "filled": filled,
            },
            status=200,
        )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@extend_schema(
    summary="Get terms for user",
    description="Detailed breakdown of obligations and permissions for both directions (host-to-guest and guest-to-host) for a user.",
    parameters=[
        OpenApiParameter("host_user_username", OpenApiTypes.STR, description="Username of the host user"),
        OpenApiParameter("host_locker_name", OpenApiTypes.STR, description="Name of the host locker"),
        OpenApiParameter("guest_user_username", OpenApiTypes.STR, description="Username of the guest user"),
        OpenApiParameter("guest_locker_name", OpenApiTypes.STR, description="Name of the guest locker"),
        OpenApiParameter("connection_name", OpenApiTypes.STR, description="Name of the connection"),
    ],
    responses={
        200: OpenApiResponse(
            description="Terms retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "terms": {"type": "object"},
                },
            },
        ),
        400: OpenApiResponse(description="Missing required fields"),
        404: OpenApiResponse(description="Connection, user, or locker not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_terms_for_user(request):
    if request.method == "GET":
        host_user_username = request.GET.get("host_user_username")  # Host username
        host_locker_name = request.GET.get("host_locker_name")  # Host locker name
        guest_user_username = request.GET.get("guest_user_username")  # Guest username
        guest_locker_name = request.GET.get("guest_locker_name")  # Guest locker name
        connection_name = request.GET.get("connection_name")

        # Validate required parameters
        if not all(
            [
                host_user_username,
                host_locker_name,
                guest_user_username,
                guest_locker_name,
                connection_name,
            ]
        ):
            return JsonResponse(
                {
                    "success": False,
                    "error": "Host user, guest user, host locker, guest locker, and connection name are required",
                },
                status=400,
            )

        try:
            # Fetch host user and locker
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.filter(
                name=host_locker_name, user=host_user
            ).first()
            if not host_locker:
                return JsonResponse(
                    {"success": False, "error": "Host locker not found"}, status=404
                )

            # Fetch guest user and locker
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.filter(
                name=guest_locker_name, user=guest_user
            ).first()
            if not guest_locker:
                return JsonResponse(
                    {"success": False, "error": "Guest locker not found"}, status=404
                )

            # Fetch the connection based on host and guest details
            connection = Connection.objects.filter(
                connection_name=connection_name,
                host_user=host_user,
                guest_user=guest_user,
                host_locker=host_locker,
                guest_locker=guest_locker,
            ).first()
            if not connection:
                return JsonResponse(
                    {"success": False, "error": "Connection not found"}, status=404
                )

            # Fetch terms and separate them by modality and direction
            connection_type = connection.connection_type
            terms = ConnectionTerms.objects.filter(conn_type=connection_type)

            obligations = {"host_to_guest": [], "guest_to_host": []}
            permissions = {
                "host_to_guest": {"canShareMoreData": False, "canDownloadData": False},
                "guest_to_host": {"canShareMoreData": False, "canDownloadData": False},
            }

            # Retrieve terms_value and terms_value_reverse for obligations
            terms_value = connection.terms_value  # Guest to Host
            terms_value_reverse = connection.terms_value_reverse  # Host to Guest

            for term in terms:
                # Filter obligatory terms for obligations
                if term.modality == "obligatory":
                    term_data = {
                        "labelName": term.data_element_name,
                        "typeOfAction": term.data_type,
                        "typeOfSharing": term.sharing_type,
                        "purpose": term.purpose,
                        "labelDescription": term.description,
                        "hostPermissions": term.host_permissions,
                        "from": term.from_Type,
                        "to": term.to_Type,
                        "terms_id":term.terms_id
                    }

                    # Assign values based on direction
                    if term.from_Type == "GUEST" and term.to_Type == "HOST":
                        term_data["value"] = terms_value.get(
                            term.data_element_name, None
                        )
                        obligations["guest_to_host"].append(term_data)
                    elif term.from_Type == "HOST" and term.to_Type == "GUEST":
                        term_data["value"] = terms_value_reverse.get(
                            term.data_element_name, None
                        )
                        obligations["host_to_guest"].append(term_data)

                # Handle permissive terms for permissions
                elif term.modality == "permissive":
                    if term.description == "They can share more data.":
                        if term.from_Type == "GUEST" and term.to_Type == "HOST":
                            permissions["guest_to_host"]["canShareMoreData"] = True
                        elif term.from_Type == "HOST" and term.to_Type == "GUEST":
                            permissions["host_to_guest"]["canShareMoreData"] = True
                    elif term.description == "They can download data.":
                        if term.from_Type == "GUEST" and term.to_Type == "HOST":
                            permissions["guest_to_host"]["canDownloadData"] = True
                        elif term.from_Type == "HOST" and term.to_Type == "GUEST":
                            permissions["host_to_guest"]["canDownloadData"] = True

            # Prepare response data
            response_data = {
                "connectionName": connection.connection_name,
                "connectionDescription": connection.connection_description,
                "lockerName": (
                    host_locker_name if request.user == host_user else guest_locker_name
                ),
                "obligations": obligations,
                "permissions": permissions,
            }

            return JsonResponse({"success": True, "terms": response_data}, status=200)

        except CustomUser.DoesNotExist as e:
            return JsonResponse(
                {"success": False, "error": f"User not found: {str(e)}"}, status=404
            )
        except Exception as e:
            print(f"Exception occurred: {e}")
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

