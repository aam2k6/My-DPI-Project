from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views
from .views import show_terms, revoke_consent

urlpatterns = [path('dpi-directory/', views.dpi_directory, name='dpi-directory'),
               path('upload-resource/', views.upload_resource, name='upload_resource'),
               path('create-locker/', views.create_locker, name='create-locker'),
               path('get-public-resources/', views.get_public_resources, name='get-public-resources'),
               path('get-connection-type/', views.get_connection_type, name='get-connection-type'),
               path('get-lockers-user/', views.get_lockers_user, name='get-lockers-user'),
               path('get-other-connection-types/', views.get_other_connection_types, name='get-other-connection-types'),
               path('connection_types/', views.get_connection_type_by_user_by_locker, name='get_connection_types'),
               path('create-new-connection/', views.create_new_connection, name='create_new_connection'),
               path('login-user/', views.login_view, name='login'),
               path('show_terms/', show_terms, name='show_terms'),
               path('give_consent/', views.give_consent, name='give_consent'),
               path('revoke_consent/', revoke_consent, name='revoke_consent'),
               path('get-connections-user-locker/', views.get_connection_by_user_by_locker, name='get-connections-user-locker'),
               #path("get-connections-user/",views.get_connection_by_user,name="get-connections-user"),
               path("get-all-connections/",views.get_all_connections,name="get-all-connections"),
               path('get-resources-user-locker/', views.get_resource_by_user_by_locker,name='get-resources-user-locker'),
               path('signup-user/', views.signup_user, name='signup_user'),
               path('download-resource/<int:resource_id>/', views.download_resource, name='download_resource'),
               # path('update_locker_info/<int:locker_id/>', views.update_locker, name="update-locker"),
               # path('update_conn_type/<int:connection_type_id>/', views.update_connection_type, name="update-connection-type"),
               path('create-connection-type-and-terms/', views.create_connection_type_and_connection_terms,name='create-connection-type-and-terms'),
               path('freeze-unfreeze-locker/', views.freeze_or_unfreeze_locker, name='freeze_locker'),
               path('freeze-unfreeze-connection/', views.freeze_or_unfreeze_connection, name='freeze_connection'),
               path('get-guest-user-connection/', views.get_guest_user_connection, name='get_guest_user_connection'),
               path('update-connection-terms/', views.update_connection_terms, name='update_connection_terms'),
               path('get-terms-status/', views.get_terms_status, name='get_terms_status'),
               path('transfer-resource/', views.transfer_resource, name='transfer_resource'),
               path('get-connection-details/', views.get_connection_details, name='get_connection_details'),
               path('create-admin/', views.create_admin, name='create_admin'),
               path('create-moderator/', views.create_moderator, name='create_moderator'),
               path('remove-admin/', views.remove_admin, name='remove_admin'),
               path('remove-moderator/', views.remove_moderator, name='remove_moderator')


               ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
