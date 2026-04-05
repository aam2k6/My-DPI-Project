
import os
import json
from django.http import JsonResponse, HttpRequest
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.conf import settings
from pypdf import PdfReader,PdfWriter
from api.models import Locker, Resource, CustomUser, Connection ,Notification , ConnectionType
from api.model.xnode_model import Xnode_V2
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import StreamingHttpResponse, HttpResponse, JsonResponse
from api.utils.resource_helper.access_resource_helper import access_Resource



from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

@csrf_exempt
@extend_schema(
    methods=["GET"],
    description="Get total pages in a document.",
    parameters=[
        OpenApiParameter(name="xnode_id", description="ID of the Xnode", required=True, type=str),
    ],
    responses={
        200: OpenApiResponse(
            description="Total pages retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "total_pages": {"type": "integer"}
                },
                "example": {
                    "success": True,
                    "message": "The document has 10 pages.",
                    "total_pages": 10
                }
            }
        ),
        400: OpenApiResponse(description="Missing xnode_id"),
        404: OpenApiResponse(description="Resource or file not found")
    }
)
@extend_schema(
    methods=["POST"],
    description="Validate page range against document's total pages.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'xnode_id': {'type': 'string'},
                'from_page': {'type': 'integer'},
                'to_page': {'type': 'integer'}
            },
            'required': ['xnode_id', 'from_page', 'to_page']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Page range validated successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"}
                },
                "example": {
                    "success": True,
                    "message": "Valid page range."
                }
            }
        ),
        400: OpenApiResponse(description="Invalid request or page range"),
        404: OpenApiResponse(description="Resource or file not found")
    }
)
@api_view(["GET", "POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_total_pages_in_document(request):
    """
    This API provides:
    - GET: Returns the total number of pages in a document based on the xnode_id.
    - POST: Validates a given page range (from_page, to_page) against the document's total pages.

    Expected JSON Body for POST:
    {
        "xnode_id": <xnode_id>,
        "from_page": <from_page>,
        "to_page": <to_page>
    }

    GET Parameters:
    - xnode_id: ID of the Xnode to retrieve total pages.

    Returns:
    - Success if pages are valid, or error message if invalid.
    """
    if request.method == "GET":
        try:
            # Extract xnode_id from query parameters
            xnode_id = request.GET.get("xnode_id")
            if not xnode_id:
                return JsonResponse(
                    {"error": "xnode_id is required in query parameters"}, status=400
                )

            # Access the INODE using the provided xnode_id
            start_inode = access_Resource(xnode_id=xnode_id)
            if not start_inode:
                return JsonResponse(
                    {"error": f"No INODE found for xnode_id: {xnode_id}"}, status=404
                )

            # Fetch the resource using the resource_id from the INODE
            resource_id = start_inode.node_information.get("resource_id")
            if not resource_id:
                return JsonResponse(
                    {"error": "No resource_id found in INODE"}, status=404
                )

            # Fetch the resource
            resource = Resource.objects.get(resource_id=resource_id)
            pdf_file_path = os.path.join(settings.MEDIA_ROOT, resource.i_node_pointer)
            pdf_file_path = pdf_file_path.replace("\\", "/")

            # Check if the file exists
            if not os.path.exists(pdf_file_path):
                return JsonResponse(
                    {"error": f"File not found for resource_id: {resource_id}"},
                    status=404,
                )

            # Read the PDF and get the number of pages
            with open(pdf_file_path, "rb") as file:
                reader = PdfReader(file)
                total_pages = len(reader.pages)

            return JsonResponse(
                {
                    "success": True,
                    "message": f"The document has {total_pages} pages.",
                    "total_pages": total_pages,
                },
                status=200,
            )

        except Resource.DoesNotExist:
            return JsonResponse(
                {"error": f"Resource with ID {resource_id} not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    elif request.method == "POST":
        try:
            # Extract data from the request body
            data = request.data
            xnode_id = data.get("xnode_id")
            from_page = data.get("from_page")
            to_page = data.get("to_page")

            # Check if all required fields are provided
            if not all([xnode_id, from_page, to_page]):
                return JsonResponse(
                    {"error": "All fields (xnode_id, from_page, to_page) are required"},
                    status=400,
                )

            # Convert from_page and to_page to integers (and handle ValueError if they aren't valid integers)
            try:
                from_page = int(from_page)
                to_page = int(to_page)
            except ValueError:
                return JsonResponse(
                    {"error": "from_page and to_page must be valid integers"},
                    status=400,
                )

            # Access the INODE using the provided xnode_id
            start_inode = access_Resource(xnode_id=xnode_id)
            if not start_inode:
                return JsonResponse(
                    {"error": f"No INODE found for xnode_id: {xnode_id}"}, status=404
                )

            # Fetch the resource using the resource_id from the INODE
            resource_id = start_inode.node_information.get("resource_id")
            if not resource_id:
                return JsonResponse(
                    {"error": "No resource_id found in INODE"}, status=404
                )

            # Fetch the resource
            resource = Resource.objects.get(resource_id=resource_id)
            pdf_file_path = os.path.join(settings.MEDIA_ROOT, resource.i_node_pointer).replace("\\", "/")

            # Check if the file exists
            if not os.path.exists(pdf_file_path):
                return JsonResponse(
                    {"error": f"File not found for resource_id: {resource_id}"},
                    status=404,
                )

            # Read the PDF and get the number of pages
            with open(pdf_file_path, "rb") as file:
                reader = PdfReader(file)
                total_pages = len(reader.pages)

            # Validate the provided page range
            if from_page < 1 or to_page > total_pages or from_page > to_page:
                return JsonResponse(
                    {
                        "error": f"Invalid page range. Document has {total_pages} pages. Entered range: from_page={from_page}, to_page={to_page}"
                    },
                    status=400,
                )

            return JsonResponse(
                {
                    "success": True,
                    "message": f"Valid page range. Document has {total_pages} pages. Entered range: from_page={from_page}, to_page={to_page}",
                },
                status=200,
            )

        except Resource.DoesNotExist:
            return JsonResponse(
                {"error": f"Resource with ID {resource_id} not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)

