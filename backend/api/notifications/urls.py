# api/notification/urls.py
from django.urls import path

# notifications
from .views.get_and_read_notifications import get_notifications, mark_notifications_read
from .views.reject_resource_notification import reject_resource_notification
from .views.reject_revert_consent import reject_revert_consent

urlpatterns = [
    path('list/', get_notifications, name='get-notifications'),
    path("mark-as-read/", mark_notifications_read, name="mark-notification-read"),
    path("reject-resource/", reject_resource_notification, name="reject_resource_notification"),
    path("reject_revert_consent/", reject_revert_consent,name="reject_revert_consent"),
]
