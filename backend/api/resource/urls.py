# api/authentication/urls.py
from django.urls import path
# #resource
from .views.get_resource import get_resource_by_user_by_locker,get_public_resources
from .views.upload import upload_resource,create_subset_resource
from .views.Resource_CURD import delete_Update_Resource
from .views.consent_artefact_CURD import consent_artifact_view_update
from .views.access import access_Resource_API,access_res_submitted
from .views.stream import stream_resource
from .views.download import download_resource,check_download_status
from .views.xnode_views.xnode_status import xnode_v2_status,update_Xnode_Inode,fix_invalid_xnodes
from .views.xnode_views.get_total_page import get_total_pages_in_document
from .views.xnode_views.get_all_xnode import get_All_Xnodes
from .views.xnode_views.get_xnode_for_connection import get_incoming_connection_resource_shared_by_host_to_guest,get_outgoing_connection_resource_shared_by_guest_to_host,get_outgoing_connection_xnode_details,get_user_resources_by_connection_type
 
urlpatterns = [
    path("get-by-user-locker/", get_resource_by_user_by_locker,name="get-resources-user-locker",),
    path("upload/", upload_resource, name="upload_resource"),
    path("create-subset/", create_subset_resource, name="create_subset_resource"),
    path('edit-delete/', delete_Update_Resource, name='edit_delete_resource'),

    path('consent-artefact-view-edit/',consent_artifact_view_update,name='consent_artefact_view_update'),
    path("access/",access_Resource_API,name="access_resource"),
    path('access-res-submitted/',access_res_submitted, name='access_res_submitted'),
    path("stream/",stream_resource,name="stream_resource"),
    path("download/",download_resource,name="download_resource",),

    path("download-resource/<int:resource_id>/", download_resource, name="download_resource"),
    path("check-download-status/<int:xnode_id>/<int:connection_id>/", check_download_status, name="check-download-status"),
    path("update-xnode-status/",xnode_v2_status,name="update_xnode_status"),
    path("update-inode/",update_Xnode_Inode,name="update_inode"),

    path("get-total-pages/",get_total_pages_in_document, name="get-total-pages"),
    path("fix-invalid-xnode/",fix_invalid_xnodes, name="fix_invalid_xnodes"),
    path("get-public-resources/",get_public_resources, name="get-public-resources"),
    path("get-all-xnodes-for-locker/",get_All_Xnodes,name='get_all_xnodes_for_locker'),

    path("get-user-resources-by-connection-type/", get_user_resources_by_connection_type, name="get_user_resources_by_connection_type"),
    path("get-outgoing-connection-xnode-details/", get_outgoing_connection_xnode_details, name="get_outgoing_connection_xnode_details"),
    path("all-incoming-connection-resource/", get_incoming_connection_resource_shared_by_host_to_guest, name="all_incoming_connection_resource/"),
    path("all-outgoing-connection-resource/", get_outgoing_connection_resource_shared_by_guest_to_host, name="all_outgoing_connection_resource/"),
]
