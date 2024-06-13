from django.shortcuts import render

# Create your views here.
from rest_framework import generics, request, status
from rest_framework.response import Response
from rest_framework.renderers import TemplateHTMLRenderer
from django.db import transaction
from .models import Resource, Locker, User, Connection
from .serializers import ResourceSerializer, LockerSerializer

class ResourceListCreate(generics.ListCreateAPIView):
    rederer_class = [TemplateHTMLRenderer]
    template_name = 'createresource.html'

    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    
    @transaction.atomic
    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)

class LockerListCreate(generics.ListCreateAPIView):
    queryset = Locker.objects.all()
    serializer_class = LockerSerializer

class ShareResources(generics.RetrieveUpdateDestroyAPIView):
    renderer_class = [TemplateHTMLRenderer]
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
            old_owner = resource.owner
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

        #Connection.objects.create(
        #   connection_name = old_owner + "<>" + new_owner,
        #   connection_norm = "",
        #    access_norm = "",
        #    access_token = "",
        #    source_locker = resource.locker,
        #    target_locker = new_owner_locker,
        #    source_user = old_owner,
        #    target_user = new_owner_username,
        #) 

        return render(request, self.template_name, {'Success':'Resource Uploaded'})
    
def display_home(request):
    return render(request, 'page1.html')

def sharing_page(request):
    return render(request, 'sharingpage(page2).html')

def dpi_directory(request):
    return render(request, 'page3.html')

#def view_connection(request):
#    return render(request, 'viewconnection(page5).html')

def iiitb_locker(request):
    return render(request, 'page4.html')