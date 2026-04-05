
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from api.models import (
    Resource,
    Locker,

)
from api.model.xnode_model import Xnode_V2
from api.utils.resource_helper.access_resource_helper import access_Resource
from api.serializers import XnodeV2Serializer
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpRequest, JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication



from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

@csrf_exempt  # Ensure this is on top
@extend_schema(
    description="Get all XNodes for a specific locker. Requires locker_id.",
    parameters=[
        OpenApiParameter(name="locker_id", description="Locker ID to filter XNodes", required=True, type=int),
    ],
    responses={
        200: OpenApiResponse(
            description="XNodes retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "xnode_list": {
                        "type": "array",
                        "items": {"type": "object"}
                    }
                },
                "example": {
                    "xnode_list": [
                        {
                            "id": 1,
                            "resource_name": "My Document",
                            "xnode_Type": "INODE"
                        }
                    ]
                }
            }
        ),
        400: OpenApiResponse(description="Missing locker ID"),
        404: OpenApiResponse(description="Locker or starting Inode not found")
    }
)
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])

def get_All_Xnodes(request: HttpRequest) -> JsonResponse:

    """
    Expected query parameter:
    locker_id: value
    """
    print(f"Authenticated User: {request.user}, Authenticated: {request.user.is_authenticated}")

    locker_id = request.GET.get("locker_id", None)
    if locker_id is None:
        return JsonResponse({"message": "Locker ID cannot be None."}, status=400)

    locker_list = Locker.objects.filter(locker_id=locker_id)
    if locker_list.exists():
        locker = locker_list.first()

        # Determine if the user is the owner of the locker
        is_owner = locker.user == request.user
        
        print(f"Locker Owner: {locker.user}, Request User: {request.user}, Is Owner: {is_owner}")


        xnode_list = Xnode_V2.objects.filter(locker=locker)
        xnode_data_with_resources = []
        print(len(xnode_list))

        for xnode in xnode_list:
            start_inode = access_Resource(xnode_id=xnode.id)
            if start_inode is None:
                return JsonResponse(
                    {
                        "message": f"Starting Inode for Xnode with ID = {xnode.id} does not exist."
                    },
                    status=404,
                )

            try:
                # Fetch the corresponding resource for the inode
                resource = Resource.objects.get(
                    resource_id=start_inode.node_information.get("resource_id")
                )

                

                # Check visibility based on whether the user is the owner or not
                if is_owner or resource.type == "public":


                    resource_name = resource.document_name  # Get the document name

                    # Serialize the Xnode and attach the corresponding resource name
                    xnode_serializer = XnodeV2Serializer(xnode)
                    xnode_data = xnode_serializer.data
                    xnode_data["resource_name"] = (
                        resource_name  # Add the resource name to the Xnode data
                    )

                    xnode_data_with_resources.append(xnode_data)

            except Resource.DoesNotExist:
                return JsonResponse(
                    {"error": f"Resource not found for Xnode ID = {xnode.id}"},
                    status=404,
                )
            except Exception as e:
                return JsonResponse({"error": str(e)}, status=500)

        return JsonResponse({"xnode_list": xnode_data_with_resources}, status=200)
    else:
        return JsonResponse(
            {"message": f"Locker with ID = {locker_id} does not exist."}, status=404
        )
    

