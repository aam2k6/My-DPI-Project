from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from api.serializers import (
    ConnectionTermsSerializer,
    GlobalConnectionTypeTemplateGetSerializer,
)
from api.models import (
    ConnectionTerms,
    GlobalConnectionTypeTemplate,
)
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

#google
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes, OpenApiResponse

@csrf_exempt
@extend_schema(
    description="Retrieve all terms for a given global connection type template.",
    parameters=[
        OpenApiParameter(name="template_Id", description="The ID of the global connection type template", required=True, type=int),
    ],
    responses={
        200: OpenApiResponse(
            description="Terms retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "data": {
                        "type": "object",
                        "properties": {
                            "template_id": {"type": "integer"},
                            "template_name": {"type": "string"},
                            "template_description": {"type": "string"},
                            "obligations": {"type": "object"},
                            "permissions": {"type": "object"},
                            "forbidden": {"type": "object"},
                        }
                    }
                },
                "example": {
                    "success": True,
                    "data": {
                        "template_id": 1,
                        "template_name": "Standard Shared",
                        "template_description": "Standard sharing template",
                        "obligations": {"guest_host": [], "host_guest": []},
                        "permissions": {
                            "guest_host": {"canShareMoreData": False, "canDownloadData": False},
                            "host_guest": {"canShareMoreData": False, "canDownloadData": False}
                        },
                        "forbidden": {"guest_host": [], "host_guest": []}
                    }
                }
            }
        ),
        400: OpenApiResponse(description="Invalid request or missing template ID"),
        404: OpenApiResponse(description="Template or terms not found")
    }
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_All_Connection_Terms_For_Global_Connection_Type_Template(request):
    """
    Retrieve all terms for a given global connection type template.

    Query Parameters:
    - template_Id: The ID of the global connection type template.

    Returns:
    - JsonResponse: A JSON object containing the terms and associated details.
    """
    template_Id = request.GET.get("template_Id", None)

    if template_Id is None:
        return JsonResponse(
            {"success": False, "error": "Template ID is required"}, status=400
        )

    try:
        # Fetch the template using the provided template_Id
        template = GlobalConnectionTypeTemplate.objects.filter(
            global_connection_type_template_id=template_Id
        )

        if not template.exists():
            return JsonResponse(
                {
                    "success": False,
                    "message": f"Global connection type template with ID = {template_Id} does not exist.",
                },
                status=404,
            )

        template = template.first()

        # Fetch all connection terms related to the global connection type template
        terms = ConnectionTerms.objects.filter(global_conn_type=template,conn_type_id__isnull=True)
        print("connection terms", terms)

        if not terms.exists():
            return JsonResponse(
                {
                    "success": False,
                    "message": "No terms found for the given global connection type template.",
                },
                status=404,
            )

        # Initialize separate categories for guest_host and host_guest
        obligations = {"guest_host": [], "host_guest": []}
        forbidden_terms = {"guest_host": [], "host_guest": []}
        permissions = {
            "guest_host": {"canShareMoreData": False, "canDownloadData": False},
            "host_guest": {"canShareMoreData": False, "canDownloadData": False},
        }

        for term in terms:
            term_data = {
                "terms_id": term.terms_id,
                "global_conn_type_id": term.global_conn_type_id,
                "labelName": term.data_element_name,
                "typeOfAction": term.data_type,
                "typeOfSharing": term.sharing_type,
                "purpose": term.purpose,
                "labelDescription": term.description,
                "hostPermissions": term.host_permissions,
            }

            # Identify direction
            if term.from_Type.lower() == "guest" and term.to_Type.lower() == "host":
                direction = "guest_host"
            elif term.from_Type.lower() == "host" and term.to_Type.lower() == "guest":
                direction = "host_guest"
            else:
                continue  # Skip unknown directions

            # Add to respective categories
            if term.modality == "obligatory":
                obligations[direction].append(term_data)
            elif term.modality == "forbidden":
                forbidden_terms[direction].append(term_data)
            elif term.description == "They can share more data.":
                permissions[direction]["canShareMoreData"] = True
            elif term.description == "They can download data.":
                permissions[direction]["canDownloadData"] = True

        response_data = {
            "template_id": template.global_connection_type_template_id,
            "template_name": template.global_connection_type_name,
            "template_description": template.global_connection_type_description,
            "obligations": obligations,
            "permissions": permissions,
            "forbidden": forbidden_terms,
        }

        return JsonResponse({"success": True, "data": response_data}, status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
    

@csrf_exempt
@extend_schema(
    description="Get all global connection type templates or a particular one if name is provided in body.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'global_connection_type_template_name': {'type': 'string'}
            }
        }
    },
    responses={
        200: OpenApiResponse(
            description="Global templates obtained successfully",
            response={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "array",
                        "items": {"type": "object"}
                    }
                },
                "example": {
                    "data": [
                        {
                            "id": 1,
                            "name": "Template 1",
                            "description": "Description 1"
                        }
                    ]
                }
            }
        )
    }
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_Global_Connection_Type(request):
    """
    This API is used to get all global connection type templates or a particular one if the name is mentioned in the request.
    Expected JSON to get a particular global connection type (raw JSON data/form data):
    {
        "global_connection_type_template_name": value
    }
    To get all conection types, no need to send any JSON.
    """
    if request.method == "GET":
        name = request.data.get(
            "global_connection_type_template_name"
        )  # RAW JSON DATA/FORM DATA
        print(name)
        if name:
            global_Connection_Type = GlobalConnectionTypeTemplate.objects.filter(
                global_connection_type_name=name
            )
            print(global_Connection_Type.first())
            if global_Connection_Type.exists():
                serializer = GlobalConnectionTypeTemplateGetSerializer(
                    global_Connection_Type.first()
                )
                terms = ConnectionTerms.objects.filter(
                    global_conn_type=global_Connection_Type.first()
                )
                terms_Serializer = ConnectionTermsSerializer(terms, many=True)
                return JsonResponse(
                    {
                        "global_connection": serializer.data,
                        "terms_attached_to_global_template": terms_Serializer.data,
                    }
                )
            else:
                return JsonResponse(
                    {
                        "message": f"global connection type template with name = {name} does not exist."
                    }
                )
        else:
            global_Connection_Types = GlobalConnectionTypeTemplate.objects.all()
            serializer = GlobalConnectionTypeTemplateGetSerializer(
                global_Connection_Types, many=True
            )
            return JsonResponse({"data": serializer.data})


