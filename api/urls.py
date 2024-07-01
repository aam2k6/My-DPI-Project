from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views
from django.views.generic import TemplateView
from .views import upload_resource #, get_lockers_user

urlpatterns = [
    # path("", views.display_home, name="page1"),
    # path("sharingpage/", views.sharing_page, name="sharing-page"),
    # path("iiitb-locker/", views.iiitb_locker, name='iiitb-locker'),
    # path("addlocker/", views.LockerListCreate.as_view(), name="resource-view-create"),
    # path("addresource/", views.ResourceListCreate.as_view(), name="resource-view-create"),
    # path("shareresource/", views.ShareResources.as_view(), name='upload-resources'),
    # path("create-locker/", views.add_locker, name="create-locker"),
    path('upload-resource/', views.upload_resource, name='upload_resource'),
    # path('sharing-page/', sharing_page, name='sharing_page'),
    # path('api/connections/', views.iiitb_locker, name='api-connections'),
    # path('api/user-connections/', views.get_user_connection, name='api-user-connections'),
    path('create-locker/', views.create_locker, name='create-locker'),
    path('get-public-resources/', views.get_public_resources, name='get-public-resources'),

    
    #path('get-lockers-user/', views.get_lockers_user, name='get-lockers-user'),
    #path('dpi-directory/', views.dpi_directory, name='dpi-directory'),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)