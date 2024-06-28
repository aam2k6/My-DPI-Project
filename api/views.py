from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.renderers import TemplateHTMLRenderer
from django.db import transaction
from rest_framework.views import APIView
import os
from django.db.models import Q
#import requests
import json
#from django.views import View
#from django.urls import reverse
from django.conf import settings
from .models import Resource, Locker, User, Connection
from .serializers import ResourceSerializer, LockerSerializer
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
#from django.core.serializers import serialize
#from django.views.generic import TemplateView
#from django.core.serializers.json import DjangoJSONEncoder
#from django.utils.decorators import method_decorator

@csrf_exempt
def upload_resource(request):
    if request.method == 'POST':
        try:
            document_name = request.POST.get('resource_name')
            locker_id = request.POST.get('locker_id')
            owner_id = request.POST.get('owner_id')
            resource_type = request.POST.get('type')
            file = request.FILES.get('document')

            if not locker_id or not owner_id:
                return JsonResponse({'success': False, 'error': 'Locker ID and Owner ID are required'})

            # Validate locker_id and owner_id are integers
            try:
                locker_id = int(locker_id)
                owner_id = int(owner_id)
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Locker ID and Owner ID must be integers'})

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
                return JsonResponse({'success': True, 'document_name': document_name, 'type': resource_type, 'resource_url': resource_url})
            else:
                return JsonResponse({'success': False, 'error': 'No file provided'})
        except Locker.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Locker not found'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Owner not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})

class ResourceListCreate(generics.ListCreateAPIView):
    renderer_classes = [TemplateHTMLRenderer]
    template_name = 'createresource.html'
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer()
        return Response({'serializer': serializer})
    
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            document_name = serializer.validated_data.get('document_name')
            locker = serializer.validated_data.get('locker')
            version = serializer.validated_data.get('version')
            connections = serializer.validated_data.get('connections')
            owner = serializer.validated_data.get('owner')
            resource_type = serializer.validated_data.get('type')
            file = request.FILES.get('document')

            if file:
                file_path = os.path.join(settings.MEDIA_ROOT, 'documents', file.name)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                with open(file_path, 'wb+') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)

                Resource.objects.create(
                    document_name=document_name,
                    i_node_pointer=file_path,
                    locker=locker,
                    version=version,
                    connections=connections,
                    owner=owner,
                    type=resource_type,
                )

                return render(request, self.template_name, {'success': 'Resource Uploaded'})
            else:
                return render(request, self.template_name, {'error': 'No file provided'})

        return render(request, self.template_name, {'serializer': serializer})

class LockerListCreate(generics.ListCreateAPIView):
    queryset = Locker.objects.all()
    serializer_class = LockerSerializer

class ShareResources(generics.RetrieveUpdateDestroyAPIView):
    renderer_classes = [TemplateHTMLRenderer]
    template_name = 'shareresource.html'
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer

    @transaction.atomic
    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        resource_name = request.POST.get('resource_name')
        new_owner_username = request.POST.get('new_owner')

        print(f"POST data received - resource_name: {resource_name}, new_owner_username: {new_owner_username}")

        if not resource_name or not new_owner_username:
            return render(request, self.template_name, {'error': 'Incomplete information'})

        try: 
            resource = Resource.objects.get(document_name=resource_name)
            print(f"Found resource: {resource}")
            print(f"Current owner of resource '{resource_name}': {resource.owner}")
        except Resource.DoesNotExist:
            return render(request, self.template_name, {'error': 'Resource not found'})

        try:
            new_owner = User.objects.get(username=new_owner_username)
        except User.DoesNotExist:
            return render(request, self.template_name, {'error': 'Destination User not found'})

        print(f"resource_name: {resource_name}, new_owner_username: {new_owner_username}")

        resource.owner = new_owner
        resource.save()
        print(f"Resource owner updated to: {resource.owner}")

        return render(request, self.template_name, {'success': 'Resource Shared'})

@csrf_exempt
def add_locker(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            locker_name = data.get('name')
            description = data.get('description')
            if locker_name and description:
                user = request.user if request.user.is_authenticated else User.objects.first()
                locker = Locker.objects.create(name=locker_name, description=description, user=user)
                return JsonResponse({'success': True, 'name': locker.name, 'description': locker.description})
            return JsonResponse({'success': False, 'error': 'Name and description are required'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return render(request, 'add_locker.html')

       
def display_home(request):
    user = request.user if request.user.is_authenticated else User.objects.first()
    lockers = Locker.objects.filter(user=user)
    return render(request, 'page1.html', {'lockers': lockers})

def sharing_page(request):
    user = request.user if request.user.is_authenticated else User.objects.first()
    locker = Locker.objects.filter(user=user).first()
    # return render(request, 'sharingpage(page2).html', {'locker': locker, 'user': user})
    return render(request, 'sharingpage.html', {'locker': locker, 'user': user})
class DpiDirectoryView(APIView):
    def get(self, request):
        query = request.GET.get('search', '')
        if query:
            users = User.objects.filter(Q(username__icontains=query))
        else:
            users = User.objects.all()

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return render(request, 'partials/user_list.html', {'users': users})
        else:
            return render(request, 'page3.html', {'users': users})

# def iiitb_locker(request):
#     def connection_list_view(request):
#     connections = Connection.objects.all()
#     return render(request, 'page4.html', {'connections': connections})

# def get_user_connection(request):
#     connections = Connection.objects.all()
#     return render(request, 'sharingpage(page2).html', {'connections': connections})\

