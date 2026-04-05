

import json
from django.utils import timezone
from api.utils.xnode.xnode_helper import compute_terms_status  # Import NodeLockChecker
from api.utils.google_drive_helper.drive_helper import (
    add_drive_permission, get_or_refresh_google_token,
    try_transfer_ownership_via_permission, download_file_to_temp,
    upload_file_from_temp, delete_drive_file, get_file_metadata,
    _drive_copy_return_new_file_id # Add this
)
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from api.models import (
    Resource,
    Notification,
    Locker,
    CustomUser,
    Connection,
)
from api.model.xnode_model import Xnode_V2
from api.utils.resource_helper.access_resource_helper import access_Resource
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_http_methods
from api.utils.resource_helper.resource_CURD import delete_descendants,update_parents
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes
import os
import tempfile
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from django.db import transaction

@extend_schema(
    summary="Transfer resource (Guest to Host)",
    description="Transfer ownership of resources from a guest locker to a host locker according to connection terms. This includes physical file transfer in Google Drive for INODEs.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "host_locker_name": {"type": "string"},
                "guest_locker_name": {"type": "string"},
                "host_user_username": {"type": "string"},
                "guest_user_username": {"type": "string"},
                "validity_until": {"type": "string", "format": "date-time"},
            },
            "required": ["connection_name", "host_locker_name", "guest_locker_name", "host_user_username", "guest_user_username", "validity_until"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Resources transferred successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid request or no eligible resources"),
        404: OpenApiResponse(description="Connection, user, or locker not found"),
        500: OpenApiResponse(description="Drive transfer or resource update failed"),
    },
)
@csrf_exempt
@require_http_methods(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def transfer_resource(request):
    """
    Transfer resource(s) according to connection terms.
    INODE transfer: download guest file -> upload to host Drive -> update existing Resource & INODE (no new INODE).
    VNODE/SNODE transfer: update node_information owners and locker only.
    """
    print("print(0) -- transfer_resource called")
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        print("print(0.1) invalid json")
        return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

    required = [
        "connection_name",
        "host_locker_name",
        "guest_locker_name",
        "host_user_username",
        "guest_user_username",
        "validity_until",
    ]
    details = {f: body.get(f) for f in required}
    if None in details.values():
        print("print(0.2) missing fields", details)
        return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

    # Load objects
    try:
        host_user = CustomUser.objects.get(username=details["host_user_username"])
        host_locker = Locker.objects.get(name=details["host_locker_name"], user=host_user)
        guest_user = CustomUser.objects.get(username=details["guest_user_username"])
        guest_locker = Locker.objects.get(name=details["guest_locker_name"], user=guest_user)
        connection = Connection.objects.get(
            connection_name=details["connection_name"],
            guest_locker=guest_locker,
            host_locker=host_locker,
        )
    except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
        print("print(0.3) object not found:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=404)

    print("print(1) -- loaded objects")
    terms = connection.terms_value or {}
    allowed_resources = connection.resources.get("Transfer", []) or []


    # Main entry processor for each transferable term
    def process_transfer_entries(key: str, value: str):
        print("print(2) processing term:", key)
        if not ("|" in value and (value.endswith(";T") or value.endswith("; T"))):
            print("print(2.1) not transfer term or malformed")
            return None

        try:
            data = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
            parts = data.split("|")
            if len(parts) < 2:
                raise ValueError("Malformed term entry")
            xnode_id = parts[1].strip()
            print("print(2.2) xnode_id extracted:", xnode_id)

            if not any(xnode_id in res for res in allowed_resources):
                print("print(2.3) xnode not in allowed resources; skip")
                return None

            xnode = Xnode_V2.objects.get(id=xnode_id)
            print("print(2.4) loaded xnode:", xnode.id, "type:", xnode.xnode_Type)

            # build provenance entry
            new_entry = {
                "connection": connection.connection_id,
                "to_locker": host_locker.locker_id,
                "from_locker": guest_locker.locker_id,
                "to_user": host_user.user_id,
                "from_user": guest_user.user_id,
                "type_of_share": "Transfer",
                "xnode_id": xnode.id,
                "xnode_post_conditions": xnode.post_conditions,
                "reverse": False,
                "timestamp": timezone.now().isoformat(),
            }

            if not isinstance(xnode.provenance_stack, list):
                xnode.provenance_stack = []

            node_type = xnode.xnode_Type

            # resolve inode using existing access_Resource
            inode = None
            try:
                inode = access_Resource(xnode_id=xnode.id)
            except Exception as e:
                print("print(2.5) access_Resource failed (non-fatal):", e)
                inode = None

            # VNODE logic: change current_owner and locker
            if node_type == "VNODE":
                print("print(3) VNODE transfer")
                xnode.provenance_stack.insert(0, new_entry)
                xnode.node_information["current_owner"] = host_user.user_id
                xnode.locker = host_locker
                xnode.save(update_fields=["provenance_stack", "node_information", "locker"])
                print("print(3.1) VNODE updated")
                return True

            # SNODE logic: change primary_owner & current_owner and locker
            if node_type == "SNODE":
                print("print(4) SNODE transfer")
                xnode.provenance_stack.insert(0, new_entry)
                xnode.node_information["primary_owner"] = host_user.user_id
                xnode.node_information["current_owner"] = host_user.user_id
                xnode.locker = host_locker
                xnode.save(update_fields=["provenance_stack", "node_information", "locker"])
                print("print(4.1) SNODE updated")
                return True

            # INODE logic: DO DRIVE copy; then update Resource & INODE (existing) per your confirmed logic
            if node_type == "INODE":
                print("print(5) INODE transfer start")
                resource_obj = None
                if inode:
                    try:
                        resource_id = inode.node_information.get("resource_id")
                        if resource_id:
                            resource_obj = Resource.objects.get(resource_id=resource_id)
                            print("print(5.1) resolved resource:", resource_obj.resource_id)
                    except Exception as e:
                        print("print(5.2) resolving Resource failed:", e)
                        resource_obj = None

                if not resource_obj:
                    print("print(5.3) No resource found for INODE; cannot transfer")
                    return JsonResponse({"success": False, "error": "No Resource found for INODE transfer"}, status=400)

                # Do Drive copy (download->upload->delete)
                try:
                    print("print(6) performing Drive copy")
                    copy_res = _drive_copy_return_new_file_id(resource_obj, guest_user, host_user, host_locker)
                    new_file_id = copy_res["new_file_id"]
                    new_mime = copy_res.get("new_mime")
                    print("print(6.1) new_file_id:", new_file_id)
                except Exception as e:
                    print("print(6.2) drive copy failed:", e)
                    return JsonResponse({"success": False, "error": f"Drive transfer failed: {str(e)}"}, status=500)

                # Update Resource row (lock it)
                try:
                    print("print(7) updating Resource row")
                    with transaction.atomic():
                        # lock resource row
                        res_locked = Resource.objects.select_for_update().get(pk=resource_obj.pk)
                        # update relevant fields
                        res_locked.i_node_pointer = new_file_id
                        res_locked.drive_owner_email = host_user.email
                        res_locked.locker = host_locker
                        # update owner field - adapt to your model fields (owner or owner_id)
                        if hasattr(res_locked, "owner"):
                            res_locked.owner = host_user
                        elif hasattr(res_locked, "owner_id"):
                            res_locked.owner_id = host_user.user_id
                        # keep drive_file_name same or updated from metadata if you prefer
                        if new_mime and getattr(res_locked, "drive_mime_type", None) != new_mime:
                            res_locked.drive_mime_type = new_mime
                        res_locked.save()
                        print("print(7.1) Resource updated:", res_locked.resource_id)
                except Exception as e:
                    print("print(7.2) Resource update failed, will NOT rollback drive copy:", e)
                    return JsonResponse({"success": False, "error": f"Failed to update Resource: {str(e)}"}, status=500)

                # Update the INODE / xnode node_information and locker & provenance
                try:
                    print("print(8) updating Xnode (inode) info and provenance")
                    xnode.provenance_stack.insert(0, new_entry)
                    # update ownership fields per your provided logic
                    xnode.node_information["primary_owner"] = host_user.user_id
                    xnode.node_information["current_owner"] = host_user.user_id
                    xnode.node_information["resourse_link"] = f"https://drive.google.com/file/d/{new_file_id}/preview"
                    xnode.locker = host_locker
                    xnode.save(update_fields=["provenance_stack", "node_information", "locker"])
                    print("print(8.1) Xnode updated")
                except Exception as e:
                    print("print(8.2) Xnode update failed:", e)
                    return JsonResponse({"success": False, "error": f"Failed to update INODE: {str(e)}"}, status=500)

                # Update inode object (if access_Resource returned a separate inode model instance), update its node_information and is_locked if post_conditions exist
                try:
                    if inode:
                        print("print(9) updating resolved inode object")
                        if not isinstance(inode.node_information, dict):
                            inode.node_information = dict(inode.node_information or {})
                        inode.node_information["primary_owner"] = host_user.user_id
                        inode.node_information["current_owner"] = host_user.user_id
                        inode.node_information["drive_file_id"] = new_file_id  # optional cache
                        inode.save(update_fields=["node_information"])
                        # update is_locked using post_conditions (same logic as old code)
                        if inode.post_conditions:
                            post_conditions = inode.post_conditions
                            is_locked = {}
                            for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                                is_locked[k] = not post_conditions.get(k, False)
                            xnode.is_locked = is_locked
                            xnode.save(update_fields=["is_locked"])
                            print("print(9.1) Updated is_locked for Xnode:", xnode.id, is_locked)
                except Exception as e:
                    print("print(9.2) inode update warning:", e)
                    # non-fatal, continue

                # If xnode had vnode_list or snode_list -> delete descendants and notify affected users
                try:
                    if xnode.vnode_list or xnode.snode_list:
                        print("print(10) deleting descendants")
                        deleted_node_ids = delete_descendants(xnode)
                        xnode.vnode_list = []
                        xnode.snode_list = []
                        xnode.save(update_fields=["vnode_list", "snode_list"])
                        print("print(10.1) cleared vnode/snode lists")

                        affected_lockers = Locker.objects.filter(xnode_v2__id__in=deleted_node_ids)
                        affected_users = set(locker.user for locker in affected_lockers)
                        doc_name = resource_obj.document_name if resource_obj else "Unknown Resource"
                        notification_message = f"Resource '{doc_name}' is no longer accessible. It has been deleted because the original owner transferred the resource."

                        for user in affected_users:
                            user_lockers = affected_lockers.filter(user=user)
                            if not user_lockers.exists():
                                continue
                            for locker in user_lockers:
                                extra_data = {
                                    "resource_id": resource_obj.resource_id if resource_obj else None,
                                    "resource_name": doc_name,
                                    "locker_id": locker.locker_id,
                                    "locker_name": locker.name,
                                    "user_id": user.user_id,
                                    "username": user.username,
                                    "connection_id": connection.connection_id,
                                    "connection_name": connection.connection_name,
                                }
                                Notification.objects.create(
                                    connection=connection,
                                    guest_user=user,
                                    host_user=user,
                                    guest_locker=guest_locker,
                                    host_locker=guest_locker,
                                    connection_type=connection.connection_type,
                                    created_at=timezone.now(),
                                    message=notification_message,
                                    notification_type="resource_transferred",
                                    target_type="resource",
                                    target_id=str(resource_obj.resource_id) if resource_obj else None,
                                    extra_data=extra_data,
                                )
                                print("print(10.2) notification created for", user.username)
                except Exception as e:
                    print("print(10.3) descendant deletion/notification failed (non-fatal):", e)

                print("print(11) INODE transfer completed successfully")
                return True

            # Unknown node type
            print("print(7) unknown node type; skipping")
            return None

        except (IndexError, ValueError, Xnode_V2.DoesNotExist) as e:
            print("print(8) error processing transfer entry:", e)
            return JsonResponse({"success": False, "error": "Invalid format in terms_value or Xnode not found"}, status=400)

    # iterate terms
    transferred_any = False
    for key, value in terms.items():
        if key == "canShareMoreData":
            continue
        resp = process_transfer_entries(key, value)
        if isinstance(resp, JsonResponse):
            return resp
        if resp is True:
            transferred_any = True

    # nested canShareMoreData
    can_share_more_data = terms.get("canShareMoreData", {}) or {}
    for nested_key, nested_val in can_share_more_data.items():
        transfer_val = nested_val.get("enter_value")
        if transfer_val:
            resp = process_transfer_entries(nested_key, transfer_val)
            if isinstance(resp, JsonResponse):
                return resp
            if resp is True:
                transferred_any = True

    if transferred_any:
        print("print(99) overall transfer succeeded")
        return JsonResponse({"success": True, "message": "Resources transferred successfully"}, status=200)
    else:
        print("print(99.1) no eligible file resource found")
        return JsonResponse({"success": False, "error": "No eligible file resource found for transfer"}, status=400)
    

"""
    reverse transfer api to transfer resource ownership from host to guest based on connection terms and also send notification to affected users by using google drive like sharing mechanism and fallback mechanism
"""

@extend_schema(
    summary="Transfer resource (Host to Guest)",
    description="Transfer ownership of resources from a host locker to a guest locker according to connection terms. This includes physical file transfer in Google Drive for INODEs.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "host_locker_name": {"type": "string"},
                "guest_locker_name": {"type": "string"},
                "host_user_username": {"type": "string"},
                "guest_user_username": {"type": "string"},
                "validity_until": {"type": "string", "format": "date-time"},
            },
            "required": ["connection_name", "host_locker_name", "guest_locker_name", "host_user_username", "guest_user_username", "validity_until"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Resources transferred successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid request or no eligible resources"),
        404: OpenApiResponse(description="Connection, user, or locker not found"),
        500: OpenApiResponse(description="Drive transfer or resource update failed"),
    },
)
@csrf_exempt
@require_http_methods(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def transfer_resource_reverse(request):
    """
    Transfer resource(s) according to connection terms.
    INODE transfer: download host file -> upload to guest Drive -> update existing Resource & INODE (no new INODE).
    VNODE/SNODE transfer: update node_information owners and locker only.
    """
    print("print(0) -- transfer_resource called")
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        print("print(0.1) invalid json")
        return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

    required = [
        "connection_name",
        "host_locker_name",
        "guest_locker_name",
        "host_user_username",
        "guest_user_username",
        "validity_until",
    ]
    details = {f: body.get(f) for f in required}
    if None in details.values():
        print("print(0.2) missing fields", details)
        return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

    # Load objects
    try:
        host_user = CustomUser.objects.get(username=details["host_user_username"])
        host_locker = Locker.objects.get(name=details["host_locker_name"], user=host_user)
        guest_user = CustomUser.objects.get(username=details["guest_user_username"])
        guest_locker = Locker.objects.get(name=details["guest_locker_name"], user=guest_user)
        connection = Connection.objects.get(
            connection_name=details["connection_name"],
            guest_locker=guest_locker,
            host_locker=host_locker,
        )
    except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
        print("print(0.3) object not found:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=404)

    print("print(1) -- loaded objects")
    terms = connection.terms_value_reverse or {}
    allowed_resources = connection.resources.get("Transfer", []) or []

    # Main entry processor for each transferable term
    def process_transfer_entries(key: str, value: str):
        print("print(2) processing term:", key)
        if not ("|" in value and (value.endswith(";T") or value.endswith("; T"))):
            print("print(2.1) not transfer term or malformed")
            return None

        try:
            data = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
            parts = data.split("|")
            if len(parts) < 2:
                raise ValueError("Malformed term entry")
            xnode_id = parts[1].strip()
            print("print(2.2) xnode_id extracted:", xnode_id)

            if not any(xnode_id in res for res in allowed_resources):
                print("print(2.3) xnode not in allowed resources; skip")
                return None

            xnode = Xnode_V2.objects.get(id=xnode_id)
            print("print(2.4) loaded xnode:", xnode.id, "type:", xnode.xnode_Type)

            # build provenance entry
            new_entry = {
                "connection": connection.connection_id,
                "to_locker": guest_locker.locker_id,
                "from_locker": host_locker.locker_id,
                "to_user": guest_user.user_id,
                "from_user": host_user.user_id,
                "type_of_share": "Transfer",
                "xnode_id": xnode.id,
                "xnode_post_conditions": xnode.post_conditions,
                "reverse": False,
                "timestamp": timezone.now().isoformat(),
            }

            if not isinstance(xnode.provenance_stack, list):
                xnode.provenance_stack = []

            node_type = xnode.xnode_Type

            # resolve inode using existing access_Resource
            inode = None
            try:
                inode = access_Resource(xnode_id=xnode.id)
            except Exception as e:
                print("print(2.5) access_Resource failed (non-fatal):", e)
                inode = None

            # VNODE logic: change current_owner and locker
            if node_type == "VNODE":
                print("print(3) VNODE transfer")
                xnode.provenance_stack.insert(0, new_entry)
                xnode.node_information["current_owner"] = guest_user.user_id
                xnode.locker = guest_locker
                xnode.save(update_fields=["provenance_stack", "node_information", "locker"])
                print("print(3.1) VNODE updated")
                return True

            # SNODE logic: change primary_owner & current_owner and locker
            if node_type == "SNODE":
                print("print(4) SNODE transfer")
                xnode.provenance_stack.insert(0, new_entry)
                xnode.node_information["primary_owner"] = guest_user.user_id
                xnode.node_information["current_owner"] = guest_user.user_id
                xnode.locker = guest_locker
                xnode.save(update_fields=["provenance_stack", "node_information", "locker"])
                print("print(4.1) SNODE updated")
                return True

            # INODE logic: DO DRIVE copy; then update Resource & INODE (existing) per your confirmed logic
            if node_type == "INODE":
                print("print(5) INODE transfer start")
                resource_obj = None
                if inode:
                    try:
                        resource_id = inode.node_information.get("resource_id")
                        if resource_id:
                            resource_obj = Resource.objects.get(resource_id=resource_id)
                            print("print(5.1) resolved resource:", resource_obj.resource_id)
                    except Exception as e:
                        print("print(5.2) resolving Resource failed:", e)
                        resource_obj = None

                if not resource_obj:
                    print("print(5.3) No resource found for INODE; cannot transfer")
                    return JsonResponse({"success": False, "error": "No Resource found for INODE transfer"}, status=400)

                # Do Drive copy (download->upload->delete)
                try:
                    print("print(6) performing Drive copy")
                    copy_res = _drive_copy_return_new_file_id(resource_obj, host_user, guest_user, guest_locker)
                    new_file_id = copy_res["new_file_id"]
                    new_mime = copy_res.get("new_mime")
                    print("print(6.1) new_file_id:", new_file_id)
                except Exception as e:
                    print("print(6.2) drive copy failed:", e)
                    return JsonResponse({"success": False, "error": f"Drive transfer failed: {str(e)}"}, status=500)

                # Update Resource row (lock it)
                try:
                    print("print(7) updating Resource row")
                    with transaction.atomic():
                        # lock resource row
                        res_locked = Resource.objects.select_for_update().get(pk=resource_obj.pk)
                        # update relevant fields
                        res_locked.i_node_pointer = new_file_id
                        res_locked.drive_owner_email = guest_user.email
                        res_locked.locker = guest_locker
                        # update owner field - adapt to your model fields (owner or owner_id)
                        if hasattr(res_locked, "owner"):
                            res_locked.owner = guest_user
                        elif hasattr(res_locked, "owner_id"):
                            res_locked.owner_id = guest_user.user_id
                        # keep drive_file_name same or updated from metadata if you prefer
                        if new_mime and getattr(res_locked, "drive_mime_type", None) != new_mime:
                            res_locked.drive_mime_type = new_mime
                        res_locked.save()
                        print("print(7.1) Resource updated:", res_locked.resource_id)
                except Exception as e:
                    print("print(7.2) Resource update failed, will NOT rollback drive copy:", e)
                    return JsonResponse({"success": False, "error": f"Failed to update Resource: {str(e)}"}, status=500)

                # Update the INODE / xnode node_information and locker & provenance
                try:
                    print("print(8) updating Xnode (inode) info and provenance")
                    xnode.provenance_stack.insert(0, new_entry)
                    # update ownership fields per your provided logic
                    xnode.node_information["primary_owner"] = guest_user.user_id
                    xnode.node_information["current_owner"] = guest_user.user_id
                    xnode.node_information["resourse_link"] = f"https://drive.google.com/file/d/{new_file_id}/preview"
                    xnode.locker = guest_locker
                    xnode.save(update_fields=["provenance_stack", "node_information", "locker"])
                    print("print(8.1) Xnode updated")
                except Exception as e:
                    print("print(8.2) Xnode update failed:", e)
                    return JsonResponse({"success": False, "error": f"Failed to update INODE: {str(e)}"}, status=500)

                # Update inode object (if access_Resource returned a separate inode model instance), update its node_information and is_locked if post_conditions exist
                try:
                    if inode:
                        print("print(9) updating resolved inode object")
                        if not isinstance(inode.node_information, dict):
                            inode.node_information = dict(inode.node_information or {})
                        inode.node_information["primary_owner"] = guest_user.user_id
                        inode.node_information["current_owner"] = guest_user.user_id
                        inode.node_information["drive_file_id"] = new_file_id  # optional cache
                        inode.save(update_fields=["node_information"])
                        # update is_locked using post_conditions 
                        if inode.post_conditions:
                            post_conditions = inode.post_conditions
                            is_locked = {}
                            for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                                is_locked[k] = not post_conditions.get(k, False)
                            xnode.is_locked = is_locked
                            xnode.save(update_fields=["is_locked"])
                            print("print(9.1) Updated is_locked for Xnode:", xnode.id, is_locked)
                except Exception as e:
                    print("print(9.2) inode update warning:", e)
                    # non-fatal, continue

                # If xnode had vnode_list or snode_list -> delete descendants and notify affected users
                try:
                    if xnode.vnode_list or xnode.snode_list:
                        print("print(10) deleting descendants")
                        deleted_node_ids = delete_descendants(xnode)
                        xnode.vnode_list = []
                        xnode.snode_list = []
                        xnode.save(update_fields=["vnode_list", "snode_list"])
                        print("print(10.1) cleared vnode/snode lists")

                        affected_lockers = Locker.objects.filter(xnode_v2__id__in=deleted_node_ids)
                        affected_users = set(locker.user for locker in affected_lockers)
                        doc_name = resource_obj.document_name if resource_obj else "Unknown Resource"
                        notification_message = f"Resource '{doc_name}' is no longer accessible. It has been deleted because the original owner transferred the resource."

                        for user in affected_users:
                            user_lockers = affected_lockers.filter(user=user)
                            if not user_lockers.exists():
                                continue
                            for locker in user_lockers:
                                extra_data = {
                                    "resource_id": resource_obj.resource_id if resource_obj else None,
                                    "resource_name": doc_name,
                                    "locker_id": locker.locker_id,
                                    "locker_name": locker.name,
                                    "user_id": user.user_id,
                                    "username": user.username,
                                    "connection_id": connection.connection_id,
                                    "connection_name": connection.connection_name,
                                }
                                Notification.objects.create(
                                    connection=connection,
                                    guest_user=guest_user,
                                    host_user=user,
                                    guest_locker=guest_locker,
                                    host_locker=locker,
                                    connection_type=connection.connection_type,
                                    created_at=timezone.now(),
                                    message=notification_message,
                                    notification_type="resource_transferred",
                                    target_type="resource",
                                    target_id=str(resource_obj.resource_id) if resource_obj else None,
                                    extra_data=extra_data,
                                )
                                print("print(10.2) notification created for", user.username)
                except Exception as e:
                    print("print(10.3) descendant deletion/notification failed (non-fatal):", e)

                print("print(11) INODE transfer completed successfully")
                return True

            # Unknown node type
            print("print(7) unknown node type; skipping")
            return None

        except (IndexError, ValueError, Xnode_V2.DoesNotExist) as e:
            print("print(8) error processing transfer entry:", e)
            return JsonResponse({"success": False, "error": "Invalid format in terms_value or Xnode not found"}, status=400)

    # iterate terms
    transferred_any = False
    for key, value in terms.items():
        if key == "canShareMoreData":
            continue
        resp = process_transfer_entries(key, value)
        if isinstance(resp, JsonResponse):
            return resp
        if resp is True:
            transferred_any = True

    # nested canShareMoreData
    can_share_more_data = terms.get("canShareMoreData", {}) or {}
    for nested_key, nested_val in can_share_more_data.items():
        transfer_val = nested_val.get("enter_value")
        if transfer_val:
            resp = process_transfer_entries(nested_key, transfer_val)
            if isinstance(resp, JsonResponse):
                return resp
            if resp is True:
                transferred_any = True

    if transferred_any:
        print("print(99) overall transfer succeeded")
        return JsonResponse({"success": True, "message": "Resources transferred successfully"}, status=200)
    else:
        print("print(99.1) no eligible file resource found")
        return JsonResponse({"success": False, "error": "No eligible file resource found for transfer"}, status=400)
