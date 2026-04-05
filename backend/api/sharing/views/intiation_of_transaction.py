
import json
from django.http import JsonResponse,HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from api.models import Locker, CustomUser, Connection
from api.model.xnode_model import Xnode_V2
from api.utils.xnode.xnode_helper import NodeLockChecker  # Import NodeLockChecker
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes



@extend_schema(
    summary="Process resource consent (Guest side)",
    description="Initiate or update a resource transaction (share, confer, transfer, collateral) from the guest's perspective. Creates VNODEs or SNODEs as needed.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "guest_locker_name": {"type": "string"},
                "guest_user_username": {"type": "string"},
                "xnode_id": {"type": "integer"},
                "share_Type": {"type": "string", "enum": ["share", "confer", "transfer", "collateral"]},
                "old_xnode": {"type": "integer", "description": "Optional ID of old xnode to replace"},
            },
            "required": ["connection_name", "guest_locker_name", "guest_user_username", "xnode_id", "share_Type"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Transaction processed successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "new_xnode_id": {"type": "integer"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid request or restricted operation"),
        401: OpenApiResponse(description="Unauthorized"),
        404: OpenApiResponse(description="User, locker, connection, or xnode not found"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def process_resource_consent_guest(request):
    if request.method == "POST":
        try:
            # Check if the request user is authenticated
            if not request.user or not request.user.is_authenticated:
                return JsonResponse({"success": False, "error": "User not authenticated"}, status=401)

            # Parse JSON input
            body = json.loads(request.body)

            connection_name = body.get("connection_name")
            guest_locker_name = body.get("guest_locker_name")
            guest_user_username = body.get("guest_user_username")
            xnode_id = body.get("xnode_id")
            share_Type = body.get("share_Type")
            old_xnode = body.get("old_xnode")

            # Check if all required fields are present
            if not all([
                connection_name,
                guest_locker_name,
                guest_user_username,
                xnode_id,
                share_Type
            ]):
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            guest_user = CustomUser.objects.get(username=guest_user_username)
            guest_locker = Locker.objects.get(name=guest_locker_name, user=guest_user)
            connection = Connection.objects.get(
                connection_name=connection_name,
                guest_locker=guest_locker,
                guest_user=guest_user,
            )
            #get the host user
            host_user = connection.host_user

            # Fetch the existing Xnode
            try:
                inode_xnode = Xnode_V2.objects.get(id=xnode_id)
            except Xnode_V2.DoesNotExist:
                return JsonResponse({"success": False, "error": "Xnode not found"}, status=404)

            # Check if share_Type is valid
            if share_Type.lower() == "share":

                # Check if the creator and user are the same
                if inode_xnode.creator != request.user.user_id:
                    # Ensure sharing is allowed only if creator and host user are different
                    if not inode_xnode.post_conditions.get("share", False):
                        return JsonResponse({"success": False, "error": "Sharing is restricted by the owner of the Resource."}, status=400)
                
                # Copy and modify post_conditions and creator_conditions
                post_conditions = {**inode_xnode.post_conditions}
                creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                for key in ["download", "confer", "collateral", "subset"]:
                    post_conditions[key] = False
                    creator_conditions[key] = False

                post_conditions["creator_conditions"] = creator_conditions


                # If old_xnode_id is provided, delete the old VNODE first
                print("old_xnode:", old_xnode)
                if old_xnode:
                    try:
                        old_xnode = Xnode_V2.objects.get(id=old_xnode)
                        print("Deleting old_xnode:", old_xnode.id)
                        # Delete the old VNODE before creating the new one
                        old_xnode.delete()
                        print("Deleted old_xnode:", old_xnode.id)
                    except Xnode_V2.DoesNotExist:
                        print("old_xnode not found:", old_xnode)
                        pass #Proceed if already deleted

                # Create VNODE in guest locker
                xnode_created = Xnode_V2.objects.create(
                    locker=guest_locker,
                    creator=guest_user.user_id,
                    connection=connection,
                    created_at=timezone.now(),
                    validity_until=timezone.now() + timezone.timedelta(days=10),
                    xnode_Type=Xnode_V2.XnodeType.VNODE,
                    post_conditions=post_conditions, 
                    # provenance_stack=inode_xnode.provenance_stack,  # Copy provenance stack
                )

                xnode_created.node_information = {
                    "current_owner": guest_user.user_id,
                    "link": xnode_id,
                    "reverse": False,
                }
                xnode_created.save()

                return JsonResponse({
                    "success": True,
                    "message": f"VNODE Created Successfully: {xnode_created.id}",
                    "new_xnode_id": xnode_created.id  # Return the new VNODE ID for frontend update
                })

            elif share_Type.lower() == "confer":

                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and user are the same
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_confer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check confer permission first
                    print("creator", inode_xnode.creator)
                    print("user", guest_user.user_id)

                    if not inode_xnode.post_conditions.get("confer", False):
                        print("Confer is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is restricted by the owner of Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_confer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the node is locked"
                        }, status=400)

      
                # Fetch host locker
                host_locker = connection.host_locker


                # Copy and modify post_conditions and creator_conditions
                post_conditions = {**inode_xnode.post_conditions}
                creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                for key in ["subset"]:
                    post_conditions[key] = False
                    creator_conditions[key] = False

                post_conditions["creator_conditions"] = creator_conditions

                # If old_xnode_id is provided, delete the old SNODE first
                if old_xnode:
                    try:
                        old_xnode = Xnode_V2.objects.get(id=old_xnode)
                        # Delete the old SNODE before creating the new one
                        old_xnode.delete()
                    except Xnode_V2.DoesNotExist:
                        pass #Proceed if already deleted


                # Create SNODE in host locker
                xnode_created_Snode = Xnode_V2.objects.create(
                    creator=guest_user.user_id,
                    locker=guest_locker,
                    connection=connection,
                    created_at=timezone.now(),
                    validity_until=timezone.now() + timezone.timedelta(days=10),
                    xnode_Type=Xnode_V2.XnodeType.SNODE,
                    post_conditions=inode_xnode.post_conditions, 
                    provenance_stack=inode_xnode.provenance_stack,  # Copy provenance stack
                )

                xnode_created_Snode.node_information = {
                    "resource_id": inode_xnode.node_information["resource_id"],
                    "inode_or_snode_id": inode_xnode.id,
                    "primary_owner": inode_xnode.node_information.get("primary_owner", ""),
                    "current_owner": inode_xnode.node_information.get("primary_owner", ""),
                    "reverse": False,
                }
                xnode_created_Snode.save()
                
                return JsonResponse({
                    "success": True,
                    "message": f"SNODE Created Successfully: {xnode_created_Snode.id}",
                    "new_xnode_id": xnode_created_Snode.id  # Return the new SNODE ID for frontend update
                })
            
            elif share_Type.lower() == "transfer":
                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and user are the same
                print("request user",request.user.user_id)
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_transfer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check transfer permission first
                    print("creator", inode_xnode.creator)
                    print("user", guest_user.user_id)

                    if not inode_xnode.post_conditions.get("transfer", False):
                        print("Transfer is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is restricted by the owner of the  Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_transfer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the node is locked"
                        }, status=400)
                    
                print("Assigning connection:", connection)
                print("Connection ID:", connection.connection_id if connection else None)

                    
                # Store the connection_id in the existing inode_xnode
                inode_xnode.connection = connection
                inode_xnode.save(update_fields=["connection"])
                                
                return JsonResponse({
                    "success": True,
                    #"message": f"Transfer operation successful",
                    "new_xnode_id": inode_xnode.id  # Returning the existing Xnode ID
                })

                
            elif share_Type.lower() == "collateral":

                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Collateral is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and  user are the same
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_collateral_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check collateral permission first
                    print("creator", inode_xnode.creator)
                    print("user", guest_user.user_id)

                    if not inode_xnode.post_conditions.get("collateral", False):
                        print("collateral is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is restricted by the owner of the  Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_collateral_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is not possible as the node is locked"
                        }, status=400)
                
                print("Assigning connection:", connection)
                print("Connection ID:", connection.connection_id if connection else None)

                # Store the connection_id in the existing inode_xnode
                inode_xnode.connection = connection
                inode_xnode.save(update_fields=["connection"])
                                
                return JsonResponse({
                            "success": True,
                            #"message": f"Collateral operation successful",
                            "new_xnode_id": inode_xnode.id  # Returning the existing Xnode ID
                        })

            else:
                return JsonResponse({"success": False, "error": "Invalid share type"}, status=400)

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)



@extend_schema(
    summary="Process resource consent (Host side)",
    description="Initiate or update a resource transaction (share, confer, transfer, collateral) from the host's perspective. Creates VNODEs or SNODEs as needed.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "host_locker_name": {"type": "string"},
                "host_user_username": {"type": "string"},
                "xnode_id": {"type": "integer"},
                "share_Type": {"type": "string", "enum": ["share", "confer", "transfer", "collateral"]},
                "old_xnode": {"type": "integer", "description": "Optional ID of old xnode to replace"},
            },
            "required": ["connection_name", "host_locker_name", "host_user_username", "xnode_id", "share_Type"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Transaction processed successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "new_xnode_id": {"type": "integer"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid request or restricted operation"),
        401: OpenApiResponse(description="Unauthorized"),
        404: OpenApiResponse(description="User, locker, connection, or xnode not found"),
    },
)
@csrf_exempt
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def process_resource_consent_host(request):
    if request.method == "POST":
        try:
            # Check if the request user is authenticated
            if not request.user or not request.user.is_authenticated:
                return JsonResponse({"success": False, "error": "User not authenticated"}, status=401)

            # Parse JSON input
            body = json.loads(request.body)

            connection_name = body.get("connection_name")
            host_locker_name = body.get("host_locker_name")
            host_user_username = body.get("host_user_username")
            xnode_id = body.get("xnode_id")
            share_Type = body.get("share_Type")
            old_xnode = body.get("old_xnode")

            # Check if all required fields are present
            if not all([
                connection_name,
                host_locker_name,
                host_user_username,
                xnode_id,
                share_Type
            ]):
                return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

            # Fetch necessary objects
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)
            connection = Connection.objects.get(
                connection_name=connection_name,
                host_locker=host_locker,
                host_user=host_user,
            )

            #get the guest user
            guest_user = connection.guest_user

            # Fetch the existing Xnode
            try:
                inode_xnode = Xnode_V2.objects.get(id=xnode_id)
            except Xnode_V2.DoesNotExist:
                return JsonResponse({"success": False, "error": "Xnode not found"}, status=404)

            # Check if share_Type is valid
            if share_Type.lower() == "share":

                # Check if the creator and user are the same
                if inode_xnode.creator != request.user.user_id:
                    # Ensure sharing is allowed only if creator and host user are different
                    if not inode_xnode.post_conditions.get("share", False):
                        return JsonResponse({"success": False, "error": "Sharing is restricted by the owner of the  Resource"}, status=400)
                    
                # Copy and modify post_conditions and creator_conditions
                post_conditions = {**inode_xnode.post_conditions}
                creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                for key in ["download", "confer", "collateral", "subset"]:
                    post_conditions[key] = False
                    creator_conditions[key] = False

                post_conditions["creator_conditions"] = creator_conditions
           
                # If old_xnode_id is provided, delete the old VNODE first
                if old_xnode:
                    try:
                        old_xnode = Xnode_V2.objects.get(id=old_xnode)
                        # Delete the old VNODE before creating the new one
                        old_xnode.delete()
                    except Xnode_V2.DoesNotExist:
                        pass #Proceed if already deleted
           
                # Create VNODE in host locker
                xnode_created = Xnode_V2.objects.create(
                    locker=host_locker,
                    creator=host_user.user_id,
                    connection=connection,
                    created_at=timezone.now(),
                    validity_until=timezone.now() + timezone.timedelta(days=10),
                    xnode_Type=Xnode_V2.XnodeType.VNODE,
                    post_conditions=post_conditions,  # Copy terms from INODE
                    provenance_stack=inode_xnode.provenance_stack,  # Copy provenance stack
                )

                xnode_created.node_information = {
                    "current_owner": host_user.user_id,
                    "link": xnode_id,
                    "reverse": True,
                }
                xnode_created.save()

                return JsonResponse({
                    "success": True,
                    "message": f"VNODE Created Successfully: {xnode_created.id}",
                    "new_xnode_id": xnode_created.id  # Return the new VNODE ID for frontend update
                })

            elif share_Type.lower() == "confer":
                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and user are the same
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_confer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check confer permission first
                    print("creator", inode_xnode.creator)
                    print("user", host_user.user_id)

                    if not inode_xnode.post_conditions.get("confer", False):
                        print("Confer is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is restricted by the owner of the  Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_confer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Confer is not possible as the node is locked"
                        }, status=400)

      
                # Fetch host locker
                host_locker = connection.host_locker


                # Copy and modify post_conditions and creator_conditions
                post_conditions = {**inode_xnode.post_conditions}
                creator_conditions = post_conditions.get("creator_conditions", {}).copy()

                for key in ["subset"]:
                    post_conditions[key] = False
                    creator_conditions[key] = False

                post_conditions["creator_conditions"] = creator_conditions

                # If old_xnode_id is provided, delete the old SNODE first
                if old_xnode:
                    try:
                        old_xnode = Xnode_V2.objects.get(id=old_xnode)
                        # Delete the old SNODE before creating the new one
                        old_xnode.delete()
                    except Xnode_V2.DoesNotExist:
                        pass #Proceed if already deleted


                # Create SNODE in host locker
                xnode_created_Snode = Xnode_V2.objects.create(
                    creator=host_user.user_id,
                    locker=host_locker,
                    connection=connection,
                    created_at=timezone.now(),
                    validity_until=timezone.now() + timezone.timedelta(days=10),
                    xnode_Type=Xnode_V2.XnodeType.SNODE,
                    post_conditions=inode_xnode.post_conditions,  # Copy terms from INODE
                    provenance_stack=inode_xnode.provenance_stack,  # Copy provenance stack
                )

                xnode_created_Snode.node_information = {
                    "resource_id": inode_xnode.node_information["resource_id"],
                    "inode_or_snode_id": inode_xnode.id,
                    "primary_owner": inode_xnode.node_information.get("primary_owner", ""),
                    "current_owner": inode_xnode.node_information.get("primary_owner", ""),
                    "reverse": False,
                }
                xnode_created_Snode.save()

              
                return JsonResponse({
                    "success": True,
                    "message": f"SNODE Created Successfully: {xnode_created_Snode.id}",
                    "new_xnode_id": xnode_created_Snode.id  # Return the new SNODE ID for frontend update
                })
            
            elif share_Type.lower() == "transfer":
                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and user are the same
                print("request user",request.user.user_id)
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_transfer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check transfer permission first
                    print("creator", inode_xnode.creator)
                    print("user", host_user.user_id)

                    if not inode_xnode.post_conditions.get("transfer", False):
                        print("Transfer is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is restricted by the owner of the  Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_transfer_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "Transfer is not possible as the node is locked"
                        }, status=400)
                    
                # Store the connection_id in the existing inode_xnode
                inode_xnode.connection = connection
                inode_xnode.save(update_fields=["connection"])
                    
                return JsonResponse({
                    "success": True,
                    #"message": f"Transfer operation successful",
                    "new_xnode_id": inode_xnode.id  # Returning the existing Xnode ID
                })

            elif share_Type.lower() == "collateral":
                if inode_xnode.connection !=None and inode_xnode.connection.connection_status != "closed":
                    return JsonResponse({
                            "success": False,
                            "error": "Collateral is not possible as the connection is still established or live."
                        }, status=400)
                
                # Check if the creator and  user are the same
                if inode_xnode.creator == request.user.user_id:
                # Case 1: User and Creator are the same, only check if the node is locked
                    if NodeLockChecker(inode_xnode).is_collateral_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is not possible as the node is locked"
                        }, status=400)
                else:
                    # Case 2: User and Creator are different, check collateral permission first
                    print("creator", inode_xnode.creator)
                    print("user", host_user.user_id)

                    if not inode_xnode.post_conditions.get("collateral", False):
                        print("collateral is not allowed based on post_conditions:", inode_xnode.post_conditions)
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is restricted by the owner of the  Resource"
                        }, status=400)

                    # After checking post_conditions, check if the node is locked
                    if NodeLockChecker(inode_xnode).is_collateral_locked():
                        return JsonResponse({
                            "success": False,
                            "error": "collateral is not possible as the node is locked"
                        }, status=400)
                    
                # Store the connection_id in the existing inode_xnode
                inode_xnode.connection = connection
                inode_xnode.save(update_fields=["connection"])
                    
                return JsonResponse({
                            "success": True,
                            #"message": f"Collateral operation successful",
                            "new_xnode_id": inode_xnode.id  # Returning the existing Xnode ID
                        })

            else:
                return JsonResponse({"success": False, "error": "Invalid share type"}, status=400)

        except (Connection.DoesNotExist, Locker.DoesNotExist, CustomUser.DoesNotExist) as e:
            return JsonResponse({"success": False, "error": str(e)}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)

    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)


