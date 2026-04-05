
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api.models import Locker
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse

#google
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import extend_schema, OpenApiResponse

@csrf_exempt
@extend_schema(
    description="Creates a locker associated with the logged-in user.",
    request={
        'application/x-www-form-urlencoded': {
            'type': 'object',
            'properties': {
                'name': {'type': 'string'},
                'description': {'type': 'string'}
            },
            'required': ['name']
        }
    },
    responses={
        201: OpenApiResponse(
            description="Successfully created a locker",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "id": {"type": "integer"},
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                },
                "example": {
                    "success": True,
                    "id": 1,
                    "name": "My Locker",
                    "description": "Personal documents"
                }
            }
        ),
        400: OpenApiResponse(
            description="Invalid request",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Locker with this name already exists"
                }
            }
        )
    }
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_locker(request):
    """
    Creates a locker associated with the logged-in user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Body:
    - name : The name of the new locker.
    - description (optional): The description of the new locker.

    Returns:
    - JsonResponse: A JSON object containing the new locker id, its name and description or an error message.

    Response Codes:
    - 201: Successfully created a resource (locker) at the backend.
    - 400: The data sent in the request is invalid, missing or malformed.
    - 401: The user is not authenticated.
    - 405: Request method not allowed (if not POST).
    """
    if request.method == "POST":
        try:
            # data = json.loads(request.body)
            locker_name = request.POST.get("name")
            description = request.POST.get("description", "")

            if not locker_name:
                return JsonResponse(
                    {"success": False, "error": "Name is required"}, status=400
                )

            user = request.user

            # Check if a locker with the same name already exists for this user
            if Locker.objects.filter(name=locker_name, user=user).exists():
                return JsonResponse(
                    {"success": False, "error": "Locker with this name already exists"},
                    status=400,
                )

            # Create the locker
            locker = Locker.objects.create(
                name=locker_name, description=description, user=user
            )
            return JsonResponse(
                {
                    "success": True,
                    "id": locker.locker_id,
                    "name": locker.name,
                    "description": locker.description,
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

