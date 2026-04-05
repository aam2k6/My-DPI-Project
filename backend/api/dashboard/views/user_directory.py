from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from api.models import (
    CustomUser
)
from api.serializers import UserSerializer
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse


from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import extend_schema

@extend_schema(
    summary="Get user directory",
    responses={
        200: OpenApiResponse(
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "users": {
                        "type": "array",
                        "items": {"type": "object"}
                    }
                }
            }
        )
    }
)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_directory(request):
    """ "
    Retrieve all users present in the DPI Directory.

    Parameters:
       - request: HttpRequest object containing metadata about the request.

    Returns:
       - JsonResponse: A JSON object containing a list of all users or an error message.

    Response Codes:
       - 200: Successful retrieval of users.
       - 404: No users are found.
       - 405: Request method not allowed (if not GET).
    """
    if request.method == "GET":
        #users = CustomUser.objects.all()
        users = CustomUser.objects.filter(login_method='google')
        if not users.exists():
            return JsonResponse(
                {"success": False, "message": "No Users are present."}, status=404
            )

        serializer = UserSerializer(users, many=True)
        return JsonResponse({"success": True, "users": serializer.data}, status=200)
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )