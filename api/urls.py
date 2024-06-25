from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views  
from django.views.generic import TemplateView
from .views import DpiDirectoryView, sharing_page, upload_resource

urlpatterns = [
    path("", views.display_home, name="page1"),
    path("sharingpage/", views.sharing_page, name="sharing-page"),
    path("dpi-directory/", views.DpiDirectoryView.as_view(), name="dpi-directory"),
    path("iiitb-locker/", views.iiitb_locker, name='iiitb-locker'),
    path("addlocker/", views.LockerListCreate.as_view(), name="resource-view-create"),
    path("addresource/", views.ResourceListCreate.as_view(), name="resource-view-create"),
    path("shareresource/", views.ShareResources.as_view(), name='upload-resources'),
    path("create-locker/", views.add_locker, name="create-locker"),
    path('upload-resource/', upload_resource, name='upload_resource'),
    path('sharing-page/', sharing_page, name='sharing_page'),
    path('api/connections/', views.iiitb_locker, name='api-connections'),
    path('api/user-connections/', views.get_user_connection, name='api-user-connections'),
    path('add-locker/', views.add_locker, name='add-locker'),  
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)