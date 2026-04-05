
import json
from django.utils import timezone
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from api.serializers import (
    ConnectionTypeSerializer 
)
from api.models import (
    Connection,
    ConnectionTerms,
    ConnectionType
    

)

from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import JsonResponse
from django.utils.dateparse import parse_datetime
from datetime import datetime
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone


@extend_schema(
    summary="Edit or delete connection type",
    description="Update or delete a connection type and its associated terms and validity time.",
    methods=["PUT", "DELETE"],
    request={
        "PUT": {
            "application/json": {
                "type": "object",
                "properties": {
                    "connection_type_id": {"type": "integer"},
                    "connection_type_name": {"type": "string"},
                    "connection_type_description": {"type": "string"},
                    "validity_time": {"type": "string", "format": "date-time"},
                    "terms": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "terms_id": {"type": "integer"},
                                "data_element_name": {"type": "string"},
                                "description": {"type": "string"},
                                "purpose": {"type": "string"},
                            },
                        },
                    },
                },
                "required": ["connection_type_id", "connection_type_name", "validity_time"],
            }
        },
        "DELETE": {
            "application/json": {
                "type": "object",
                "properties": {
                    "connection_type_id": {"type": "integer"},
                },
                "required": ["connection_type_id"],
            }
        }
    },
    responses={
        200: OpenApiResponse(
            description="Success",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                },
                "example": {
                    "success": True,
                    "message": "Connection type, terms, and validity time updated successfully"
                }
            },
        ),
        400: OpenApiResponse(description="Invalid request or missing fields"),
        404: OpenApiResponse(description="Connection type not found"),
    },
)
@csrf_exempt
@api_view(["PUT", "DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def edit_delete_connectiontype_details(request):

    # ===================== UPDATE =====================
    if request.method == "PUT":
        try:
            data = json.loads(request.body)

            connection_type_id = data.get("connection_type_id")
            new_name = data.get("connection_type_name")
            new_description = data.get("connection_type_description")
            validity_time_str = data.get("validity_time")
            terms = data.get("terms", [])

            # -------- Validation --------
            if not connection_type_id or not new_name:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "connection_type_id and connection_type_name are required",
                    },
                    status=400,
                )

            if not validity_time_str:
                return JsonResponse(
                    {"success": False, "error": "validity_time is required"},
                    status=400,
                )

            
            validity_time = parse_datetime(validity_time_str)

            if validity_time:
                
                if timezone.is_naive(validity_time):
                    validity_time = timezone.make_aware(validity_time)
            else:
                date_obj = parse_datetime(validity_time_str)
                if not date_obj:
                    return JsonResponse(
                        {"success": False, "error": "Invalid validity_time format"},
                        status=400,
                    )

                
                validity_time = timezone.make_aware(
                    datetime.combine(date_obj, datetime.max.time())
                )

            # -------- Fetch ConnectionType --------
            connection_type = ConnectionType.objects.get(
                connection_type_id=connection_type_id
            )

            old_name = connection_type.connection_type_name

            # -------- Update ConnectionType --------
            connection_type.connection_type_name = new_name
            if new_description:
                connection_type.connection_description = new_description

           
            connection_type.validity_time = validity_time
            connection_type.save()

            
            Connection.objects.filter(
                connection_type_id=connection_type_id
            ).update(
                validity_time=validity_time
            )

            # -------- Update ConnectionTerms --------
            for term in terms:
                term_id = term.get("terms_id")
                if not term_id:
                    continue

                ConnectionTerms.objects.filter(terms_id=term_id).update(
                    data_element_name=term.get("data_element_name"),
                    description=term.get("description"),
                    purpose=term.get("purpose"),
                )


            return JsonResponse(
                {
                    "success": True,
                    "message": "Connection type, terms, and validity time updated successfully",
                },
                status=200,
            )

        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "ConnectionType not found"},
                status=404,
            )

        except Exception as e:
            return JsonResponse(
                {"success": False, "error": str(e)},
                status=400,
            )

    # ===================== DELETE =====================
    elif request.method == "DELETE":
        try:
            data = json.loads(request.body)
            connection_type_id = data.get("connection_type_id")

            if not connection_type_id:
                return JsonResponse(
                    {"success": False, "error": "connection_type_id is required"},
                    status=400,
                )

            ConnectionType.objects.get(
                connection_type_id=connection_type_id
            ).delete()

            return JsonResponse(
                {"success": True, "message": "ConnectionType deleted successfully"},
                status=200,
            )

        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "ConnectionType not found"},
                status=404,
            )

        except Exception as e:
            return JsonResponse(
                {"success": False, "error": str(e)},
                status=400,
            )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"},
        status=405,
    )
