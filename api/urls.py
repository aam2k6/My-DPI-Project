from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views
from django.views.generic import TemplateView
from .views import upload_resource #, get_lockers_user
from .views import upload_resource, get_lockers_user,Get_connectiontype_byuser_bylocker,create_new_connection

urlpatterns = [
    # path("", views.display_home, name="page1"),
    # path("sharingpage/", views.sharing_page, name="sharing-page"),
    path('dpi-directory/', views.dpi_directory, name='dpi-directory'),
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
    path('get-public-resources/<int:user_id>', views.get_public_resources, name='get-public-resources'),
    path('get-connection-type/', views.get_connection_type, name= 'get-connection-type'),
    path('get-lockers-user/', views.get_lockers_user, name='get-lockers-user'),
    path('get-other-connections/<int:target_user_id>/<int:target_locker_id>/', views.get_other_connections, name='get-other-connections'),
    path('connection_types/', Get_connectiontype_byuser_bylocker, name='get_connection_types'),
     path('create_new_connection/', create_new_connection, name='create_new_connection'),


]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
