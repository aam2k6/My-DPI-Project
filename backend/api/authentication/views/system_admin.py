
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from api.models import (
    CustomUser,
)

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
    summary="Promote a user to sys_admin",
    description=(
        "Promotes a specified user to `sys_admin`. "
        "Only users with `sys_admin` privileges can perform this action. "
        "Requires authentication."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {
                    "type": "string",
                    "description": "The username of the user to promote to sys_admin",
                }
            },
            "required": ["username"]
        }
    },
    responses={
        200: OpenApiResponse(
            description="User successfully promoted to sys_admin",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"}
                },
                "example": {
                    "success": True,
                    "message": "john_doe has been promoted to sys_admin successfully"
                }
            }
        ),
        400: OpenApiResponse(
            description="Bad request (missing parameters or other error)",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Username is required"
                }
            }
        ),
        403: OpenApiResponse(
            description="Permission denied (requesting user not sys_admin)",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Permission denied"
                }
            }
        ),
        404: OpenApiResponse(
            description="Specified user not found",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "User not found"
                }
            }
        ),
        405: OpenApiResponse(
            description="Invalid request method",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Invalid request method"
                }
            }
        ),
    },
    # tags=["authentication"]
)

@csrf_exempt
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def promote_user_to_sys_admin(request):
    """
    Promote a user to sys_admin.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - username: The username of the user to promote to sys_admin.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful promotion to sys_admin.
    - 404: Specified user not found.
    - 400: Bad request (missing parameters).
    - 403: Permission denied.
    """
    if request.method == "PUT":
        username = request.data.get("username")

        if not username:
            return JsonResponse(
                {"success": False, "error": "Username is required"}, status=400
            )

        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            # Find the user to be promoted
            user_to_promote = CustomUser.objects.get(username=username)

            # Promote the user to sys_admin
            user_to_promote.user_type = CustomUser.SYS_ADMIN
            user_to_promote.save()

            return JsonResponse(
                {
                    "success": True,
                    "message": f"{username} has been promoted to sys_admin successfully",
                },
                status=200,
            )

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )



@extend_schema(
    summary="Promote a user to moderator",
    description=(
        "Promotes a specified user to `moderator`. "
        "Only users with `sys_admin` privileges can perform this action. "
        "Requires authentication."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {
                    "type": "string",
                    "description": "The username of the user to promote to moderator",
                }
            },
            "required": ["username"]
        }
    },
    responses={
        200: OpenApiResponse(
            description="User successfully promoted to sys_admin",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"}
                },
                "example": {
                    "success": True,
                    "message": "john_doe has been promoted to sys_admin successfully"
                }
            }
        ),
        400: OpenApiResponse(
            description="Bad request (missing parameters or other error)",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Username is required"
                }
            }
        ),
        403: OpenApiResponse(
            description="Permission denied (requesting user not sys_admin)",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Permission denied"
                }
            }
        ),
        404: OpenApiResponse(
            description="Specified user not found",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "User not found"
                }
            }
        ),
        405: OpenApiResponse(
            description="Invalid request method",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Invalid request method"
                }
            }
        ),
    },
    # tags=["User Management"]
)

@csrf_exempt
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def promote_user_to_moderator(request):
    """
    Promote a user to moderator.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - username: The username of the user to promote to moderator.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful promotion to moderator.
    - 404: Specified user not found.
    - 400: Bad request (missing parameters).
    - 403: Permission denied.
    """
    if request.method == "PUT":
        username = request.data.get("username")

        if not username:
            return JsonResponse(
                {"success": False, "error": "Username is required"}, status=400
            )

        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            # Find the user to be promoted
            user_to_promote = CustomUser.objects.get(username=username)

            # Promote the user to moderator
            user_to_promote.user_type = CustomUser.MODERATOR
            user_to_promote.save()

            return JsonResponse(
                {
                    "success": True,
                    "message": f"{username} has been promoted to moderator successfully",
                },
                status=200,
            )

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "User not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

@extend_schema(
    summary="Demote sys_admin to regular user",
    description=(
        "Removes admin privileges from a specified user. "
        "Only users with `sys_admin` privileges can perform this action. "
        "Requires authentication via JWT."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {
                    "type": "string",
                    "description": "The username of the sys_admin to be demoted",
                }
            },
            "required": ["username"]
        }
    },
    responses={
        200: OpenApiResponse(
            description="Admin privileges successfully removed",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"}
                },
                "example": {
                    "success": True,
                    "message": "Admin privileges removed from john_doe"
                }
            }
        ),
        400: OpenApiResponse(
            description="Bad request (invalid data or user not an admin)",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "User is not an admin"
                }
            }
        ),
        401: OpenApiResponse(
            description="User not authenticated",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Authentication credentials were not provided"
                }
            }
        ),
        403: OpenApiResponse(
            description="Permission denied (requesting user not sys_admin)",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Permission denied"
                }
            }
        ),
        404: OpenApiResponse(
            description="User not found",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "User not found"
                }
            }
        ),
        405: OpenApiResponse(
            description="Invalid request method",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Invalid request method"
                }
            }
        ),
    },
    # tags=["User Management"]
)

@csrf_exempt
@api_view(["PUT"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def demote_sys_admin_to_user(request):
    """
    Remove admin privileges from a user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - username: The username of the admin to be demoted.

    Returns:
    - JsonResponse: A JSON object indicating success or error message.

    Response Codes:
    - 200: Successful removal of admin privileges.
    - 400: Bad request (if data is invalid or user is not an admin).
    - 401: User not authenticated.
    - 403: Forbidden (if the requesting user does not have permission).
    - 404: User not found.
    """
    if request.method == "PUT":
        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            username = request.data.get("username")

            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )

            try:
                user = CustomUser.objects.get(username=username)

                if user.user_type not in ["system_admin", "sys_admin"]:
                    return JsonResponse(
                        {"success": False, "error": "User is not an admin"}, status=400
                    )

                user.user_type = "user"
                user.save()

                return JsonResponse(
                    {
                        "success": True,
                        "message": f"Admin privileges removed from {username}",
                    },
                    status=200,
                )
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "User not found"}, status=404
                )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

@extend_schema(
    summary="Demote moderator to regular user",
    description=(
        "Removes moderator privileges from a specified user. "
        "Only users with `sys_admin` privileges can perform this action. "
        "Requires authentication via JWT."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {
                    "type": "string",
                    "description": "The username of the moderator to be demoted",
                }
            },
            "required": ["username"]
        }
    },
    responses={
        200: OpenApiResponse(
            description="Moderator privileges successfully removed",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"}
                },
                "example": {
                    "success": True,
                    "message": "Moderator privileges removed from john_doe"
                }
            }
        ),
        400: OpenApiResponse(
            description="Bad request (invalid data or user not a moderator)",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "User is not a moderator"
                }
            }
        ),
        401: OpenApiResponse(
            description="User not authenticated",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Authentication credentials were not provided"
                }
            }
        ),
        403: OpenApiResponse(
            description="Permission denied (requesting user not sys_admin)",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Permission denied"
                }
            }
        ),
        404: OpenApiResponse(
            description="User not found",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "User not found"
                }
            }
        ),
        405: OpenApiResponse(
            description="Invalid request method",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {
                    "success": False,
                    "error": "Invalid request method"
                }
            }
        ),
    },
    # tags=["User Management"]
)
@csrf_exempt
@api_view(["PUT"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def demote_sys_moderator_to_user(request):
    """
    Remove moderator privileges from a user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Form Parameters:
    - username: The username of the moderator to be demoted.

    Returns:
    - JsonResponse: A JSON object indicating success or error message.

    Response Codes:
    - 200: Successful removal of moderator privileges.
    - 400: Bad request (if data is invalid or user is not a moderator).
    - 401: User not authenticated.
    - 403: Forbidden (if the requesting user does not have permission).
    - 404: User not found.
    """
    if request.method == "PUT":
        try:
            # Check if the requesting user is a sys_admin
            requesting_user = request.user
            if requesting_user.user_type not in ["sys_admin", CustomUser.SYS_ADMIN]:
                return JsonResponse(
                    {"success": False, "error": "Permission denied"}, status=403
                )

            username = request.data.get("username")

            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username is required"}, status=400
                )

            try:
                user = CustomUser.objects.get(username=username)

                if user.user_type != "moderator":
                    return JsonResponse(
                        {"success": False, "error": "User is not a moderator"},
                        status=400,
                    )

                user.user_type = "user"
                user.save()

                return JsonResponse(
                    {
                        "success": True,
                        "message": f"Moderator privileges removed from {username}",
                    },
                    status=200,
                )
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "User not found"}, status=404
                )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

