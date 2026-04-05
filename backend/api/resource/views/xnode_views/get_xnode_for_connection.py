
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from api.models import (
    Resource,
    Locker,
    CustomUser,
    Connection,
)


from api.model.xnode_model import Xnode_V2
from api.utils.resource_helper.access_resource_helper import access_Resource
from api.serializers import XnodeV2Serializer
from django.http import HttpRequest, JsonResponse


from rest_framework_simplejwt.authentication import JWTAuthentication




from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

@extend_schema(
    description="Fetch resource names and XNode details for a specific connection type and user.",
    parameters=[
        OpenApiParameter(name="connection_type_id", description="ID of the connection type", required=True, type=int),
        OpenApiParameter(name="username", description="Username to filter resources", required=True, type=str),
        OpenApiParameter(name="locker_id", description="Locker ID to filter", required=True, type=int),
    ],
    responses={
        200: OpenApiResponse(
            description="Resources retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connection_type_id": {"type": "integer"},
                    "username": {"type": "string"},
                    "data": {
                        "type": "array",
                        "items": {"type": "object"}
                    }
                },
                "example": {
                    "success": True,
                    "connection_type_id": 1,
                    "username": "user1",
                    "data": [
                        {
                            "id": 101,
                            "resource_name": "Document A",
                            "connection_type_name": "Type A"
                        }
                    ]
                }
            }
        ),
        400: OpenApiResponse(description="Missing required parameters"),
        404: OpenApiResponse(description="User or Locker not found")
    }
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_user_resources_by_connection_type(request):
    """
    Fetch resource names and XNode details for a specific connection type and user.

    Query Parameters:
        - connection_type_id: ID of the connection type to filter.
        - username: Username to filter the resources for.
        -locker_id: locker ID to filter specific locker

    Returns:
        - JsonResponse: A JSON object with the resource names and associated XNode details.
    """
    if request.method != "GET":
        return JsonResponse(
            {"success": False, "error": "Invalid request method"}, status=405
        )

    try:
        connection_type_id = request.GET.get("connection_type_id")
        username = request.GET.get("username")
        locker_id = request.GET.get("locker_id")

        if not connection_type_id or not username or not locker_id:
            return JsonResponse(
                {"success": False, "message": "Missing connection_type_id or username or locker_id"},
                status=400,
            )

        # Fetch user by username
        user = CustomUser.objects.filter(username=username).first()
        if not user:
            return JsonResponse(
                {"success": False, "message": "User not found"}, status=404
            )
        
        # Verify the locker exists and belongs to the user
        locker = Locker.objects.filter(locker_id=locker_id).first()
        if not locker:
            return JsonResponse({"success": False, "message": "Locker not found for the given user"}, status=404)


        # Filter connections by locker
        connections = Connection.objects.filter(
            connection_type_id=connection_type_id, guest_user=user, host_locker_id=locker
        ).select_related("connection_type")

        if not connections.exists():
            return JsonResponse(
                {"success": False, "message": "No connections found"}, status=404
            )

        # Prepare response with all XNode details and resource names
        xnode_data_with_resources = []

        for connection in connections:
            # Fetch XNode details related to the connection
            xnodes = Xnode_V2.objects.filter(connection=connection, locker = locker).select_related("connection")

            for xnode in xnodes:
                try:
                    # Get inode information for the XNode
                    start_inode = access_Resource(xnode_id=xnode.id)
                    if start_inode is None:
                        continue  # Skip this XNode if no inode is found

                    # Fetch resource associated with the inode
                    resource = Resource.objects.get(
                        resource_id=start_inode.node_information.get("resource_id")
                    )

                    # Serialize XNode data
                    xnode_serializer = XnodeV2Serializer(xnode)
                    xnode_data = xnode_serializer.data
                    xnode_data["resource_name"] = resource.document_name  # Add resource name
                    xnode_data["connection_type_name"] = connection.connection_type.connection_type_name

                    xnode_data_with_resources.append(xnode_data)

                except Resource.DoesNotExist:
                    continue  # Skip this XNode if the resource does not exist
                except Exception as e:
                    return JsonResponse({"success": False, "error": str(e)}, status=500)

        return JsonResponse(
            {
                "success": True,
                "connection_type_id": connection_type_id,
                "username": username,
                "data": xnode_data_with_resources,
            },
            status=200,
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@extend_schema(
    description="Fetch XNode details for a specific outgoing connection.",
    parameters=[
        OpenApiParameter(name="connection_id", description="ID of the connection", required=True, type=int),
        OpenApiParameter(name="locker_id", description="Locker ID", required=True, type=int),
    ],
    responses={
        200: OpenApiResponse(
            description="XNode details retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connection_id": {"type": "integer"},
                    "data": {
                        "type": "array",
                        "items": {"type": "object"}
                    }
                },
                "example": {
                    "success": True,
                    "connection_id": 10,
                    "data": [
                        {
                            "id": 101,
                            "resource_name": "Document B",
                            "connection_type_name": "Type B"
                        }
                    ]
                }
            }
        ),
        400: OpenApiResponse(description="Missing connection_id or locker_id"),
        404: OpenApiResponse(description="Connection or Locker not found")
    }
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connection_xnode_details(request):
    """
    Fetch XNode details and associated resource names for a specific outgoing connection.

    Query Parameters:
        - connection_id: ID of the connection to filter.
        - locker_id:locker_id 

    Returns:
        - JsonResponse: A JSON object with XNode details and associated resource names.
    """
    try:
        connection_id = request.GET.get("connection_id")
        locker_id = request.GET.get("locker_id")

        if not connection_id or not locker_id:
            return JsonResponse(
                {"success": False, "message": "Missing connection_id or locker_id"}, status=400
            )
        
        locker = Locker.objects.filter(locker_id=locker_id).first()
        if not locker:
            return JsonResponse({"success": False, "message": "Locker not found for the given user"}, status=404)



        # Fetch the connection
        connection = Connection.objects.filter(connection_id=connection_id, guest_locker = locker).select_related("connection_type", "host_user").first()
        
        if not connection:
            return JsonResponse(
                {"success": False, "message": "Connection not found"}, status=404
            )
        

        # Fetch XNodes related to this connection
        xnodes = Xnode_V2.objects.filter(connection=connection, locker = locker).select_related("connection")
        xnode_data_with_resources = []
        print("xnode data with resources",xnode_data_with_resources)

        for xnode in xnodes:
            try:
                # Get inode information for the XNode
                start_inode = access_Resource(xnode_id=xnode.id)
                if start_inode is None:
                    continue  # Skip if no inode is found

                # Fetch resource associated with the inode
                resource = Resource.objects.get(
                    resource_id=start_inode.node_information.get("resource_id")
                )

                # Serialize XNode data
                xnode_serializer = XnodeV2Serializer(xnode)
                xnode_data = xnode_serializer.data
                xnode_data["resource_name"] = resource.document_name  # Add resource name
                xnode_data["connection_type_name"] = connection.connection_type.connection_type_name
                xnode_data_with_resources.append(xnode_data)

            except Resource.DoesNotExist:
                continue  # Skip this XNode if the resource does not exist
            except Exception as e:
                return JsonResponse({"success": False, "error": str(e)}, status=500)

        return JsonResponse(
            {
                "success": True,
                "connection_id": connection_id,
                "data": xnode_data_with_resources,
            },
            status=200,
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)





@extend_schema(
    description="Fetch resources sent by host to guest for a specific connection.",
    parameters=[
        OpenApiParameter(name="connection_id", description="ID of the connection", required=True, type=int),
        OpenApiParameter(name="guest_user_id", description="Guest user ID", required=True, type=int),
        OpenApiParameter(name="guest_locker_id", description="Guest locker ID", required=True, type=int),
    ],
    responses={
        200: OpenApiResponse(
            description="Host shared resources retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connection_id": {"type": "integer"},
                    "connection_name": {"type": "string"},
                    "connection_type_name": {"type": "string"},
                    "shared_to_user": {"type": "string"},
                    "data": {
                        "type": "array",
                        "items": {"type": "object"}
                    }
                },
                "example": {
                    "success": True,
                    "connection_id": 5,
                    "connection_name": "Connection X",
                    "connection_type_name": "Type X",
                    "shared_to_user": "guest_user",
                    "data": [
                        {
                            "id": 202,
                            "resource_name": "Shared Doc",
                            "shared_to_user": "guest_user",
                            "connection_type_name": "Type X"
                        }
                    ]
                }
            }
        ),
        400: OpenApiResponse(description="Missing parameters or validation error"),
        403: OpenApiResponse(description="Unauthorized"),
        404: OpenApiResponse(description="Connection or User not found")
    }
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_incoming_connection_resource_shared_by_host_to_guest(request):
    """
    Fetch resources sent by host to guest for a specific connection.

    Query Params:
        - connection_id: ID of the connection
        - user_id: Guest user ID (for validation)
        - locker_id: Guest locker ID (for validation)
    """
    try:
        connection_id = request.GET.get("connection_id")
        guest_user_id = request.GET.get("guest_user_id")
        guest_locker_id = request.GET.get("guest_locker_id")

        if not connection_id or not guest_user_id or not guest_locker_id:
            return JsonResponse(
                {"success": False, "message": "Missing connection_id, user_id, or locker_id"},
                status=400,
            )

        host_user = request.user

        # # Validate host locker (optional if needed)
        # host_locker = Locker.objects.filter(user=host_user).first()
        # if not host_locker:
        #     return JsonResponse({"success": False, "message": "Host locker not found"}, status=404)

        # Get guest user
        guest_user = CustomUser.objects.filter(user_id=guest_user_id).first()
        if not guest_user:
            return JsonResponse({"success": False, "message": "Guest user not found"}, status=404)

        # Get connection
        connection = Connection.objects.select_related("guest_user", "guest_locker", "connection_type").filter(
            connection_id=connection_id).first()
        if not connection:
            return JsonResponse({"success": False, "message": "Connection not found"}, status=404)

        if connection.host_user != host_user:
            return JsonResponse({"success": False, "message": "Unauthorized: Not host in this connection"}, status=403)

        if connection.guest_user.user_id != guest_user.user_id or str(connection.guest_locker.locker_id) != str(guest_locker_id):
            return JsonResponse({
                "success": False,
                "message": "Guest user_id or locker_id does not match the connection"
            }, status=400)

        # Fetch xnodes in guest locker (host → guest)
        #xnodes = Xnode_V2.objects.filter(connection=connection, locker=connection.guest_locker)
        try:
            xnodes = Xnode_V2.objects.filter(connection=connection,locker=connection.guest_locker).exclude(creator=connection.guest_user.user_id)
        except Exception as e:
            return JsonResponse({"success": False, "error": f"xnode filter failed: {str(e)}"}, status=500)

        xnode_data_with_resources = []

        for xnode in xnodes:
            try:
                inode = access_Resource(xnode_id=xnode.id)
                if not inode:
                    continue
                resource = Resource.objects.get(resource_id=inode.node_information.get("resource_id"))

                xnode_serializer = XnodeV2Serializer(xnode)
                xnode_data = xnode_serializer.data
                xnode_data["resource_name"] = resource.document_name
                xnode_data["shared_to_user"] = connection.guest_user.username
                xnode_data["connection_type_name"] = connection.connection_type.connection_type_name

                xnode_data_with_resources.append(xnode_data)
            except Resource.DoesNotExist:
                continue
            except Exception as e:
                return JsonResponse({"success": False, "error": str(e)}, status=500)

        return JsonResponse({
            "success": True,
            "connection_id": connection.connection_id,
            "connection_name": connection.connection_name,
            "connection_type_name":connection.connection_type.connection_type_name,
            "shared_to_user": connection.guest_user.username,
            "data": xnode_data_with_resources
        }, status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@extend_schema(
    description="Fetch resources sent by guest to host for a specific connection.",
    parameters=[
        OpenApiParameter(name="connection_id", description="ID of the connection", required=True, type=int),
        OpenApiParameter(name="host_user_id", description="Host user ID", required=True, type=int),
        OpenApiParameter(name="host_locker_id", description="Host locker ID", required=True, type=int),
    ],
    responses={
        200: OpenApiResponse(
            description="Guest shared resources retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "connection_id": {"type": "integer"},
                    "connection_name": {"type": "string"},
                    "connection_type_name": {"type": "string"},
                    "shared_to_user": {"type": "string"},
                    "data": {
                        "type": "array",
                        "items": {"type": "object"}
                    }
                },
                "example": {
                    "success": True,
                    "connection_id": 5,
                    "connection_name": "Connection Y",
                    "connection_type_name": "Type Y",
                    "shared_to_user": "host_user",
                    "data": [
                        {
                            "id": 303,
                            "resource_name": "Guest Doc",
                            "shared_to_user": "host_user",
                            "connection_type_name": "Type Y"
                        }
                    ]
                }
            }
        ),
        400: OpenApiResponse(description="Missing parameters or validation error"),
        403: OpenApiResponse(description="Unauthorized"),
        404: OpenApiResponse(description="Connection or User not found")
    }
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_outgoing_connection_resource_shared_by_guest_to_host(request):
    """
    Fetch resources sent by guest to host for a specific connection.

    Query Params:
        - connection_id: ID of the connection
        - user_id: Host user ID (for validation)
        - locker_id: Host locker ID (for validation)
    """
    try:
        connection_id = request.GET.get("connection_id")
        host_user_id = request.GET.get("host_user_id")
        host_locker_id = request.GET.get("host_locker_id")

        if not connection_id or not host_user_id or not host_locker_id:
            return JsonResponse(
                {"success": False, "message": "Missing connection_id, user_id, or locker_id"},
                status=400,
            )

        guest_user = request.user

        # Get host user
        host_user = CustomUser.objects.filter(user_id=host_user_id).first()
        if not host_user:
            return JsonResponse({"success": False, "message": "Host user not found"}, status=404)

        # Get connection
        connection = Connection.objects.select_related("host_user", "host_locker", "connection_type").filter(
            connection_id=connection_id).first()
        if not connection:
            return JsonResponse({"success": False, "message": "Connection not found"}, status=404)

        if connection.guest_user != guest_user:
            return JsonResponse({"success": False, "message": "Unauthorized: Not guest in this connection"}, status=403)

        if connection.host_user.user_id != host_user.user_id or str(connection.host_locker.locker_id) != str(host_locker_id):
            return JsonResponse({
                "success": False,
                "message": "Host user_id or locker_id does not match the connection"
            }, status=400)

        # Fetch xnodes in host locker (guest to host)
        xnodes = Xnode_V2.objects.filter(connection=connection, locker=connection.host_locker).exclude(creator=connection.host_user.user_id)
        xnode_data_with_resources = []

        for xnode in xnodes:
            try:
                inode = access_Resource(xnode_id=xnode.id)
                if not inode:
                    continue
                resource = Resource.objects.get(resource_id=inode.node_information.get("resource_id"))

                xnode_serializer = XnodeV2Serializer(xnode)
                xnode_data = xnode_serializer.data
                xnode_data["resource_name"] = resource.document_name
                xnode_data["shared_to_user"] = connection.host_user.username
                xnode_data["connection_type_name"] = connection.connection_type.connection_type_name

                xnode_data_with_resources.append(xnode_data)
            except Resource.DoesNotExist:
                continue
            except Exception as e:
                return JsonResponse({"success": False, "error": str(e)}, status=500)

        return JsonResponse({
            "success": True,
            "connection_id": connection.connection_id,
            "connection_name": connection.connection_name,
            "connection_type_name":connection.connection_type.connection_type_name,
            "shared_to_user": connection.host_user.username,
            "data": xnode_data_with_resources
        }, status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
