
import json
from django.http import JsonResponse,HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.models import Locker, CustomUser, Connection, Resource, Notification, ConnectionType, ConnectionTerms
from api.model.xnode_model import Xnode_V2
from api.utils.xnode.xnode_helper import NodeLockChecker  # Import NodeLockChecker
from api.utils.resource_helper.access_resource_helper import access_Resource
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes


#share approve GUEST TO HOST
@extend_schema(
    summary="Approve resource share (Guest to Host)",
    description="Approve and process data sharing from a guest locker to a host locker based on connection terms.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "host_locker_name": {"type": "string"},
                "guest_locker_name": {"type": "string"},
                "host_user_username": {"type": "string"},
                "guest_user_username": {"type": "string"},
            },
            "required": ["connection_name", "host_locker_name", "guest_locker_name", "host_user_username", "guest_user_username"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Resources shared successfully",
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
def share_resource_approve_v2(request):
    print("===== API called: share_resource_approve_v2 =====")

    if request.method == "POST":
        try:
            # Parse JSON input
            body = json.loads(request.body)
            print("Received JSON body:", body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            guest_locker_name = body.get("guest_locker_name")
            host_user_username = body.get("host_user_username")
            guest_user_username = body.get("guest_user_username")

            # Check if all required fields are present
            if not all([
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
            ]):
                print("ERROR: Missing required fields")
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            print("Fetching database objects...")
            host_user = CustomUser.objects.get(username=host_user_username)
            print(f"Host User found: {host_user}")

            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            print(f"Host Locker found: {host_locker}")

            guest_user = CustomUser.objects.get(username=guest_user_username)
            print(f"Guest User found: {guest_user}")

            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            print(f"Guest Locker found: {guest_locker}")

            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )
            print(f"Connection found: {connection}")

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            print("ERROR: Object not found:", str(e))
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            print("ERROR: Invalid JSON format")
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

        def process_sharable_entry(key, value, resources_section):
            """Handles the logic of sharing a file based on a single entry."""
            print(f"Processing key: {key}, value: {value}")
         
            if "|" in value and (value.endswith(";T") or value.endswith("; T")):
                try:
                    parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
                    parts = parts_T.split("|")

                    if len(parts) >= 2:
                        document_name, xnode_id = parts[:2]
                        xnode_info = xnode_id.strip()

                        print(f"Extracted - Document: {document_name}, Xnode ID: {xnode_info}")

                    # Debug shared resources
                    print("Shared Resources:", resources_section)

                    # Check if the xnode_info is part of resources["Share"]
                    if any(str(xnode_info) in str(res) for res in resources_section):
                        print(f"Xnode ID {xnode_info} found in shared {resources_section}resources.")

                        try:
                            vnode_xnode = Xnode_V2.objects.get(id=xnode_info)
                            print(f"Found Xnode {xnode_info}, updating locker to host locker.")

                            vnode_xnode.locker = host_locker
                            vnode_xnode.node_information["current_owner"] = host_user.user_id
                            vnode_xnode.save(update_fields=["locker","node_information"])
                            print(f"Successfully updated Xnode {xnode_info} locker to {host_locker}.")

                            # Update is_locked based on post_conditions
                            post_conditions = vnode_xnode.post_conditions or {}
                            is_locked = {}
                            for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                                is_locked[k] = not post_conditions.get(k, False)
                            vnode_xnode.is_locked = is_locked
                            vnode_xnode.save(update_fields=["is_locked"])
                            print(f"Updated is_locked for Xnode {xnode_info}: {is_locked}")

                            linked_xnode_id = vnode_xnode.node_information["link"]
                            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)


                            print("--------------------------------")
                            new_entry = {
                                "connection": connection.connection_id,
                                "from_locker": guest_locker.locker_id,
                                "to_locker": host_locker.locker_id,
                                "from_user": guest_user.user_id,
                                "to_user": host_user.user_id,
                                "type_of_share": "Share",
                                "xnode_id": vnode_xnode.id,
                                "xnode_post_conditions": linked_xnode.post_conditions,
                                # "xnode_snapshot": serialized_data,  # 💾 Full snapshot here
                                "reverse": False
                            }

                            print("new_entry:", new_entry)

                            if not isinstance(linked_xnode.provenance_stack, list):
                                linked_xnode.provenance_stack = []
                            print("++++++++++++++++++++++++++++++++")

                            linked_xnode.provenance_stack.insert(0, new_entry)
                            linked_xnode.save(update_fields=["provenance_stack"])   
                            linked_inode = access_Resource(xnode_id=int(xnode_info))   

                            while True:
                                linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

                                linked_xnode.vnode_list.append(int(xnode_info))
                                linked_xnode.save(update_fields=["vnode_list"])
                                if linked_xnode_id == linked_inode.id:
                                    break
                                else:
                                    linked_xnode_id = linked_xnode.node_information["link"]
                                    continue
                            
                            return True

                        except Xnode_V2.DoesNotExist:
                            print(f"ERROR: Xnode {xnode_info} not found in DB")
                            return JsonResponse(
                                {"success": False, "error": "Original INODE not found"}, status=404
                            )
                        except Exception as e:
                            print(f"Unexpected error while updating locker: {e}")
                            return JsonResponse(
                                {"success": False, "error": f"Unexpected error: {str(e)}"}, status=500
                            )

                except (IndexError, ValueError) as e:
                    print(f"ERROR processing file share for {key}: {e}")
                    return JsonResponse(
                        {"success": False, "error": "Invalid format in terms_value or Xnode not found"},
                        status=400,
                    )
            else:
                print(f"Skipping {key}, it does not meet the sharing criteria.")
                return False

        # Debugging connection terms and resources
        print("Connection Terms:", connection.terms_value)
        print("Connection Resources:", connection.resources)

        # Start processing all entries
        shared_any = False
        terms = connection.terms_value or {}
        resources = connection.resources.get("Share", [])

        for key, value in terms.items():
            if key == "canShareMoreData":
                continue
            if process_sharable_entry(key, value, resources):
                shared_any = True

        # Process nested share terms
        can_share_more_data = terms.get("canShareMoreData", {})
        for nested_key, nested_value in can_share_more_data.items():
            sharing_value = nested_value.get("enter_value")
            if sharing_value:
                if process_sharable_entry(nested_key, sharing_value, resources):
                    shared_any = True

        if shared_any:
            print("Resources shared successfully")
            return JsonResponse({"success": True, "message": "Resources shared successfully"}, status=200)
        else:
            print("No eligible file resource found for sharing.")
            return JsonResponse({"success": False, "error": "No eligible file resource found for sharing"}, status=400)
                    
    print("ERROR: Invalid request method")
    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)

#share approve HOST TO GUEST
@extend_schema(
    summary="Approve resource share (Host to Guest)",
    description="Approve and process data sharing from a host locker to a guest locker based on connection terms.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "host_locker_name": {"type": "string"},
                "guest_locker_name": {"type": "string"},
                "host_user_username": {"type": "string"},
                "guest_user_username": {"type": "string"},
            },
            "required": ["connection_name", "host_locker_name", "guest_locker_name", "host_user_username", "guest_user_username"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Resources shared successfully",
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
def share_resource_approve_reverse_v2(request):
    print("===== API called: share_resource_approve_v2 =====")

    if request.method == "POST":
        try:
            # Parse JSON input
            body = json.loads(request.body)
            print("Received JSON body:", body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            guest_locker_name = body.get("guest_locker_name")
            host_user_username = body.get("host_user_username")
            guest_user_username = body.get("guest_user_username")

            # Check if all required fields are present
            if not all([
                connection_name,
                host_locker_name,
                guest_locker_name,
                host_user_username,
                guest_user_username,
            ]):
                print("ERROR: Missing required fields")
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            print("Fetching database objects...")
            host_user = CustomUser.objects.get(username=host_user_username)
            print(f"Host User found: {host_user}")

            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            print(f"Host Locker found: {host_locker}")

            guest_user = CustomUser.objects.get(username=guest_user_username)
            print(f"Guest User found: {guest_user}")

            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            print(f"Guest Locker found: {guest_locker}")

            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )
            print(f"Connection found: {connection}")

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            print("ERROR: Object not found:", str(e))
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            print("ERROR: Invalid JSON format")
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

        def process_sharable_entry(key, value, resources_section):
            """Handles the logic of sharing a file based on a single entry."""
            print(f"Processing key: {key}, value: {value}")

            if "|" in value and (value.endswith(";T") or value.endswith("; T")):
                try:
                    parts_T = value.split("; T")[0] if "; T" in value else value.split(";T")[0]
                    parts = parts_T.split("|")

                    if len(parts) >= 2:
                        document_name, xnode_id = parts[:2]
                        xnode_info = xnode_id.strip()

                        print(f"Extracted - Document: {document_name}, Xnode ID: {xnode_info}")

                    # Debug shared resources
                    print("Shared Resources:", resources_section)

                    # Check if the xnode_info is part of resources["Share"]
                    if any(str(xnode_info) in str(res) for res in resources_section):
                        print(f"Xnode ID {xnode_info} found in shared {resources_section}resources.")

                        try:
                            vnode_xnode = Xnode_V2.objects.get(id=xnode_info)
                            print(f"Found Xnode {xnode_info}, updating locker to host locker.")

                            vnode_xnode.locker = guest_locker
                            vnode_xnode.node_information["current_owner"] = guest_user.user_id
                            vnode_xnode.save(update_fields=["locker","node_information"])
                            print(f"Successfully updated Xnode {xnode_info} locker to {guest_locker}.")

                            # Update is_locked based on post_conditions
                            post_conditions = vnode_xnode.post_conditions or {}
                            is_locked = {}
                            for k in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                                is_locked[k] = not post_conditions.get(k, False)
                            vnode_xnode.is_locked = is_locked
                            vnode_xnode.save(update_fields=["is_locked"])
                            print(f"Updated is_locked for Xnode {xnode_info}: {is_locked}")

                            linked_xnode_id = vnode_xnode.node_information["link"]
                            linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

                            print("--------------------------------")
                            new_entry = {
                                "connection": connection.connection_id,
                                "from_locker": host_locker.locker_id,
                                "to_locker": guest_locker.locker_id,
                                "from_user": host_user.user_id,
                                "to_user": guest_user.user_id,
                                "type_of_share": "Share",
                                "xnode_id": vnode_xnode.id,
                                "xnode_post_conditions": linked_xnode.post_conditions,
                                # "xnode_snapshot": serialized_data,  # 💾 Full snapshot here
                                "reverse": True
                            }

                            print("new_entry:", new_entry)

                            if not isinstance(linked_xnode.provenance_stack, list):
                                linked_xnode.provenance_stack = []
                            print("++++++++++++++++++++++++++++++++")

                            linked_xnode.provenance_stack.insert(0, new_entry)
                            linked_xnode.save(update_fields=["provenance_stack"])   
                            linked_inode = access_Resource(xnode_id=xnode_info)   
 
                           
                            while True:
                                linked_xnode = Xnode_V2.objects.get(id=linked_xnode_id)

                                linked_xnode.vnode_list.append(int(xnode_info))
                                linked_xnode.save(update_fields=["vnode_list"])
                                if linked_xnode_id == linked_inode.id:
                                    break
                                else:
                                    linked_xnode_id = linked_xnode.node_information["link"]
                                    continue


                            return True

                        except Xnode_V2.DoesNotExist:
                            print(f"ERROR: Xnode {xnode_info} not found in DB")
                            return JsonResponse(
                                {"success": False, "error": "Original INODE not found"}, status=404
                            )
                        except Exception as e:
                            print(f"Unexpected error while updating locker: {e}")
                            return JsonResponse(
                                {"success": False, "error": f"Unexpected error: {str(e)}"}, status=500
                            )

                except (IndexError, ValueError) as e:
                    print(f"ERROR processing file share for {key}: {e}")
                    return JsonResponse(
                        {"success": False, "error": "Invalid format in terms_value or Xnode not found"},
                        status=400,
                    )

            print(f"Skipping {key}, it does not meet the sharing criteria.")
            return False

        # Debugging connection terms and resources
        print("Connection Terms:", connection.terms_value_reverse)
        print("Connection Resources:", connection.resources)

        # Start processing all entries
        shared_any = False
        terms = connection.terms_value_reverse or {}
        resources = connection.resources.get("Share", [])

        for key, value in terms.items():
            if key == "canShareMoreData":
                continue
            if process_sharable_entry(key, value, resources):
                shared_any = True

        # Process nested share terms
        can_share_more_data = terms.get("canShareMoreData", {})
        for nested_key, nested_value in can_share_more_data.items():
            sharing_value = nested_value.get("enter_value")
            if sharing_value:
                if process_sharable_entry(nested_key, sharing_value, resources):
                    shared_any = True

        if shared_any:
            print("Resources shared successfully")
            return JsonResponse({"success": True, "message": "Resources shared successfully"}, status=200)
        else:
            print("No eligible file resource found for sharing.")
            return JsonResponse({"success": False, "error": "No eligible file resource found for sharing"}, status=400)
                    
    print("ERROR: Invalid request method")
    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)

