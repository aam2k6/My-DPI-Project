
import json
from http import HTTPStatus
from django.http import JsonResponse,HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from api.models import Locker, CustomUser, Connection, Resource, Notification, ConnectionType, ConnectionTerms
from api.model.xnode_model import Xnode_V2
from api.utils.resource_helper.access_resource_helper import access_Resource
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from api.utils.xnode.xnode_helper import get_defalut_validity

from django.db import transaction
#from api.utils.google_drive_helper.drive_helper import _drive_copy_return_new_file_id
from api.utils.google_drive_helper.drive_helper import (
    add_drive_permission, get_or_refresh_google_token,
    try_transfer_ownership_via_permission, download_file_to_temp,
    upload_file_from_temp, delete_drive_file, get_file_metadata,
    _drive_copy_return_new_file_id # Add this
)


@extend_schema(
    summary="Approve collateral resource (Guest to Host)",
    description="Pledge resources from a guest locker as collateral for a host locker according to connection terms. Creates an SNODE in the guest locker and transfers ownership of the resource to the host.",
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
            description="Resources pledged successfully",
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
        500: OpenApiResponse(description="Internal server error"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def collateral_resource(request: HttpRequest) -> JsonResponse:
    """
    Expected JSON data (form data):
    connection_name,
    host_locker_name,
    guest_locker_name,
    host_user_username,
    guest_user_username,
    validity_until
    """
    if request.method == "POST":
        try:
            # Parse JSON input
            body = json.loads(request.body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            guest_locker_name = body.get("guest_locker_name")
            host_user_username = body.get("host_user_username")
            guest_user_username = body.get("guest_user_username")
            validity_until = body.get("validity_until")

            # Check if all required fields are present
            if not all([
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
                validity_until,
            ]):
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

        # Helper function to process sharable entries
        def do_collateral(key, value):
            """Handles the logic of sharing a file based on a single entry."""
            print(f"Checking key: {key}, value: {value}")  # Debugging output


            if "|" in value and (value.endswith(";T") or value.endswith("; T")):
                try:
                    parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
                    parts = parts_T.split("|")  # Split by '|'

                    if len(parts) >= 2:
                        document_name, xnode_id = parts[:2]  # Extract document name and xnode_id
                        xnode_id = xnode_id.strip()  # Ensure xnode_id is clean
                        print(f"Document: {document_name}, Xnode ID: {xnode_id}")  # Debugging output

                    # Getting the original Inode
                    # Resolve INODE
                    # ------------------------------------
                    xnode = Xnode_V2.objects.get(id=xnode_id)

                    # ------------------------------------
                    # DRIVE TRANSFER (OUTSIDE TRANSACTION)
                    # ------------------------------------
                    new_file_id = None

                    if xnode.xnode_Type == Xnode_V2.XnodeType.INODE:
                        print("INODE detected, resolving resource")

                        inode = access_Resource(xnode_id=xnode.id)
                        resource_id = inode.node_information["resource_id"]

                        resource_obj = Resource.objects.get(resource_id=resource_id)

                        if resource_id not in processed_resources:
                            print(f"Drive copy started for resource_id: {resource_id}")

                            drive_res = _drive_copy_return_new_file_id(
                                resource_obj=resource_obj,
                                sender_user=guest_user,
                                receiver_user=host_user,
                                receiver_locker=host_locker,
                            )

                            new_file_id = drive_res["new_file_id"]
                            processed_resources[resource_id] = new_file_id

                            print(f"Drive copy completed, new_file_id: {new_file_id}")

                            # Update Resource (physical pointer)
                            with transaction.atomic():
                                resource_obj.i_node_pointer = new_file_id
                                resource_obj.locker = host_locker
                                resource_obj.drive_owner_email = host_user.email
                                if hasattr(resource_obj, "owner"):
                                    resource_obj.owner = host_user
                                resource_obj.save()

                        else:
                            new_file_id = processed_resources[resource_id]
                            print(f"Reusing existing Drive file: {new_file_id}")

                    # ------------------------------------
                    # DATABASE CONSISTENCY BLOCK
                    # ------------------------------------
                    with transaction.atomic():

                        xnode = Xnode_V2.objects.select_for_update().get(id=xnode_id)

                        # safety
                        if not isinstance(xnode.provenance_stack, list):
                            xnode.provenance_stack = []
                        if not isinstance(xnode.snode_list, list):
                            xnode.snode_list = []

                        # Update INODE physical metadata
                        if new_file_id:
                            xnode.node_information["resourse_link"] = (
                                f"https://drive.google.com/file/d/{new_file_id}/preview"
                            )
                        # --------------------------------
                        # PROVENANCE
                        # --------------------------------
                        new_entry = {
                            "connection": connection.connection_id,
                            "from_locker": guest_locker.locker_id,
                            "to_locker": host_locker.locker_id,
                            "from_user": guest_user.user_id,
                            "to_user": host_user.user_id,
                            "type_of_share": "Collateral",
                            "xnode_id": 0,
                            "xnode_post_conditions": xnode.post_conditions,
                            "reverse": False,
                        }

                        xnode.provenance_stack.insert(0, new_entry)

                        xnode.locker = host_locker
                        xnode.connection = connection
                        xnode.node_information["current_owner"] = host_user.user_id

                        xnode.save(update_fields=[
                            "provenance_stack",
                            "locker",
                            "connection",
                            "node_information",
                        ])

                        # --------------------------------
                        # PREPARE SNODE POST CONDITIONS
                        # --------------------------------
                        post_conditions = {**xnode.post_conditions}
                        creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                        for k in ["subset"]:
                            post_conditions[k] = False
                            creator_conditions[k] = False

                        post_conditions["creator_conditions"] = creator_conditions

                        # --------------------------------
                        # CREATE SNODE
                        # --------------------------------
                        xnode_created_Snode = Xnode_V2.objects.create(
                            creator=host_user.user_id,
                            locker=guest_locker,
                            connection=connection,
                            created_at=timezone.now(),
                            post_conditions=post_conditions,
                            validity_until=get_defalut_validity(),
                            xnode_Type=Xnode_V2.XnodeType.SNODE,
                        )

                        xnode_created_Snode.node_information = {
                            "inode_or_snode_id": xnode.id,
                            "resource_id": xnode.node_information["resource_id"],
                            "reverse": False,
                            "primary_owner": host_user.user_id,
                            "current_owner": guest_user.user_id,
                        }
                        xnode_created_Snode.save()

                        # --------------------------------
                        # LINK + BACKFILL
                        # --------------------------------
                        xnode.snode_list.insert(0, xnode_created_Snode.id)
                        xnode.provenance_stack[0]["xnode_id"] = xnode_created_Snode.id

                        xnode.save(update_fields=["snode_list", "provenance_stack"])

                    # ------------------------------------
                    # LOCK FLAGS (SAFE OUTSIDE TX)
                    # ------------------------------------
                    is_locked = {}
                    post_conditions = xnode.post_conditions or {}

                    for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                        is_locked[k] = not post_conditions.get(k, False)

                    xnode_created_Snode.is_locked = is_locked
                    xnode_created_Snode.save(update_fields=["is_locked"])

                    return True
                    

                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    return JsonResponse({"error": f"Error processing entry {key}: {e}"}, status=400)
            return False
                    
        # Start processing all entries
        collateral_success = False
        processed_resources = {}
        terms = connection.terms_value or {}
        resources = connection.resources.get("Collateral", [])

        # Top-level terms
        for key, value in terms.items():
            if key == "canShareMoreData":
                continue
            resource_name_in_value = value.split("|")[0].strip()
            status = value.split(";")[1].strip()
            for resource in resources:
                collateral_resource = resource.split("|")[0].strip()
                if collateral_resource == resource_name_in_value and status == "T":
                    result = do_collateral(key, value)
                    if isinstance(result, JsonResponse):
                        return result  # error returned
                    if result is True:
                        collateral_success = True

        # Nested entries: canShareMoreData
        can_share_more_data = connection.terms_value.get("canShareMoreData", {})
        for nested_key, nested_value in can_share_more_data.items():
            sharing_value = nested_value.get("enter_value")
            if sharing_value:
                resource_name_in_value = sharing_value.split("|")[0].strip()
                status = sharing_value.split(";")[1].strip()
                for resource in resources:
                    collateral_resource = resource.split("|")[0].strip()
                    if collateral_resource == resource_name_in_value and status == "T":
                        result = do_collateral(nested_key, sharing_value)
                        if isinstance(result, JsonResponse):
                            return result  # error returned
                        if result is True:
                            collateral_success = True

        # Final response
        if collateral_success:
            return JsonResponse({"success": True, "message": "Eligible resources pledged successfully"}, status=200)
        else:
            return JsonResponse({"success": False, "error": "No eligible file resource found for pledging"}, status=400)


    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)


@extend_schema(
    summary="Approve collateral resource (Host to Guest)",
    description="Pledge resources from a host locker as collateral for a guest locker according to connection terms. Creates an SNODE in the host locker and transfers ownership of the resource to the guest.",
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
            description="Resources pledged successfully",
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
        500: OpenApiResponse(description="Internal server error"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def collateral_resource_reverse(request: HttpRequest) -> JsonResponse:
    """
    Expected JSON data (form data):
    connection_name,
    host_locker_name,
    guest_locker_name,
    host_user_username,
    guest_user_username,
    validity_until
    """
    if request.method == "POST":
        try:
            # Parse JSON input
            body = json.loads(request.body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            guest_locker_name = body.get("guest_locker_name")
            host_user_username = body.get("host_user_username")
            guest_user_username = body.get("guest_user_username")
            validity_until = body.get("validity_until")

            # Check if all required fields are present
            if not all(
                [
                    connection_name,
                    host_locker_name,
                    guest_locker_name,
                    host_user_username,
                    guest_user_username,
                    validity_until,
                ]
            ):
                return JsonResponse(
                    {"success": False, "error": "All fields are required"}, status=400
                )

            # Fetch necessary objects
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )

        except (
            Connection.DoesNotExist,
            Locker.DoesNotExist,
            CustomUser.DoesNotExist,
        ) as e:
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            return JsonResponse(
                {"success": False, "error": "Invalid JSON format"}, status=400
            )

        # Debug: Print the connection.terms_value and connection.resources for inspection
        print("terms_value:", connection.terms_value_reverse)
        print("resources:", connection.resources)

        # if connection.connection_type.post_conditions["collateral"] == False:
        #     return JsonResponse({"success": False, "error": "Collateral not allowed in this connection"}, status=400)
        
        # Helper function to process sharable entries
        def do_collateral_reverse(key, value):
   

            if "|" in value and (value.endswith(";T") or value.endswith("; T")):
                try:
                    parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
                    parts = parts_T.split("|")  # Split by '|'

                    if len(parts) >= 2:
                        document_name, xnode_id = parts[:2]  # Extract document name and xnode_id
                        xnode_id = xnode_id.strip()  # Ensure xnode_id is clean
                        print(f"Document: {document_name}, Xnode ID: {xnode_id}")  # Debugging output

                   # Getting the original Inode
                    # Resolve INODE
                    # ------------------------------------
                    xnode = Xnode_V2.objects.get(id=xnode_id)

                    # ------------------------------------
                    # DRIVE TRANSFER (OUTSIDE TRANSACTION)
                    # ------------------------------------
                    new_file_id = None

                    if xnode.xnode_Type == Xnode_V2.XnodeType.INODE:
                        print("INODE detected, resolving resource")

                        inode = access_Resource(xnode_id=xnode.id)
                        resource_id = inode.node_information["resource_id"]

                        resource_obj = Resource.objects.get(resource_id=resource_id)

                        if resource_id not in processed_resources:
                            print(f"Drive copy started for resource_id: {resource_id}")

                            drive_res = _drive_copy_return_new_file_id(
                                resource_obj=resource_obj,
                                sender_user=host_user,
                                receiver_user=guest_user,
                                receiver_locker=guest_locker,
                            )

                            new_file_id = drive_res["new_file_id"]
                            processed_resources[resource_id] = new_file_id

                            print(f"Drive copy completed, new_file_id: {new_file_id}")

                            # Update Resource (physical pointer)
                            with transaction.atomic():
                                resource_obj.i_node_pointer = new_file_id
                                resource_obj.locker = guest_locker
                                resource_obj.drive_owner_email = guest_user.email
                                if hasattr(resource_obj, "owner"):
                                    resource_obj.owner = guest_user
                                resource_obj.save()

                        else:
                            new_file_id = processed_resources[resource_id]
                            print(f"Reusing existing Drive file: {new_file_id}")

                    # ------------------------------------
                    # DATABASE CONSISTENCY BLOCK
                    # ------------------------------------
                    with transaction.atomic():

                        xnode = Xnode_V2.objects.select_for_update().get(id=xnode_id)

                        # safety
                        if not isinstance(xnode.provenance_stack, list):
                            xnode.provenance_stack = []
                        if not isinstance(xnode.snode_list, list):
                            xnode.snode_list = []

                        # Update INODE physical metadata
                        if new_file_id:
                            xnode.node_information["resourse_link"] = (
                                f"https://drive.google.com/file/d/{new_file_id}/preview"
                            )
                        # --------------------------------
                        # PROVENANCE
                        # --------------------------------
                        new_entry = {
                            "connection": connection.connection_id,
                            "from_locker": host_locker.locker_id,
                            "to_locker": guest_locker.locker_id,
                            "from_user": host_user.user_id,
                            "to_user": guest_user.user_id,
                            "type_of_share": "Collateral",
                            "xnode_id": 0,
                            "xnode_post_conditions": xnode.post_conditions,
                            "reverse": True,
                        }

                        xnode.provenance_stack.insert(0, new_entry)

                        xnode.locker = guest_locker
                        xnode.connection = connection
                        xnode.node_information["current_owner"] = guest_user.user_id

                        xnode.save(update_fields=[
                            "provenance_stack",
                            "locker",
                            "connection",
                            "node_information",
                        ])

                        # --------------------------------
                        # PREPARE SNODE POST CONDITIONS
                        # --------------------------------
                        post_conditions = {**xnode.post_conditions}
                        creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                        for k in ["subset"]:
                            post_conditions[k] = False
                            creator_conditions[k] = False

                        post_conditions["creator_conditions"] = creator_conditions

                        xnode_created_Snode = Xnode_V2.objects.create(
                            creator= guest_user.user_id,
                            locker=host_locker,
                            connection=connection,
                            created_at=timezone.now(),
                            post_conditions=post_conditions,
                            validity_until=get_defalut_validity(),
                            xnode_Type=Xnode_V2.XnodeType.SNODE,
                        )
                        xnode_created_Snode.node_information={
                                "inode_or_snode_id": xnode.id,
                                "resource_id": xnode.node_information["resource_id"],
                                "reverse": True,
                                "method_name":{},
                                "method_params":{},
                                "primary_owner": guest_user.user_id,
                                "current_owner": host_user.user_id,
                            }
                        xnode_created_Snode.save()
                        xnode.snode_list.insert(0, xnode_created_Snode.id)
                        # xnode.provenance_stack.insert(0, {"locker": host_locker.locker_id, "connection": connection.connection_id, "user": host_user.user_id})
                        xnode.save()

                        # Set is_locked on SNODE based on INODE's post_conditions
                        post_conditions = xnode.post_conditions or {}
                        is_locked = {}

                        for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                            is_locked[key] = not post_conditions.get(key, False)

                        xnode_created_Snode.is_locked = is_locked
                        xnode_created_Snode.save(update_fields=["is_locked"])
                        print(f"Updated is_locked for SNODE {xnode_created_Snode.id}: {is_locked}")
                        xnode.provenance_stack[0]["xnode_id"] = xnode_created_Snode.id
                        xnode.save(update_fields=["provenance_stack"])
                        print(f"updated provenance stack of xnode:{xnode.provenance_stack[0]['xnode_id']}")

                        return True

                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    return JsonResponse({"error": f"Error processing entry {key}: {e}"}, status=400)
            return False

        
        # Start processing all entries
        collateral_success = False
        processed_resources = {}
        terms = connection.terms_value_reverse or {}
        resources = connection.resources.get("Collateral", [])

        # Top-level terms
        for key, value in terms.items():
            if key == "canShareMoreData":
                continue
            resource_name_in_value = value.split("|")[0].strip()
            status = value.split(";")[1].strip()
            for resource in resources:
                collateral_resource = resource.split("|")[0].strip()
                if collateral_resource == resource_name_in_value and status == "T":
                    result = do_collateral_reverse(key, value)
                    if isinstance(result, JsonResponse):
                        return result  # error returned
                    if result is True:
                        collateral_success = True

        # Nested entries: canShareMoreData
        can_share_more_data = connection.terms_value_reverse.get("canShareMoreData", {})
        for nested_key, nested_value in can_share_more_data.items():
            sharing_value = nested_value.get("enter_value")
            if sharing_value:
                resource_name_in_value = sharing_value.split("|")[0].strip()
                status = sharing_value.split(";")[1].strip()
                for resource in resources:
                    collateral_resource = resource.split("|")[0].strip()
                    if collateral_resource == resource_name_in_value and status == "T":
                        result = do_collateral_reverse(nested_key, sharing_value)
                        if isinstance(result, JsonResponse):
                            return result  # error returned
                        if result is True:
                            collateral_success = True

        # Final response
        if collateral_success:
            return JsonResponse({"success": True, "message": "Eligible resources pledged successfully"}, status=200)
        else:
            return JsonResponse({"success": False, "error": "No eligible file resource found for pledging"}, status=400)


    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )
