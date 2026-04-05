
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
    methods=["DELETE"],
    description="Delete a locker.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'locker_name': {'type': 'string'}
            },
            'required': ['locker_name']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Locker deleted successfully",
            response={
                "type": "object",
                "properties": {"message": {"type": "string"}},
                "example": {"message": "Locker(ID = 1) was successfully deleted."}
            }
        ),
        404: OpenApiResponse(
            description="Locker not found",
            response={
                "type": "object",
                "properties": {"message": {"type": "string"}},
                "example": {"message": "Locker with name = example does not exist."}
            }
        )
    }
)
@extend_schema(
    methods=["PUT"],
    description="Update a locker.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'locker_name': {'type': 'string'},
                'new_locker_name': {'type': 'string'},
                'description': {'type': 'string'},
                'is_frozen': {'type': 'boolean'}
            },
            'required': ['locker_name']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Locker updated successfully",
            response={
                "type": "object",
                "properties": {"message": {"type": "string"}},
                "example": {"message": "Locker updated successfully."}
            }
        ),
        404: OpenApiResponse(
            description="Locker not found",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "error": {"type": "string"}
                },
                "example": {"success": False, "error": "Locker with name = example does not exist."}
            }
        )
    }
)
@api_view(["PUT", "DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_Update_Locker(request: HttpRequest):
    if request.method == "DELETE":
        """
        Expected JSON data(raw JSON data/form data):
        {
            "locker_name": value
        }
        """
        user: CustomUser = request.user
        locker_name = request.data.get("locker_name")

        if not locker_name:
            return JsonResponse({"message": "Locker name is not provided."}, status=400)

        locker_to_be_deleted = Locker.objects.filter(name=locker_name, user=user)

        if locker_to_be_deleted.exists():
            delete_locker = locker_to_be_deleted.first()
            delete_locker.delete()
            return JsonResponse(
                {
                    "message": f"Locker(ID = {delete_locker.locker_id}) with name = {locker_name} of user with username = {user.username} was successfully deleted."
                },
                status=200,
            )
        else:
            return JsonResponse(
                {"message": f"Locker with name = {locker_name} does not exist."},
                status=404,
            )

    elif request.method == "PUT":
        """
        Expected JSON data (raw JSON data/form data):
        {
            "locker_name": value,
            "new_locker_name": value,
            "description": value
        }
        """
        data = request.data
        locker_name = data.get("locker_name")
        new_locker_name = data.get("new_locker_name")
        new_description = data.get("description")
        is_frozen = data.get("is_frozen")

        if not locker_name:
            return JsonResponse(
                {"success": False, "error": "Locker name must be provided."}, status=400
            )

        locker = Locker.objects.filter(name=locker_name, user=request.user).first()
        if locker:
            if new_locker_name:
                locker.name = new_locker_name
            if new_description:
                locker.description = new_description
            if is_frozen is not None:
                locker.is_frozen = is_frozen
            locker.save()

            return JsonResponse({"message": "Locker updated successfully."})
        else:
            return JsonResponse(
                {
                    "success": False,
                    "error": f"Locker with name = {locker_name} does not exist.",
                },
                status=404,
            )

    else:
        return JsonResponse({"message": "Request method should be either POST or PUT."})

