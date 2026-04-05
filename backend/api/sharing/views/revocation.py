
import json
from http import HTTPStatus
from django.http import JsonResponse,HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from api.models import Locker, CustomUser, Connection, Resource, Notification, ConnectionType, ConnectionTerms
from api.model.xnode_model import Xnode_V2
from api.utils.xnode.xnode_helper import NodeLockChecker  # Import NodeLockChecker

from api.utils.resource_helper.access_resource_helper import access_Resource
from api.utils.xnode.xnode_helper import delete_vnode, get_provenance_stack
from rest_framework_simplejwt.authentication import JWTAuthentication
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialToken
from api.utils.google_drive_helper.drive_helper import (add_drive_permission,get_or_refresh_google_token,
                    try_transfer_ownership_via_permission,
                    download_file_to_temp,
                    upload_file_from_temp,delete_drive_file,get_file_metadata)
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from api.utils.xnode.xnode_helper import append_xnode_provenance,remove_xnode_provenance_entry

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes

#drive collateral

import os
import tempfile
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials as GoogleCredentials
from google.oauth2.credentials import Credentials

DRIVE_API_SCOPES = ["https://www.googleapis.com/auth/drive"]
TEMP_DIR = tempfile.gettempdir()
from django.db import transaction

# Helper: build drive service from access token
def get_drive_service_from_token(access_token):
    creds = Credentials(token=access_token)
    return build("drive", "v3", credentials=creds)


def _drive_copy_return_new_file_id(resource_obj, sender_user, receiver_user, receiver_locker):
    print("\n========== DRIVE COPY START ==========")

    if not resource_obj or not getattr(resource_obj, "i_node_pointer", None):
        print("Resource has no drive file id")
        raise Exception("Resource has no drive file id")

    old_file_id = resource_obj.i_node_pointer
    print("Old file ID:", old_file_id)

    # --------------------------------
    # Tokens
    # --------------------------------
    sender_token = get_or_refresh_google_token(sender_user)
    receiver_token = get_or_refresh_google_token(receiver_user)

    if not sender_token:
        raise Exception("Sender Google token unavailable")
    if not receiver_token:
        raise Exception("Receiver Google token unavailable")

    print("Tokens ready")

    sender_drive = get_drive_service_from_token(sender_token)
    receiver_drive = get_drive_service_from_token(receiver_token)
    print("Drive services created")

    # --------------------------------
    # Metadata
    # --------------------------------
    meta = get_file_metadata(sender_drive, old_file_id)
    name = meta.get("name") or resource_obj.document_name or f"resource_{resource_obj.resource_id}"
    mimetype = meta.get("mimeType")

    print("File:", name)
    print("MIME:", mimetype)

    # --------------------------------
    # Temp file
    # --------------------------------
    ext = os.path.splitext(name)[1]
    temp_path = os.path.join(
        TEMP_DIR,
        f"transfer_{resource_obj.resource_id}_{int(timezone.now().timestamp())}{ext}"
    )
    print("Temp path:", temp_path)

    try:
        # Download
        print("Downloading...")
        download_file_to_temp(sender_drive, old_file_id, temp_path)
        print("Download done")

        # Resolve destination folder
        dest_folder_id = None
        if hasattr(receiver_locker, "drive_folder_id"):
            dest_folder_id = receiver_locker.drive_folder_id
        elif hasattr(receiver_locker, "drive_folder"):
            dest_folder_id = receiver_locker.drive_folder
        elif hasattr(receiver_locker, "folder_id"):
            dest_folder_id = receiver_locker.folder_id
        elif hasattr(receiver_locker, "node_information"):
            dest_folder_id = receiver_locker.node_information.get("drive_folder_id")

        print("Upload destination:", dest_folder_id or "ROOT")

        # Upload
        print("Uploading...")
        upload_resp = upload_file_from_temp(
            receiver_drive,
            dest_folder_id,
            temp_path,
            name,
            mimetype
        )
        print("Upload response:", upload_resp)

        new_file_id = upload_resp.get("id")
        if not new_file_id:
            raise Exception("Upload failed")

        # Delete original (best-effort)
        print("Deleting original (best-effort)...")
        delete_drive_file(sender_drive, old_file_id)
        print("Delete Done")

        print("========== DRIVE COPY SUCCESS ==========")

        return {
            "new_file_id": new_file_id,
            "new_mime": upload_resp.get("mimeType"),
            "name": name,
        }

    except Exception as e:
        print("DRIVE COPY FAILED:", e)
        import traceback
        traceback.print_exc()
        raise

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                print("Temp file removed")
            except Exception as e:
                print("Temp cleanup failed:", e)





def revoke_share(connection_id, shared_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False):
    try:
        connection = Connection.objects.get(connection_id=connection_id)
        host_locker = Locker.objects.get(locker_id=host_locker)
        guest_locker = Locker.objects.get(locker_id=guest_locker)
        host_user = CustomUser.objects.get(user_id=host_user)
        guest_user = CustomUser.objects.get(user_id=guest_user)
        for vnode_id in shared_resources:
            vnode = Xnode_V2.objects.get(id=vnode_id)
            linked_xnode_id = vnode.node_information["link"]
            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)
            print("here 1")
            inode = access_Resource(xnode_id=vnode_id)
            document_name = None
            print("here 2")
            if inode:
                try:
                    resource = Resource.objects.get(
                        resource_id=inode.node_information.get("resource_id")
                    )
                    document_name = resource.document_name
                except Resource.DoesNotExist:
                    document_name = "Unknown Resource"
            print("here 3")
            action = "reverted" if is_revert else "revoked"
            notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has {action} access to the resource."

            #notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has revoked access to the resource."

            p_stack = get_provenance_stack(linked_xnode.id, connection_id, "Share", vnode_id)
            print("here 4")
            print(f"provenance: {p_stack}")
            print(f"vnode_list: {vnode.vnode_list}")
            if not vnode.vnode_list:
                print("here 4.1")
                Notification.objects.create(
                    connection=connection,
                    guest_user=host_user if not p_stack.get("reverse") else guest_user,
                    host_user=host_user if not p_stack.get("reverse") else guest_user,
                    guest_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    host_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    connection_type=connection.connection_type,
                    created_at=timezone.now(),
                    message=notification_message,
                )
                print(f"Notification sent to {host_user if not p_stack.get('reverse') else guest_user} for affected locker {host_locker if not p_stack.get('reverse') else guest_locker}")
            else:
                print("here 4.2")
                linked_vnodes = [{vnode_id:linked_xnode_id}]
                for v_id in vnode.vnode_list:
                    print("here 4.3")
                    v_node = Xnode_V2.objects.get(id=v_id)
                    link = v_node.node_information["link"]
                    linked_vnodes.append({int(v_id) : int(link)})
                
                delete_vnode(vnode_id, linked_vnodes, notification_message)
                # for k,v in linked_vnodes.items():
                #     print("here 4.4")
                #     if k not in linked_vnodes.values():
                #         continue
                #     else:
                #         k_xnode = Xnode_V2.objects.get(id=k)
                #         k_link_xnode = Xnode_V2.objects.get(id=v)
                #         print("here 4.5")
                #         k_link_p_stack = get_provenance_stack(k_link_xnode.id, connection_id, "Share", k)
                #         k_link_connection = Connection.objects.get(connection_id=k_link_p_stack.get("connection"))
                #         Notification.objects.create(
                #             connection=k_link_connection,
                #             guest_user= CustomUser.objects.get(user_id=k_link_p_stack.get("to_user")),
                #             host_user= CustomUser.objects.get(user_id=k_link_p_stack.get("to_user")),
                #             guest_locker= Locker.objects.get(locker_id=k_link_p_stack.get("to_locker")),
                #             host_locker= Locker.objects.get(locker_id=k_link_p_stack.get("to_locker")),
                #             connection_type=k_link_connection.connection_type,
                #             created_at=timezone.now(),
                #             message=notification_message,
                #         )
                #         print(f"Notification sent to {k_link_p_stack.get('to_user')} for affected locker {k_link_p_stack.get('to_locker')}")

                #         try:
                #             temp_id = linked_xnode_id    
                #             while True:
                #                 temp = Xnode_V2.objects.get(id=temp_id)
                #                 print("here 4.6")
                #                 if str(k) in map(str, temp.vnode_list):
                #                     temp.vnode_list = [v for v in temp.vnode_list if str(v) != str(k)]
                #                     temp.save(update_fields=["vnode_list"])
                #                 if temp.xnode_Type == Xnode_V2.XnodeType.INODE:
                #                     break
                #                 elif temp.xnode_Type == Xnode_V2.XnodeType.VNODE:
                #                     temp_id = temp.node_information["link"]
                #                 else:
                #                     break  # or raise an error if other types should not appear
                #         except Xnode_V2.DoesNotExist:
                #             return JsonResponse({"success": False, "error": "Inode does not exist"}, status=400)

                #         k_xnode.delete()
            
            print("here 5")
            try:
                temp_id = linked_xnode_id    
                while True:
                    temp = Xnode_V2.objects.get(id=temp_id)
                    print(f"vnode_id : {vnode_id} || vnode_list : {temp.vnode_list}")
                    if str(vnode_id) in map(str, temp.vnode_list):
                        temp.vnode_list = [v for v in temp.vnode_list if str(v) != str(vnode_id)]
                        temp.save(update_fields=["vnode_list"])
                    
                    if temp.xnode_Type == Xnode_V2.XnodeType.INODE:
                        print("break loop")
                        break
                    elif temp.xnode_Type == Xnode_V2.XnodeType.VNODE:
                        temp_id = temp.node_information["link"]
                    else:
                        break  # or raise an error if other types should not appear
            except Xnode_V2.DoesNotExist:
                return JsonResponse({"success": False, "error": "Inode does not exist"}, status=400)
            except Exception as e:
                return JsonResponse({"success": False, "error": e}, status=400)
            print("here 6")
            linked_xnode.post_conditions = p_stack.get("xnode_post_conditions")
            linked_xnode.save(update_fields=["post_conditions"])        
            print("here 7")
            remove_xnode_provenance_entry(
                xnode_instance = linked_xnode.id,
                connection_id = connection_id,
                from_user=host_user.user_id if p_stack.get("reverse") else guest_user.user_id,
                to_user=guest_user.user_id if p_stack.get("reverse") else host_user.user_id,
                from_locker=host_locker.locker_id if p_stack.get("reverse") else guest_locker.locker_id,
                to_locker=guest_locker.locker_id if p_stack.get("reverse") else host_locker.locker_id,
                type_of_share= "Share",
                xnode_id=vnode_id
            )
            print("here 8")
            vnode.delete()
            print("here 9")
        return JsonResponse({"success": True, "message": "Successfully revoked all shared resources"}, status=200)
    except Exception as e:
        print(e)
        return JsonResponse({"success": False, "error": e}, status=400)

##for drive file.
def revoke_collateral(
    connection_id,
    collateral_resources,
    host_user,
    host_locker,
    guest_user,
    guest_locker,
    is_revert=False
):
    try:
        print("========== REVOKE COLLATERAL START ==========")

        connection = Connection.objects.get(connection_id=connection_id)
        host_locker = Locker.objects.get(locker_id=host_locker)
        guest_locker = Locker.objects.get(locker_id=guest_locker)
        host_user = CustomUser.objects.get(user_id=host_user)
        guest_user = CustomUser.objects.get(user_id=guest_user)

        for inode_id in collateral_resources:
            print(f"\n[LOOP] inode_id={inode_id}")

            # ---------- OLD WORKING LOGIC (UNCHANGED) ----------
            snodes = Xnode_V2.objects.filter(
                Q(node_information__inode_or_snode_id=int(inode_id))
            )

            if len(snodes) != 1:
                return JsonResponse(
                    {"success": False, "error": "multiple or no snodes found"},
                    status=400,
                )

            snode = snodes.first()
            print(f"SNODE found: {snode.id}")

            linked_xnode_id = snode.node_information["inode_or_snode_id"]
            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)
            inode = linked_xnode
            print(f"INODE found: {inode.id}")

            # Resolve document name 
            resolved_inode = access_Resource(xnode_id=snode.id)
            document_name = "Unknown Resource"
            resource = None

            if resolved_inode:
                try:
                    resource = Resource.objects.get(
                        resource_id=resolved_inode.node_information.get("resource_id")
                    )
                    document_name = resource.document_name
                except Resource.DoesNotExist:
                    pass

            action = "reverted" if is_revert else "revoked"
            notification_message = (
                f"Resource '{document_name}' is no longer accessible. "
                f"It has been deleted because the owner has {action} access to the resource."
            )

            # Provenance stack 
            p_stack = get_provenance_stack(
                linked_xnode_id,
                connection.connection_id,
                "Collateral",
                snode.id,
            )

            if p_stack is None:
                return JsonResponse(
                    {"success": False, "error": "provenance is returning null"},
                    status=400,
                )

            print("Provenance:", p_stack)

            # ==================================================
            # DRIVE REVERT — CORRECT SOURCE SELECTION
            # ==================================================

            if resource and resource.i_node_pointer:
                old_file_id = resource.i_node_pointer
                print(f"[DRIVE] INODE resource_id={resource.resource_id}")
                print(f"[DRIVE] Old file ID={old_file_id}")

                # ALWAYS download from current owner (to_user)
                sender_user = CustomUser.objects.get(user_id=p_stack["to_user"])
                receiver_user = CustomUser.objects.get(user_id=p_stack["from_user"])

                sender_locker = Locker.objects.get(locker_id=p_stack["to_locker"])
                receiver_locker = Locker.objects.get(locker_id=p_stack["from_locker"])

                print(
                    f"[DRIVE] Revert direction: "
                    f"{sender_user.username} ➜ {receiver_user.username}"
                )

                try:
                    drive_resp = _drive_copy_return_new_file_id(
                        resource_obj=resource,
                        sender_user=sender_user,
                        receiver_user=receiver_user,
                        receiver_locker=receiver_locker,
                    )

                    new_file_id = drive_resp["new_file_id"]
                    print(f"[DRIVE] Revert success → new_file_id={new_file_id}")

                    # ---------- RESOURCE TABLE UPDATE ----------
                    resource.i_node_pointer = new_file_id
                    resource.owner = receiver_user
                    resource.locker = receiver_locker
                    resource.drive_owner_email = receiver_user.email
                    resource.save(
                        update_fields=[
                            "i_node_pointer",
                            "owner",
                            "locker",
                            "drive_owner_email",
                        ]
                    )

                    # ---------- INODE UPDATE ----------
                    inode.node_information["resourse_link"] = (
                        f"https://drive.google.com/file/d/{new_file_id}/preview"
                    )

                except Exception as e:
                    print("[REVOKE COLLATERAL ERROR]", e)


            # =======================NOTIFICATION===========================

            if not snode.vnode_list:
                Notification.objects.create(
                    connection=connection,
                    guest_user=host_user if not p_stack.get("reverse") else guest_user,
                    host_user=host_user if not p_stack.get("reverse") else guest_user,
                    guest_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    host_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    connection_type=connection.connection_type,
                    created_at=timezone.now(),
                    message=notification_message,
                    notification_type="node_deleted",
                    target_type="xnode",
                    target_id=str(snode.id),
                    extra_data={
                        "xnode_id": snode.id,
                        "xnode_type": snode.xnode_Type,
                        "locker_id": p_stack.get("to_locker"),
                        "locker_name": Locker.objects.get(
                            locker_id=p_stack.get("to_locker")
                        ).name,
                        "user_id": p_stack.get("to_user"),
                        "username": CustomUser.objects.get(
                            user_id=p_stack.get("to_user")
                        ).username,
                        "connection_id": connection.connection_id,
                        "connection_name": connection.connection_name,
                    },
                )
            else:
                linked_vnodes = [{snode.id: linked_xnode_id}]
                for v_id in snode.vnode_list:
                    v_node = Xnode_V2.objects.get(id=v_id)
                    link = v_node.node_information["link"]
                    linked_vnodes.append({int(v_id): int(link)})
                delete_vnode(snode.id, linked_vnodes, notification_message)

            # ---------- CLEAN INODE ----------
            if str(snode.id) in map(str, linked_xnode.snode_list):
                linked_xnode.snode_list = [
                    s for s in linked_xnode.snode_list if str(s) != str(snode.id)
                ]

            linked_xnode.locker = (
                host_locker if p_stack.get("reverse") else guest_locker
            )
            linked_xnode.connection = None
            linked_xnode.node_information["current_owner"] = (
                host_user.user_id if p_stack.get("reverse") else guest_user.user_id
            )
            linked_xnode.post_conditions = p_stack.get("xnode_post_conditions")

            linked_xnode.save(
                update_fields=[
                    "snode_list",
                    "post_conditions",
                    "node_information",
                    "connection",
                    "locker",
                ]
            )

            # ---------- REMOVE PROVENANCE ----------
            remove_xnode_provenance_entry(
                xnode_instance=linked_xnode.id,
                connection_id=connection.connection_id,
                from_user=host_user.user_id
                if p_stack.get("reverse")
                else guest_user.user_id,
                to_user=guest_user.user_id
                if p_stack.get("reverse")
                else host_user.user_id,
                from_locker=host_locker.locker_id
                if p_stack.get("reverse")
                else guest_locker.locker_id,
                to_locker=guest_locker.locker_id
                if p_stack.get("reverse")
                else host_locker.locker_id,
                type_of_share="Collateral",
                xnode_id=snode.id,
            )

            # ---------- DELETE SNODE ----------
            snode.delete()
            print(f"SNODE {snode.id} deleted")

        return JsonResponse(
            {"success": True, "message": "Successfully revoked all collateral resources"},
            status=200,
        )

    except Exception as e:
        print("[REVOKE COLLATERAL FATAL ERROR]", e)
        return JsonResponse({"success": False, "error": str(e)}, status=400)


def revoke_confer(connection_id, conferred_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False):
    try:
        connection = Connection.objects.get(connection_id=connection_id)
        host_locker = Locker.objects.get(locker_id=host_locker)
        guest_locker = Locker.objects.get(locker_id=guest_locker)
        host_user = CustomUser.objects.get(user_id=host_user)
        guest_user = CustomUser.objects.get(user_id=guest_user)
        print("1 here")
        for snode_id in conferred_resources:   
            snode = Xnode_V2.objects.get(id=snode_id)
            linked_xnode_id = snode.node_information["inode_or_snode_id"]
            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

            inode = access_Resource(xnode_id=snode_id)
            document_name = None

            if inode:
                try:
                    resource = Resource.objects.get(
                        resource_id=inode.node_information.get("resource_id")
                    )
                    document_name = resource.document_name
                except Resource.DoesNotExist:
                    document_name = "Unknown Resource"
            
            action = "reverted" if is_revert else "revoked"
            notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has {action} access to the resource."

            #notification_message = f"Resource '{document_name}' is no longer accessible. It has been deleted because the owner has revoked access to the resource."

            p_stack = get_provenance_stack(linked_xnode.id, connection.connection_id, "Confer", snode_id)

            if not snode.vnode_list:
                Notification.objects.create(
                    connection=connection,
                    guest_user=host_user if not p_stack.get("reverse") else guest_user,
                    host_user=host_user if not p_stack.get("reverse") else guest_user,
                    guest_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    host_locker=host_locker if not p_stack.get("reverse") else guest_locker,
                    connection_type=connection.connection_type,
                    created_at=timezone.now(),
                    message=notification_message,
                    notification_type="node_deleted",
                    target_type="xnode",
                    target_id=str(snode.id),
                    extra_data={
                        "xnode_id": snode.id,
                        "xnode_type": snode.xnode_Type,
                        "locker_id": p_stack.get("to_locker"),
                        "locker_name": Locker.objects.get(locker_id=p_stack.get("to_locker")).name,
                        "user_id": p_stack.get("to_user"),
                        "username": CustomUser.objects.get(user_id=p_stack.get("to_user")).username,
                        "connection_id": connection.connection_id,
                        "connection_name": connection.connection_name,
                    }
                )
                print(f"Notification sent to {host_user if not p_stack.get('reverse') else guest_user} for affected locker {host_locker if not p_stack.get('reverse') else guest_locker}")
            else:
                linked_vnodes = [{snode.id:linked_xnode_id}]
                for v_id in snode.vnode_list:
                    print("here 4.3")
                    v_node = Xnode_V2.objects.get(id=v_id)
                    link = v_node.node_information["link"]
                    linked_vnodes.append({int(v_id) : int(link)})
            
                delete_vnode(snode.id, linked_vnodes, notification_message)

            try:
                temp_id = linked_xnode.id    
                while True:
                    temp = Xnode_V2.objects.get(id=temp_id)
                    if str(snode_id) in map(str, temp.snode_list):
                        temp.snode_list = [s for s in temp.snode_list if str(s) != str(snode_id)]
                        temp.save(update_fields=["snode_list"])
                    
                    if temp.xnode_Type == Xnode_V2.XnodeType.INODE:
                        break
                    elif temp.xnode_Type == Xnode_V2.XnodeType.SNODE:
                        temp_id = temp.node_information["inode_or_snode_id"]
                    else:
                        break  # or raise an error if other types should not appear
            except Xnode_V2.DoesNotExist:
                return JsonResponse({"success": False, "error": "Inode does not exist"}, status=400)
            linked_xnode.locker = host_locker if p_stack.get("reverse") else guest_locker
            linked_xnode.connection = None
            linked_xnode.node_information["current_owner"] = host_user.user_id if p_stack.get("reverse") else guest_user.user_id
            linked_xnode.post_conditions = p_stack.get("xnode_post_conditions")

            linked_xnode.save()

            remove_xnode_provenance_entry(
                xnode_instance = linked_xnode.id,
                connection_id = connection_id,
                from_user=host_user.user_id if p_stack.get("reverse") else guest_user.user_id,
                to_user=guest_user.user_id if p_stack.get("reverse") else host_user.user_id,
                from_locker=host_locker.locker_id if p_stack.get("reverse") else guest_locker.locker_id,
                to_locker=guest_locker.locker_id if p_stack.get("reverse") else host_locker.locker_id,
                type_of_share= "Confer",
                xnode_id=snode_id
            )

            snode.delete()

        return JsonResponse({"success": True, "message": "Successfully revoked all shared resources"}, status=200) 
    except Exception as e:
        print(f"confer error: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=400)

def revoke(connection_id, host_user, host_locker, guest_user, guest_locker):
    try:
        connection = Connection.objects.get(connection_id=connection_id)
        shared_resources = []
        transferred_resources = []
        collateralled_resources = []
        conferred_resources = []
        
        # Your existing code to populate the resource lists...
        for terms in [connection.terms_value, connection.terms_value_reverse]:
            print(f"Termss:::: {terms}")
            for key, value in terms.items():
                if not isinstance(value, str) or '|' not in value or ';' not in value:
                    continue
                
                try:
                    part1, rest = value.split("|")
                    xnode_id, approval_status = rest.split(";")
                except ValueError:
                    continue
                if approval_status.strip() == "T":
                    conn_term = ConnectionTerms.objects.get(
                        conn_type_id=connection.connection_type_id,
                        data_element_name=key
                    )
                    if conn_term.sharing_type == "share":
                        shared_resources.append(xnode_id)
                    elif conn_term.sharing_type == "transfer":
                        transferred_resources.append(xnode_id)
                    elif conn_term.sharing_type == "collateral":
                        collateralled_resources.append(xnode_id)
                    elif conn_term.sharing_type == "confer":
                        conferred_resources.append(xnode_id)

        results = []
        
        if shared_resources:
            print(f"--------------------Revoking share: {shared_resources}")
            result = revoke_share(connection.connection_id, shared_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False)
            results.append(result)
        
        if collateralled_resources:
            print(f"--------------------Revoking Collateral: {collateralled_resources}")
            result = revoke_collateral(connection.connection_id, collateralled_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False)
            results.append(result)
        
        # if transferred_resources:
        #     print(f"--------------------Revoking transfer: {transferred_resources}")
        #     result = revoke_transfer(connection.connection_id, transferred_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False)
        #     results.append(result)
        
        if conferred_resources:
            print(f"--------------------Revoking confer: {conferred_resources}")
            result = revoke_confer(connection.connection_id, conferred_resources, host_user, host_locker, guest_user, guest_locker,is_revert=False)
            results.append(result)
        
        for result in results:
            if result.status_code != 200:
                return result
        
        return JsonResponse({"success": True, "message": "Successfully revoked all resources"}, status=200)
        
    except Exception as e:
        print(f"revoke error: {e}")
        return JsonResponse({"success": False, "error": str(e)}, status=400)

@extend_schema(
    summary="Revoke consent",
    description="Revoke consent for a connection. This action can be performed by either the host or the guest. It updates the connection status and may trigger resource revocation.",
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "connection_type_name": {"type": "string"},
                "guest_username": {"type": "string"},
                "guest_lockername": {"type": "string"},
                "host_username": {"type": "string"},
                "host_lockername": {"type": "string"},
            },
            "required": ["connection_name", "connection_type_name", "guest_username", "guest_lockername", "host_username", "host_lockername"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Consent revoked successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid request, missing fields, or error during revocation"),
        401: OpenApiResponse(description="User not authenticated"),
        403: OpenApiResponse(description="Permission denied or waiting for other party"),
        404: OpenApiResponse(description="Connection, user, or locker not found"),
        405: OpenApiResponse(description="Method not allowed"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def revoke_consent(request):
    """
    Revoke for a connection.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - connection_name: The name of the connection.
    - connection_type_name: The name of the connection type.
    - guest_username: The username of the guest user.
    - guest_lockername: The name of the guest locker.
    - host_username: The username of the host user.
    - host_lockername: The name of the host locker.

    Returns:
    - JsonResponse: A JSON object containing a success message or an error message.

    Response Codes:
    - 200: Successful revocation of consent.
    - 400: Bad request (if data is invalid or connection not found).
    - 401: User not authenticated.
    - 403: Permission denied.
    - 404: Connection or user or locker not found.
    - 405: Request method not allowed (if not POST).
    """
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    if not request.user.is_authenticated:
        return JsonResponse(
            {"success": False, "error": "User not authenticated"}, status=401
        )
    
    print("-----------------------------------------------------------")
    print(f"Connection name: {request.POST.get('connection_name')}")
    print(f"Connection type name: {request.POST.get('connection_type_name')}")
    print(f"Guest username: {request.POST.get('guest_username')}")
    print(f"Guest lockername: {request.POST.get('guest_lockername')}")
    print(f"Host username: {request.POST.get('host_username')}")
    print(f"Host lockername: {request.POST.get('host_lockername')}")

    # Extract form data
    connection_name = request.POST.get("connection_name")
    connection_type_name = request.POST.get("connection_type_name")
    guest_username = request.POST.get("guest_username")
    guest_lockername = request.POST.get("guest_lockername")
    host_username = request.POST.get("host_username")
    host_lockername = request.POST.get("host_lockername")

    # Check if all required fields are present
    # Required fields and their values
    required_fields = {
        "connection_name": connection_name,
        "connection_type_name": connection_type_name,
        "guest_username": guest_username,
        "guest_lockername": guest_lockername,
        "host_username": host_username,
        "host_lockername": host_lockername,
    }

    # Check if all required fields are present
    if None in [
        connection_name,
        connection_type_name,
        guest_username,
        guest_lockername,
        host_username,
        host_lockername,
    ]:
        return JsonResponse(
            {"success": False, "error": "All fields are required"}, status=400
        )

    try:
        # Retrieve the guest user and guest locker
        guest_user = CustomUser.objects.get(username=guest_username)
        guest_locker = Locker.objects.get(name=guest_lockername, user=guest_user)

        # Retrieve the host user and host locker
        host_user = CustomUser.objects.get(username=host_username)
        host_locker = Locker.objects.get(name=host_lockername, user=host_user)

        # Retrieve the connection type
        try:
            connection_type = ConnectionType.objects.get(
                connection_type_name__iexact=connection_type_name
            )
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "error": f"Connection type not found: {connection_type_name}",
                },
                status=404,
            )

        # Retrieve the connection
        try:
            connection = Connection.objects.get(
                connection_name=connection_name,
                connection_type_id=connection_type,
                guest_user=guest_user,
                host_user=host_user,
                guest_locker=guest_locker,
                host_locker=host_locker
            )
        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found"}, status=404
            )

        # Check if the requesting user is either the host or guest user
        if request.user != host_user and request.user != guest_user:
            return JsonResponse(
                {"success": False, "error": "Permission denied"}, status=403
            )
        
        #check if connection is closed
        # if connection.connection_status != "closed":
        #     return JsonResponse({"message":"Conection needs to be closed to revoke."},status=400)

        # Set requester_consent to False
        connection.requester_consent = False

        if request.user == guest_user:
            connection.revoke_guest = True
        else:
            connection.revoke_host = True

        # Save the connection
        connection.save(update_fields=["requester_consent", "revoke_guest", "revoke_host"])

        # Check modality
        terms = ConnectionTerms.objects.filter(conn_type=connection.connection_type)
        forbidden = any(term.modality.lower() == "forbidden" for term in terms)
        
        if forbidden:
            if connection.revoke_guest and not connection.revoke_host:
                return JsonResponse({"success": False, "error": "Guest has revoked. Waiting for Host to revoke."},status=403)
            elif connection.revoke_host and not connection.revoke_guest:
                return JsonResponse({"success": False, "error": "Host has revoked. Waiting for Guest to revoke."},status=403)
            elif connection.revoke_guest and connection.revoke_host:
                print("--------------------Revoking both guest and host")
                revoke(connection.connection_id, host_user.user_id, host_locker.locker_id, guest_user.user_id, guest_locker.locker_id)
                connection.connection_status = 'revoked'
                connection.save(update_fields=["connection_status"])
        else:
            print("+++++++++++++++Revoking both guest and host")
            revoke(connection.connection_id, host_user.user_id, host_locker.locker_id, guest_user.user_id, guest_locker.locker_id)
            connection.connection_status = 'revoked'
            connection.save(update_fields=["connection_status"])

        # if request.user != guest_user:
        #     connection.revoke_guest = True
        #     connection.save(update_fields=["revoke_guest"])
        # else:
        #     connection.revoke_host = True
        #     connection.save(update_fields=["revoke_host"])

        # connection.close_guest = True
        # connection.close_host = True
        # connection.connection_status = 'closed'

        # connection.save(update_fields=["connection_status", "close_host", "close_guest"])


        return JsonResponse(
            {"success": True, "message": "Consent revoked successfully"}, status=200
        )

    except CustomUser.DoesNotExist as e:
        return JsonResponse(
            {"success": False, "error": f"User not found: {str(e)}"}, status=404
        )
    except Locker.DoesNotExist as e:
        return JsonResponse(
            {"success": False, "error": f"Locker not found: {str(e)}"}, status=404
        )
    except Exception as e:
        return JsonResponse(
            {"success": False, "error": f"An error occurred: {str(e)}"}, status=400
        )




#revert use xnode table
@extend_schema(
    summary="Revert consent for a specific resource",
    description="Revert consent for a shared resource (Xnode). This effectively undoes the sharing, transferring, conferring, or collateralizing of a resource.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "xnode_id": {"type": "integer"},
                "revert_reason": {"type": "string"},
            },
            "required": ["xnode_id"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Consent reverted successfully or request sent",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid request, missing xnode_id, or error during revert"),
        403: OpenApiResponse(description="Permission denied"),
        404: OpenApiResponse(description="Xnode or connection not found"),
    },
)
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def revert_consent(request):
    print("Revert Consent Initiated")

    user = request.user
    xnode_id = request.data.get("xnode_id")
    reason = request.data.get("revert_reason", "").strip()

    if not xnode_id:
        return JsonResponse({"success": False, "error": "Missing xnode_id"})

    try:
        xnode = Xnode_V2.objects.get(id=xnode_id)
        print(f"Xnode {xnode_id} found")
    except Xnode_V2.DoesNotExist:
        return JsonResponse({"success": False, "error": "Xnode not found"})

    connection = xnode.connection
    if not connection:
        fallback_id = xnode.node_information.get("inode_or_snode_id") or xnode.node_information.get("link")
        if fallback_id:
            try:
                parent_xnode = Xnode_V2.objects.get(id=fallback_id)
                if parent_xnode.connection:
                    xnode = parent_xnode
                    connection = xnode.connection
                    print("Fallback to parent xnode")
            except Exception as e:
                print("Fallback failed:", str(e))

    if not connection:
        return JsonResponse({"success": False, "error": "No connection associated with this consent"})

    host_user = connection.host_user
    guest_user = connection.guest_user
    host_locker = connection.host_locker
    guest_locker = connection.guest_locker

    if user != host_user and user != guest_user:
        return JsonResponse({"success": False, "error": "only Host or Guest can revert"}, status=403)

    def detect_share_type(x):
        def all_terms_dicts():
            for terms in [connection.terms_value, connection.terms_value_reverse]:
                if not isinstance(terms, dict):
                    continue
                merged = dict(terms)
                if "canShareMoreData" in terms and isinstance(terms["canShareMoreData"], dict):
                    merged.update(terms["canShareMoreData"])
                yield merged

        for terms_dict in all_terms_dicts():
            for key, value in terms_dict.items():
                try:
                    if isinstance(value, str):
                        # Regular top-level case
                        _, rest = value.split("|")
                        term_xnode_id, approval = rest.split(";")
                        if term_xnode_id.strip() == str(x.id) and approval.strip() == "T":
                            conn_term = ConnectionTerms.objects.get(
                                conn_type_id=connection.connection_type_id,
                                data_element_name=key
                            )
                            return conn_term.sharing_type
                    elif isinstance(value, dict):
                        # Nested case from canShareMoreData
                        enter_val = value.get("enter_value", "")
                        type_of_share = value.get("typeOfShare", "").lower()
                        _, rest = enter_val.split("|")
                        term_xnode_id, approval = rest.split(";")
                        if term_xnode_id.strip() == str(x.id) and approval.strip() == "T":
                            return type_of_share  # Directly return type from dict
                except Exception as e:
                    print(f"warning while parsing term: {e}")
                    continue
        return None


    share_type = detect_share_type(xnode)

    # Final fallback to parent
    if not share_type:
        fallback_id = xnode.node_information.get("inode_or_snode_id") or xnode.node_information.get("link")
        if fallback_id:
            try:
                parent_xnode = Xnode_V2.objects.get(id=fallback_id)
                share_type = detect_share_type(parent_xnode)
                if share_type:
                    xnode = parent_xnode
                    print("Final fallback to parent xnode for share_type detection")
            except:
                pass

    if not share_type:
        return JsonResponse({"success": False, "error": "No share type found for this resource"})

    print(f" Detected share_type = {share_type}")

    document_name = "Unknown Resource"
    inode = access_Resource(xnode_id=xnode.id)
    if inode:
        try:
            res_id = inode.node_information.get("resource_id")
            resource = Resource.objects.get(resource_id=res_id)
            document_name = resource.document_name
        except:
            pass

    is_host = user == host_user
    target_user = guest_user if is_host else host_user
    target_locker = guest_locker if is_host else host_locker
    user_locker = host_locker if is_host else guest_locker

    # Collateral logic
    if share_type.lower() == "collateral":

        # Prepare list of nodes to update: original xnode + linked node from same collateral
        xnodes_to_update = [xnode]  # Always include the request node

        # Check if revert already requested by this user
        pending_user = guest_user.username if is_host else host_user.username
        already_requested = ((is_host and xnode.host_revert_status == 1) or(not is_host and xnode.guest_revert_status == 1))
        if already_requested:
            return JsonResponse({
                "success": False,
                "message": f"You've already sent a revert request. Waiting for approval from '{pending_user}'."
            })


        # Handle parent → child
        if xnode.xnode_Type in [Xnode_V2.XnodeType.INODE, Xnode_V2.XnodeType.SNODE]:
            possible_children = Xnode_V2.objects.filter(connection=connection, xnode_Type="SNODE")
            for child in possible_children:
                if str(child.node_information.get("inode_or_snode_id")) == str(xnode.id):
                    print("Matched child node:", child.id)
                    xnodes_to_update.append(child)
                    break

        # Handle child → parent
        if xnode.xnode_Type == Xnode_V2.XnodeType.SNODE:
            parent_id = xnode.node_information.get("inode_or_snode_id")
            if parent_id:
                try:
                    parent_node = Xnode_V2.objects.get(id=parent_id, connection=connection)
                    print("Matched parent node:", parent_node.id)
                    xnodes_to_update.append(parent_node)
                except Xnode_V2.DoesNotExist:
                    print("No parent node found for id:", parent_id)

        #debug logic            
        print("Final nodes to update:")
        for node in xnodes_to_update:
            print("Updating:", node.id, "Type:", node.xnode_Type)

        # Now update flags on all involved nodes
        for node in xnodes_to_update:
            if is_host:
                if node.host_revert_status != 1:
                    node.host_revert_status = 1
            else:
                if node.guest_revert_status != 1:
                    node.guest_revert_status = 1
            node.save(update_fields=["host_revert_status", "guest_revert_status"])

        # If both parties approved, revoke and mark as reverted
        main_node = xnodes_to_update[0]
        if main_node.host_revert_status == 1 and main_node.guest_revert_status == 1 and not main_node.reverted:
            revoke_collateral(
                connection.connection_id,
                [node.id for node in xnodes_to_update],
                host_user.user_id, host_locker.locker_id,
                guest_user.user_id, guest_locker.locker_id,
                is_revert=True
            )

            # Update old notification_type after success
            notif_to_update = None
            for node in xnodes_to_update:
                notif = Notification.objects.filter(
                    target_id=str(node.id),
                    target_type="xnode",
                    connection=connection,
                    notification_type="revert_approval_pending"
                ).order_by("-created_at").first()

                if notif:
                    notif_to_update = notif
                    print(f"Found revert notification for node {node.id}")
                    break

            if notif_to_update:
                notif_to_update.notification_type = "revert_approved_or_rejected"
                notif_to_update.save()
                print("Notification updated.")
            else:
                print("No revert notification found to update.")

            #rest the xnode flag after successfull revert 
            for node in xnodes_to_update:
                # Check if node still exists before trying to save
                if not Xnode_V2.objects.filter(id=node.id).exists():
                    print(f"Node {node.id} was deleted. Skipping save.")
                    continue

                node.host_revert_status = 0
                node.guest_revert_status = 0
                node.save(update_fields=["host_revert_status", "guest_revert_status"])

            return JsonResponse({
                "success": True,
                "message": "Collateral consent successfully reverted."
            })

           # return JsonResponse({"success": True, "message": "Collateral consent has been successfully reverted by both parties."})

        # First revert request → notify the other party
        if (is_host and xnode.guest_revert_status == 0) or (not is_host and xnode.host_revert_status == 0):
            Notification.objects.create(
                connection=connection,
                host_user=target_user,
                guest_user=user,
                host_locker=target_locker,
                guest_locker=user_locker,
                connection_type=connection.connection_type,
                created_at=timezone.now(),
                message=f"User '{user.username}' has requested to withdraw the collateral provided for the consent '{document_name}'. Please review and approve or reject the request.",
                notification_type="revert_approval_pending",
                target_type="xnode",
                target_id=str(xnode.id),
                extra_data={
                    "xnode_id": xnode.id,
                    "connection_id": connection.connection_id,
                    "revert_reason": reason,
                    "resource_name": document_name,
                        "user_details": {
                            "id": user.user_id,
                            "username": user.username,
                            "description": getattr(user, "description", ""),
                            "user_type": getattr(user, "user_type", "user"),
                        },
                }
            )

        waiting_for = guest_user.username if is_host else host_user.username
        return JsonResponse({
            "success": True,
            "message": f"Revert request sent by '{user.username}'. Waiting for approval from '{waiting_for}'."
        })

    # Non-collateral → immediate revert
    print(f"Creating revert for non-collateral: {xnode.id} {connection.connection_id}")
    if share_type == "share":
        revoke_share(connection.connection_id, [xnode.id], host_user.user_id,
                     host_locker.locker_id, guest_user.user_id, guest_locker.locker_id,
                     is_revert=True)
    elif share_type == "confer":
        revoke_confer(connection.connection_id, [xnode.id], host_user.user_id,
                      host_locker.locker_id, guest_user.user_id, guest_locker.locker_id,
                      is_revert=True)
    # elif share_type == "transfer":
    #     revoke_transfer(...)
    else:
        return JsonResponse({"success": False, "error": f"Unsupported share_type: {share_type}"})

    return JsonResponse({"success": True, "message": f"{share_type.capitalize()} consent reverted successfully."})
