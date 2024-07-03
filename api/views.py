import os
from django.conf import settings
from .models import Resource, Locker, User, Connection, ConnectionType
from .serializers import ResourceSerializer, ConnectionTypeSerializer,ConnectionSerializer
from .models import Resource, Locker, User, Connection
from .serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db import models
from rest_framework.parsers import JSONParser



@csrf_exempt
def upload_resource(request):
    """
        Creates a resource (file) for a particular locker of the authenticated user.

        Parameters:
        - request: HttpRequest object containing metadata about the request.

        Request Body:
        - name : The name of the resource.
        - locker_id : The ID of the locker.
        - owner_id : The ID of the user who owns the resource.
        - type : Visibility of the resource (Either Public or Private).
        - document : The file that contains the resource.

        Returns:
        - JsonResponse: A JSON object containing the name of the resource, its type and the relative path of the resource or an error message.

        Response Codes:
        - 201: Successfully created a resource(here locker) at the backend.
        - 400: The data sent in the request is invalid, missing or malformed.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == 'POST':
        try:
            document_name = request.POST.get('resource_name')
            locker_id = request.POST.get('locker_id')
            owner_id = request.POST.get('owner_id')
            resource_type = request.POST.get('type')
            file = request.FILES.get('document')

            if not locker_id or not owner_id:
                return JsonResponse({'success': False, 'error': 'Locker ID and Owner ID are required'}, status=400)

            try:
                locker_id = int(locker_id)
                owner_id = int(owner_id)
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Locker ID and Owner ID must be integers'}, status=400)

            locker = Locker.objects.get(pk=locker_id)
            owner = User.objects.get(pk=owner_id)

            if file:
                file_path = os.path.join(settings.MEDIA_ROOT, 'documents', file.name)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                with open(file_path, 'wb+') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)

                resource = Resource.objects.create(
                    document_name=document_name,
                    i_node_pointer=file_path,
                    locker=locker,
                    owner=owner,
                    type=resource_type,
                )
                resource_url = os.path.join(settings.MEDIA_URL, 'documents', file.name)
                return JsonResponse({'success': True, 'document_name': document_name, 'type': resource_type,
                                     'resource_url': resource_url}, status=201)
            else:
                return JsonResponse({'success': False, 'error': 'No file provided'}, status=400)
        except Locker.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Locker not found'}, status=400)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Owner not found'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
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
                user = request.user if request.user.is_authenticated else User.objects.first()
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
                    user = User.objects.get(username=username)  # Fetch user by username
                except User.DoesNotExist:
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
def get_public_resources(request, user_id, locker_id):
    
    """ 
        Retrieve all public resources of the target_user and target_locker the logged user views.

        This view uses GET request to fetch all resources of target_user under a specific target_locker
        whose visibility is marked as "public". Every user should get access to other user's lockers only
        if the current user is authenticated 

        Parameters:
            - request: HttpRequest object containing metadata about the request.

        Query Parameters:
            - user_id : user_id of the target_user that the authenticated user is viewing
            - locker_id : locker_id of the viewed user's locker
        
        Returns:
            - JsonResponse: A JSON object containing a list of lockers or an error message.
        
        Response Codes:
            - 200: Successful retrieval of public resources.
            - 400: Speciifed user or locker not found.
            - 404: No public resources found.
            - 405: Request method not allowed (if not GET).    
    """
    
    if request.method == 'GET':
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'User not found'}, status=400)

        try:
            locker = Locker.objects.get(pk=locker_id, owner=user)
        except Locker.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Locker not found or does not belong to the user'}, status=400)

        public_resources = Resource.objects.filter(owner=user, visibility='public', locker=locker)
        if not public_resources.exists():
            return JsonResponse({'success': False, 'message': 'No public resources found'}, status=404)

        serializer = ResourceSerializer(public_resources, many=True)
        return JsonResponse({'success': True, 'resources': serializer.data}, status=200)

    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=405)
    
@csrf_exempt
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

            user_connection_type = connection_types.filter(owner=user)

            if not user_connection_type.exists():
                return JsonResponse({'success': False, 'message': 'No connection types'}, status=404)

            serializer = ConnectionTypeSerializer(user_connection_type, many=True)
            return JsonResponse({'success': True, 'connection_types': serializer.data}, status=200)

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
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
        users = User.objects.all()
        if not users.exists():
            return JsonResponse({'success': False, 'message': 'No Users are present.'}, status=404)

        serializer = UserSerializer(users, many=True)
        return JsonResponse({'success': True, 'users': serializer.data}, status=200)
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def get_other_connections(request, target_user_id, target_locker_id):

    """ 
        Retrieve all the connection types of target_locker of the target_user that the authenticated user
        does not have a connection with.

        This view uses GET request to fetch all connection types of the current user 
        (refering to the target_user_id and target_locker_id). Further, the values of target_user/source_user 
        and target_locker/source_locker is compared with target_user_id and target_locker_id, each. If a match is found, 
        that connection gets fetched.

        Parameters:
           - request: HttpRequest object containing metadata about the request.

        Query Parameters:
            - target_user_id
            - target_locker_id

       Returns:
           - JsonResponse: A JSON object containing a list of all users or an error message.

       Response Codes:
           - 200: Successful connetion_types of users.
           - 400: No connectiont types are found.
           - 405: Request method not allowed (if not GET).
    """

    if request.method == 'GET':
        current_user = request.user
        try:
            target_user = User.objects.get(pk=target_user_id)
            target_locker = User.objects.get(pk=target_locker_id)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message':'User not found' }, status=400)
        except Locker.DoesNotExist:
            return JsonResponse({'success':False , 'message':'Locker not found'}, status=400)
        
        all_connection_types = ConnectionType.objects.filter(owner_user=target_user)

        existing_connections = Connection.objects.filter(
            (models.Q(source_user=current_user) | models.Q(target_user=current_user)) &
            (models.Q(source_locker=target_locker) | models.Q(target_locker=target_locker)
        ))

        existing_connection_type_ids = existing_connections.values_list('connection_type_id', flat=True)

        available_connection_types = all_connection_types.exclude(connection_type_id__in=existing_connection_type_ids)

        if not available_connection_types.exists():
            return JsonResponse({'success': False, 'message': 'No available connection types found'}, status=400)

        # Serialize the connection types
        serializer = ConnectionTypeSerializer(available_connection_types, many=True)

        # Return a JSON response with status
        return JsonResponse({'success': True, 'connection_types': serializer.data}, status=200)

    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def Get_connectiontype_byuser_bylocker(request):
    """
    Retrieve connection types by locker and user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Query Parameters:
    - username: The username of the user.
    - locker_id: The ID of the locker.

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
        locker_id = request.GET.get('locker_id')

        if not username or not locker_id:
            return JsonResponse({'success': False, 'error': 'Username and Locker ID are required'}, status=400)

        try:
            user = User.objects.get(username=username)
            locker = Locker.objects.get(locker_id=locker_id, user=user)
            connection_types = ConnectionType.objects.filter(owner_user=user, owner_locker=locker)

            if not connection_types.exists():
                return JsonResponse({'success': False, 'message': 'No connection types found for this user and locker'}, status=404)

            serializer = ConnectionTypeSerializer(connection_types, many=True)
            return JsonResponse({'success': True, 'connection_types': serializer.data}, status=200)

        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
        except Locker.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Locker not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def create_new_connection(request):
    """
    Create a new connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_id: The ID of the connection type.
    - source_locker: The ID of the source locker.
    - target_locker: The ID of the target locker.
    - source_user: The ID of the source user.
    - target_user: The ID of the target user.
    - connection_description: The description of the connection.
    - requester_consent: Boolean indicating if the requester has consented.
    - revoke_source: Boolean indicating if the source can revoke.
    - revoke_target: Boolean indicating if the target can revoke.

    Returns:
    - JsonResponse: A JSON object containing the created connection or an error message.

    Response Codes:
    - 201: Successful creation of the connection.
    - 400: Bad request (if data is invalid).
    - 405: Request method not allowed (if not POST).
    """
    if request.method == 'POST':
        data = request.POST  
        serializer = ConnectionSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse({'success': True, 'connection': serializer.data}, status=201)
        return JsonResponse({'success': False, 'error': serializer.errors}, status=400)
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)
