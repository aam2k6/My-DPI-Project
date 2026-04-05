
import os
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.http import FileResponse, Http404
from api.model.xnode_model import Xnode_V2
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from api.models import (
    Connection,
    ConnectionType,
    Resource
)


from api.model.xnode_model import Xnode_V2
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes


@extend_schema(
    summary="Download Resource by Xnode ID",
    description=(
        "Downloads a resource file using its Xnode ID passed as a query parameter. "
        "Only the primary owner can download the resource. "
        "Download is not allowed for VNODEs or locked resources."
    ),
    parameters=[
        OpenApiParameter(
            name="xnode_id",
            description="ID of the Xnode to download from",
            required=True,
            type=int,
            location=OpenApiParameter.QUERY,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="File downloaded successfully (binary response)"
        ),
        400: OpenApiResponse(
            description="Invalid request or missing Xnode ID"
        ),
        401: OpenApiResponse(
            description="User not authenticated"
        ),
        402: OpenApiResponse(
            description="Download disabled or user not authorized"
        ),
        404: OpenApiResponse(
            description="File not found"
        ),
        405: OpenApiResponse(
            description="Method not allowed"
        ),
        500: OpenApiResponse(
            description="Internal server error"
        ),
    },
    # tags=["Resource Management"],
)


@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def download_resource(request):
    if request.method != 'GET':
        return JsonResponse({"success":False,"error":"Invalid request method"},status=405)
    try:
        user_id=request.user.user_id

        if not user_id :
            return JsonResponse({"success": False, "error": "Missing user_id"}, status=400)
        
        #body = json.loads(request.body)
        xnode_id = request.GET.get("xnode_id")

        if not xnode_id:
            return JsonResponse({'success': False, 'error': 'Missing Xnode ID'}, status=400)

        xnode = Xnode_V2.objects.get(id=xnode_id)

        if xnode.xnode_Type == 'VNODE':
            return JsonResponse({'success': "Cannot download using VNode"}, status=400)
        
        if xnode.is_locked['download']:
            return JsonResponse({'success': False, 'error': 'Download has been disabled'}, status=402)

        if xnode.node_information['primary_owner'] != user_id:
            return JsonResponse({'success': False, 'error' : 'Only Primary owner can download'}, status=402)

        while xnode.xnode_Type == 'SNODE':
            xnode = Xnode_V2.objects.get(id=xnode.node_information['inode_or_snode_id'])


        # file_path = os.path.join(os.getcwd(), xnode.node_information['resourse_link'])
        # print("Looking for file at:", file_path)

        media_relative_path = xnode.node_information['resourse_link']

        # Strip leading '/media/' or 'media/' from stored path
        if media_relative_path.startswith(settings.MEDIA_URL):
            media_relative_path = media_relative_path[len(settings.MEDIA_URL):]

        # Now join with MEDIA_ROOT
        file_path = os.path.join(settings.MEDIA_ROOT, media_relative_path)

        # Normalize path 
        file_path = os.path.normpath(file_path)


        if os.path.exists(file_path):
            return FileResponse(open(file_path, 'rb'), as_attachment=True)
        else:
            raise Http404("File not found.")

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500) 
    


@extend_schema(
    summary="Check download permission status",
    description=(
        "Checks whether a resource can be downloaded based on both "
        "Xnode permissions and Connection Type permissions."
    ),
    parameters=[
        OpenApiParameter(
            name="xnode_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            required=True,
            description="ID of the Xnode",
        ),
        OpenApiParameter(
            name="connection_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            required=True,
            description="ID of the connection",
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Download permission status",
            response={
                "type": "object",
                "properties": {
                    "canDownload": {
                        "type": "boolean",
                        "description": "Indicates whether the resource can be downloaded",
                    },
                },
                "example": {
                    "canDownload": True
                },
            },
        ),
        401: OpenApiResponse(
            description="User not authenticated"
        ),
        404: OpenApiResponse(
            description="Connection, connection type, or Xnode not found"
        ),
        405: OpenApiResponse(
            description="Method not allowed"
        ),
    },
    # tags=["Resource Management"],
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])

def check_download_status(request, xnode_id, connection_id):
    print(f"Received request for check_download_status with xnode_id={xnode_id}, connection_id={connection_id}")

    if request.method != "GET":
        print("Error: Method not allowed")
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Fetch Connection
    try:
        connection = Connection.objects.get(connection_id=connection_id)
        print(f"Found Connection: {connection}")
    except Connection.DoesNotExist:
        print("Error: Connection not found")
        return JsonResponse({"error": "Connection not found"}, status=404)

    # Get Connection Type ID
    connection_type_id = connection.connection_type.connection_type_id
    print(f"Connection Type ID: {connection_type_id}")

    # Fetch ConnectionType_V2
    try:
        connection_type = ConnectionType.objects.get(connection_type_id=connection_type_id)
        print(f"Found ConnectionType_V2: {connection_type}")
    except ConnectionType.DoesNotExist:
        print("Error: Connection type not found")
        return JsonResponse({"error": "Connection type not found"}, status=404)

    # Fetch Xnode_V2
    try:
        xnode = Xnode_V2.objects.get(id=xnode_id)
        print(f"Found Xnode_V2: {xnode}")
    except Xnode_V2.DoesNotExist:
        print("Error: Xnode not found")
        return JsonResponse({"error": "Xnode not found"}, status=404)

    # Debugging permissions
    print(f"xnode post_conditions: {xnode.post_conditions}")
    print(f"connection_type post_conditions: {connection_type.post_conditions}")

    node_download_permission = xnode.post_conditions.get("download", False)
    connection_download_permission = connection_type.post_conditions.get("download", False)

    can_download = node_download_permission and connection_download_permission

    print(f"Download permissions - Node: {node_download_permission}, Connection Type: {connection_download_permission}")
    print(f"Final canDownload value: {can_download}")

    return JsonResponse({"canDownload": can_download})


@extend_schema(
    summary="Download resource by resource ID",
    description=(
        "Downloads a resource file using its resource ID passed as a path parameter. "
        "The authenticated user must have access to the resource."
    ),
    parameters=[
        OpenApiParameter(
            name="resource_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            required=True,
            description="ID of the resource to download",
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="File downloaded successfully (binary response)"
        ),
        400: OpenApiResponse(
            description="Bad request or unexpected error"
        ),
        401: OpenApiResponse(
            description="User not authenticated"
        ),
        404: OpenApiResponse(
            description="Resource or file not found"
        ),
    },
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def download_resource(request, resource_id):
    """
    View to download a resource by its ID.

    Parameters:
    - request: HttpRequest object containing metadata about the request.
    - resource_id: ID of the resource to be downloaded.

    Returns:
    - FileResponse: The file to be downloaded.
    - JsonResponse: A JSON object with an error message if the resource is not found or not accessible.
    """
    try:
        resource = get_object_or_404(Resource, resource_id=resource_id)

        # Assume resource.i_node_pointer stores the relative path, e.g., 'documents/hk_admissions.pdf'
        relative_path = resource.i_node_pointer
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        file_path = file_path.replace("\\", "/") # Ensure the path is in the correct format for the OS
        print(f"Trying to access file at: {file_path}")

        if os.path.exists(file_path):
            response = FileResponse(
                open(file_path, "rb"),
                as_attachment=True,
                filename=os.path.basename(file_path),
            )
            return response
        else:
            print(f"File not found at: {file_path}")
            return JsonResponse({"error": "File not found."}, status=404)
    except Exception as e:
        print(f"Error: {str(e)}")
        return JsonResponse({"error": str(e)}, status=400)
