from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Connection, CustomUser, ConnectionType, Resource
from .model.xnode_model import Xnode_V2
from allauth.socialaccount.models import SocialToken
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from datetime import timedelta
from .models import GoogleAuthToken
from allauth.socialaccount.signals import pre_social_login
from allauth.socialaccount.models import SocialToken, SocialAccount
from django.db.models.signals import post_save

User = get_user_model()

# Signal for CustomUser
@receiver(post_save, sender=CustomUser)
def update_connection_name_on_user_update(sender, instance, **kwargs):
    print('In update connection name on user update signal.')
    # Get all connections where the instance (host or guest) is involved
    connections = Connection.objects.filter(host_user=instance) | Connection.objects.filter(guest_user=instance)
    for connection in connections:
        connection.save()  # This will call the save method and update the connection_name

# Signal for ConnectionType
@receiver(post_save, sender=ConnectionType)
def update_connection_name_on_type_update(sender, instance, **kwargs):
    # Get all connections where the instance type is involved
    connections = Connection.objects.filter(connection_type=instance)
    for connection in connections:
        connection.save()  # This will call the save method and update the connection_name

