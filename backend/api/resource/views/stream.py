
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.models import Locker, Resource, CustomUser, Connection ,Notification , ConnectionType
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.utils.google_drive_helper.drive_helper import get_or_refresh_google_token
import requests
from django.http import StreamingHttpResponse, HttpResponse, JsonResponse
from api.utils.resource_helper.access_resource_helper import access_Resource


from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

# stream file to user
@csrf_exempt
@extend_schema(
    description="Streams a Google Drive file for a given xnode_id.",
    parameters=[
        OpenApiParameter(name="xnode_id", description="ID of the Xnode", required=True, type=int),
    ],
    responses={
        200: OpenApiTypes.BINARY, 
        400: OpenApiResponse(description="Missing xnode_id or resource ID"), 
        403: OpenApiResponse(description="Access denied"), 
        404: OpenApiResponse(description="Resource or file not found"), 
        502: OpenApiResponse(description="Failed to fetch from Drive")
    }
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def stream_resource(request):
    """
    Streams a Google Drive file for a given xnode_id (any vnode/snode/inode).
    - Resolves to root INODE via access_Resource(...)
    - Uses INODE owner's token to fetch content from Drive (or anonymous if resource is public)
    - Supports Range requests (206 Partial Content) for video seeking
    """
    xnode_id = request.GET.get("xnode_id")
    if not xnode_id:
        return JsonResponse({"message": "xnode_id is required."}, status=400)

    # Resolve to the original inode
    inode = access_Resource(xnode_id=int(xnode_id))
    if not inode:
        return JsonResponse({"message": "Could not find original inode."}, status=404)

    resource_id = inode.node_information.get("resource_id")
    if not resource_id:
        return JsonResponse({"message": "Resource ID missing in inode."}, status=400)

    try:
        resource = Resource.objects.get(resource_id=resource_id)
    except Resource.DoesNotExist:
        return JsonResponse({"message": "Resource not found."}, status=404)

    file_id = resource.i_node_pointer
    mime = resource.drive_mime_type or "application/octet-stream"
    filename = resource.drive_file_name or resource.document_name or "file"
    owner_user = resource.owner

    # Fetch owner's Google token
    owner_token = None
    try:
        owner_token = get_or_refresh_google_token(owner_user)
    except Exception as e:
        print("Warning fetching owner token:", e)

    # Resource is PRIVATE, but token unavailable -> deny
    if resource.type == Resource.PRIVATE and not owner_token:
        return JsonResponse({"message": "Owner Google token unavailable. Access denied."}, status=403)

    headers = {}
    if owner_token:
        headers["Authorization"] = f"Bearer {owner_token}"

    # Range header for partial streaming
    range_header = request.META.get("HTTP_RANGE", None)
    if range_header:
        headers["Range"] = range_header

    session = requests.Session()
    session.max_redirects = 3

    # Detect Google-native MIME (Docs, Sheets, Slides, Drawing)
    google_mime = resource.drive_mime_type
    is_google_native = google_mime.startswith("application/vnd.google-apps") if google_mime else False

    # Export rule map for supported Google-native file types
    export_map = {
        "application/vnd.google-apps.document": "application/pdf",
        "application/vnd.google-apps.spreadsheet": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.google-apps.presentation": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.google-apps.drawing": "image/png",
    }

    try:
        if is_google_native:
            # Select appropriate export MIME
            export_mime = export_map.get(google_mime, "application/pdf")

            gurl = (
                f"https://www.googleapis.com/drive/v3/files/{file_id}/export"
                f"?mimeType={export_mime}"
            )

            # Export API does NOT support Range header; ignore Range
            native_headers = {}
            if owner_token:
                native_headers["Authorization"] = f"Bearer {owner_token}"

            resp = session.get(gurl, headers=native_headers, stream=True, timeout=60)

        else:
            # Normal non-Google file -> direct streaming with Range support
            gurl = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
            resp = session.get(gurl, headers=headers, stream=True, timeout=60)

    except requests.RequestException as e:
        print("Error fetching from Drive:", e)
        return JsonResponse({"message": "Failed to fetch file from Drive."}, status=502)

    # Error codes from Google
    if resp.status_code in (401, 403):
        try:
            error_data = resp.json()
            error_msg = error_data.get("error", {}).get("message", "")
            if "insufficient authentication scopes" in error_msg.lower():
                return JsonResponse({
                    "message": "Access denied: Insufficient Google Drive scopes. Please logout and login again, ensuring you grant permission to access Google Drive.",
                    "details": error_msg
                }, status=403)
        except:
            pass
        return JsonResponse({"message": "Access to Drive file denied. Ensure you have granted Google Drive permissions."}, status=403)
    if resp.status_code == 404:
        return JsonResponse({"message": "Drive file not found."}, status=404)

    # Prepare Django streaming response
    status_code = resp.status_code
    content_length = resp.headers.get("Content-Length")
    content_range = resp.headers.get("Content-Range")
    accept_ranges = resp.headers.get("Accept-Ranges", "bytes")  # default bytes
    content_type = resp.headers.get("Content-Type", mime)

    # Streaming iterator
    def stream_generator():
        try:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    yield chunk
        finally:
            try:
                resp.close()
            except:
                pass

    django_response = StreamingHttpResponse(stream_generator(), status=status_code, content_type=content_type)

    # Forward headers
    if content_length:
        django_response["Content-Length"] = content_length

    if content_range:
        django_response["Content-Range"] = content_range
        if status_code != 206:
            django_response.status_code = status_code

    django_response["Accept-Ranges"] = accept_ranges

    # Inline so browser/iframe can preview
    django_response["Content-Disposition"] = f'inline; filename="{filename}"'

    if resp.headers.get("Last-Modified"):
        django_response["Last-Modified"] = resp.headers.get("Last-Modified")

    return django_response
