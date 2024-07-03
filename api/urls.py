from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views

urlpatterns = [path('dpi-directory/', views.dpi_directory, name='dpi-directory'),
    path('upload-resource/', views.upload_resource, name='upload_resource'),
    path('create-locker/', views.create_locker, name='create-locker'),
    path('get-public-resources/<int:user_id>', views.get_public_resources, name='get-public-resources'),
    path('get-connection-type/', views.get_connection_type, name='get-connection-type'),
    path('get-lockers-user/', views.get_lockers_user, name='get-lockers-user'),
    path('get-other-connections/<int:target_user_id>/<int:target_locker_id>/', views.get_other_connections,
         name='get-other-connections'),
    path('connection_types/', views.get_connectiontype_by_user_by_locker, name='get_connection_types'),
    path('create_new_connection/', views.create_new_connection, name='create_new_connection'),
    path('login-user/', views.login_view, name='login'), ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
