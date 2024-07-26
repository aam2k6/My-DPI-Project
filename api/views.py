import base64
import os
import json
from django.conf import settings
from django.contrib.auth import login, authenticate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import ResourceSerializer, ConnectionTypeSerializer, ConnectionSerializer, ConnectionType, \
    ConnectionTermsSerializer
from .models import Resource, Locker, CustomUser, Connection, ConnectionTerms
from .serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import JsonResponse, FileResponse
from django.db import models
from rest_framework.parsers import JSONParser
from django.views.decorators.http import require_POST
from django.core.exceptions import ObjectDoesNotExist
from django.utils.dateparse import parse_datetime


@csrf_exempt
@api_view(['POST'])
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
    if request.method == 'POST':
        try:
            document_name = request.POST.get('resource_name')
            locker_name = request.POST.get('locker_name')
            resource_type = request.POST.get('type')
            file = request.FILES.get('document')

            if request.user.is_authenticated:
                user = request.user
            else:
                return JsonResponse({'error': 'User not authenticated'}, status=401)

            locker = Locker.objects.get(user=user, name=locker_name)

            if file:
                relative_path = os.path.join('documents', file.name)
                file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                with open(file_path, 'wb+') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)

                resource = Resource.objects.create(document_name=document_name, i_node_pointer=relative_path,
                    locker=locker, owner=user, type=resource_type)
                resource_url = os.path.join(settings.MEDIA_URL, relative_path)
                return JsonResponse({'success': True, 'document_name': document_name, 'type': resource_type,
                    'resource_url': resource_url}, status=201)
            else:
                return JsonResponse({'success': False, 'error': 'No file provided'}, status=400)
        except Locker.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Locker not found'}, status=400)
        except CustomUser.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Owner not found'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@api_view(['GET'])
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
            response = FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))
            return response
        else:
            print(f"File not found at: {file_path}")
            return JsonResponse({'error': 'File not found.'}, status=404)
    except Exception as e:
        print(f"Error: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@api_view(['POST'])
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
    if request.method == 'POST':
        try:
            locker_name = request.POST.get('name')
            description = request.POST.get('description', '')
            if locker_name:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse({'error': 'User not authenticated'}, status=401)

                locker = Locker.objects.create(name=locker_name, description=description, user=user)
                return JsonResponse(
                    {'success': True, 'id': locker.locker_id, 'name': locker.name, 'description': locker.description},
                    status=201)
            return JsonResponse({'success': False, 'error': 'Name and description are required'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    # return render(request, 'add_locker.html')
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['GET'])
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
    if request.method == 'GET':
        try:
            username = request.GET.get('username')
            if username:
                try:
                    user = CustomUser.objects.get(username=username)  # Fetch user by username
                except CustomUser.DoesNotExist:
                    return JsonResponse({'error': 'User not found'}, status=404)
            else:
                if request.user.is_authenticated:
                    user = request.user  # Use the authenticated user
                else:
                    return JsonResponse({'error': 'User not authenticated'}, status=401)
            lockers = Locker.objects.filter(user=user)

            # If the current user does not have any existing lockers.
            if not lockers.exists():
                return JsonResponse({'success': False, 'message': 'No lockers found for this user'}, status=404)

            serializer = LockerSerializer(lockers, many=True)
            return JsonResponse({'success': True, 'lockers': serializer.data}, status=200)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['GET'])
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

    if request.method == 'GET':
        try:
            username = request.GET.get('username')
            locker_name = request.GET.get('locker_name')
            if not username:
                return JsonResponse({'success': False, 'error': 'Username is required'}, status=400)
            if not locker_name:
                return JsonResponse({'success': False, 'error': 'Locker Name is required'}, status=400)

            try:
                random_user = CustomUser.objects.get(username=username)
            except CustomUser.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'User not found'}, status=404)

            try:
                random_user_locker = Locker.objects.get(user=random_user, name=locker_name)
            except Locker.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Locker not found for the given username'}, status=404)

            public_resources = Resource.objects.filter(owner=random_user, type='public', locker=random_user_locker)
            if not public_resources.exists():
                return JsonResponse({'success': False, 'message': 'No public resources found'}, status=404)
            serializer = ResourceSerializer(public_resources, many=True)
            return JsonResponse({'success': True, 'resources': serializer.data}, status=200)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=405)


@csrf_exempt
@api_view(['GET'])
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

    if request.method == 'GET':
        try:
            user = request.user
            connection_types = ConnectionType.objects.all()

            user_connection_type = connection_types.filter(owner_user=user)

            if not user_connection_type.exists():
                return JsonResponse({'success': False, 'message': 'No connection types'}, status=404)

            serializer = ConnectionTypeSerializer(user_connection_type, many=True)
            return JsonResponse({'success': True, 'connection_types': serializer.data}, status=200)

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['GET'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def dpi_directory(request):
    """"
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
    if request.method == 'GET':
        users = CustomUser.objects.all()
        if not users.exists():
            return JsonResponse({'success': False, 'message': 'No Users are present.'}, status=404)

        serializer = UserSerializer(users, many=True)
        return JsonResponse({'success': True, 'users': serializer.data}, status=200)
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['GET'])
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

    if request.method == 'GET':

        if request.user.is_authenticated:
            current_user = request.user  # Use the authenticated user
        else:
            return JsonResponse({'error': 'User not authenticated'}, status=401)

        try:
            guest_username = request.GET.get('guest_username')
            guest_locker_name = request.GET.get('guest_locker_name')
            guest_user = CustomUser.objects.get(username=guest_username)  # Fetch user by username
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)  # Fetch locker by lockername
        except CustomUser.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'User not found'}, status=404)
        except Locker.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Locker not found for the specified username'},
                                status=404)

        # This is for Rohith viewing IIITB's Transcripts Locker. Fetch all the connection types of
        # IIITB's Transcripts Locker. Fetch, these connection types' connection ids.

        connection_types_iiitb_transcripts_ids = ConnectionType.objects.filter(owner_user=guest_user,
                                                                               owner_locker=guest_locker).values_list(
            'connection_type_id', flat=True)

        if not connection_types_iiitb_transcripts_ids:
            return JsonResponse({'success': False, 'message': 'No connection types found'}, status=404)

        # Now fetch, all the connections where Rohith is either the host_user or guest_user. (Or more formally, it
        # would be the current authenticated user)

        rohith_connections = Connection.objects.filter(
            models.Q(host_user=current_user) | models.Q(guest_user=current_user))

        rohith_connection_type_ids = rohith_connections.values_list('connection_type_id', flat=True).distinct()

        # Converting QuerySets to sets, for finding easy set difference.
        rohith_connection_type_ids_set = set(rohith_connection_type_ids)
        connection_types_iiitb_transcripts_set = set(connection_types_iiitb_transcripts_ids)

        # So finally, the list of connection type ids that Rohith has not yet initiated a connection to, with
        # IIITB's Transcripts locker are :
        difference_ids_set = connection_types_iiitb_transcripts_set - rohith_connection_type_ids_set

        if not difference_ids_set:
            return JsonResponse({'success': False, 'message': 'No other connection types to connect to.'}, status=404)

        difference_connection_types = ConnectionType.objects.filter(connection_type_id__in=difference_ids_set)
        serializer = ConnectionTypeSerializer(difference_connection_types, many=True)

        return JsonResponse({'success': True, 'connection_types': serializer.data}, status=200)
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['GET'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_connectiontype_by_user_by_locker(request):
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
    if request.method == 'GET':
        username = request.GET.get('username')
        locker_name = request.GET.get('locker_name')

        if not locker_name:
            return JsonResponse({'success': False, 'error': 'Locker name is required'}, status=400)

        try:
            if username:
                try:
                    user = CustomUser.objects.get(username=username)
                except CustomUser.DoesNotExist:
                    return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
            else:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse({'success': False, 'error': 'User not authenticated'}, status=401)

            try:
                locker = Locker.objects.get(name=locker_name, user=user)
            except Locker.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Locker not found'}, status=404)

            connection_types = ConnectionType.objects.filter(owner_user=user, owner_locker=locker)

            if not connection_types.exists():
                return JsonResponse({'success': False, 'message': 'No connection types found for this user and locker'},
                                    status=404)

            serializer = ConnectionTypeSerializer(connection_types, many=True)
            return JsonResponse({'success': True, 'connection_types': serializer.data}, status=200)

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def create_new_connection(request):
    """
    Create a new connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_id: The ID of the connection type.
    - host_locker: The name of the source locker.
    - guest_locker: The name of the target locker.
    - host_user: The username of the source user.
    - guest_user: The username of the target user.
    - connection_description: The description of the connection.
    - requester_consent: Boolean indicating if the requester has consented.
    - revoke_host: Boolean indicating if the source can revoke.
    - revoke_guest: Boolean indicating if the target can revoke.

    Returns:
    - JsonResponse: A JSON object containing the created connection or an error message.

    Response Codes:
    - 201: Successful creation of the connection.
    - 400: Bad request (if data is invalid).
    - 405: Request method not allowed (if not POST).
    """
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'success': False, 'error': 'User not authenticated'}, status=401)

        data = request.POST.copy()

        connection_type_id = data.get('connection_type_id')
        host_locker_name = data.get('host_locker')
        guest_locker_name = data.get('guest_locker')
        host_user_username = data.get('host_user')
        guest_user_username = data.get('guest_user')

        if not all([connection_type_id, host_locker_name, guest_locker_name, host_user_username, guest_user_username]):
            return JsonResponse({'success': False, 'error': 'All fields are required'}, status=400)

        try:
            connection_type = ConnectionType.objects.get(pk=connection_type_id)
            host_user = CustomUser.objects.get(username=host_user_username)
            guest_user = CustomUser.objects.get(username=guest_user_username)

            host_locker = Locker.objects.filter(name=host_locker_name, user=host_user)
            guest_locker = Locker.objects.filter(name=guest_locker_name, user=guest_user)

            if host_locker.count() != 1:
                return JsonResponse({'success': False,
                                     'error': 'Host locker not found or multiple lockers found with the same name for the host user'},
                                    status=400)
            if guest_locker.count() != 1:
                return JsonResponse({'success': False,
                                     'error': 'Guest locker not found or multiple lockers found with the same name for the guest user'},
                                    status=400)

            host_locker = host_locker.first()
            guest_locker = guest_locker.first()

        except ConnectionType.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Connection type not found'}, status=400)
        except CustomUser.DoesNotExist as e:
            return JsonResponse({'success': False, 'error': f'User not found: {e}'}, status=400)

        connection = Connection(connection_name=data.get('connection_name'), connection_type_id=connection_type,
            host_locker=host_locker, guest_locker=guest_locker, host_user=host_user, guest_user=guest_user,
            connection_description=data.get('connection_description', ''),
            requester_consent=data.get('requester_consent', 'false').lower() == 'true',
            revoke_host=data.get('revoke_host', 'false').lower() == 'true',
            revoke_guest=data.get('revoke_guest', 'false').lower() == 'true')

        try:
            connection.save()
            return JsonResponse({'success': True,
                                 'connection': {'id': connection.connection_id, 'name': connection.connection_name,
                                     'description': connection.connection_description,
                                     'host_user': connection.host_user.username,
                                     'guest_user': connection.guest_user.username,
                                     'host_locker': connection.host_locker.name,
                                     'guest_locker': connection.guest_locker.name,
                                     'requester_consent': connection.requester_consent,
                                     'revoke_host': connection.revoke_host, 'revoke_guest': connection.revoke_guest,
                                     'created_time': connection.created_time,
                                     'validity_time': connection.validity_time}}, status=201)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    if request.method == 'POST':

        auth = request.META['HTTP_AUTHORIZATION'].split()
        auth_decoded = base64.b64decode(auth[1]).decode('utf-8')
        username, password = auth_decoded.split(':')

        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)  # Log the user in
            user_serializer = UserSerializer(user)
            return Response({'success': True, 'user': user_serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['GET'])
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

    Returns:
        - JsonResponse: A JSON object containing a list of terms or an error message.

    Response Codes:
        - 200: Successful retrieval of terms.
        - 401: User is not authenticated.
        - 404: Specified user not found or no terms found.
        - 405: Request method not allowed (if not GET).
        - 400: Bad request (missing parameters or other errors).
    """
    if request.method == 'GET':
        username = request.user
        locker_name = request.data["locker_name"]
        terms_id = request.GET.get('terms_id')
        print(locker_name)
        try:
            if username:
                try:
                    user = CustomUser.objects.get(username=username)
                    
                except CustomUser.DoesNotExist:
                    return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
            else:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse({'success': False, 'error': 'User not authenticated'}, status=401)
                
            locker = Locker.objects.filter(name = locker_name, user_id = user.user_id)
            
           
            if locker:
                connection_types = ConnectionType.objects.filter(owner_user=user.user_id, owner_locker_id = locker[0].locker_id)
            else:
                connection_types = []

            if terms_id:
                terms = ConnectionTerms.objects.filter(conn_type__in=connection_types, terms_id=terms_id)
            else:
                terms = ConnectionTerms.objects.filter(conn_type__in=connection_types)

            if not terms.exists():
                return JsonResponse({'success': False, 'message': 'No terms found for this user'}, status=404)

            serializer = ConnectionTermsSerializer(terms, many=True)
            filtered_data = [{'description': term['description'], 'modality': term['modality'],
                'data_element_name': term['data_element_name'], 'data_type': term['data_type'],
                'sharing_type': term['sharing_type']} for term in serializer.data]
            return JsonResponse({'success': True, 'terms': filtered_data}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def give_consent(request):
    """
    Give consent for a connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_id: The ID of the connection.
    - consent: Boolean indicating the consent status.

    Returns:
    - JsonResponse: A JSON object containing a success message or an error message.

    Response Codes:
    - 200: Successful update of the consent status.
    - 400: Bad request (if data is invalid or connection not found).
    - 405: Request method not allowed (if not POST).
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'User not authenticated'}, status=401)

    connection_id = request.POST.get('connection_id')
    consent = request.POST.get('consent')

    if connection_id is None or consent is None:
        return JsonResponse({'success': False, 'error': 'Connection ID and consent status are required'}, status=400)

    try:
        connection = Connection.objects.get(connection_id=connection_id)
        connection.requester_consent = consent.lower() in ['true', '1', 't', 'y', 'yes']
        connection.save()
        return JsonResponse({'success': True, 'message': 'Consent status updated successfully'}, status=200)
    except Connection.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Connection not found'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAuthenticated])
def revoke_consent(request):
    """
    Revoke consent for a connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Body Parameters:
    - connection_id: The ID of the connection.
    - revoke_host: Boolean indicating if the source user is revoking consent.
    - revoke_guest: Boolean indicating if the target user is revoking consent.

    Returns:
    - JsonResponse: A JSON object indicating the success or failure of the operation.

    Response Codes:
    - 200: Successful revocation of consent.
    - 400: Bad request (if data is invalid).
    - 404: Connection not found.
    - 405: Request method not allowed (if not POST).
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'User not authenticated'}, status=401)

    try:
        connection_id = request.POST.get('connection_id')
        revoke_host = request.POST.get('revoke_host', 'false').lower() == 'true'
        revoke_guest = request.POST.get('revoke_guest', 'false').lower() == 'true'

        if not connection_id:
            return JsonResponse({'success': False, 'error': 'Connection ID is required'}, status=400)

        try:
            connection = Connection.objects.get(connection_id=connection_id)
        except ObjectDoesNotExist:
            return JsonResponse({'success': False, 'error': 'Connection not found'}, status=404)

        if revoke_host:
            connection.revoke_host = True

        if revoke_guest:
            connection.revoke_guest = True

        connection.save()

        return JsonResponse({'success': True, 'message': 'Consent revoked successfully'}, status=200)

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
@api_view(['GET'])
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
    if request.method == 'GET':
        try:
            locker_name = request.GET.get('locker_name')
            username = request.GET.get('username')

            if request.user.is_authenticated:
                user = request.user
            else:
                return JsonResponse({'error': 'User not authenticated'}, status=401)

            if not username:
                locker = Locker.objects.filter(user=user, name=locker_name).first()

                # If the current user does not have the given locker with "locker_name"
                if not locker:
                    return JsonResponse({'success': False, 'message': 'No such locker found for this user'}, status=404)

                # Fetch incoming connections
                incoming_connections = Connection.objects.filter(host_user=user, host_locker=locker)
                incoming_serializer = ConnectionSerializer(incoming_connections, many=True)

                # Fetch outgoing connections
                outgoing_connections = Connection.objects.filter(guest_user=user, guest_locker=locker)
                outgoing_serializer = ConnectionSerializer(outgoing_connections, many=True)

                connections = {'incoming_connections': incoming_serializer.data,
                               'outgoing_connections': outgoing_serializer.data}

                return JsonResponse({'success': True, 'connections': connections}, status=200)

            if username:
                other_user = CustomUser.objects.get(username=username)
                other_locker = Locker.objects.filter(user=other_user, name=locker_name).first()

                # Fetch only the outgoing connections
                outgoing_connections = Connection.objects.filter(host_user=other_user, host_locker=other_locker,
                                                                 guest_user=user)
                outgoing_serializer = ConnectionSerializer(outgoing_connections, many=True)
                connections = outgoing_serializer.data
                return JsonResponse({'success': True, 'connections': connections}, status=200)

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['GET'])
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
    if request.method == 'GET':
        try:
            locker_name = request.GET.get('locker_name')
            if request.user.is_authenticated:
                user = request.user
            else:
                return JsonResponse({'error': 'User not authenticated'}, status=401)

            locker = Locker.objects.filter(user=user, name=locker_name).first()

            # If the current user does not have the given locker with "locker_name"
            if not locker:
                return JsonResponse({'success': False, 'message': 'No such locker found for this user'}, status=404)

            resources = Resource.objects.filter(locker=locker)
            serializer = ResourceSerializer(resources, many=True)

            return JsonResponse({'success': True, 'resources': serializer.data}, status=200)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def signup_user(request):
    if request.method == 'POST':
        try:
            username = request.POST.get('username')
            description = request.POST.get('description')
            password = request.POST.get('password')
            if not username:
                return JsonResponse({'success': False, 'error': 'Username is required'}, status=400)
            if not description:
                return JsonResponse({'success': False, 'error': 'Description is required'}, status=400)
            if not password:
                return JsonResponse({'success': False, 'error': 'Password is required'}, status=400)

                # Check if username already exists
            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse({'success': False, 'error': 'Username already taken'}, status=400)

            new_user = CustomUser(description=description, username=username)
            new_user.set_password(password)
            new_user.save()

            return JsonResponse({'success': True, 'id': new_user.user_id, 'username': new_user.username,
                                 'description': new_user.description}, status=201)

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['PATCH'])
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
    if request.method == 'PATCH':
        try:
            connection_type = ConnectionType.objects.get(pk=connection_type_id)
        except ConnectionType.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'ConnectionType not found.'}, status=404)

        data = json.loads(request.body)
        serializer = ConnectionTypeSerializer(connection_type, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse({'success': True, 'connection_type': serializer.data}, status=200)

        return JsonResponse({'success': False, 'errors': serializer.errors}, status=400)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['PATCH'])
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
    if request.method == 'PATCH':
        try:
            locker = Locker.objects.get(pk=locker_id)
        except Locker.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Locker not found.'}, status=404)

        data = json.loads(request.body)
        serializer = LockerSerializer(locker, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse({'success': True, 'locker': serializer.data}, status=200)

        return JsonResponse({'success': False, 'errors': serializer.errors}, status=400)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['PUT'])
@permission_classes([AllowAny])  # Allow access without authentication
def freeze_locker(request):
    """
    Freeze lockers.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - locker_name: The name of the locker.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful freezing of the lockers.
    - 404: Specified locker not found.
    - 400: Bad request (missing parameters).
    """
    if request.method == 'PUT':
        locker_name = request.data.get('locker_name')

        if not locker_name:
            return JsonResponse({'success': False, 'error': 'Locker name is required'}, status=400)

        try:
            lockers = Locker.objects.filter(name=locker_name)

            if not lockers.exists():
                return JsonResponse({'success': False, 'error': 'Locker not found'}, status=404)

            frozen_lockers = 0
            already_frozen_lockers = 0

            for locker in lockers:
                if locker.is_frozen:
                    already_frozen_lockers += 1
                else:
                    locker.is_frozen = True
                    locker.save()
                    frozen_lockers += 1

            message = f"Lockers frozen: {frozen_lockers}. Already frozen: {already_frozen_lockers}."

            return JsonResponse({'success': True, 'message': message}, status=200)

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['PUT'])
@permission_classes([AllowAny])  # Allow access without authentication
def freeze_connection(request):
    """
    Freeze connections.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - connection_name: The name of the connection.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful freezing of the connections.
    - 404: Specified connection not found.
    - 400: Bad request (missing parameters).
    """
    if request.method == 'PUT':
        connection_name = request.data.get('connection_name')

        if not connection_name:
            return JsonResponse({'success': False, 'error': 'Connection name is required'}, status=400)

        try:
            connections = Connection.objects.filter(connection_name=connection_name)

            if not connections.exists():
                return JsonResponse({'success': False, 'error': 'Connection not found'}, status=404)

            frozen_count = 0
            already_frozen_count = 0

            for connection in connections:
                if connection.is_frozen:
                    already_frozen_count += 1
                else:
                    connection.is_frozen = True
                    connection.save()
                    frozen_count += 1

            message = f'{frozen_count} connections frozen, {already_frozen_count} already frozen.'

            return JsonResponse({'success': True, 'message': message}, status=200)

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)


@csrf_exempt
@api_view(['POST'])
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
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

    if request.user.is_authenticated:
        current_user = request.user  # Use the authenticated user
    else:
        return JsonResponse({'error': 'User not authenticated'}, status=401)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(data={'error': 'Invalid JSON'}, status=400)

    connection_type_name = data.get('connectionName')
    connection_description = data.get('connectionDescription')
    owner_locker_name = data.get('lockerName')
    validity_time_str = data.get('validity')

    connection_terms_obligations = data.get('obligations')
    connection_terms_permissions = data.get('permissions')

    if not all([connection_type_name, owner_locker_name, validity_time_str, connection_description]):
        return JsonResponse({'success': False, 'error': 'All fields are required'}, status=400)

    try:
        owner_user = CustomUser.objects.get(username=current_user)
        owner_locker = Locker.objects.filter(name=owner_locker_name, user=owner_user).first()
        if not owner_locker:
            return JsonResponse({'success': False, 'error': 'Owner locker not found'}, status=404)

        validity_time = parse_datetime(validity_time_str)
        if validity_time is None:
            raise ValueError("Invalid date format")

        new_connection_type = ConnectionType(connection_type_name=connection_type_name,
                                             connection_description=connection_description, owner_user=owner_user,
                                             owner_locker=owner_locker, validity_time=validity_time)
        new_connection_type.save()

        for obligation in connection_terms_obligations:
            ConnectionTerms.objects.create(
                conn_type=new_connection_type,
                modality='obligatory',
                data_element_name=obligation['labelName'],
                data_type=obligation['typeOfAction'],
                sharing_type=obligation['typeOfSharing'],
                description=obligation['labelDescription'],
                host_permissions=obligation['hostPermissions']
            )

        can_share_more_data = connection_terms_permissions['canShareMoreData']
        can_download_data = connection_terms_permissions['canDownloadData']

        if can_share_more_data:
            ConnectionTerms.objects.create(conn_type=new_connection_type,
                                           modality='permissive',
                                           description='They can share more data.')
        if can_download_data:
            ConnectionTerms.objects.create(conn_type=new_connection_type,
                                           modality='permissive',
                                           description='They can download data.')

        return JsonResponse({'success': True, 'connection_type_message': 'Connection Type successfully created',
                             'connection_terms_message': 'Connection Terms successfully created'}, status=201)

    except CustomUser.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Owner user not found'}, status=404)
    except ValueError as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)