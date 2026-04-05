
from rest_framework import status
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from api.models import (
    Locker,
    CustomUser
    
)
from api.serializers import  LockerSerializer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse

#google
from rest_framework_simplejwt.authentication import JWTAuthentication


from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

@csrf_exempt
@extend_schema(
    description="Retrieve lockers for a user. If username is not provided, returns lockers for authenticated user.",
    parameters=[
        OpenApiParameter(name="username", description="Username to filter lockers by", required=False, type=str),
    ],
    responses={
        200: LockerSerializer(many=True),
        404: OpenApiResponse(
            description="User or lockers not found",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "error": {"type": "string"}
                },
                "example": {"success": False, "error": "User not found"}
            }
        )
    }
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_lockers_user(request):
    """
    Retrieve lockers associated with a specific user or the authenticated user.

    This view handles GET requests to fetch lockers either for a specific user,
    identified by a 'username' query parameter, or for the authenticated user
    if no username is provided.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username (optional): The username of the user whose lockers are to be fetched.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of lockers.
        - 401: User is not authenticated.
        - 404: Specified user not found.
        - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        try:
            username = request.GET.get("username")
            if username:
                try:
                    user = CustomUser.objects.get(
                        username=username
                    )  # Fetch user by username
                except CustomUser.DoesNotExist:
                    return JsonResponse({"error": "User not found"}, status=404)
            else:
                if request.user.is_authenticated:
                    user = request.user  # Use the authenticated user
                else:
                    return JsonResponse({"error": "User not authenticated"}, status=401)
            lockers = Locker.objects.filter(user=user)

            # If the current user does not have any existing lockers.
            if not lockers.exists():
                return JsonResponse(
                    {"success": False, "message": "No lockers found for this user"},
                    status=404,
                )

            serializer = LockerSerializer(lockers, many=True)
            return JsonResponse(
                {"success": True, "lockers": serializer.data}, status=200
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )