
import os
import json
from django.http import JsonResponse, HttpRequest
from django.utils import timezone
from django.core import serializers
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import make_aware
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from django.conf import settings
from pypdf import PdfReader,PdfWriter
import shutil
from django.http import FileResponse, Http404

from api.models import Locker, Resource, CustomUser, Connection ,Notification , ConnectionType
from api.model.xnode_model import Xnode_V2
from api.serializers import ResourceSerializer, XnodeV2Serializer
from django.db import models
from django.db.models import Q
from api.serializers import ConnectionSerializer

from rest_framework_simplejwt.authentication import JWTAuthentication
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from rest_framework_simplejwt.tokens import RefreshToken
from api.utils.google_drive_helper.drive_helper import user_has_drive_access,make_drive_file_public,get_or_refresh_google_token

import math
import requests
from django.http import StreamingHttpResponse, HttpResponse, JsonResponse
from django.utils.http import http_date
from django.utils.decorators import method_decorator
from api.utils.resource_helper.access_resource_helper import access_Resource


# This function deletes a node and its descendants recursively
def delete_descendants(xnode):
    """
    Recursively delete all descendant nodes of a given Xnode and update parent node lists.
    """
    delete_xnode_list = []

    # Get all direct children
    child_nodes = Xnode_V2.objects.filter(
        Q(node_information__link=xnode.id) | Q(node_information__inode_or_snode_id=xnode.id)
    )

    for child in child_nodes:
        # **Find other lockers where the child node exists**
        other_lockers = Locker.objects.filter(xnode_v2__id=child.id).exclude(user=xnode.locker.user)

        affected_users = set()
        affected_lockers = set()

        for locker in other_lockers:
            affected_users.add(locker.user)
            affected_lockers.add(locker)

        if affected_users:
            # Get connection info from the child (not from parent)
            connection = getattr(child, "connection", None)
            connection_type = getattr(connection, "connection_type", None) if connection else None

            send_deletion_notification(affected_users, affected_lockers, child, connection, connection_type)

        delete_xnode_list.extend(delete_descendants(child))  # Recursively delete child's descendants

        print(f"Updating parents before deleting Xnode {child.id}")
        update_parents(child)  # Update parent vnode_list first

        delete_xnode_list.append(child.id)  # Add child to deletion list
        print(f"Deleting child Xnode: {child.id} ({child.xnode_Type})")
        child.delete()  # Delete child node

    return delete_xnode_list


def update_parents(xnode, deleting_user=None):
    """
    Updates all parent nodes by removing the deleted Xnode from their vnode_list and snode_list.
    If the parent node loses access to a resource, notify the affected users.
    """
    all_parents = Xnode_V2.objects.all()  # Get all nodes
    filtered_parents = [
        parent for parent in all_parents
        if xnode.id in parent.vnode_list or xnode.id in parent.snode_list
    ]

    for parent in filtered_parents:
        # Remove the deleted node from vnode_list and snode_list
        parent.vnode_list = [vid for vid in parent.vnode_list if vid != xnode.id]
        parent.snode_list = [sid for sid in parent.snode_list if sid != xnode.id]

        parent.save(update_fields=["vnode_list", "snode_list"])  # Update only these fields
        print(f"Updated parent Xnode: {parent.id}, vnode_list: {parent.vnode_list}")

        #  Check if the parent node loses all access
        if not parent.vnode_list and not parent.snode_list:
            # Find affected users (except deleting user)
            affected_users = set()
            affected_lockers = set()

            parent_lockers = Locker.objects.filter(xnode_v2__id=parent.id)
            for locker in parent_lockers:
                if locker.user != deleting_user:  # Skip deleting user
                    affected_users.add(locker.user)
                    affected_lockers.add(locker)

            # Send notification ONLY to affected users (not the deleting user)
            if affected_users:
                send_deletion_notification(affected_users, affected_lockers, parent, deleting_user)

            print(f"Notification sent for parent Xnode {parent.id} losing its resources.")


def send_deletion_notification(users, lockers, xnode, connection=None, connection_type=None):

    """
    Sends notification to users about the deletion of a shared Xnode resource.
    """
    try:
        inode = access_Resource(xnode_id=xnode.id)
        document_name = None

        if inode:
            try:
                resource = Resource.objects.get(
                    resource_id=inode.node_information.get("resource_id")
                )
                document_name = resource.document_name
            except Resource.DoesNotExist:
                document_name = "Unknown Resource"

        message = f"The resource '{document_name}' ({xnode.xnode_Type}) has been deleted by its original owner. It is no longer accessible."

        for user in users:
            user_lockers = [locker for locker in lockers if locker.user == user]

            for locker in user_lockers:
                # Ensure connection is not None before saving
                if connection is None:
                    print(f"Skipping notification for {user.username} due to missing connection.")
                    continue

                Notification.objects.create(
                    connection=connection,  
                    connection_type=connection_type,  
                    host_user=user,
                    guest_user=user,
                    host_locker=locker,
                    guest_locker=locker,
                    created_at=timezone.now(),
                    message=message,
                    notification_type="resource_deleted",
                    target_type="resource",
                    target_id=str(xnode.id),
                    extra_data={
                        "xnode_id": xnode.id,
                        "xnode_type": xnode.xnode_Type,
                        "resource_name": document_name,
                        "locker_id": locker.locker_id,
                        "locker_name": locker.name,
                        "user_id": user.user_id,
                        "username": user.username,
                        "connection_id": connection.connection_id if connection else None,
                        "connection_name": connection.connection_name if connection else None,
                    }
                )
                print(f"Notification sent to {user.username} for locker {locker.name}")

    except Exception as e:
        print(f"Error while sending notification: {e}")