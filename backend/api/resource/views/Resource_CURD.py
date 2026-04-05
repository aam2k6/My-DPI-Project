

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.models import Locker, Resource, CustomUser
from api.model.xnode_model import Xnode_V2
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import StreamingHttpResponse, HttpResponse, JsonResponse

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes

from api.utils.resource_helper.resource_CURD import delete_descendants, update_parents, send_deletion_notification


@extend_schema(
    summary="Delete Resource",
    description="Delete a resource Xnode and its descendants.",
    methods=["DELETE"],
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "locker_name": {"type": "string"},
                "owner_name": {"type": "string"},
                "xnode_id": {"type": "integer"},
            },
            "required": ["locker_name", "owner_name", "xnode_id"],
        }
    },
    responses={
        200: OpenApiResponse(description="Resource deleted successfully"),
        400: OpenApiResponse(description="Invalid request"),
        403: OpenApiResponse(description="Permission denied"),
        404: OpenApiResponse(description="Resource or locker not found"),
    },
)
@extend_schema(
    summary="Update Resource",
    description="Update a resource Xnode (INODE, VNODE, SNODE).",
    methods=["PUT"],
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "locker_name": {"type": "string"},
                "owner_name": {"type": "string"},
                "xnode_id": {"type": "integer"},
                "new_document_name": {"type": "string"},
                "new_visibility": {"type": "string"},
                "new_validity_time": {"type": "string", "format": "date-time"},
                "post_conditions": {"type": "object"},
            },
            "required": ["locker_name", "owner_name", "xnode_id"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Resource updated successfully",
            response={
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                },
                "example": {
                    "message": "Resource & XNode post_conditions updated successfully."
                }
            },
        ),
        400: OpenApiResponse(description="Invalid request"),
        403: OpenApiResponse(description="Permission denied"),
        404: OpenApiResponse(description="Resource/Xnode or locker not found"),
    },
)
@csrf_exempt
@api_view(["DELETE", "PUT"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_Update_Resource(request: HttpRequest) -> JsonResponse:
    if request.method == "DELETE":
        locker_name = request.data.get("locker_name")
        owner_name = request.data.get("owner_name")
        xnode_id = request.data.get("xnode_id")

        if not locker_name or not owner_name or not xnode_id:
            return JsonResponse({"message": "Locker name, Owner name, and Xnode ID must be provided."}, status=400)

        user: CustomUser = request.user

        try:
            request_User = CustomUser.objects.get(username=owner_name)
        except CustomUser.DoesNotExist:
            return JsonResponse({"message": f"User with name = {owner_name} does not exist."}, status=404)

        if request_User != user:
            return JsonResponse({"message": "You are not allowed to delete this resource."}, status=403)

        locker = Locker.objects.filter(name=locker_name, user=request_User).first()
        if not locker:
            return JsonResponse({"message": f"Locker with name '{locker_name}' and user '{owner_name}' does not exist."}, status=404)

        xnode = Xnode_V2.objects.filter(id=xnode_id, locker=locker).first()
        if not xnode:
            return JsonResponse({"message": "Xnode not found."}, status=404)

        # connection = xnode.connection
        # connection_type = connection.connection_type
        connection = getattr(xnode, "connection", None)
        connection_type = getattr(connection, "connection_type", None) if connection else None


        xnode_type = xnode.xnode_Type  # Store type before deletion
        print(f"Initiating deletion for {xnode_type} Xnode: {xnode.id}")

        affected_lockers = Locker.objects.filter(xnode_v2=xnode)
        affected_users = {locker.user for locker in affected_lockers}

        delete_xnode_list = delete_descendants(xnode)

        if xnode_type == Xnode_V2.XnodeType.INODE:
            resource_id = xnode.node_information.get("resource_id")
            if resource_id:
                resource = Resource.objects.filter(resource_id=resource_id).first()
                if resource:
                    print(f"Deleting associated resource: {resource_id}")
                    resource.delete()

        update_parents(xnode)

        if affected_users:
            send_deletion_notification(affected_users, affected_lockers, xnode, connection, connection_type)

        delete_xnode_list.append(xnode.id)
        print(f"Deleting parent Xnode: {xnode.id} ({xnode_type})")
        xnode.delete()

        message = f"Successfully deleted {xnode_type} {xnode_id} and all descendants: {delete_xnode_list}"
        print(message)

        return JsonResponse({"message": message}, status=200)


    elif request.method == "PUT":
        """
        Updates Resource (INODE) or XNode (VNODE, SNODE).

        Expected JSON:
        {
            "locker_name": "locker name",
            "owner_name": "user name",
            "xnode_id": id,
            "new_document_name": "Updated Name" (optional),
            "new_visibility": "public/private" (optional),
            "new_validity_time": "YYYY-MM-DDTHH:MM:SS" (optional),
            "post_conditions": {...} (optional, allowed for INODE, VNODE, SNODE)
        }
        """
        def validate_post_condition_update(creator_conditions, new_post_condition, is_creator):
            if is_creator:
                return True, "Valid update"

            violated_keys = []
            for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                creator_value = creator_conditions.get(key, False)
                new_value = new_post_condition.get(key, False)
                if not creator_value and new_value:
                    violated_keys.append(key)

            if violated_keys:
                keys_str = ", ".join(violated_keys)
                return False, f"You cannot enable the following permissions because the creator has disabled them: {keys_str}."

            return True, "Valid update"


        # Extract Data
        locker_name = request.data.get("locker_name")
        owner_name = request.data.get("owner_name")
        xnode_id = request.data.get("xnode_id")
        new_document_name = request.data.get("new_document_name", None)
        visibility = request.data.get("new_visibility", None)
        new_validity_time = request.data.get("new_validity_time", None)
        new_post_condition = request.data.get("post_conditions", None)

        user: CustomUser = request.user  # Logged-in user
        print(f" Request User: {owner_name}, Logged-in User: {user.username}")

        # Validate Required Fields
        if not locker_name or not owner_name or not xnode_id:
            return JsonResponse(
                {"message": "Fields 'locker_name', 'owner_name', and 'xnode_id' are required."},
                status=400,
            )

        # Validate Owner
        try:
            request_User = CustomUser.objects.get(username=owner_name)
        except CustomUser.DoesNotExist:
            return JsonResponse({"message": f"User '{owner_name}' does not exist."}, status=404)

        # Permission Check
        if request_User != user:
            return JsonResponse({"message": "You are not authorized to update this resource."}, status=403)

        # Fetch Locker
        try:
            locker = Locker.objects.get(name=locker_name, user=request_User)
            print(f" Locker found: {locker.name}")
        except Locker.DoesNotExist:
            return JsonResponse(
                {"message": f"Locker '{locker_name}' does not exist for user '{owner_name}'."},
                status=404,
            )

        #Fetch XNode
        try:
            xnode = Xnode_V2.objects.get(id=xnode_id)
            xnode_type = xnode.xnode_Type
            print(f"XNode found: ID={xnode.id}, Type={xnode_type}")
        except Xnode_V2.DoesNotExist:
            return JsonResponse({"message": f"XNode with ID '{xnode_id}' does not exist."}, status=404)

        # Determine if User is Creator
        is_creator = (xnode.creator == user.user_id)
        print("creator", xnode.creator)
        print("user", user.user_id)
        print("is_creator", is_creator)

        # INODE Handling
        if xnode_type == Xnode_V2.XnodeType.INODE:
            if not isinstance(xnode.node_information, dict):
                return JsonResponse({"message": "XNode node_information is missing or invalid."}, status=400)

            resource_id = xnode.node_information.get("resource_id")
            if not resource_id:
                return JsonResponse({"message": "XNode does not contain a valid resource_id."}, status=400)

            try:
                resource_To_Be_Updated = Resource.objects.get(resource_id=resource_id)
                print(f"Resource found: {resource_To_Be_Updated.resource_id}")

                # Update fields if provided
                resource_To_Be_Updated.document_name = new_document_name or resource_To_Be_Updated.document_name
                resource_To_Be_Updated.type = visibility or resource_To_Be_Updated.type
                resource_To_Be_Updated.validity_time = new_validity_time or resource_To_Be_Updated.validity_time
                resource_To_Be_Updated.save()
                print("Resource updated successfully!")

                # Handle post_conditions if provided
                if new_post_condition is not None:
                    creator_conditions = xnode.post_conditions.get("creator_conditions", {})
                    is_valid, message = validate_post_condition_update(creator_conditions, new_post_condition, is_creator)
                    if not is_valid:
                        return JsonResponse({"message": message}, status=403)

                    # Update post_condition keys
                    for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                        xnode.post_conditions[key] = new_post_condition.get(key, xnode.post_conditions.get(key))

                    # Update creator_conditions if user is creator
                    if is_creator:
                        if "creator_conditions" not in xnode.post_conditions:
                            xnode.post_conditions["creator_conditions"] = {}
                        for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                            xnode.post_conditions["creator_conditions"][key] = new_post_condition.get(key, xnode.post_conditions["creator_conditions"].get(key, False))

                    xnode.save()
                    print(" XNode post_conditions updated successfully!")

                return JsonResponse({"message": "Resource & XNode post_conditions updated successfully."})

            except Resource.DoesNotExist:
                return JsonResponse(
                    {"message": f"Resource with ID '{resource_id}' does not exist."},
                    status=404,
                )

        # VNODE / SNODE Handling
        elif xnode_type in [Xnode_V2.XnodeType.VNODE, Xnode_V2.XnodeType.SNODE]:
            if new_post_condition is None:
                return JsonResponse(
                    {"message": "post_conditions is required for VNODE/SNODE updates."},
                    status=400,
                )

            creator_conditions = xnode.post_conditions.get("creator_conditions", {})
            is_valid, message = validate_post_condition_update(creator_conditions, new_post_condition, is_creator)
            if not is_valid:
                return JsonResponse({"message": message}, status=403)

            for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                xnode.post_conditions[key] = new_post_condition.get(key, xnode.post_conditions.get(key))

            if is_creator:
                if "creator_conditions" not in xnode.post_conditions:
                    xnode.post_conditions["creator_conditions"] = {}
                for key in ["download", "share", "confer", "transfer", "collateral", "subset"]:
                    xnode.post_conditions["creator_conditions"][key] = new_post_condition.get(key, xnode.post_conditions["creator_conditions"].get(key, False))

            xnode.save()
            print("XNode post_conditions updated successfully!")

            return JsonResponse({"message": "XNode post_conditions updated successfully."})

        else:
            return JsonResponse({"message": f"Unknown XNode Type '{xnode_type}'."}, status=400)
