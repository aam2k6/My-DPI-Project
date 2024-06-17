from django.urls import path
from . import views  

urlpatterns = [
    path("", views.display_home, name="page1"),
    path("sharingpage(page2)/", views.sharing_page, name="sharing-page"),
    path("page3/", views.dpi_directory, name="dpi-directory"),
    path("page4/", views.iiitb_locker, name='iiitb-locker'),
    path("addlocker/", views.LockerListCreate.as_view(), name="resource-view-create"),
    path("addresource/", views.ResourceListCreate.as_view(), name="resource-view-create"),
    path("shareresource/", views.ShareResources.as_view(), name='upload-resources'),
    path("create-locker/", views.add_locker, name="create-locker"),  
]
