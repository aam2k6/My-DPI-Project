from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views
from .views import show_terms, revoke_consent

urlpatterns = [
    path("dpi-directory/", views.dpi_directory, name="dpi-directory"),
    path("upload-resource/", views.upload_resource, name="upload_resource"),
    path("create-locker/", views.create_locker, name="create-locker"),
    path("get-public-resources/", views.get_public_resources, name="get-public-resources"),
    path("get-connection-type/", views.get_connection_type, name="get-connection-type"),
    path("get-lockers-user/", views.get_lockers_user, name="get-lockers-user"),
    path("get-other-connection-types/",views.get_other_connection_types,name="get-other-connection-types"),
    path("connection_types/",views.get_connection_type_by_user_by_locker,name="get_connection_types"),
    path("create-new-connection/",views.create_new_connection,name="create_new_connection"),
    path("login-user/", views.login_view, name="login"),
    path("show_terms/", show_terms, name="show_terms"),
    path("give_consent/", views.give_consent, name="give_consent"),
    path("revoke_consent/", revoke_consent, name="revoke_consent"),
    path("get-connections-user-locker/",views.get_connection_by_user_by_locker,name="get-connections-user-locker"),
    path("get-resources-user-locker/",views.get_resource_by_user_by_locker,name="get-resources-user-locker"),
    path("signup-user/", views.signup_user, name="signup_user"),
    path("download-resource/<int:resource_id>/",views.download_resource,name="download_resource"),
    # path('update_locker_info/<int:locker_id/>', views.update_locker, name="update-locker"),
    # path('update_conn_type/<int:connection_type_id>/', views.update_connection_type, name="update-connection-type"),
    path("create-connection-type-and-terms/",views.create_connection_type_and_connection_terms,name="create-connection-type-and-terms"),
    path("freeze_locker/", views.freeze_locker, name="freeze_locker"),
    path("freeze_connection/", views.freeze_connection, name="freeze_connection"),
    path("get-guest-user-connection/",views.get_guest_user_connection,name="get_guest_user_connection"),
    path("update-connection-terms/",views.update_connection_terms,name="update_connection_terms"),
    path("get-terms-status/", views.get_terms_status, name="get_terms_status"),
    path("transfer-resource/", views.transfer_resource, name="transfer_resource"),
    path("get-connection-details/",views.get_connection_details,name="get_connection_details"),
    path("get-connection-terms-for-global-template/",view=views.get_All_Connection_Terms_For_Global_Connection_Type_Template,name="get_Connection_Terms_For_Global_Template"),
    path("add-global-template/",view=views.create_Global_Connection_Type_Template,name="create_global_template"),
    path("connect-type-to-template/",view=views.connect_Global_Connection_Type_Template_And_Connection_Type,name="connect_type_to_template"),
    path("get-template-or-templates/",view=views.get_Global_Connection_Type,name="get_template_or_templates"),
    path("get-link-regulation-for-connection-type/",view=views.get_Connection_Link_Regulation_For_Connection_Type,name="get_link_for_connection_type"),
    path("create-global-terms/",view=views.create_Global_Connection_Terms,name="create_global_terms"),
    path("share-resource/", view=views.share_Resource_Create_Vnode, name="share_resource")
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
