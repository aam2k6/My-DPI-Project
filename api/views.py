import base64
import os
import json
from django.conf import settings
from django.contrib.auth import login, authenticate
from django.shortcuts import get_object_or_404
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
    GlobalConnectionTypeTemplatePostSerializer,
    GlobalConnectionTypeTemplateGetSerializer,
    ConnectionTypeRegulationLinkTableGetSerializer,
    ConnectionTypeRegulationLinkTablePostSerializer,
)
from .models import (
    Resource,
    Locker,
    CustomUser,
    Connection,
    ConnectionTerms,
    GlobalConnectionTypeTemplate,
    ConnectionTypeRegulationLinkTable,
)
from .serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import JsonResponse, FileResponse, HttpResponseForbidden
from django.db import models
from rest_framework.parsers import JSONParser
from django.views.decorators.http import require_POST
from django.core.exceptions import ObjectDoesNotExist
from django.utils.dateparse import parse_datetime
from datetime import datetime
from functools import wraps


def is_sys_admin(user: CustomUser):
    return user.user_type == CustomUser.SYS_ADMIN


def is_moderator(user: CustomUser):
    return user.user_type == CustomUser.MODERATOR


def is_user(user: CustomUser):
    return user.user_type == CustomUser.USER


def role_required(user_type):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if request.user.is_authenticated and request.user.user_type == user_type:
                return view_func(request, *args, **kwargs)
            return HttpResponseForbidden()

        return _wrapped_view

    return decorator


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
    - 201: Successfully created a resource(here locker) at the backend.
    - 400: The data sent in the request is invalid, missing or malformed.
    - 405: Request method not allowed (if not GET).
    """
    if request.method == "POST":
        try:
            locker_name = request.POST.get("name")
            description = request.POST.get("description", "")
            if locker_name:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse({"error": "User not authenticated"}, status=401)

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
            return JsonResponse(
                {"success": False, "error": "Name and description are required"},
                status=400,
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    # return render(request, 'add_locker.html')
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
    - connection_name: Name of the connection. -- DONE
    - connection_type_name: Name of the connection type. -- DONE
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

            if request.user.is_authenticated:
                user = request.user
            else:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            if not username:
                locker = Locker.objects.filter(user=user, name=locker_name).first()

                # If the current user does not have the given locker with "locker_name"
                if not locker:
                    return JsonResponse(
                        {
                            "success": False,
                            "message": "No such locker found for this user",
                        },
                        status=404,
                    )

                # Fetch incoming connections
                incoming_connections = Connection.objects.filter(
                    host_user=user, host_locker=locker
                )
                incoming_serializer = ConnectionSerializer(
                    incoming_connections, many=True
                )

                # Fetch outgoing connections
                outgoing_connections = Connection.objects.filter(
                    guest_user=user, guest_locker=locker
                )
                outgoing_serializer = ConnectionSerializer(
                    outgoing_connections, many=True
                )

                connections = {
                    "incoming_connections": incoming_serializer.data,
                    "outgoing_connections": outgoing_serializer.data,
                }

                return JsonResponse(
                    {"success": True, "connections": connections}, status=200
                )

            if username:
                other_user = CustomUser.objects.get(username=username)
                other_locker = Locker.objects.filter(
                    user=other_user, name=locker_name
                ).first()

                # Fetch only the outgoing connections
                outgoing_connections = Connection.objects.filter(
                    host_user=other_user, host_locker=other_locker, guest_user=user
                )
                outgoing_serializer = ConnectionSerializer(
                    outgoing_connections, many=True
                )
                connections = outgoing_serializer.data
                return JsonResponse(
                    {"success": True, "connections": connections}, status=200
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
@api_view(["POST"])
@permission_classes([AllowAny])
def signup_user(request):
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
@permission_classes([IsAuthenticated])
def freeze_locker(request):
    """
    Freeze a locker.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - username: The username of the user.
    - locker_name: The name of the locker.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful freezing of the locker.
    - 404: Specified user or locker not found.
    - 400: Bad request (missing parameters).
    """
    if request.method == "PUT":
        username = request.data.get("username")
        locker_name = request.data.get("locker_name")

        if not username or not locker_name:
            return JsonResponse(
                {"success": False, "error": "Username and locker name are required"},
                status=400,
            )

        try:
            # Check if the requesting user is a sys_admin or moderator
            requesting_user = request.user
            if requesting_user.user_type not in [
                CustomUser.SYS_ADMIN,
                CustomUser.MODERATOR,
            ]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            user = CustomUser.objects.get(username=username)
            locker = Locker.objects.get(name=locker_name, user=user)

            if locker.is_frozen:
                return JsonResponse(
                    {"success": False, "message": "This locker is already frozen"},
                    status=200,
                )
            else:
                locker.is_frozen = True
                locker.save()
                return JsonResponse(
                    {"success": True, "message": "Locker has been frozen successfully"},
                    status=200,
                )

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Locker not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def freeze_connection(request):
    """
    Freeze a connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - username: The username of the user.
    - connection_name: The name of the connection to freeze.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful freezing of the connection.
    - 404: Specified user or connection not found.
    - 400: Bad request (missing parameters).
    - 403: Permission denied.
    """
    if request.method == "PUT":
        username = request.data.get("username")
        connection_name = request.data.get("connection_name")

        if not username or not connection_name:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Username and connection name are required",
                },
                status=400,
            )

        try:
            # Check if the requesting user is a sys_admin or moderator
            requesting_user = request.user
            if requesting_user.user_type not in [
                CustomUser.SYS_ADMIN,
                CustomUser.MODERATOR,
            ]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            user = CustomUser.objects.get(username=username)
            connection = Connection.objects.get(
                connection_name=connection_name, guest_user=user
            )

            if connection.is_frozen:
                return JsonResponse(
                    {"success": False, "message": "This connection is already frozen"},
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

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Connection.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Connection not found for the specified user",
                },
                status=404,
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


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_terms_status(request):
    """
    Request Body:
    {
        "connection_name": "Application No. 4",
        "host_locker_name": "Admissions",
        "guest_locker_name": "Education",
        "host_user_username": "iiitb",
        "guest_user_username": "rohith",
        "terms_value": {
            "Application Number": "; F",
            "Another Field": "documents/rohith_transcripts.pdf; F"
        }
    }
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

        terms_value = connection.terms_value
        for key, value in terms_value.items():
            if value.endswith("; T"):
                count_T += 1
            elif value.endswith("; F"):
                count_F += 1

        return JsonResponse(
            {"success": True, "count_T": count_T, "count_F": count_F}, status=200
        )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def transfer_resource(request):
    if request.method == "POST":

        connection_name = request.POST.get("connection_name")
        host_locker_name = request.POST.get("host_locker_name")
        guest_locker_name = request.POST.get("guest_locker_name")
        host_user_username = request.POST.get("host_user_username")
        guest_user_username = request.POST.get("guest_user_username")

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

        for key, value in connection.terms_value.items():
            if "; T" in value:
                doc_path = value.split("; T")[0].strip()
                if doc_path in connection.resources["Transfer"]:
                    res = Resource.objects.get(i_node_pointer=doc_path)
                    res.owner = host_user
                    res.locker = host_locker
                    res.save()
        return JsonResponse(
            {"success": True, "message": "Transfer successful"}, status=200
        )
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


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


# FEATURE ADDITION


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
    Expected JSON:
    {
        "connection_type_name": value,
        "connection_type_description": value
    }
    """
    data = request.data
    requesting_user: CustomUser = request.user
    if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
        return JsonResponse(
            {
                "message": f"User must be a system admin to access this API endpoint. Current user has {requesting_user.user_type} type."
            }
        )
    try:
        serializer = GlobalConnectionTypeTemplatePostSerializer(data=data)
        if not serializer.is_valid():
            return JsonResponse({"status": 400, "errors": serializer.errors})
        serializer.save()
        return JsonResponse(
            {"status": 201, "message": "Global connection type created successfully."}
        )
    except Exception as e:
        print(e)
        return JsonResponse({"message": "Something went wrong.", "error": e})


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_Global_Connection_Type(request):
    """
    This API is used to get all global connection type templates or a particular one if the ID is mentioned in the request.
    Expected JSON to get a particular global connection type:
    {
        "connection_type_template_name": value
    }
    To get all conection types, no need to send any JSON.
    """
    if request.method == 'GET':
        name = request.data.get("connection_type_template_name")
        print(name)
        if name:
            global_Connection_Type = GlobalConnectionTypeTemplate.objects.get(
                connection_type_name=name
            )
            print(global_Connection_Type)
            if global_Connection_Type:
                serializer = GlobalConnectionTypeTemplateGetSerializer(
                    global_Connection_Type
                )
                terms = ConnectionTerms.objects.filter(
                    global_conn_type=global_Connection_Type
                )
                terms_Serializer = ConnectionTermsSerializer(terms, many=True)
                return JsonResponse(
                    {
                        "global_connection": serializer.data,
                        "terms_attached_to_template": terms_Serializer.data,
                    }
                )
            else:
                return JsonResponse(
                    {
                        "message": f"global connection type template with name = {name} does not exist."
                    }
                )
        # else:
        #     global_Connection_Types = GlobalConnectionTypeTemplate.objects.all()
        #     serializer = GlobalConnectionTypeTemplateGetSerializer(
        #         global_Connection_Types, many=True
        #     )
        #     return JsonResponse({"data": serializer.data})


@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def connect_Global_Connection_Type_Template_And_Connection_Type(request):
    """
    Expected JSON:
    {
        "template_Id": value,
        "type_Id": value
    }
    """
    template_Id = request.POST.get("template_Id")
    type_Id = request.POST.get("type_Id")
    # data = {"connection_Type_Id": "", "connection_Template_Id": ""}
    if template_Id is not None and type_Id is not None:
        template = GlobalConnectionTypeTemplate.objects.filter(
            connection_type_template_id=template_Id
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
                # data["connection_Template_Id"] = template.first()
                # data["connection_Type_Id"] = connection_Type.first()
                link = ConnectionTypeRegulationLinkTable(
                    connection_Type_Id=connection_Type.first(),
                    conection_Template_Id=template.first(),
                )
                try:
                    serializer = ConnectionTypeRegulationLinkTablePostSerializer(
                        data=link
                    )
                    if not serializer.is_valid():
                        return JsonResponse(
                            {"status": 400, "errors": serializer.errors}
                        )
                    serializer.save()
                    return JsonResponse(
                        {
                            "status": 201,
                            "message": f"Connection type with ID = {type_Id} linked successfully to global connection type template with ID = {template_Id}",
                        }
                    )
                except Exception as e:
                    print(e)
                    return JsonResponse(
                        {"message": "Something went wrong.", "error": e}
                    )
    return JsonResponse({
        'message': f'Template ID = {template_Id} and type ID = {type_Id}'
    })


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_All_Connection_Terms_For_Global_Connection_Type_Template(request):
    """
    Expected JSON:
    {
        "template_Id": value
    }
    """
    template_Id = request.GET.get("template_Id", None)
    if template_Id is not None:
        template = GlobalConnectionTypeTemplate.objects.filter(
            connection_type_template_id=template_Id
        )
        if not template.exists():
            return JsonResponse(
                {
                    "message": f"global conection type template with ID = {template_Id} does not exist."
                }
            )
        else:
            terms = ConnectionTerms.objects.filter(global_conn_type=template.first())
            serializer = ConnectionTermsSerializer(data=terms, many=True)
            return JsonResponse({"data": serializer.data})


@csrf_exempt
@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_Connection_Link_Regulation_For_Connection_Type(request):
    """
    Expected JSON:
    {
        "connection_Type_ID": value
    }
    """
    if request.method == "GET":
        conn_type_ID = request.GET.get("connection_Type_ID")
        link_Regulation = ConnectionTypeRegulationLinkTable.objects.filter(
            connection_Type_Id=conn_type_ID
        )
        if link_Regulation.exists():
            serializer = ConnectionTypeRegulationLinkTableGetSerializer(
                data=link_Regulation, many=True
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
def create_Connection_Terms_And_Link_To_Global_Template(request):
    if request.method == "POST":
        requesting_user: CustomUser = request.user
        if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
            return JsonResponse(
                {
                    "message": f"User must be a system admin to hit this API endpoint. Current user has {requesting_user.user_type} type"
                }
            )
        global_conn_type_id = request.POST.get("global_conn_type_id")
        connection_terms_obligations = request.POST.get("obligations")
        connection_terms_permissions = request.POST.get("permissions")

        template = GlobalConnectionTypeTemplate.objects.filter(
            connection_type_template_id=global_conn_type_id
        )
        if not template.exists():
            return JsonResponse(
                {
                    "message": f"Global connection type template with ID = {global_conn_type_id} does not exist."
                }
            )

        for obligation in connection_terms_obligations:
            ConnectionTerms.objects.create(
                global_conn_type=template.first(),
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
                global_conn_type=template.first(),
                modality="permissive",
                description="They can share more data.",
            )
        if can_download_data:
            ConnectionTerms.objects.create(
                global_conn_type=template.first(),
                modality="permissive",
                description="They can download data.",
            )
    return JsonResponse({"message": "Request method is not POST."})
