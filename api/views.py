from django.shortcuts import render
from rest_framework import generics, request, status
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
from .serializers import ResourceSerializer, LockerSerializer, ConnectionSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
#from django.core.serializers import serialize
#from django.views.generic import TemplateView
#from django.core.serializers.json import DjangoJSONEncoder
#from django.utils.decorators import method_decorator

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
            type = serializer.validated_data.get('type')
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
                    type=type,
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
    #No lookup_field since it'll be based on the primary key which is default

    @transaction.atomic
    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        resource_name = request.POST.get('resource_name')
        new_owner_username = request.POST.get('new_owner')
        #new_owner_locker = request.POST.get('new_locker') #take from user

        print(f"POST data received - resource_name: {resource_name}, new_owner_username: {new_owner_username}")

        if not resource_name and not new_owner_username:
            return render(request, self.template_name, {'error':'Incomplete information'})
            
        try: 
            resource = Resource.objects.get(document_name = resource_name)
            #old_owner = resource.owner
            print(f"Found resource: {resource}")
            print(f"Current owner of resource '{resource_name}': {resource.owner}")
        except Resource.DoesNotExist:
            return render(request, self.template_name, {'error':'Resource not found'})
            
        try:
            new_owner = User.objects.get(username = new_owner_username)
        except User.DoesNotExist:
            return render(request, self.template_name, {'error':'Destination User not found'})

        print(f"resource_name: {resource_name}, new_owner_username: {new_owner_username}")

        resource.owner = new_owner
        #resource.type = "Shared"
        resource.save()
        print(f"Resource owner updated to: {resource.owner}")

        return render(request, self.template_name, {'Success':'Resource Uploaded'})
    
@csrf_exempt
def add_locker(request):
    print("add_locker view called")
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            locker_name = data.get('name')
            print(f"Received locker_name: {locker_name}")
            if locker_name:
                user = request.user if request.user.is_authenticated else User.objects.first()
                locker = Locker.objects.create(name=locker_name, user=user)
                return JsonResponse({'success': True, 'name': locker.name})
            return JsonResponse({'success': False, 'error': 'No locker name provided'})
        except Exception as e:
            print(f"Exception: {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)})
    print("Invalid request method")
    return JsonResponse({'success': False, 'error': 'Invalid request method'})


def display_home(request):
    user = User.objects.first()
    lockers = Locker.objects.filter(user=user)
    return render(request, 'page1.html', {'lockers': lockers})

def sharing_page(request):
    return render(request, 'sharingpage(page2).html')

class DpiDirectoryView(APIView):
    def get(self, request):
        query = request.GET.get('search', '')
        if query:
            users = User.objects.filter(Q(username__icontains=query))
        else:
            users = User.objects.all()

        return render(request, 'partials/user_list.html', {'users': users})

    def get_page(self, request):
        users = User.objects.all()
        return render(request, 'page3.html', {'users': users})
    
def iiitb_locker(request):
    return render(request, 'page4.html')
