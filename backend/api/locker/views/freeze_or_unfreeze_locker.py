
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api.models import (
    Locker,
    CustomUser,

)

from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse


#google
from rest_framework_simplejwt.authentication import JWTAuthentication


from drf_spectacular.utils import extend_schema, OpenApiResponse

@csrf_exempt
@extend_schema(
    description="Freeze or unfreeze a locker.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'username': {'type': 'string'},
                'locker_name': {'type': 'string'},
                'action': {'type': 'string', 'enum': ['freeze', 'unfreeze']}
            },
            'required': ['username', 'locker_name', 'action']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Locker frozen/unfrozen successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"}
                },
                "example": {
                    "success": True,
                    "message": "Locker \"My Locker\" has been frozen"
                }
            }
        ),
        400: OpenApiResponse(description="Invalid request or action"),
        401: OpenApiResponse(description="User not authenticated"),
        403: OpenApiResponse(description="Permission denied"),
        404: OpenApiResponse(description="Locker or user not found")
    }
)
@api_view(["PUT"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def freeze_or_unfreeze_locker(request):
    """
    Freeze or unfreeze a locker based on its current status.

    Parameters:
        - request: HttpRequest object containing metadata about the request.

    Form Parameters:
        - username: The username of the user whose locker is to be frozen or unfrozen.
        - locker_name: Name of the locker to be frozen or unfrozen.
        - action: Specifies whether to "freeze" or "unfreeze" the locker.

    Returns:
        - JsonResponse: A JSON object indicating success or an error message.

    Response Codes:
        - 200: Successful freezing or unfreezing of the locker.
        - 400: Bad request (if data is invalid).
        - 401: User not authenticated.
        - 403: Forbidden (if the requesting user does not have permission).
        - 404: Locker not found.
        - 405: Request method not allowed (if not PUT).
    """
    if request.method == "PUT":
        if not request.user.is_authenticated:
            return JsonResponse(
                {"success": False, "error": "User not authenticated"}, status=401
            )

        # Check if the requesting user is a sys_admin or moderator
        requesting_user = request.user
        if requesting_user.user_type not in [
            "sys_admin",
            CustomUser.SYS_ADMIN,
            CustomUser.MODERATOR,
        ]:
            return JsonResponse(
                {"success": False, "error": "Permission denied"}, status=403
            )

        username = request.data.get("username")
        locker_name = request.data.get("locker_name")
        action = request.data.get("action")

        if not username or not locker_name or not action:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Username, locker name, and action are required",
                },
                status=400,
            )

        try:
            user = CustomUser.objects.get(username=username)
            locker = Locker.objects.get(name=locker_name, user=user)
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Locker not found"}, status=404
            )

        if action == "freeze":
            if locker.is_frozen:
                return JsonResponse(
                    {"success": False, "error": "Locker is already frozen"}, status=400
                )
            locker.is_frozen = True
            locker.save()
            return JsonResponse(
                {"success": True, "message": f'Locker "{locker_name}" has been frozen'},
                status=200,
            )

        elif action == "unfreeze":
            if not locker.is_frozen:
                return JsonResponse(
                    {"success": False, "error": "Locker is not frozen"}, status=400
                )
            locker.is_frozen = False
            locker.save()
            return JsonResponse(
                {
                    "success": True,
                    "message": f'Locker "{locker_name}" has been unfrozen',
                },
                status=200,
            )

        else:
            return JsonResponse(
                {"success": False, "error": "Invalid action specified"}, status=400
            )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )