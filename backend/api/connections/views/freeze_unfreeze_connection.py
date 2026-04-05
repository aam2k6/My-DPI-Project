
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes
from api.models import (
    CustomUser,
    Connection,

)

from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse


@extend_schema(
    summary="Freeze or unfreeze a connection",
    description="Toggle the frozen state of a connection. Only accessible by system admins or moderators.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "connection_name": {"type": "string"},
                "connection_id": {"type": "integer"},
                "action": {"type": "string", "enum": ["freeze", "unfreeze"]},
            },
            "required": ["connection_name", "connection_id", "action"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Action performed successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid action or missing parameters"),
        403: OpenApiResponse(description="Permission denied"),
        404: OpenApiResponse(description="Connection or user not found"),
    },
)
@csrf_exempt
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def freeze_or_unfreeze_connection(request):
    """
    Freeze or unfreeze a connection based on the specified action.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Request Data (PUT):
    - connection_name: The name of the connection to freeze or unfreeze.
    - connection_id: The ID of the connection to freeze or unfreeze (optional).
    - action: Specifies whether to "freeze" or "unfreeze" the connection.

    Returns:
    - JsonResponse: A JSON object indicating success or failure.

    Response Codes:
    - 200: Successful freezing or unfreezing of the connection.
    - 404: Specified user or connection not found.
    - 400: Bad request (missing parameters).
    - 403: Permission denied.
    """
    if request.method == "PUT":
        connection_name = request.data.get("connection_name")
        connection_id = request.data.get("connection_id")
        action = request.data.get("action")

        if not connection_id or not connection_name or not action:
            return JsonResponse(
                {
                    "success": False,
                    "error": "connection_id, Connection Name, and Action are required",
                },
                status=400,
            )

        try:
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


            if connection_id:
                # Fetch connection by connection_id
                connection = Connection.objects.get(connection_id=connection_id)
            else:
                # Fetch connection by  connection_name
                connection = Connection.objects.get(
                    connection_name=connection_name, connection_id=connection_id
                )

            if action == "freeze":
                if connection.is_frozen:
                    return JsonResponse(
                        {
                            "success": False,
                            "message": "This connection is already frozen",
                        },
                        status=200,
                    )
                else:
                    connection.is_frozen = True
                    connection.save()
                    return JsonResponse(
                        {
                            "success": True,
                            "message": "Connection has been frozen successfully",
                        },
                        status=200,
                    )

            elif action == "unfreeze":
                if not connection.is_frozen:
                    return JsonResponse(
                        {"success": False, "message": "This connection is not frozen"},
                        status=200,
                    )
                else:
                    connection.is_frozen = False
                    connection.save()
                    return JsonResponse(
                        {
                            "success": True,
                            "message": "Connection has been unfrozen successfully",
                        },
                        status=200,
                    )

            else:
                return JsonResponse(
                    {"success": False, "error": "Invalid action specified"}, status=400
                )

        except Connection.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection not found"}, status=404
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
