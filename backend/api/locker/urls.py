# api/locker/urls.py
from django.urls import path
#locker
from api.locker.views.create_locker import create_locker
from api.locker.views.get_locker import get_lockers_user
from api.locker.views.freeze_or_unfreeze_locker import freeze_or_unfreeze_locker
from api.locker.views.Delete_update_locker import delete_Update_Locker
from api.locker.views.locker_connection_stats import get_locker_status


urlpatterns = [
    path("create/", create_locker, name="create-locker"),
    path("get-user/", get_lockers_user, name="get-lockers-user"),
    path("freeze-unfreeze/", freeze_or_unfreeze_locker, name="freeze_locker"),
    path("update-delete/", delete_Update_Locker, name="update_delete_locker"),
    path("get-status/", get_locker_status, name="get_locker_status"),

]
