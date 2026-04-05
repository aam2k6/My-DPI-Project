from django.urls import path
from .views.get_connection_type import (
    get_connection_type,
    get_connection_type_by_user_by_locker,
    get_connection_type_by_user,
    get_other_connection_types,
)
from .views.create_connection_type import create_connection_type_and_connection_terms
from .views.connectionType_CURD import edit_delete_connectiontype_details
from .views.get_terms_by_connectionType import get_terms_by_connection_type

urlpatterns = [
    path("get-other-connection-types/", get_other_connection_types),
    path("get_connection_types_by_locker/", get_connection_type_by_user_by_locker),
    path("get_connection_types/", get_connection_type_by_user),
    path("get-connection-type-by-user/", get_connection_type),
    path("create-connection-type-and-terms/", create_connection_type_and_connection_terms),
    path("edit-delete-connectiontype/", edit_delete_connectiontype_details),
    path("get-terms-by-conntype/", get_terms_by_connection_type),
]

