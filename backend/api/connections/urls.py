from django.urls import path
from .views.CURD import create_new_connection, update_extra_data
from .views.close_connection import (
    close_connection_consent,
    close_connection_guest,
    close_connection_host,
)
from .views.get_connection_details import *
from .views.get_terms_connection import *
from .views.consent import get_consent_status, give_consent
from .views.terms import update_connection_termsONLY, update_connection_terms
from .views.freeze_unfreeze_connection import freeze_or_unfreeze_connection
from .views.connection_status import (
    update_connection_status_if_expired_onlogin,
    update_connection_status_if_expired,
    update_connection_status_tolive,
)

urlpatterns = [
    path("create/", create_new_connection),
    path("update-extra-data/", update_extra_data),

    path("close-consent/", close_connection_consent),
    path("close-guest/", close_connection_guest),
    path("close-host/", close_connection_host),

    path("get-details/", get_connection_details),
    path("get-user-locker/", get_connection_by_user_by_locker),
    path("get-outgoing-by-user/", get_outgoing_connections_by_user),
    path("get-guest-user-connection/", get_guest_user_connection),
    path("get-guest-user-connection-id/", get_guest_user_connection_id),
    path("get-all/", get_all_connections),
    path("get-outgoing-connections/", get_outgoing_connections_to_locker),
    path("get-extra-data/", get_extra_data),
    path("get-outgoing-connections-user/", get_outgoing_connections_user),
    path("get_connections_by_user/", get_connections_by_user),

    path("show_terms/", show_terms),
    path("show_terms_reverse/", show_terms_reverse),
    path("get-terms-status/", get_terms_status),
    path("get-terms-status-reverse/", get_terms_status_reverse),
    path("get-terms-value/", get_terms_for_user),

    path("get-consent/", get_consent_status),
    path("give-consent/", give_consent),

    path("update-connectiontermsonly/", update_connection_termsONLY),
    path("update_connection_terms/", update_connection_terms),
    path("freeze-unfreeze-connection/", freeze_or_unfreeze_connection),

    path("update_status/", update_connection_status_if_expired),
    path("update_status_tolive/", update_connection_status_tolive),
    path("update_status_if_expired_onlogin/",update_connection_status_if_expired_onlogin,),
]

