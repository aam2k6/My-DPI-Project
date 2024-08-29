import base64
import os
import json
from django.conf import settings
from django.contrib.auth import login, authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import (
    ResourceSerializer,
    ConnectionTypeSerializer,
    ConnectionSerializer,
    ConnectionType,
    ConnectionTermsSerializer,
    ConnectionFilterSerializer,
    VnodeSerializer,
    SnodeSerializer,
    GlobalConnectionTypeTemplateGetSerializer,
    GlobalConnectionTypeTemplatePostSerializer,
    ConnectionTypeRegulationLinkTableGetSerializer,
    ConnectionTypeRegulationLinkTablePostSerializer,
)
from .models import (
    Resource,
    Locker,
    CustomUser,
    Connection,
    ConnectionTerms,
    Vnode,
    Snode,
    GlobalConnectionTypeTemplate,
    ConnectionTypeRegulationLinkTable,
)
from .serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse
from django.db import models
from rest_framework.parsers import JSONParser
from django.views.decorators.http import require_POST
from django.core.exceptions import ObjectDoesNotExist
from django.utils.dateparse import parse_datetime
from datetime import datetime


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def upload_resource(request):
    """
    Creates a resource (file) for a particular locker of the authenticated user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Body:
    - name : The name of the resource.
    - locker_name : Name of the locker
    - type : Visibility of the resource (Either Public or Private).
    - document : The file that contains the resource.

    Returns:
    - JsonResponse: A JSON object containing the name of the resource, its type and the relative path of the resource or an error message.

    Response Codes:
    - 201: Successfully created a resource(here locker) at the backend.
    - 400: The data sent in the request is invalid, missing or malformed.
    - 401: User is not authenticated.
    - 405: Request method not allowed (if not GET).
    """
    if request.method == "POST":
        try:
            document_name = request.POST.get("resource_name")
            locker_name = request.POST.get("locker_name")
            resource_type = request.POST.get("type")
            file = request.FILES.get("document")

            if request.user.is_authenticated:
                user = request.user
            else:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            locker = Locker.objects.get(user=user, name=locker_name)

            if file:
                relative_path = os.path.join("documents", file.name)
                file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                with open(file_path, "wb+") as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)

                resource = Resource.objects.create(
                    document_name=document_name,
                    i_node_pointer=relative_path,
                    locker=locker,
                    owner=user,
                    type=resource_type,
                )
                resource_url = os.path.join(settings.MEDIA_URL, relative_path)
                return JsonResponse(
                    {
                        "success": True,
                        "document_name": document_name,
                        "type": resource_type,
                        "resource_url": resource_url,
                    },
                    status=201,
                )
            else:
                return JsonResponse(
                    {"success": False, "error": "No file provided"}, status=400
                )
        except Locker.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Locker not found"}, status=400
            )
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Owner not found"}, status=400
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def download_resource(request, resource_id):
    """
    View to download a resource by its ID.

    Parameters:
    - request: HttpRequest object containing metadata about the request.
    - resource_id: ID of the resource to be downloaded.

    Returns:
    - FileResponse: The file to be downloaded.
    - JsonResponse: A JSON object with an error message if the resource is not found or not accessible.
    """
    try:
        resource = get_object_or_404(Resource, resource_id=resource_id)

        # Assume resource.i_node_pointer stores the relative path, e.g., 'documents/hk_admissions.pdf'
        relative_path = resource.i_node_pointer
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        print(f"Trying to access file at: {file_path}")

        if os.path.exists(file_path):
            response = FileResponse(
                open(file_path, "rb"),
                as_attachment=True,
                filename=os.path.basename(file_path),
            )
            return response
        else:
            print(f"File not found at: {file_path}")
            return JsonResponse({"error": "File not found."}, status=404)
    except Exception as e:
        print(f"Error: {str(e)}")
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def create_locker(request):
    """
    Creates a locker associated with the logged-in user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Body:
    - name : The name of the new locker.
    - description (optional): The description of the new locker.

    Returns:
    - JsonResponse: A JSON object containing the new locker id, its name and description or an error message.

    Response Codes:
    - 201: Successfully created a resource (locker) at the backend.
    - 400: The data sent in the request is invalid, missing or malformed.
    - 401: The user is not authenticated.
    - 405: Request method not allowed (if not POST).
    """
    if request.method == "POST":
        try:
            locker_name = request.POST.get("name")
            description = request.POST.get("description", "")

            if not locker_name:
                return JsonResponse(
                    {"success": False, "error": "Name is required"}, status=400
                )

            user = request.user

            # Check if a locker with the same name already exists for this user
            if Locker.objects.filter(name=locker_name, user=user).exists():
                return JsonResponse(
                    {"success": False, "error": "Locker with this name already exists"},
                    status=400,
                )

            # Create the locker
            locker = Locker.objects.create(
                name=locker_name, description=description, user=user
            )
            return JsonResponse(
                {
                    "success": True,
                    "id": locker.locker_id,
                    "name": locker.name,
                    "description": locker.description,
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_lockers_user(request):
    """
    Retrieve lockers associated with a specific user or the authenticated user.

    This view handles GET requests to fetch lockers either for a specific user,
    identified by a 'username' query parameter, or for the authenticated user
    if no username is provided.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username (optional): The username of the user whose lockers are to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of lockers.
        - 401: User is not authenticated.
        - 404: Specified user not found.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        try:
            username = request.GET.get("username")
            if username:
                try:
                    user = CustomUser.objects.get(
                        username=username
                    )  # Fetch user by username
                except CustomUser.DoesNotExist:
                    return JsonResponse({"error": "User not found"}, status=404)
            else:
                if request.user.is_authenticated:
                    user = request.user  # Use the authenticated user
                else:
                    return JsonResponse({"error": "User not authenticated"}, status=401)
            lockers = Locker.objects.filter(user=user)

            # If the current user does not have any existing lockers.
            if not lockers.exists():
                return JsonResponse(
                    {"success": False, "message": "No lockers found for this user"},
                    status=404,
                )

            serializer = LockerSerializer(lockers, many=True)
            return JsonResponse(
                {"success": True, "lockers": serializer.data}, status=200
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_public_resources(request):
    """
    Retrieve all public resources of the guest_user and guest_locker the logged user views.

    This view uses GET request to fetch all resources of guest_user under a specific guest_locker
    whose visibility is marked as "public". Every user should get access to other user's lockers only
    if the current user is authenticated

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username : username of the target_user that the authenticated user is viewing
        - locker_name : locker_name of the viewed user's locker

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of public resources.
        - 400: Specified user or locker not found.
        - 404: No public resources found.
        - 405: Request method not allowed (if not GET).
    """

    if request.method == "GET":
        try:
            username = request.GET.get("username")
            locker_name = request.GET.get("locker_name")
            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )
            if not locker_name:
                return JsonResponse(
                    {"success": False, "error": "Locker Name is required"}, status=400
                )

            try:
                random_user = CustomUser.objects.get(username=username)
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "User not found"}, status=404
                )

            try:
                random_user_locker = Locker.objects.get(
                    user=random_user, name=locker_name
                )
            except Locker.DoesNotExist:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "Locker not found for the given username",
                    },
                    status=404,
                )

            public_resources = Resource.objects.filter(
                owner=random_user, type="public", locker=random_user_locker
            )
            if not public_resources.exists():
                return JsonResponse(
                    {"success": False, "message": "No public resources found"},
                    status=404,
                )
            serializer = ResourceSerializer(public_resources, many=True)
            return JsonResponse(
                {"success": True, "resources": serializer.data}, status=200
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request"}, status=405)


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_type(request):
    """
    Retrieve all connection types of the authenticated user.

    This view uses the GET method through which exisitng connection types of the authenticated user is seen.
    Connection types are listed out in the admin view of the user.

     Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username of the authenticated user.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of connection types.
        - 404: No connection types found.
        - 405: Request method not allowed (if not GET).
    """

    if request.method == "GET":
        try:
            user = request.user
            connection_types = ConnectionType.objects.all()

            user_connection_type = connection_types.filter(owner_user=user)

            if not user_connection_type.exists():
                return JsonResponse(
                    {"success": False, "message": "No connection types"}, status=404
                )

            serializer = ConnectionTypeSerializer(user_connection_type, many=True)
            return JsonResponse(
                {"success": True, "connection_types": serializer.data}, status=200
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def dpi_directory(request):
    """ "
    Retrieve all users present in the DPI Directory.

    Parameters:
       - request: HttpRequest object containing metadata about the request.

    Returns:
       - JsonResponse: A JSON object containing a list of all users or an error message.

    Response Codes:
       - 200: Successful retrieval of users.
       - 404: No users are found.
       - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        users = CustomUser.objects.all()
        if not users.exists():
            return JsonResponse(
                {"success": False, "message": "No Users are present."}, status=404
            )

        serializer = UserSerializer(users, many=True)
        return JsonResponse({"success": True, "users": serializer.data}, status=200)
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_other_connection_types(request):
    """
    Retrieve all the connection types of guest_locker of the guest_user that the authenticated user
    does not have a connection with.

    This view uses GET request to fetch all connection types of the current user
    (refering to the guest_user_id and guest_locker_id). Further, the values of guest_user/host_user
    and guest_locker/host_locker is compared with guest_user_id and guest_locker_id, each. If a match is found,
    that connection gets fetched.

    Parameters:
       - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - guest_username
        - guest_locker_name

    Returns:
       - JsonResponse: A JSON object containing a list of all users or an error message.

    Response Codes:
       - 200: Successful connetion_types of users.
       - 400: No connections types are found.
       - 404: User not found / Locker not found.
       - 405: Request method not allowed (if not GET).
    """

    if request.method == "GET":

        if request.user.is_authenticated:
            current_user = request.user  # Use the authenticated user
        else:
            return JsonResponse({"error": "User not authenticated"}, status=401)

        try:
            guest_username = request.GET.get("guest_username")
            guest_locker_name = request.GET.get("guest_locker_name")
            guest_user = CustomUser.objects.get(
                username=guest_username
            )  # Fetch user by username
            guest_locker = Locker.objects.get(
                name=guest_locker_name, user=guest_user
            )  # Fetch locker by lockername
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "message": "User not found"}, status=404
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Locker not found for the specified username",
                },
                status=404,
            )

        # This is for Rohith viewing IIITB's Transcripts Locker. Fetch all the connection types of
        # IIITB's Transcripts Locker. Fetch, these connection types' connection ids.

        connection_types_iiitb_transcripts_ids = ConnectionType.objects.filter(
            owner_user=guest_user, owner_locker=guest_locker
        ).values_list("connection_type_id", flat=True)

        if not connection_types_iiitb_transcripts_ids:
            return JsonResponse(
                {"success": False, "message": "No connection types found"}, status=404
            )

        # Now fetch, all the connections where Rohith is either the host_user or guest_user. (Or more formally, it
        # would be the current authenticated user)

        rohith_connections = Connection.objects.filter(
            models.Q(host_user=current_user) | models.Q(guest_user=current_user)
        )

        rohith_connection_type_ids = rohith_connections.values_list(
            "connection_type_id", flat=True
        ).distinct()

        # Converting QuerySets to sets, for finding easy set difference.
        rohith_connection_type_ids_set = set(rohith_connection_type_ids)
        connection_types_iiitb_transcripts_set = set(
            connection_types_iiitb_transcripts_ids
        )

        # So finally, the list of connection type ids that Rohith has not yet initiated a connection to, with
        # IIITB's Transcripts locker are :
        difference_ids_set = (
            connection_types_iiitb_transcripts_set - rohith_connection_type_ids_set
        )

        if not difference_ids_set:
            return JsonResponse(
                {
                    "success": False,
                    "message": "No other connection types to connect to.",
                },
                status=404,
            )

        difference_connection_types = ConnectionType.objects.filter(
            connection_type_id__in=difference_ids_set
        )
        serializer = ConnectionTypeSerializer(difference_connection_types, many=True)

        return JsonResponse(
            {"success": True, "connection_types": serializer.data}, status=200
        )
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_type_by_user_by_locker(request):
    """
    Retrieve connection types by locker and user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Query Parameters:
    - username: The username of the user.
    - locker_name: The name of the locker.

    Returns:
    - JsonResponse: A JSON object containing a list of connection types or an error message.

    Response Codes:
    - 200: Successful retrieval of connection types.
    - 404: Specified user or locker not found.
    - 405: Request method not allowed (if not GET).
    - 400: Bad request (missing parameters).
    """
    if request.method == "GET":
        username = request.GET.get("username")
        locker_name = request.GET.get("locker_name")

        if not locker_name:
            return JsonResponse(
                {"success": False, "error": "Locker name is required"}, status=400
            )

        try:
            if username:
                try:
                    user = CustomUser.objects.get(username=username)
                except CustomUser.DoesNotExist:
                    return JsonResponse(
                        {"success": False, "error": "User not found"}, status=404
                    )
            else:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse(
                        {"success": False, "error": "User not authenticated"},
                        status=401,
                    )

            try:
                locker = Locker.objects.get(name=locker_name, user=user)
            except Locker.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "Locker not found"}, status=404
                )

            connection_types = ConnectionType.objects.filter(
                owner_user=user, owner_locker=locker
            )

            if not connection_types.exists():
                return JsonResponse(
                    {
                        "success": False,
                        "message": "No connection types found for this user and locker",
                    },
                    status=404,
                )

            serializer = ConnectionTypeSerializer(connection_types, many=True)
            return JsonResponse(
                {"success": True, "connection_types": serializer.data}, status=200
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def create_new_connection(request):
    """
    Create a new connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: Name of the connection.
    - connection_type_name: Name of the connection type.
    - host_locker_name: Name of the source locker.
    - guest_locker_name: Name of the target locker.
    - host_user_username: Username of the source user.
    - guest_user_username: Username of the target user.
    - connection_description: Description of the connection.
    - requester_consent <Optional> : Boolean indicating if the requester has consented.
    - revoke_host <Optional> : Boolean indicating if the source can revoke.
    - revoke_guest <Optional> : Boolean indicating if the target can revoke.

    Returns:
    - JsonResponse: A JSON object containing the created connection or an error message.

    Response Codes:
    - 201: Successful creation of the connection.
    - 400: Bad request (if data is invalid).
    - 401: User not authenticated.
    - 404: Resource not found.
    - 405: Request method not allowed (if not POST).
    """
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse(
                {"success": False, "error": "User not authenticated"}, status=401
            )

        request_connection_type_name = request.POST.get("connection_type_name")
        request_connection_name = request.POST.get("connection_name")
        request_connection_description = request.POST.get("connection_description", "")
        host_locker_name = request.POST.get("host_locker_name")
        guest_locker_name = request.POST.get("guest_locker_name")
        host_user_username = request.POST.get("host_user_username")
        guest_user_username = request.POST.get("guest_user_username")

        if not all(
            [
                request_connection_type_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
                request_connection_name,
            ]
        ):
            return JsonResponse(
                {"success": False, "error": "All fields are required"}, status=400
            )

        try:
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            connection_type = ConnectionType.objects.get(
                connection_type_name=request_connection_type_name,
                owner_locker=host_locker,
                owner_user=host_user,
            )
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
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

        # Check for existing connection with the same host user, host locker, and guest user
        # if Connection.objects.filter(host_user=host_user, host_locker=host_locker, guest_user=guest_user).exists():
        #     return JsonResponse({'success': False, 'error': 'A connection between this host and guest already exists'}, status=400)

        # Check for existing connection with the same name
        # if (Connection.objects.filter(connection_name=request_connection_name, host_user=host_user).exists() or
        #     Connection.objects.filter(connection_name=request_connection_name, guest_user=guest_user).exists()):
        #     return JsonResponse({'success': False, 'error': 'A connection with this name already exists'}, status=400)

        # Get terms of given connection type mentioned above as we need to now copy it into Connection table.
        terms = ConnectionTerms.objects.filter(
            conn_type=connection_type, modality="obligatory"
        )
        terms_value = {}
        for term in terms:
            terms_value[term.data_element_name] = "; F"

        resource_json = {}
        for term in terms:
            if term.data_type == "Upload File":
                resource_json[term.sharing_type] = []

        try:
            connection = Connection(
                connection_name=request_connection_name,
                connection_type=connection_type,
                host_locker=host_locker,
                guest_locker=guest_locker,
                host_user=host_user,
                guest_user=guest_user,
                connection_description=request_connection_description,
                requester_consent=False,
                revoke_host=False,
                revoke_guest=False,
                terms_value=terms_value,
                resources=resource_json,
            )
            connection.save()
            return JsonResponse(
                {"success": True, "id": connection.connection_id}, status=201
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    if request.method == "POST":

        auth = request.META["HTTP_AUTHORIZATION"].split()
        auth_decoded = base64.b64decode(auth[1]).decode("utf-8")
        username, password = auth_decoded.split(":")

        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)  # Log the user in
            user_serializer = UserSerializer(user)
            return Response(
                {"success": True, "user": user_serializer.data},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"success": False, "error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def show_terms(request):
    """
    Retrieve terms associated with a specific user.

    This view handles GET requests to fetch terms for a specific user,
    identified by a 'username' query parameter, and optionally filtered by 'term_id'.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username: The username of the user whose terms are to be fetched.
        - locker_name: The locker name of the user to be fetched
        - term_id: Optional. The ID of the specific term to be fetched.
        - connection_name: Name of the active connection for which terms are to be fetched

    Returns:
        - JsonResponse: A JSON object containing a list of terms or an error message.

    Response Codes:
        - 200: Successful retrieval of terms.
        - 401: User is not authenticated.
        - 404: Specified user not found or no terms found.
        - 405: Request method not allowed (if not GET).
        - 400: Bad request (missing parameters or other errors).

    {
            "connectionName": "Alumni Networks",
            "connectionDescription": "Connection type that establishes communication between alumni.",
            "lockerName": "Transcripts",
            "obligations":
            [{
                "labelName": "Graduation Batch",
                "typeOfAction": "Add Value",
                "typeOfSharing": "Share",
                "labelDescription": "It is obligatory to submit your graduation batch in order to accept the terms of this connection",
                "hostPermissions": ["Re-share", "Download"]
            }],
            "permissions":
            {
                "canShareMoreData": true,
                "canDownloadData": false
            },
            "validity": "2024-12-31"
        }

    """
    if request.method == "GET":

        username = request.GET.get("username")
        locker_name = request.GET.get("locker_name")
        connection_name = request.GET.get("connection_name")
        try:
            if username:
                try:
                    user = CustomUser.objects.get(username=username)

                except CustomUser.DoesNotExist:
                    return JsonResponse(
                        {"success": False, "error": "User not found"}, status=404
                    )
            else:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse(
                        {"success": False, "error": "User not authenticated"},
                        status=401,
                    )

            locker = Locker.objects.filter(name=locker_name, user_id=user.user_id)

            if locker:
                conn = Connection.objects.filter(
                    connection_name=connection_name
                )  # Assuming Unique Connection Name

            else:
                conn = []

            if conn and locker:
                connection_types = ConnectionType.objects.filter(
                    connection_type_id=conn[0].connection_type_id
                )
            else:
                connection_types = []

            terms = ConnectionTerms.objects.filter(conn_type__in=connection_types)

            if not terms.exists():
                return JsonResponse(
                    {"success": False, "message": "No terms found for this user"},
                    status=404,
                )

            serializer = ConnectionTermsSerializer(terms, many=True)

            filtered_data = {}
            filtered_data["connectionName"] = conn[0].connection_name
            filtered_data["connectionDescription"] = conn[0].connection_description
            filtered_data["lockerName"] = locker_name

            obligations = []
            perm = {"canShareMoreData": False, "canDownloadData": False}

            for term in serializer.data:
                if term["modality"] == "obligatory":
                    d = {}
                    d["labelName"] = term["data_element_name"]
                    d["typeOfAction"] = term["data_type"]
                    d["typeOfSharing"] = term["sharing_type"]
                    d["labelDescription"] = term["description"]
                    d["hostPermissions"] = term["host_permissions"]
                    obligations.append(d)
                else:
                    if term["description"] == "They can share more data.":
                        perm["canShareMoreData"] = True
                    if term["description"] == "They can download data.":
                        perm["canDownloadData"] = True

            filtered_data["obligations"] = obligations
            filtered_data["permissions"] = perm

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


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def give_consent(request):
    """
    Give consent for a connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_name: The name of the connection type.
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
    connection_type_name = request.POST.get("connection_type_name")
    guest_username = request.POST.get("guest_username")
    guest_lockername = request.POST.get("guest_lockername")
    host_username = request.POST.get("host_username")
    host_lockername = request.POST.get("host_lockername")
    consent = request.POST.get("consent")

    if None in [
        connection_name,
        connection_type_name,
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
                connection_type_name__iexact=connection_type_name
            )
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Connection type not found: {}".format(
                        connection_type_name
                    ),
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

        # Update the consent status
        connection.requester_consent = consent.lower() in ["true", "1", "t", "y", "yes"]
        connection.save()

        # Get the consent given date and the validity date from the connection
        consent_given_date = datetime.now()
        validity_date = connection.validity_time

        return JsonResponse(
            {
                "success": True,
                "message": "Consent status updated successfully",
                "consent_given_date": consent_given_date.strftime(
                    "%B %d, %Y, %I:%M %p"
                ),
                "valid_until": validity_date.strftime("%B %d, %Y, %I:%M %p"),
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


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def revoke_consent(request):
    """
    Revoke consent for a connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_name: The name of the connection type.
    - guest_username: The username of the guest user.
    - guest_lockername: The name of the guest locker.
    - host_username: The username of the host user.
    - host_lockername: The name of the host locker.
    - revoke_host: Boolean indicating if the host user is revoking consent.
    - revoke_guest: Boolean indicating if the guest user is revoking consent.

    Returns:
    - JsonResponse: A JSON object containing a success message or an error message.

    Response Codes:
    - 200: Successful revocation of consent.
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
    revoke_host = request.POST.get("revoke_host", "false").lower() in [
        "true",
        "1",
        "t",
        "y",
        "yes",
    ]
    revoke_guest = request.POST.get("revoke_guest", "false").lower() in [
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
                    "error": "Connection type not found: {}".format(
                        connection_type_name
                    ),
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

        # Update the revocation status based on the provided flags
        if revoke_host:
            connection.revoke_host = True

        if revoke_guest:
            connection.revoke_guest = True

        # Save the connection
        connection.save()

        return JsonResponse(
            {"success": True, "message": "Consent revoked successfully"}, status=200
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

from collections import defaultdict
from collections import defaultdict

@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
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
            guest_users_count = incoming_connections.values('guest_user').distinct().count()

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
                "connection_type_counts": dict(connection_type_counts),  # Add the counts here
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


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
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


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
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


@csrf_exempt
@api_view(["POST", "PUT"])
@permission_classes([AllowAny])
def signup_user(request:HttpRequest):
    if request.method == "POST":
        try:
            username = request.POST.get("username")
            description = request.POST.get("description")
            password = request.POST.get("password")
            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )
            if not description:
                return JsonResponse(
                    {"success": False, "error": "Description is required"}, status=400
                )
            if not password:
                return JsonResponse(
                    {"success": False, "error": "Password is required"}, status=400
                )

                # Check if username already exists
            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse(
                    {"success": False, "error": "Username already taken"}, status=400
                )

            new_user = CustomUser(description=description, username=username)
            new_user.set_password(password)
            new_user.save()

            return JsonResponse(
                {
                    "success": True,
                    "id": new_user.user_id,
                    "username": new_user.username,
                    "description": new_user.description,
                },
                status=201,
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
        
    if request.method == "PUT":
        """
        Expected JSON data (raw JSON data/form data):
        {
            "user_ID": value,
            "new_name": value,
            "new_description": value
        }
        """
        user_ID = request.data.get('user_ID', None)
        if user_ID is None:
            return JsonResponse({
                'message': f'User ID must be provided.'
            })
        new_name = request.data.get('new_name')
        new_description = request.data.get('new_description')
        user_List = CustomUser.objects.filter(user_id=user_ID)
        if user_List.exists():
            user:CustomUser = user_List.first()
            user.username = new_name
            user.description = new_description
            user.save()
            return JsonResponse({
                'message': f'User with user ID = {user_ID} updated successfully.'
            })
        return JsonResponse({
            'message': f'User with user ID = {user_ID} does not exist.'
        })

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PATCH"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_type(request, connection_type_id):
    """
    Update an existing ConnectionType.

    Parameters:
       - request: HttpRequest object containing metadata about the request.
       - connection_type_id: ID of the ConnectionType to be updated.

    Returns:
       - JsonResponse: A JSON object containing the updated ConnectionType or an error message.

    Response Codes:
       - 200: Successful update of the ConnectionType.
       - 400: Bad request due to invalid data.
       - 404: ConnectionType not found.
       - 405: Request method not allowed (if not PATCH).
    """
    if request.method == "PATCH":
        try:
            connection_type = ConnectionType.objects.get(pk=connection_type_id)
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "message": "ConnectionType not found."}, status=404
            )

        data = json.loads(request.body)
        serializer = ConnectionTypeSerializer(connection_type, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse(
                {"success": True, "connection_type": serializer.data}, status=200
            )

        return JsonResponse({"success": False, "errors": serializer.errors}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PATCH"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_locker(request, locker_id):
    """
    Update an existing Locker.

    Parameters:
       - request: HttpRequest object containing metadata about the request.
       - locker_id: ID of the Locker to be updated.

    Returns:
       - JsonResponse: A JSON object containing the updated Locker or an error message.

    Response Codes:
       - 200: Successful update of the Locker.
       - 400: Bad request due to invalid data.
       - 404: Locker not found.
       - 405: Request method not allowed (if not PATCH).
    """
    if request.method == "PATCH":
        try:
            locker = Locker.objects.get(pk=locker_id)
        except Locker.DoesNotExist:
            return JsonResponse(
                {"success": False, "message": "Locker not found."}, status=404
            )

        data = json.loads(request.body)
        serializer = LockerSerializer(locker, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse(
                {"success": True, "locker": serializer.data}, status=200
            )

        return JsonResponse({"success": False, "errors": serializer.errors}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def freeze_or_unfreeze_locker(request):
    """
    Freeze or unfreeze a locker based on its current status.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Form Parameters:
        - username: The username of the user whose locker is to be frozen or unfrozen.
        - locker_name: Name of the locker to be frozen or unfrozen.
        - action: Specifies whether to "freeze" or "unfreeze" the locker.

    Returns:
        - JsonResponse: A JSON object indicating success or an error message.

    Response Codes:
        - 200: Successful freezing or unfreezing of the locker.
        - 400: Bad request (if data is invalid).
        - 401: User not authenticated.
        - 403: Forbidden (if the requesting user does not have permission).
        - 404: Locker not found.
        - 405: Request method not allowed (if not PUT).
    """
    if request.method == "PUT":
        if not request.user.is_authenticated:
            return JsonResponse(
                {"success": False, "error": "User not authenticated"}, status=401
            )

        # Check if the requesting user is a sys_admin or moderator
        requesting_user = request.user
        if requesting_user.user_type not in [
            "sys_admin",
            CustomUser.SYS_ADMIN,
            CustomUser.MODERATOR,
        ]:
            return JsonResponse(
                {"success": False, "error": "Permission denied"}, status=403
            )

        username = request.data.get("username")
        locker_name = request.data.get("locker_name")
        action = request.data.get("action")

        if not username or not locker_name or not action:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Username, locker name, and action are required",
                },
                status=400,
            )

        try:
            user = CustomUser.objects.get(username=username)
            locker = Locker.objects.get(name=locker_name, user=user)
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Locker not found"}, status=404
            )

        if action == "freeze":
            if locker.is_frozen:
                return JsonResponse(
                    {"success": False, "error": "Locker is already frozen"}, status=400
                )
            locker.is_frozen = True
            locker.save()
            return JsonResponse(
                {"success": True, "message": f'Locker "{locker_name}" has been frozen'},
                status=200,
            )

        elif action == "unfreeze":
            if not locker.is_frozen:
                return JsonResponse(
                    {"success": False, "error": "Locker is not frozen"}, status=400
                )
            locker.is_frozen = False
            locker.save()
            return JsonResponse(
                {
                    "success": True,
                    "message": f'Locker "{locker_name}" has been unfrozen',
                },
                status=200,
            )

        else:
            return JsonResponse(
                {"success": False, "error": "Invalid action specified"}, status=400
            )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


# @csrf_exempt
# @api_view(['PUT'])
# @permission_classes([IsAuthenticated])
# def freeze_or_unfreeze_connection(request):
#     """
#     Freeze or unfreeze a connection based on the specified action.

#     Parameters:
#     - request: HttpRequest object containing metadata about the request.

#     Request Data (PUT):
#     - username: The username of the user.
#     - connection_name: The name of the connection to freeze or unfreeze.
#     - connection_id: The ID of the connection to freeze or unfreeze (optional).
#     - action: Specifies whether to "freeze" or "unfreeze" the connection.

#     Returns:
#     - JsonResponse: A JSON object indicating success or failure.

#     Response Codes:
#     - 200: Successful freezing or unfreezing of the connection.
#     - 404: Specified user or connection not found.
#     - 400: Bad request (missing parameters).
#     - 403: Permission denied.
#     """
#     if request.method == 'PUT':
#         username = request.data.get('username')
#         connection_name = request.data.get('connection_name')
#         connection_id = request.data.get('connection_id')
#         action = request.data.get('action')

#         # if not username or not connection_name or not action:
#         #     return JsonResponse({'success': False, 'error': 'Username, Connection Name, and Action are required'}, status=400)

#         try:
#             # Check if the requesting user is a sys_admin or moderator
#             requesting_user = request.user
#             if requesting_user.user_type not in ['sys_admin',CustomUser.SYS_ADMIN, CustomUser.MODERATOR]:
#                 return JsonResponse({'success': False, 'error': 'Permission denied'}, status=403)

#             #user = CustomUser.objects.get(username=username)

#             if connection_id:
#                 # Fetch connection by connection_id
#                 connection = Connection.objects.get(connection_id=connection_id)
#             # else:
#             #     # Fetch connection by username and connection_name
#             #     connection = Connection.objects.get(connection_name=connection_name, guest_user=user)

#             if action == "freeze":
#                 if connection.is_frozen:
#                     return JsonResponse({'success': False, 'message': 'This connection is already frozen'}, status=200)
#                 else:
#                     connection.is_frozen = True
#                     connection.save()
#                     return JsonResponse({'success': True, 'message': 'Connection has been frozen successfully'}, status=200)

#             elif action == "unfreeze":
#                 if not connection.is_frozen:
#                     return JsonResponse({'success': False, 'message': 'This connection is not frozen'}, status=200)
#                 else:
#                     connection.is_frozen = False
#                     connection.save()
#                     return JsonResponse({'success': True, 'message': 'Connection has been unfrozen successfully'}, status=200)

#             else:
#                 return JsonResponse({'success': False, 'error': 'Invalid action specified'}, status=400)

#         except Connection.DoesNotExist:
#             return JsonResponse({'success': False, 'error': 'Connection not found'}, status=404)
#         # except CustomUser.DoesNotExist:
#         #     return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
#         except Exception as e:
#             return JsonResponse({'success': False, 'error': str(e)}, status=400)

#     return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def freeze_or_unfreeze_connection(request):
    """
    Freeze or unfreeze a connection based on the specified action.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - username: The username of the user.
    - connection_name: The name of the connection to freeze or unfreeze.
    - connection_id: The ID of the connection to freeze or unfreeze (optional).
    - action: Specifies whether to "freeze" or "unfreeze" the connection.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful freezing or unfreezing of the connection.
    - 404: Specified user or connection not found.
    - 400: Bad request (missing parameters).
    - 403: Permission denied.
    """
    if request.method == "PUT":
        username = request.data.get("username")
        connection_name = request.data.get("connection_name")
        connection_id = request.data.get("connection_id")
        action = request.data.get("action")

        if not username or not connection_name or not action:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Username, Connection Name, and Action are required",
                },
                status=400,
            )

        try:
            # Check if the requesting user is a sys_admin or moderator
            requesting_user = request.user
            if requesting_user.user_type not in [
                "sys_admin",
                CustomUser.SYS_ADMIN,
                CustomUser.MODERATOR,
            ]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            user = CustomUser.objects.get(username=username)

            if connection_id:
                # Fetch connection by connection_id
                connection = Connection.objects.get(connection_id=connection_id)
            else:
                # Fetch connection by username and connection_name
                connection = Connection.objects.get(
                    connection_name=connection_name, guest_user=user
                )

            if action == "freeze":
                if connection.is_frozen:
                    return JsonResponse(
                        {
                            "success": False,
                            "message": "This connection is already frozen",
                        },
                        status=200,
                    )
                else:
                    connection.is_frozen = True
                    connection.save()
                    return JsonResponse(
                        {
                            "success": True,
                            "message": "Connection has been frozen successfully",
                        },
                        status=200,
                    )

            elif action == "unfreeze":
                if not connection.is_frozen:
                    return JsonResponse(
                        {"success": False, "message": "This connection is not frozen"},
                        status=200,
                    )
                else:
                    connection.is_frozen = False
                    connection.save()
                    return JsonResponse(
                        {
                            "success": True,
                            "message": "Connection has been unfrozen successfully",
                        },
                        status=200,
                    )

            else:
                return JsonResponse(
                    {"success": False, "error": "Invalid action specified"}, status=400
                )

        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found"}, status=404
            )
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def create_connection_type_and_connection_terms(request):
    """
    Create a new connection type and connection terms associated with this connection type.

    Request Body :
    - connection_type_name: Name of the connection type.
    - connection_description: Description of the connection type.
    - owner_locker: Locker name of the currently logged-in user.
    - validity_time: Validity time of the connection type.
    - connections_terms : Array of connection terms.

    Returns:
    - JsonResponse: A JSON object containing the created connection type or an error message.

    Response Codes:
        - 201: Successful creation of connection type and connection terms.
        - 400: Malformed Request
        - 401: Request User not authenticated.
        - 404: Specified locker not found.
        - 405: Request method not allowed (if not POST).

    Sample Data - Connection Terms :
        {
            "connectionName": "Alumni Networks",
            "connectionDescription": "Connection type that establishes communication between alumni.",
            "lockerName": "Transcripts",
            "obligations":
            [{
                "labelName": "Graduation Batch",
                "typeOfAction": "Add Value",
                "typeOfSharing": "Share",
                "labelDescription": "It is obligatory to submit your graduation batch in order to accept the terms of this connection",
                "hostPermissions": ["Re-share", "Download"]
            }],
            "permissions":
            {
                "canShareMoreData": true,
                "canDownloadData": false
            },
            "validity": "2024-12-31"
        }
    """
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    if request.user.is_authenticated:
        current_user = request.user  # Use the authenticated user
    else:
        return JsonResponse({"error": "User not authenticated"}, status=401)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(data={"error": "Invalid JSON"}, status=400)

    connection_type_name = data.get("connectionName")
    connection_description = data.get("connectionDescription")
    owner_locker_name = data.get("lockerName")
    validity_time_str = data.get("validity")

    connection_terms_obligations = data.get("obligations")
    connection_terms_permissions = data.get("permissions")

    if not all(
        [
            connection_type_name,
            owner_locker_name,
            validity_time_str,
            connection_description,
        ]
    ):
        return JsonResponse(
            {"success": False, "error": "All fields are required"}, status=400
        )

    try:
        owner_user = CustomUser.objects.get(username=current_user)
        owner_locker = Locker.objects.filter(
            name=owner_locker_name, user=owner_user
        ).first()
        if not owner_locker:
            return JsonResponse(
                {"success": False, "error": "Owner locker not found"}, status=404
            )

        validity_time = parse_datetime(validity_time_str)
        if validity_time is None:
            raise ValueError("Invalid date format")

        new_connection_type = ConnectionType(
            connection_type_name=connection_type_name,
            connection_description=connection_description,
            owner_user=owner_user,
            owner_locker=owner_locker,
            validity_time=validity_time,
        )
        new_connection_type.save()

        for obligation in connection_terms_obligations:
            ConnectionTerms.objects.create(
                conn_type=new_connection_type,
                modality="obligatory",
                data_element_name=obligation["labelName"],
                data_type=obligation["typeOfAction"],
                sharing_type=obligation["typeOfSharing"],
                description=obligation["labelDescription"],
                host_permissions=obligation["hostPermissions"],
            )

        can_share_more_data = connection_terms_permissions["canShareMoreData"]
        can_download_data = connection_terms_permissions["canDownloadData"]

        if can_share_more_data:
            ConnectionTerms.objects.create(
                conn_type=new_connection_type,
                modality="permissive",
                description="They can share more data.",
            )
        if can_download_data:
            ConnectionTerms.objects.create(
                conn_type=new_connection_type,
                modality="permissive",
                description="They can download data.",
            )

        return JsonResponse(
            {
                "success": True,
                "connection_type_message": "Connection Type successfully created",
                "connection_terms_message": "Connection Terms successfully created",
            },
            status=201,
        )

    except CustomUser.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Owner user not found"}, status=404
        )
    except ValueError as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
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
            connection = Connection.objects.filter(connection_type=connection_type)

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


@csrf_exempt
@api_view(["PATCH"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_connection_terms(request):
    """
    Request Body :
    {
        "connection_name" : "Application No. 4",
        "host_locker_name" : "Admissions",
        "guest_locker_name" : "Education",
        "host_user_username" : "iiitb",
        "guest_user_username" : "rohith",
        "terms_value" : {
                            "Application Number" : "9273903; F",
                            "BTech Marks Card" : "documents/rohith_transcripts.pdf; T",
                            "Gate ScoreCard" : "documents/rohith_gate_score_card.pdf; T"
                        },
        "resources" : {
                            "Transfer": ["documents/rohith_transcripts.pdf", "documents/rohith_gate_score_card.pdf"],
                            "Share": [],
    }
    """
    if request.method == "PATCH":

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(data={"error": "Invalid JSON"}, status=400)

        connection_name = data.get("connection_name")
        host_locker_name = data.get("host_locker_name")
        guest_locker_name = data.get("guest_locker_name")
        host_user_username = data.get("host_user_username")
        guest_user_username = data.get("guest_user_username")
        connection_terms_json = data.get("terms_value")
        resources_json = data.get("resources")

        if not all(
            [
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
                connection_terms_json,
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

        connection.terms_value = connection_terms_json
        connection.resources = resources_json
        connection.save()
        return JsonResponse(
            {"success": True, "message": "Connection Terms successfully updated."},
            status=200,
        )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


# @csrf_exempt
# @api_view(["GET"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def get_terms_status(request):
#     """
#     Request Parameters:
#     - connection_name
#     - host_locker_name
#     - guest_locker_name
#     - host_user_username
#     - guest_user_username
#     """
#     if request.method == "GET":
#         connection_name = request.GET.get("connection_name")
#         host_locker_name = request.GET.get("host_locker_name")
#         guest_locker_name = request.GET.get("guest_locker_name")
#         host_user_username = request.GET.get("host_user_username")
#         guest_user_username = request.GET.get("guest_user_username")

#         if not all(
#             [
#                 connection_name,
#                 host_locker_name,
#                 guest_locker_name,
#                 host_user_username,
#                 guest_user_username,
#             ]
#         ):
#             return JsonResponse(
#                 {"success": False, "error": "All fields are required"}, status=400
#             )

#         try:
#             host_user = CustomUser.objects.get(username=host_user_username)
#             host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
#             guest_user = CustomUser.objects.get(username=guest_user_username)
#             guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
#             connection = Connection.objects.get(
#                 connection_name=connection_name,
#                 host_locker=host_locker,
#                 host_user=host_user,
#                 guest_locker=guest_locker,
#                 guest_user=guest_user,
#             )
#         except Connection.DoesNotExist:
#             return JsonResponse(
#                 {"success": False, "error": "Requested Connection type not found"},
#                 status=404,
#             )
#         except Locker.DoesNotExist as e:
#             return JsonResponse(
#                 {"success": False, "error": f"Locker not found: {e}"}, status=400
#             )
#         except CustomUser.DoesNotExist as e:
#             return JsonResponse(
#                 {"success": False, "error": f"User not found: {e}"}, status=400
#             )

#         count_T = 0
#         count_F = 0
#         filled = 0
#         empty = 0

#         terms_value = connection.terms_value

#         # Handle case when terms_value is empty
#         if terms_value:
#             for key, value in terms_value.items():
#                 value = value.strip()
#                 if value.endswith("; T") or value.endswith(";T"):
#                     count_T += 1
#                 elif value.endswith("; F") or value.endswith(";F"):
#                     count_F += 1

#                 stripped_value = value.rstrip("; T").rstrip(";T").rstrip("; F").rstrip(";F").strip()
#                 if stripped_value:
#                     filled += 1
#                 else:
#                     empty += 1

#             # Calculate the number of empty terms based on the total count
#             total_terms = count_T + count_F
#             if total_terms > 0:
#                 empty = total_terms - filled
#         else:
#             # If terms_value is empty, assume all expected terms are empty
#             total_terms = count_T + count_F
#             empty = total_terms
#             filled = 0

#         return JsonResponse(
#             {
#                 "success": True,
#                 "count_T": count_T,
#                 "count_F": count_F,
#                 "empty": empty,
#                 "filled": filled,
#             },
#             status=200,
#         )

#     return JsonResponse(
#         {"success": False, "error": "Invalid request method"}, status=405
#     )

@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
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
            for key, value in terms_value.items():
                value = value.strip()
                if value.endswith("; T") or value.endswith(";T"):
                    count_T += 1
                elif value.endswith("; F") or value.endswith(";F"):
                    count_F += 1
                elif value.endswith("; R") or value.endswith(";R"):
                    count_R += 1

                stripped_value = value.rstrip("; T").rstrip(";T").rstrip("; F").rstrip(";F").rstrip("; R").rstrip(";R").strip()
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

@csrf_exempt
@api_view(['POST'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def transfer_resource(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        connection_name = body.get('connection_name')
        host_locker_name = body.get('host_locker_name')
        guest_locker_name = body.get('guest_locker_name')
        host_user_username = body.get('host_user_username')
        guest_user_username = body.get('guest_user_username')
        
        print(connection_name, host_locker_name, guest_locker_name, host_user_username, guest_user_username)

        if not all([connection_name, host_locker_name, guest_locker_name, host_user_username, guest_user_username]):
            return JsonResponse({'success': False, 'error': 'All fields are required'}, status=400)

        try:
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            connection = Connection.objects.get(connection_name=connection_name, host_locker=host_locker,
                                                host_user=host_user, guest_locker=guest_locker, guest_user=guest_user)
        except Connection.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Requested Connection type not found'}, status=404)
        except Locker.DoesNotExist as e:
            return JsonResponse({'success': False, 'error': f'Locker not found: {e}'}, status=400)
        except CustomUser.DoesNotExist as e:
            return JsonResponse({'success': False, 'error': f'User not found: {e}'}, status=400)

        # Iterate over terms_value to find documents with "; T"
        for key, value in connection.terms_value.items():
            if "; T" in value:
                doc_path = value.split("; T")[0].strip()
                print(f"Document path: {doc_path}")

                # Find the i_node_pointer from the resource list
                try:
                    resource = Resource.objects.get(i_node_pointer=doc_path)    
                    resource.owner = host_user
                    resource.locker = host_locker
                    resource.save()
                    return JsonResponse({'success': True, 'message': 'Transfer successful'}, status=200)
                except Resource.DoesNotExist:
                    print(f"Resource with i_node_pointer {doc_path} does not exist.")
                    continue
        
        # If no valid document found for transfer
        return JsonResponse({'success': False, 'message': 'No valid document found for transfer'}, status=404)

@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
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
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
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
            serializer = ConnectionSerializer(connection)
            return JsonResponse({"connections": serializer.data}, status=200)

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

        # Return appropriate response
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def create_admin(request):
    """
    Promote a user to sys_admin.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - username: The username of the user to promote to sys_admin.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful promotion to sys_admin.
    - 404: Specified user not found.
    - 400: Bad request (missing parameters).
    - 403: Permission denied.
    """
    if request.method == "PUT":
        username = request.data.get("username")

        if not username:
            return JsonResponse(
                {"success": False, "error": "Username is required"}, status=400
            )

        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            # Find the user to be promoted
            user_to_promote = CustomUser.objects.get(username=username)

            # Promote the user to sys_admin
            user_to_promote.user_type = CustomUser.SYS_ADMIN
            user_to_promote.save()

            return JsonResponse(
                {
                    "success": True,
                    "message": f"{username} has been promoted to sys_admin successfully",
                },
                status=200,
            )

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def create_moderator(request):
    """
    Promote a user to moderator.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - username: The username of the user to promote to moderator.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful promotion to moderator.
    - 404: Specified user not found.
    - 400: Bad request (missing parameters).
    - 403: Permission denied.
    """
    if request.method == "PUT":
        username = request.data.get("username")

        if not username:
            return JsonResponse(
                {"success": False, "error": "Username is required"}, status=400
            )

        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            # Find the user to be promoted
            user_to_promote = CustomUser.objects.get(username=username)

            # Promote the user to moderator
            user_to_promote.user_type = CustomUser.MODERATOR
            user_to_promote.save()

            return JsonResponse(
                {
                    "success": True,
                    "message": f"{username} has been promoted to moderator successfully",
                },
                status=200,
            )

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def remove_admin(request):
    """
    Remove admin privileges from a user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - username: The username of the admin to be demoted.

    Returns:
    - JsonResponse: A JSON object indicating success or error message.

    Response Codes:
    - 200: Successful removal of admin privileges.
    - 400: Bad request (if data is invalid or user is not an admin).
    - 401: User not authenticated.
    - 403: Forbidden (if the requesting user does not have permission).
    - 404: User not found.
    """
    if request.method == "PUT":
        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            username = request.data.get("username")

            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )

            try:
                user = CustomUser.objects.get(username=username)

                if user.user_type not in ["system_admin", "sys_admin"]:
                    return JsonResponse(
                        {"success": False, "error": "User is not an admin"}, status=400
                    )

                user.user_type = "user"
                user.save()

                return JsonResponse(
                    {
                        "success": True,
                        "message": f"Admin privileges removed from {username}",
                    },
                    status=200,
                )
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "User not found"}, status=404
                )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def remove_moderator(request):
    """
    Remove moderator privileges from a user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - username: The username of the moderator to be demoted.

    Returns:
    - JsonResponse: A JSON object indicating success or error message.

    Response Codes:
    - 200: Successful removal of moderator privileges.
    - 400: Bad request (if data is invalid or user is not a moderator).
    - 401: User not authenticated.
    - 403: Forbidden (if the requesting user does not have permission).
    - 404: User not found.
    """
    if request.method == "PUT":
        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            username = request.data.get("username")

            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )

            try:
                user = CustomUser.objects.get(username=username)

                if user.user_type != "moderator":
                    return JsonResponse(
                        {"success": False, "error": "User is not a moderator"},
                        status=400,
                    )

                user.user_type = "user"
                user.save()

                return JsonResponse(
                    {
                        "success": True,
                        "message": f"Moderator privileges removed from {username}",
                    },
                    status=200,
                )
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "User not found"}, status=404
                )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
# @role_required(CustomUser.SYS_ADMIN)
def create_Global_Connection_Type_Template(request):
    """
    This API is used to create a new global connection type. This API is allowed only for system admins.
    Response Codes:
        - 201: Successfully created a global connection type.
        - 400: The data sent in the request is invalid, missing or malformed.
    Expected JSON (raw JSON data/form data):
    {
        "global_connection_type_name": value,
        "global_connection_type_description": value,
        "global_terms_IDs": list of global connection terms IDs
    }
    """
    data = request.data  # RAW JSON DATA/FORM DATA
    requesting_user: CustomUser = request.user
    if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
        return JsonResponse(
            {
                "message": f"User must be a system admin to access this API endpoint. Current user has {requesting_user.user_type} type."
            }
        )
    ids: list = data.get("global_terms_IDs")
    if ids is None or len(ids) == 0:
        return JsonResponse({"message": "List of IDs of terms must not be empty."})
    try:
        template_Data = {
            "global_connection_type_name": data.get("global_connection_type_name"),
            "global_connection_type_description": data.get(
                "global_connection_type_description"
            ),
        }
        # serializer = GlobalConnectionTypeTemplatePostSerializer(data=template_Data)
        # if not serializer.is_valid():
        #     return JsonResponse({"status": 400, "errors": serializer.errors})
        # global_Template: GlobalConnectionTypeTemplate = serializer.save()
        global_Template: GlobalConnectionTypeTemplate = (
            GlobalConnectionTypeTemplate.objects.create(
                global_connection_type_name=template_Data[
                    "global_connection_type_name"
                ],
                global_connection_type_description=template_Data[
                    "global_connection_type_description"
                ],
            )
        )
        global_Template.save()
        for id in data.get("global_terms_IDs"):
            global_Term = ConnectionTerms.objects.filter(terms_id=id).first()
            if global_Term:
                global_Term.global_conn_type = global_Template
                global_Term.save()
            else:
                return JsonResponse(
                    {
                        "message": f"Global connection term with ID = {id} does not exist."
                    }
                )
        return JsonResponse(
            {
                "status": 201,
                "message": f"Global connection type created successfully and linked it to the global terms IDs = {data.get('global_terms_IDs')} successfully.",
            }
        )
    except Exception as e:
        print(e)
        return JsonResponse({"message": "Something went wrong.", "error": f"{e}"})


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_Global_Connection_Type(request):
    """
    This API is used to get all global connection type templates or a particular one if the ID is mentioned in the request.
    Expected JSON to get a particular global connection type (raw JSON data/form data):
    {
        "global_connection_type_template_name": value
    }
    To get all conection types, no need to send any JSON.
    """
    if request.method == "GET":
        name = request.data.get(
            "global_connection_type_template_name"
        )  # RAW JSON DATA/FORM DATA
        print(name)
        if name:
            global_Connection_Type = GlobalConnectionTypeTemplate.objects.filter(
                global_connection_type_name=name
            )
            print(global_Connection_Type.first())
            if global_Connection_Type.exists():
                serializer = GlobalConnectionTypeTemplateGetSerializer(
                    global_Connection_Type.first()
                )
                terms = ConnectionTerms.objects.filter(
                    global_conn_type=global_Connection_Type.first()
                )
                terms_Serializer = ConnectionTermsSerializer(terms, many=True)
                return JsonResponse(
                    {
                        "global_connection": serializer.data,
                        "terms_attached_to_global_template": terms_Serializer.data,
                    }
                )
            else:
                return JsonResponse(
                    {
                        "message": f"global connection type template with name = {name} does not exist."
                    }
                )
        else:
            global_Connection_Types = GlobalConnectionTypeTemplate.objects.all()
            serializer = GlobalConnectionTypeTemplateGetSerializer(
                global_Connection_Types, many=True
            )
            return JsonResponse({"data": serializer.data})


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def connect_Global_Connection_Type_Template_And_Connection_Type(request):
    """
    Expected JSON (form data):
    {
        "template_Id": value,
        "type_Id": value
    }
    """
    template_Id = request.POST.get("template_Id")  # FORM DATA
    type_Id = request.POST.get("type_Id")  # FORM DATA
    # data = {"connection_type_id": "", "global_connection_template_id": ""}
    if template_Id is not None and type_Id is not None:
        template = GlobalConnectionTypeTemplate.objects.filter(
            global_connection_type_template_id=template_Id
        )
        if not template.exists():
            return JsonResponse(
                {
                    "message": f"Global connection type template with ID = {template_Id} does not exist."
                }
            )
        else:
            connection_Type = ConnectionType.objects.filter(connection_type_id=type_Id)
            if not connection_Type.exists():
                return JsonResponse(
                    {"message": f"Connection type with ID = {type_Id} does not exist."}
                )
            else:
                link = ConnectionTypeRegulationLinkTable.objects.filter(
                    connection_type_id=connection_Type.first(),
                    global_connection_template_id=template.first(),
                )
                if link.exists():
                    template_Serializer = GlobalConnectionTypeTemplateGetSerializer(
                        template.first()
                    )
                    type_Serializer = ConnectionTypeSerializer(connection_Type.first())
                    return JsonResponse(
                        {
                            "message": "This link already exists.",
                            "existing ID of link in DB": link.first().link_id,
                            "global template": template_Serializer.data,
                            "connection type": type_Serializer.data,
                        }
                    )
                # data["global_connection_template_id"] = template.first()
                # data["connection_type_id"] = connection_Type.first()
                # link = ConnectionTypeRegulationLinkTable(
                #     connection_Type_Id=connection_Type.first(),
                #     conection_Template_Id=template.first(),
                # )

                try:
                    link = ConnectionTypeRegulationLinkTable.objects.create(
                        connection_type_id=connection_Type.first(),
                        global_connection_template_id=template.first(),
                    )
                    # serializer = ConnectionTypeRegulationLinkTablePostSerializer(
                    #     data=link
                    # )
                    # if not serializer.is_valid():
                    #     return JsonResponse(
                    #         {"status": 400, "errors": serializer.errors}
                    #     )
                    # serializer.save()
                    return JsonResponse(
                        {
                            "status": 201,
                            "message": f"Connection type with ID = {type_Id} linked successfully to global connection type template with ID = {template_Id}",
                        }
                    )
                except Exception as e:
                    print(e)
                    return JsonResponse(
                        {"message": "Something went wrong.", "error": f"{e}"}
                    )
    return JsonResponse(
        {"message": f"Template ID = {template_Id} and type ID = {type_Id}"}
    )


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_All_Connection_Terms_For_Global_Connection_Type_Template(request):
    """
    Expected JSON (raw JSON data/form data):
    {
        "template_Id": value
    }
    """
    template_Id = request.GET.get("template_Id", None)  # RAW JSON DATA/FORM DATA
    if template_Id is not None:
        template = GlobalConnectionTypeTemplate.objects.filter(
            global_connection_type_template_id=template_Id
        )
        if not template.exists():
            return JsonResponse(
                {
                    "message": f"global conection type template with ID = {template_Id} does not exist."
                }
            )
        else:
            terms = ConnectionTerms.objects.filter(global_conn_type=template.first())
            serializer = ConnectionTermsSerializer(terms, many=True)
            return JsonResponse({"data": serializer.data})


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_Connection_Link_Regulation_For_Connection_Type(request):
    """
    Expected JSON (raw JSON data/form data):
    {
        "connection_Type_ID": value
    }
    """
    if request.method == "GET":
        conn_type_ID = request.data.get("connection_Type_ID")  # RAW JSON DATA/FORM DATA
        link_Regulation = ConnectionTypeRegulationLinkTable.objects.filter(
            connection_type_id=conn_type_ID
        )
        if link_Regulation.exists():
            serializer = ConnectionTypeRegulationLinkTableGetSerializer(
                link_Regulation, many=True
            )
            return JsonResponse({"data": serializer.data})
        return JsonResponse(
            {
                "message": f"Connection regulation link table does not have an entry with connection type ID = {conn_type_ID}"
            }
        )
    return JsonResponse({"message": "The method request is not GET."})


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
# @role_required(CustomUser.SYS_ADMIN)
def create_Global_Connection_Terms(request):
    """
    Expected JSON (raw JSON data/form data):
    {
        "connection_terms_obligations": obligations,
        "connection_terms_permissions": permissions
    }
    """
    if request.method == "POST":
        requesting_user: CustomUser = request.user
        if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
            return JsonResponse(
                {
                    "message": f"User must be a system admin to hit this API endpoint. Current user has {requesting_user.user_type} type"
                }
            )
        # global_conn_type_id = request.data.get("global_conn_type_id") # RAW JSON DATA/FORM DATA
        connection_terms_obligations = request.data.get(
            "connection_terms_obligations"
        )  # RAW JSON DATA/FORM DATA
        connection_terms_permissions = request.data.get(
            "connection_terms_permissions"
        )  # RAW JSON DATA/FORM DATA
        print(connection_terms_obligations)

        # template = GlobalConnectionTypeTemplate.objects.filter(
        #     global_connection_type_template_id=global_conn_type_id
        # )
        # if not template.exists():
        #     return JsonResponse(
        #         {
        #             "message": f"Global connection type template with ID = {global_conn_type_id} does not exist."
        #         }
        #     )
        terms_List: list = []
        for obligation in connection_terms_obligations:
            term = ConnectionTerms.objects.create(
                # global_conn_type=None,
                modality="obligatory",
                data_element_name=obligation["labelName"],
                data_type=obligation["typeOfAction"],
                sharing_type=obligation["typeOfSharing"],
                description=obligation["labelDescription"],
                host_permissions=obligation["hostPermissions"],
            )
            terms_List.append(term)

        can_share_more_data = connection_terms_permissions["canShareMoreData"]
        can_download_data = connection_terms_permissions["canDownloadData"]

        if can_share_more_data:
            term = ConnectionTerms.objects.create(
                # global_conn_type=None,
                modality="permissive",
                description="They can share more data.",
            )
            terms_List.append(term)
        if can_download_data:
            term = ConnectionTerms.objects.create(
                # global_conn_type=None,
                modality="permissive",
                description="They can download data.",
            )
            terms_List.append(term)
        terms_Serializer = ConnectionTermsSerializer(terms_List, many=True)
        return JsonResponse(
            {
                "message": "Global connection terms added successfully.",
                "terms": terms_Serializer.data,
            }
        )
    else:
        return JsonResponse({"message": "Request method is not POST."})


# @csrf_exempt
# @api_view(["PUT", "DELETE"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def delete_Update_Locker(request: HttpRequest):
#     if request.method == "DELETE":
#         """
#         Expected JSON data(raw JSON data/form data):
#         {
#             "locker_name": value
#         }
#         """
#         user: CustomUser = request.user
#         actual_User = CustomUser.objects.filter(username=user.username)
#         if actual_User.exists():
#             locker_Name = request.data.get("locker_name")
#             if locker_Name is None:
#                 return JsonResponse({"message": "Locker name is not provided."})
#             particular_User: CustomUser = actual_User.first()
#             locker_To_Be_Deleted = Locker.objects.filter(
#                 name=locker_Name, user=particular_User
#             )
#             if locker_To_Be_Deleted.exists():
#                 delete_Locker: Locker = locker_To_Be_Deleted.first()
#                 delete_Locker.delete()
#                 return JsonResponse(
#                     {
#                         "message": f"Locker(ID = {delete_Locker.locker_id}) with name = {locker_Name} of user with username = {particular_User.username} was successfully deleted."
#                     }
#                 )
#         else:
#             return JsonResponse(
#                 {"message": f"User with username = {user.username} does not exist."}
#             )
#     elif request.method == "PUT":
#         """
#         Expected JSON data (raw JSON data/form data):
#         {
#             "new_locker_name": value,
#             "description": value,
#             "username": username of the new user,
#             "is_frozen": value (boolean)
#         }
#         """
#         user: CustomUser = request.user
#         actual_User = CustomUser.objects.filter(username=user.username)
#         if actual_User.exists():
#             locker_Name = request.data.get("locker_name")
#             if locker_Name is None:
#                 return JsonResponse({"message": "Locker name is not provided."})
#             particular_User: CustomUser = actual_User.first()
#             locker_To_Be_Updated = Locker.objects.filter(
#                 name=locker_Name, user=particular_User
#             )
#             if locker_To_Be_Updated.exists():
#                 update_Locker: Locker = locker_To_Be_Updated.first()
#                 new_locker_name = request.data.get("new_locker_name")
#                 description = request.data.get("description")
#                 username = request.data.get("username")
#                 is_frozen = request.data.get("is_frozen")
#                 new_User = CustomUser.objects.filter(username=username)
#                 if new_User.exists():
#                     update_Locker.name = new_locker_name
#                     update_Locker.description = description
#                     update_Locker.is_frozen = is_frozen
#                     update_Locker.user = new_User
#                     update_Locker.save()
#                     return JsonResponse({"message": "Locker updated successfully."})
#                 else:
#                     return JsonResponse({
#                         'message': f'User with username = {username} does not exist.'
#                     })
#         else:
#             return JsonResponse(
#                 {"message": f"User with username = {user.username} does not exist."}
#             )
#     else:
#         return JsonResponse({"message": "Request method should be either POST or PUT."})
@csrf_exempt
@api_view(["PUT", "DELETE"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def delete_Update_Locker(request: HttpRequest):
    if request.method == "DELETE":
        """
        Expected JSON data(raw JSON data/form data):
        {
            "locker_name": value
        }
        """
        user: CustomUser = request.user
        locker_name = request.data.get("locker_name")

        if not locker_name:
            return JsonResponse({"message": "Locker name is not provided."}, status=400)

        locker_to_be_deleted = Locker.objects.filter(name=locker_name, user=user)

        if locker_to_be_deleted.exists():
            delete_locker = locker_to_be_deleted.first()
            delete_locker.delete()
            return JsonResponse(
                {
                    "message": f"Locker(ID = {delete_locker.locker_id}) with name = {locker_name} of user with username = {user.username} was successfully deleted."
                },
                status=200
            )
        else:
            return JsonResponse(
                {"message": f"Locker with name = {locker_name} does not exist."},
                status=404
            )

    elif request.method == "PUT":
        """
        Expected JSON data (raw JSON data/form data):
        {
            "locker_name": value,
            "new_locker_name": value,
            "description": value
        }
        """
        user: CustomUser = request.user
        actual_User = CustomUser.objects.filter(username=user.username)
        if actual_User.exists():
            locker_Name = request.data.get("locker_name")
            if locker_Name is None:
                return JsonResponse({"message": "Locker name is not provided."})
            particular_User: CustomUser = actual_User.first()
            locker_To_Be_Updated = Locker.objects.filter(
                name=locker_Name, user=particular_User
            )
            if locker_To_Be_Updated.exists():
                update_Locker: Locker = locker_To_Be_Updated.first()
                new_locker_name = request.data.get("new_locker_name")
                description = request.data.get("description")
                username = request.data.get("username")
                is_frozen = request.data.get("is_frozen")
                new_User = CustomUser.objects.filter(username=username)
                if new_User.exists():
                    update_Locker.name = new_locker_name
                    update_Locker.description = description
                    update_Locker.is_frozen = is_frozen
                    update_Locker.user = new_User
                    update_Locker.save()
                    return JsonResponse({"message": "Locker updated successfully."})
                else:
                    return JsonResponse(
                        {"message": f"User with username = {username} does not exist."}
                    )
        else:
            return JsonResponse(
                {"message": f"Locker with name = {locker_name} does not exist."},
                status=404
            )

    else:
        return JsonResponse({"message": "Request method should be either POST or PUT."})


@csrf_exempt
@api_view(["PUT", "DELETE"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def delete_Update_Resource(request: HttpRequest):
    if request.method == "DELETE":
        """
        Expected JSON (raw JSON data/form data):
        {
            "locker_name": value,
            "owner_name": value
        }
        """
        locker_name = request.data.get("locker_name")
        owner_name = request.data.get("owner_name")
        user: CustomUser = request.user
        request_User: CustomUser = CustomUser.objects.filter(
            username=owner_name
        ).first()
        if request_User.DoesNotExist:
            return JsonResponse(
                {"message": f"User with name = {owner_name} does not exist."}
            )
        if request_User == user:
            locker_of_resource = Locker.objects.filter(name=locker_name, user=user)
            if locker_of_resource.exists():
                particular_locker: Locker = locker_of_resource.first()
                resource_To_Be_Deleted = Resource.objects.filter(
                    owner=user, locker=particular_locker
                )
                if resource_To_Be_Deleted.exists():
                    delete_Resource: Resource = resource_To_Be_Deleted.first()
                    id = delete_Resource.resource_id
                    delete_Resource.delete()
                    return JsonResponse(
                        {"message": f"Resource with ID = {id} deleted successfully."}
                    )
                else:
                    return JsonResponse(
                        {
                            "message": f"Resource with user having username = {user.username} and locker with ID = {particular_locker.locker_id} does not exist."
                        }
                    )
            else:
                return JsonResponse(
                    {"message": f"Locker with name = {locker_name} does not exist."}
                )
        else:
            return JsonResponse(
                {"message": "You are not allowed to delete this resource."}
            )

    if request.method == "PUT":
        """
        Expected JSON (raw JSON data/form data):
        {
            "old_locker_name": value,
            "old_owner_name": value,
            "document_name": value,
            "i_node_pointer": value,
            "new_locker_name": value,
            "version": value,
            "new_owner_name": value,
            "type": value
        }
        """
        locker_name = request.data.get("old_locker_name")
        owner_name = request.data.get("old_owner_name")
        user: CustomUser = request.user
        request_User: CustomUser = CustomUser.objects.filter(
            username=owner_name
        ).first()
        if request_User.DoesNotExist:
            return JsonResponse(
                {"message": f"User with name = {owner_name} does not exist."}
            )
        if request_User == user:
            locker_of_resource = Locker.objects.filter(name=locker_name, user=user)
            if locker_of_resource.exists():
                particular_locker: Locker = locker_of_resource.first()
                resource_To_Be_Updated = Resource.objects.filter(
                    owner=user, locker=particular_locker
                )
                if resource_To_Be_Updated.exists():
                    update_Resource: Resource = resource_To_Be_Updated.first()
                    # id = delete_Resource.resource_id
                    # delete_Resource.delete()
                    document_name = request.data.get("document_name")
                    i_node_pointer = request.data.get("i_node_pointer")
                    new_locker_name = request.data.get("new_locker_name")
                    version = request.data.get("version")
                    new_owner_name = request.data.get("new_owner_name")
                    resource_type = request.data.get("type")
                    new_Locker: Locker = Locker.objects.filter(
                        name=new_locker_name, user=request_User
                    ).first()
                    if new_Locker.DoesNotExist:
                        return JsonResponse(
                            {
                                "message": f"Locker with name = {new_locker_name} does not exist."
                            }
                        )
                    else:
                        new_owner: CustomUser = CustomUser.objects.filter(
                            username=new_owner_name
                        ).first()
                        if new_owner.DoesNotExist:
                            return JsonResponse(
                                {
                                    "message": f"User with name = {new_owner_name} does not exist."
                                }
                            )
                        else:
                            update_Resource.document_name = document_name
                            update_Resource.i_node_pointer = i_node_pointer
                            update_Resource.locker = new_Locker
                            update_Resource.version = version
                            update_Resource.owner = new_owner
                            update_Resource.type = resource_type
                            update_Resource.save()
                            return JsonResponse(
                                {
                                    "message": f"Resource with ID = {update_Resource.resource_id} updated successfully."
                                }
                            )
                else:
                    return JsonResponse(
                        {
                            "message": f"Resource with user having username = {user.username} and locker with ID = {particular_locker.locker_id} does not exist."
                        }
                    )
            else:
                return JsonResponse(
                    {"message": f"Locker with name = {locker_name} does not exist."}
                )
        else:
            return JsonResponse(
                {"message": "You are not allowed to delete this resource."}
            )


# @csrf_exempt
# @api_view(["POST"])
# @authentication_classes([BasicAuthentication])
# @permission_classes([IsAuthenticated])
# def share_Resource_Create_Vnode(request:HttpRequest):
#     if request.method == 'POST':
#         """
#         Expected JSON data (raw JSON data/form data):
#         {
#             "resource_id": value,
#             "guest_locker_id": value,
#             "host_locker_id": value,
#             "connection_id": value,
#             "operator_constraints": value
#         }
#         """
#         resource_id = request.data.get('resource_id')
#         guest_locker_id = request.data.get('guest_locker_id')
#         host_locker_id = request.data.get('host_locker_id')
#         connection_id = request.data.get('connection_id')
#         resource_List = Resource.objects.filter(resource_id=resource_id)
#         if resource_List.exists():
#             guest_Locker_List = Locker.objects.filter(locker_id=guest_locker_id)
#             if guest_Locker_List.exists():
#                 host_Locker_List = Locker.objects.filter(locker_id=host_locker_id)
#                 if host_Locker_List.exists():
#                     connection_List = Connection.objects.filter(connection_id=connection_id)
#                     if connection_List.exists():
#                         connection = connection_List.first()
#                         guest_locker = guest_Locker_List.first()
#                         host_locker = host_Locker_List.first()
#                         resource = resource_List.first()
#                         operator_constraints = request.data.get('operator_constraints')
#                         vnode = Vnode.objects.create(
#                             resource=resource,
#                             connection=connection,
#                             host_locker=host_locker,
#                             guest_locker=guest_locker,
#                             operator_constraints=operator_constraints
#                         )
#                         vnode.save()
#                         serializer = VnodeSerializer(vnode)
#                         return JsonResponse({
#                             'message': 'Vnode created successfully.',
#                             'data': serializer.data
#                         })
#                     return JsonResponse({
#                         'message': f'Connection with ID = {connection_id} does not exist.'
#                     })
#                 return JsonResponse({
#                     'message': f'Locker(host locker) with ID = {host_locker_id} does not exist.'
#                 })
#             return JsonResponse({
#                 'message': f'Locker(guest locker) with ID = {guest_locker_id} does not exist.'
#             })
#         return JsonResponse({
#             'message': f'Resource with ID = {resource_id} does not exist.'
#         })

@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def share_resource(request):
    if request.method == "POST":

        connection_id = request.POST.get("connection_id")
        host_locker_name = request.POST.get("host_locker_name")
        guest_locker_name = request.POST.get("guest_locker_name")
        host_user_username = request.POST.get("host_user_username")
        guest_user_username = request.POST.get("guest_user_username")
        resource_id = request.POST.get("resource_id")

        if not all(
            [
                connection_id,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
                resource_id,
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
                connection_id=connection_id,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )
            resource = Resource.objects.get(resource_id=resource_id)
        except (
            Connection.DoesNotExist,
            Locker.DoesNotExist,
            CustomUser.DoesNotExist,
            Resource.DoesNotExist,
        ) as e:
            return JsonResponse({"success": False, "error": str(e)}, status=404)

        # logic for checking if the resource is eligible for sharing
        for key, value in connection.terms_value.items():
            if ("; T" in value) or (";T" in value):
                if "; T" in value:
                    doc_path = value.split("; T")[0].strip()
                else:
                    doc_path = value.split(";T")[0].strip()

                if doc_path == resource.i_node_pointer and resource.i_node_pointer in connection.resources.get("Share", []):
                    # Create Vnode if eligible for sharing
                    Vnode.objects.create(
                        resource=resource,
                        host_locker=host_locker,
                        guest_locker=guest_locker,
                        connection=connection,
                        operator_constraints={"view_only": True},
                    )
                    return JsonResponse(
                        {"success": True, "message": "Resource shared successfully"},
                        status=200,
                    )

        # Resource not eligible for sharing
        return JsonResponse(
            {"success": False, "error": "Resource not eligible for sharing"}, status=400
        )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def update_Connection(request:HttpRequest):
    """
    Expected JSON (raw JSON data/form data):
    {
        "connection_id": value,
        "name": new name,
        "description": new description
    }
    """
    connection_id:int = request.data.get('connection_id')
    connection:Connection = Connection.objects.filter(connection_id=connection_id).first()
    if connection.DoesNotExist:
        return JsonResponse({
            'message': f'Connection with ID = {connection_id} does not exist.'
        })
    connection.connection_description = request.data.get('description')
    connection.connection_name = request.data.get('name')
    connection.save()
    return JsonResponse({
        'message': f'The connection with ID = {connection_id} has been updated successfully.'
    })

@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_terms_for_user(request):
    if request.method == "GET":
        username = request.GET.get("username")  # This should be the host user's username 
        locker_name = request.GET.get("locker_name")
        connection_name = request.GET.get("connection_name")
        try:
            # Get the host user (owner of the locker)
            try:
                host_user = CustomUser.objects.get(username=username)
                print(f"Host user found: {host_user}")
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "User not found"}, status=404
                )

            # Get locker
            #CHANGED TO REQUEST.USER.USER_ID
            locker = Locker.objects.filter(name=locker_name, user_id=request.user.user_id).first()
            #CHANGED TO REQUEST.USER.USER_ID
            locker = Locker.objects.filter(name=locker_name, user_id=request.user.user_id).first()
            if not locker:
                print(f"Locker not found for user: {username}, locker name: {locker_name}")
                return JsonResponse({"success": False, "error": "Locker not found"}, status=404)
            print(f"Locker found: {locker}")

            
            connection = Connection.objects.filter(
                connection_name=connection_name, host_user=host_user, guest_user=request.user
            ).first()

            if not connection:
                print(f"Connection not found for host_user: {username}, guest_user: {request.user.username}, connection_name: {connection_name}")
                return JsonResponse(
                    {"success": False, "error": "Connection not found"}, status=404
                )
            print(f"Connection found: {connection}")

            # Get connection type and associated terms
            connection_type = connection.connection_type
            terms = ConnectionTerms.objects.filter(conn_type=connection_type)

            if not terms.exists():
                return JsonResponse(
                    {"success": False, "message": "No terms found for this user"},
                    status=404,
                )

            serializer = ConnectionTermsSerializer(terms, many=True)

            # Prepare response data
            filtered_data = {}
            filtered_data["connectionName"] = connection.connection_name
            filtered_data["connectionDescription"] = connection.connection_description
            filtered_data["lockerName"] = locker_name

            obligations = []
            perm = {"canShareMoreData": False, "canDownloadData": False}

            terms_value = connection.terms_value

            for term in serializer.data:
                term_value = terms_value.get(term["data_element_name"], None)
                term_data = {
                    "labelName": term["data_element_name"],
                    "typeOfAction": term["data_type"],
                    "typeOfSharing": term["sharing_type"],
                    "labelDescription": term["description"],
                    "hostPermissions": term["host_permissions"],
                    "value": term_value,  # Include the user-provided value
                }

                if term["modality"] == "obligatory":
                    obligations.append(term_data)
                else:
                    if term["description"] == "They can share more data.":
                        perm["canShareMoreData"] = True
                    if term["description"] == "They can download data.":
                        perm["canDownloadData"] = True

            filtered_data["obligations"] = obligations
            filtered_data["permissions"] = perm

            return JsonResponse({"success": True, "terms": filtered_data}, status=200)

        except Exception as e:
            print(f"Exception occurred: {e}")
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connections_to_locker(request):
    try:
        guest_username = request.user.username  # the user is authenticated 
        host_username = request.query_params.get('host_username')
        host_locker_name = request.query_params.get('host_locker_name')

        if not host_username or not host_locker_name:
            return Response({'success': False, 'message': 'Missing required parameters'}, status=400)

        # Filter connections where guest is the current user and host matches the given locker
        connections = Connection.objects.filter(
            guest_user__username=guest_username,
            host_user__username=host_username,
            host_locker__name=host_locker_name
        )

        # Serialize the data
        serializer = ConnectionSerializer(connections, many=True)

        return Response({'success': True, 'connections': serializer.data}, status=200)

    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)