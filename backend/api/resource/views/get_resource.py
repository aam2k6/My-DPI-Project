
from rest_framework.decorators import (api_view,permission_classes,authentication_classes,)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from api.serializers import (ResourceSerializer,)
from api.models import (Resource,Locker,CustomUser)
from api.serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes


@extend_schema(
    summary="Get resources by locker",
    description="Retrieve all resources belonging to a specific locker of the authenticated user.",
    parameters=[
        OpenApiParameter(
            name="locker_name",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Name of the locker",
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Resources retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "resources": {
                        "type": "array",
                        "items": {"type": "object"},
                    },
                },
                "example": {
                    "success": True,
                    "resources": [
                        {
                            "id": 1,
                            "document_name": "Project Proposal",
                            "type": "Private"
                        }
                    ]
                }
            },
        ),
        401: OpenApiResponse(description="User not authenticated"),
        404: OpenApiResponse(description="Locker not found for the user"),
        405: OpenApiResponse(description="Method not allowed"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_resource_by_user_by_locker(request):
    """
    Retrieves all the resources of a particular locker of the logged-in user.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - locker_name : The name of the locker whose resources have to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of resources.
        - 401: User is not authenticated.
        - 404: Specified user not found, Specified locker not found.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        try:
            locker_name = request.GET.get("locker_name")
            if request.user.is_authenticated:
                user = request.user
            else:
                return JsonResponse({"error": "User not authenticated"}, status=401)

            locker = Locker.objects.filter(user=user, name=locker_name).first()

            # If the current user does not have the given locker with "locker_name"
            if not locker:
                return JsonResponse(
                    {"success": False, "message": "No such locker found for this user"},
                    status=404,
                )

            resources = Resource.objects.filter(locker=locker)
            serializer = ResourceSerializer(resources, many=True)

            return JsonResponse(
                {"success": True, "resources": serializer.data}, status=200
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

@extend_schema(
    summary="Get public resources of a user's locker",
    description="Returns all public resources of a specified user's locker.",
    parameters=[
        OpenApiParameter(
            name="username",
            type=str,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Username of the target user"
        ),
        OpenApiParameter(
            name="locker_name",
            type=str,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Locker name of the target user"
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Public resources retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "resources": {
                        "type": "array",
                        "items": {"type": "object"}
                    }
                },
                "example": {
                    "success": True,
                    "resources": [
                        {
                            "id": 10,
                            "document_name": "Public Report",
                            "type": "Public"
                        }
                    ]
                }
            }
        ),
        400: OpenApiResponse(description="Missing or invalid parameters"),
        404: OpenApiResponse(description="User, locker, or resources not found"),
        401: OpenApiResponse(description="Unauthorized"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_public_resources(request):
    """
    Retrieve all public resources of the guest_user and guest_locker the logged user views.

    This view uses GET request to fetch all resources of guest_user under a specific guest_locker
    whose visibility is marked as "public". Every user should get access to other user's lockers only
    if the current user is authenticated

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username : username of the target_user that the authenticated user is viewing
        - locker_name : locker_name of the viewed user's locker

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of public resources.
        - 400: Specified user or locker not found.
        - 404: No public resources found.
        - 405: Request method not allowed (if not GET).
    """

    if request.method == "GET":
        try:
            username = request.GET.get("username")
            locker_name = request.GET.get("locker_name")
            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )
            if not locker_name:
                return JsonResponse(
                    {"success": False, "error": "Locker Name is required"}, status=400
                )

            try:
                random_user = CustomUser.objects.get(username=username)
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "User not found"}, status=404
                )

            try:
                random_user_locker = Locker.objects.get(
                    user=random_user, name=locker_name
                )
            except Locker.DoesNotExist:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "Locker not found for the given username",
                    },
                    status=404,
                )

            public_resources = Resource.objects.filter(
                owner=random_user, type="public", locker=random_user_locker
            )
            if not public_resources.exists():
                return JsonResponse(
                    {"success": False, "message": "No public resources found"},
                    status=404,
                )
            serializer = ResourceSerializer(public_resources, many=True)
            return JsonResponse(
                {"success": True, "resources": serializer.data}, status=200
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request"}, status=405)

