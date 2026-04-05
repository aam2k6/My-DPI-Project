from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.model.xnode_model import Xnode_V2
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import StreamingHttpResponse, HttpResponse, JsonResponse
from api.serializers import ResourceSerializer, XnodeV2Serializer
import json

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes


@extend_schema(
    summary="Get Consent Artefact Details",
    description="Retrieve Xnode details by passing xnode_id as a query parameter.",
    methods=["GET"],
    parameters=[
        OpenApiParameter(
            name="xnode_id",
            description="ID of the Xnode to retrieve",
            required=True,
            type=int,
            location=OpenApiParameter.QUERY,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Xnode details retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "xnode": {"type": "object"},
                },
            },
        ),
        204: OpenApiResponse(description="No data available (xnode_id is undefined/empty)"),
        404: OpenApiResponse(description="Consent artefact not found or removed"),
    },
)
@extend_schema(
    summary="Update Consent Artefact",
    description="Update an existing Xnode/Consent Artefact.",
    methods=["PATCH"],
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "xnode_id": {"type": "integer"},
                "post_conditions": {"type": "object"},
                "new_validity": {"type": "string", "format": "date-time"},
                "remarks": {"type": "string"},
            },
            "required": ["xnode_id", "post_conditions"],
        }
    },
    responses={
        200: OpenApiResponse(description="Consent Artefact Updated successfully"),
        400: OpenApiResponse(description="Invalid request, missing fields, or invalid JSON"),
        401: OpenApiResponse(description="Unauthorized to make changes"),
        500: OpenApiResponse(description="Internal server error"),
    },
)
@csrf_exempt
@api_view(["GET", "PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def consent_artifact_view_update(request: HttpRequest) -> JsonResponse:
    """
    GET: Retrieve Xnode details by passing xnode_id as a query parameter.
    POST: Create a new Xnode based on modifications to an existing Xnode.
    """
    if request.method == "GET":
        xnode_id = request.GET.get("xnode_id", None)

        if not xnode_id or xnode_id == "undefined":
            return JsonResponse({
                "success": False,
                "message": "There is no data currently available for viewing."
            }, status=200)

        try:
            xnode = Xnode_V2.objects.get(id=xnode_id)
            serializer = XnodeV2Serializer(xnode)
            return JsonResponse({"success":True,"xnode": serializer.data}, status=200)
        except Xnode_V2.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "This consent artefact has been removed or is no longer accessible."
            }, status=404)
    
    elif request.method == 'PATCH':
        try:
            body = json.loads(request.body)
            xnode_id = body.get("xnode_id")
            post_conditions = body.get("post_conditions")
            new_validity = body.get("new_validity")
            remarks = body.get("remarks")
    
            if not xnode_id or not post_conditions:
                return JsonResponse({'message': 'Both consent artefact Id and post conditions are required'}, status=400)
            
            xnode = Xnode_V2.objects.get(id=xnode_id)
            owner_id = None

            if xnode.xnode_Type == 'VNODE':
                owner_id = xnode.node_information['current_owner']
            else:
                owner_id = xnode.node_information['primary_owner']

            if request.user.user_id != owner_id:
                return JsonResponse({'message': 'Not authorized to make changes'}, status=401)
            
            for field in post_conditions:
                if xnode.is_locked[field] and owner_id != xnode.creator:
                    raise Exception("Changes not allowed in this field")
                xnode.post_conditions[field] = post_conditions[field]

            # update validity_until if provided
            if new_validity:
                xnode.validity_until = new_validity

            # store remarks inside node_information if provided
            if remarks is not None:
                node_info = xnode.node_information
                node_info['remarks'] = remarks
                xnode.node_information = node_info  # reassign updated dict

            xnode.save()

            return JsonResponse({'message': 'Consent Artefact Updated successfully'}, status=200)
        
        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format."}, status=400)
        except Exception as e:
            return JsonResponse({'message': str(e)}, status=500)

    return JsonResponse({"message": "Invalid request method."}, status=405)