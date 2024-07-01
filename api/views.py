import os
from django.conf import settings
from .models import Resource, Locker, User, Connection, ConnectionType
from .serializers import ResourceSerializer, ConnectionTypeSerializer
from .models import Resource, Locker, User, Connection
from .serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse


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
def get_public_resources(request, user_id):
    if request.method == 'GET':
        try:
            user = User.objects.get(pk=user_id)

        except user.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'User not found'}, status=400)

        public_resources = Resource.objects.filter(owner=user, visibility='public')
        if not public_resources.exists():
            return JsonResponse({'success': False, 'message': 'No public resources found'}, status=400)

        serializer = ResourceSerializer(public_resources, many=True)
        return JsonResponse({'success': True, 'resources': serializer.data}, status=200)

    return JsonResponse({'success': False, 'error': 'Invalid request'}, stutus=405)

@csrf_exempt
def get_connection_type(request):
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
