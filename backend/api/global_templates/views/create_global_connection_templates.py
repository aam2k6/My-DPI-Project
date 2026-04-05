
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from api.serializers import (
    ConnectionTypeSerializer,
    GlobalConnectionTypeTemplateGetSerializer,
    ConnectionTypeRegulationLinkTableGetSerializer,
    
)
from api.models import (
    CustomUser,
    ConnectionTerms,
    GlobalConnectionTypeTemplate,
    ConnectionTypeRegulationLinkTable,
    ConnectionType
)
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpRequest, JsonResponse
#google
from rest_framework_simplejwt.authentication import JWTAuthentication


from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes, OpenApiResponse

@csrf_exempt
@extend_schema(
    description="Create a new global connection type. Only for system admins.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'global_connection_type_name': {'type': 'string'},
                'global_connection_type_description': {'type': 'string'},
                'global_terms_IDs': {'type': 'array', 'items': {'type': 'integer'}},
                'globaltype': {'type': 'string', 'enum': ['template', 'policy']},
                'domain': {'type': 'string', 'enum': ['health', 'education', 'finance', 'personal data']}
            },
            'required': ['global_connection_type_name', 'global_connection_type_description', 'global_terms_IDs', 'globaltype', 'domain']
        }
    },
    responses={
        201: OpenApiResponse(
            description="Global connection type created successfully",
            response={
                "type": "object",
                "properties": {
                    "status": {"type": "integer"},
                    "message": {"type": "string"}
                },
                "example": {
                    "status": 201,
                    "message": "Global connection type created successfully..."
                }
            }
        ),
        400: OpenApiResponse(
            description="Invalid request",
            response={
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "error": {"type": "string"}

                },
                "example": {"message": "Invalid value for 'globaltype'..."}
            }
        )
    }
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
# @role_required(CustomUser.SYS_ADMIN)
def create_Global_Connection_Type_Template(request):
    """
    This API is used to create a new global connection type. This API is allowed only for system admins.
    Response Codes:
        - 201: Successfully created a global connection type.
        - 400: The data sent in the request is invalid, missing or malformed.
    Expected JSON (raw JSON data/form data):
    {
        "global_connection_type_name": value,
        "global_connection_type_description": value,
        "global_terms_IDs": list of global connection terms IDs,
        "globaltype": "template" or "policy",
        "domain": "health", "education", "finance", or "personal data"
    }
    """
    data = request.data  # RAW JSON DATA/FORM DATA
    requesting_user: CustomUser = request.user
    if requesting_user.user_type in [CustomUser.MODERATOR, CustomUser.USER]:
        return JsonResponse(
            {
                "message": f"User must be a system admin to access this API endpoint. Current user has {requesting_user.user_type} type."
            }
        )

    # Validate 'global_terms_IDs'
    ids: list = data.get("global_terms_IDs")
    if ids is None or len(ids) == 0:
        return JsonResponse({"message": "List of IDs of terms must not be empty."})

    # Validate 'globaltype'
    globaltype = data.get("globaltype")
    if globaltype not in ["template", "policy"]:
        return JsonResponse(
            {
                "message": "Invalid value for 'globaltype'. Must be either 'template' or 'policy'."
            },
            status=400,
        )

    # Validate 'domain'
    domain = data.get("domain")
    if domain not in ["health", "education", "finance", "personal data"]:
        return JsonResponse(
            {
                "message": "Invalid value for 'domain'. Must be one of 'health', 'education', 'finance', or 'personal data'."
            },
            status=400,
        )

    try:
        template_Data = {
            "global_connection_type_name": data.get("global_connection_type_name"),
            "global_connection_type_description": data.get(
                "global_connection_type_description"
            ),
            "globaltype": globaltype,  # New field added to the template data
            "domain": domain,  # New field added to the template data
        }

        # Create the GlobalConnectionTypeTemplate object
        global_Template: GlobalConnectionTypeTemplate = (
            GlobalConnectionTypeTemplate.objects.create(
                global_connection_type_name=template_Data[
                    "global_connection_type_name"
                ],
                global_connection_type_description=template_Data[
                    "global_connection_type_description"
                ],
                globaltype=template_Data["globaltype"],
                domain=template_Data[
                    "domain"
                ],  # Add the domain field when creating the object
            )
        )
        global_Template.save()

        # Link the created global connection type template to the provided global terms IDs
        for id in data.get("global_terms_IDs"):
            global_Term = ConnectionTerms.objects.filter(terms_id=id).first()
            if global_Term:
                global_Term.global_conn_type = global_Template
                global_Term.save()
            else:
                return JsonResponse(
                    {
                        "message": f"Global connection term with ID = {id} does not exist."
                    }
                )

        return JsonResponse(
            {
                "status": 201,
                "message": f"Global connection type created successfully and linked to the global terms IDs = {data.get('global_terms_IDs')} successfully.",
            }
        )
    except Exception as e:
        print(e)
        return JsonResponse({"message": "Something went wrong.", "error": f"{e}"})


@csrf_exempt
@extend_schema(
    methods=["GET"],
    description="Get global connection templates. If ID is provided, returns specific template.",
    parameters=[
        OpenApiParameter(name="global_connection_id", description="ID of the global connection type template", required=False, type=int),
    ],
    responses={
        200: OpenApiResponse(
            description="Global templates obtained successfully",
            response={
                "type": "object",
                "properties": {
                    "templates": {
                        "type": "array",
                        "items": {"type": "object"}
                    }
                },
                "example": {
                    "templates": [
                        {
                            "id": 1,
                            "name": "Template 1",
                            "description": "Desc"
                        }
                    ]
                }
            }
        ),
        404: OpenApiResponse(description="Template not found")
    }
)
@extend_schema(
    methods=["PUT"],
    description="Update a global connection template.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'global_connection_id': {'type': 'integer'},
                'name': {'type': 'string'},
                'description': {'type': 'string'}
            },
            'required': ['global_connection_id']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Global connection template updated successfully",
            response={
                "type": "object",
                "properties": {
                    "message": {"type": "string"}
                },
                "example": {
                    "message": "Global connection template updated successfully."
                }
            }
        ),
        404: OpenApiResponse(description="Template not found")
    }
)
@extend_schema(
    methods=["DELETE"],
    description="Delete a global connection template.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'global_connection_id': {'type': 'integer'}
            },
            'required': ['global_connection_id']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Global connection template deleted successfully",
            response={
                "type": "object",
                "properties": {
                    "message": {"type": "string"}
                },
                "example": {
                    "message": "Global connection template with ID = 1 deleted successfully."
                }
            }
        ),
        404: OpenApiResponse(description="Template not found")
    }
)
@api_view(["GET", "PUT", "DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def global_Connection_CRUD(request: HttpRequest) -> JsonResponse:
    if request.method == "GET":
        """
        "global_connection_id": value
        """
        global_connection_id = request.GET.get("global_connection_id", None)
        if global_connection_id is None:
            global_List = GlobalConnectionTypeTemplate.objects.all()
            serializer = GlobalConnectionTypeTemplateGetSerializer(
                global_List, many=True
            )
            return JsonResponse({"templates": serializer.data})
        else:
            try:
                global_connection = GlobalConnectionTypeTemplate.objects.get(
                    global_connection_type_template_id=global_connection_id
                )
                serializer = GlobalConnectionTypeTemplateGetSerializer(
                    global_connection
                )
                return JsonResponse({"global_template": serializer.data})
            except GlobalConnectionTypeTemplate.DoesNotExist:
                return JsonResponse(
                    {
                        "message": f"Global connection template with ID = {global_connection_id} does not exist."
                    }
                )
    elif request.method == "PUT":
        """
        "global_connection_id": value,
        "name": value,
        "description": value
        """
        global_connection_id = request.data.get("global_connection_id", None)
        name = request.data.get("name", None)
        description = request.data.get("description", None)
        if global_connection_id is None:
            return JsonResponse({"message": "Global connection ID cannot be None."})
        try:
            global_Connection_Template = GlobalConnectionTypeTemplate.objects.get(
                global_connection_type_template_id=global_connection_id
            )
            global_Connection_Template.global_connection_type_name = name
            global_Connection_Template.global_connection_type_description = description
            global_Connection_Template.save()
            return JsonResponse(
                {"message": "Global connection template updated successfully."},
                status=status.HTTP_200_OK,
            )
        except GlobalConnectionTypeTemplate.DoesNotExist:
            return JsonResponse(
                {
                    "message": f"Global connection template with ID = {global_connection_id} does not exist."
                }
            )
    elif request.method == "DELETE":
        """
        "global_connection_id": value
        """
        global_connection_id = request.data.get("global_connection_id", None)
        if global_connection_id is None:
            return JsonResponse({"message": "Global connection ID should not be None."})
        try:
            global_Connection_Template = GlobalConnectionTypeTemplate.objects.get(
                global_connection_type_template_id=global_connection_id
            )
            id_Deleted = global_Connection_Template.global_connection_type_template_id
            global_Connection_Template.delete()
            return JsonResponse(
                {
                    "message": f"Global connection template with ID = {id_Deleted} deleted successfully."
                }
            )
        except GlobalConnectionTypeTemplate.DoesNotExist:
            return JsonResponse(
                {
                    "message": f"Global connection template with ID = {global_connection_id} does not exist."
                }
            )
    else:
        return JsonResponse(
            {
                "message": f"Supported request methods are DELETE, GET and PUT but got request method as {request.method}."
            }
        )


@csrf_exempt
@extend_schema(
    description="Get connection regulation link for a connection type.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'connection_Type_ID': {'type': 'integer'}
            },
            'required': ['connection_Type_ID']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Connection regulation links retrieved successfully",
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
                            "link_id": 1,
                            "connection_type_id": 10,
                            "global_connection_template_id": 5
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
def get_Connection_Link_Regulation_For_Connection_Type(request):
    """
    Expected JSON (raw JSON data/form data):
    {
        "connection_Type_ID": value
    }
    """
    if request.method == "GET":
        conn_type_ID = request.data.get("connection_Type_ID")  # RAW JSON DATA/FORM DATA
        link_Regulation = ConnectionTypeRegulationLinkTable.objects.filter(
            connection_type_id=conn_type_ID
        )
        if link_Regulation.exists():
            serializer = ConnectionTypeRegulationLinkTableGetSerializer(
                link_Regulation, many=True
            )
            return JsonResponse({"data": serializer.data})
        return JsonResponse(
            {
                "message": f"Connection regulation link table does not have an entry with connection type ID = {conn_type_ID}"
            }
        )
    return JsonResponse({"message": "The method request is not GET."})


@csrf_exempt
@extend_schema(
    description="Link a global connection type template to a connection type.",
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'template_Id': {'type': 'integer'},
                'type_Id': {'type': 'integer'}
            },
            'required': ['template_Id', 'type_Id']
        }
    },
    responses={
        201: OpenApiResponse(
            description="Linked successfully",
            response={
                "type": "object",
                "properties": {
                    "status": {"type": "integer"},
                    "message": {"type": "string"}
                },
                "example": {
                    "status": 201,
                    "message": "Connection type linked successfully..."
                }
            }
        ),
        400: OpenApiResponse(description="Invalid request or link already exists")
    }
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def connect_Global_Connection_Type_Template_And_Connection_Type(request):
    """
    Expected JSON (form data):
    {
        "template_Id": value,
        "type_Id": value
    }
    """
    template_Id = request.POST.get("template_Id")  # FORM DATA
    type_Id = request.POST.get("type_Id")  # FORM DATA
    # data = {"connection_type_id": "", "global_connection_template_id": ""}
    if template_Id is not None and type_Id is not None:
        template = GlobalConnectionTypeTemplate.objects.filter(
            global_connection_type_template_id=template_Id
        )
        if not template.exists():
            return JsonResponse(
                {
                    "message": f"Global connection type template with ID = {template_Id} does not exist."
                }
            )
        else:
            connection_Type = ConnectionType.objects.filter(connection_type_id=type_Id)
            if not connection_Type.exists():
                return JsonResponse(
                    {"message": f"Connection type with ID = {type_Id} does not exist."}
                )
            else:
                link = ConnectionTypeRegulationLinkTable.objects.filter(
                    connection_type_id=connection_Type.first(),
                    global_connection_template_id=template.first(),
                )
                if link.exists():
                    template_Serializer = GlobalConnectionTypeTemplateGetSerializer(
                        template.first()
                    )
                    type_Serializer = ConnectionTypeSerializer(connection_Type.first())
                    return JsonResponse(
                        {
                            "message": "This link already exists.",
                            "existing ID of link in DB": link.first().link_id,
                            "global template": template_Serializer.data,
                            "connection type": type_Serializer.data,
                        }
                    )
                # data["global_connection_template_id"] = template.first()
                # data["connection_type_id"] = connection_Type.first()
                # link = ConnectionTypeRegulationLinkTable(
                #     connection_Type_Id=connection_Type.first(),
                #     conection_Template_Id=template.first(),
                # )

                try:
                    link = ConnectionTypeRegulationLinkTable.objects.create(
                        connection_type_id=connection_Type.first(),
                        global_connection_template_id=template.first(),
                    )
                    # serializer = ConnectionTypeRegulationLinkTablePostSerializer(
                    #     data=link
                    # )
                    # if not serializer.is_valid():
                    #     return JsonResponse(
                    #         {"status": 400, "errors": serializer.errors}
                    #     )
                    # serializer.save()
                    return JsonResponse(
                        {
                            "status": 201,
                            "message": f"Connection type with ID = {type_Id} linked successfully to global connection type template with ID = {template_Id}",
                        }
                    )
                except Exception as e:
                    print(e)
                    return JsonResponse(
                        {"message": "Something went wrong.", "error": f"{e}"}
                    )
    return JsonResponse(
        {"message": f"Template ID = {template_Id} and type ID = {type_Id}"}
    )