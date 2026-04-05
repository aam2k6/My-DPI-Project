
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
from drf_spectacular.types import OpenApiTypes
from rest_framework.response import Response
from api.serializers import (
    ConnectionTypeSerializer,
)
from api.models import (
    Locker,
    CustomUser,
    ConnectionTerms,
    ConnectionType
)
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse
from rest_framework_simplejwt.authentication import JWTAuthentication



@extend_schema(
    summary="Get terms by connection type",
    description="Retrieve all categorized terms (obligations, permissions, forbidden) for a specific connection type, filtered by host and optionally guest details.",
    parameters=[
        OpenApiParameter("connection_type_name", OpenApiTypes.STR, description="Name of the connection type"),
        OpenApiParameter("host_user_username", OpenApiTypes.STR, description="Username of the host user"),
        OpenApiParameter("host_locker_name", OpenApiTypes.STR, description="Name of the host locker"),
        OpenApiParameter("guest_user_username", OpenApiTypes.STR, description="Username of the guest user (optional)"),
        OpenApiParameter("guest_locker_name", OpenApiTypes.STR, description="Name of the guest locker (optional)"),
    ],
    responses={
        200: OpenApiResponse(
            description="Terms retrieved successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "data": {"type": "object"},
                },
            },
        ),
        400: OpenApiResponse(description="Missing required parameters"),
        404: OpenApiResponse(description="Host user, locker, or connection type not found"),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_terms_by_connection_type(request):
    if request.method == "GET":
        connection_type_name = request.GET.get("connection_type_name")
        host_user_username = request.GET.get("host_user_username")
        host_locker_name = request.GET.get("host_locker_name")
        guest_user_username = request.GET.get("guest_user_username")
        guest_locker_name = request.GET.get("guest_locker_name")

        # Validate required parameters
        if not all([connection_type_name, host_user_username, host_locker_name]):
            return JsonResponse(
                {
                    "success": False,
                    "error": "Host user, locker, and connection type name are required",
                },
                status=400,
            )

        try:
            # Get the host user and locker
            host_user = CustomUser.objects.get(username=host_user_username)
            host_locker = Locker.objects.get(name=host_locker_name, user=host_user)

            # Optionally get guest user and locker
            guest_user = None
            guest_locker = None
            if guest_user_username and guest_locker_name:
                guest_user = CustomUser.objects.get(username=guest_user_username)
                guest_locker = Locker.objects.get(
                    name=guest_locker_name, user=guest_user
                )

            # Get the connection type
            connection_type = ConnectionType.objects.get(
                connection_type_name=connection_type_name,
                owner_user=host_user,
                owner_locker=host_locker,
            )

            # Get terms related to the connection type
            terms = ConnectionTerms.objects.filter(conn_type=connection_type)

            if not terms.exists():
                return JsonResponse(
                    {
                        "success": False,
                        "message": "No terms found for the given connection type",
                    },
                    status=404,
                )

            # Separate terms by modality and direction
            obligations_guest_to_host = []
            obligations_host_to_guest = []
            permissions_guest_to_host = {
                "canShareMoreData": False,
                "canDownloadData": False,
            }
            permissions_host_to_guest = {
                "canShareMoreData": False,
                "canDownloadData": False,
            }
            forbidden_guest_to_host = []
            forbidden_host_to_guest = []

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

                # Obligations
                if term.modality == "obligatory":
                    if (
                        term.from_Type == ConnectionTerms.TermFromTo.GUEST
                        and term.to_Type == ConnectionTerms.TermFromTo.HOST
                    ):
                        obligations_guest_to_host.append(term_data)
                    elif (
                        term.from_Type == ConnectionTerms.TermFromTo.HOST
                        and term.to_Type == ConnectionTerms.TermFromTo.GUEST
                    ):
                        obligations_host_to_guest.append(term_data)

                # Permissions
                elif term.modality == "permissive":
                    if term.description == "They can share more data.":
                        if (
                            term.from_Type == ConnectionTerms.TermFromTo.GUEST
                            and term.to_Type == ConnectionTerms.TermFromTo.HOST
                        ):
                            permissions_guest_to_host["canShareMoreData"] = True
                        elif (
                            term.from_Type == ConnectionTerms.TermFromTo.HOST
                            and term.to_Type == ConnectionTerms.TermFromTo.GUEST
                        ):
                            permissions_host_to_guest["canShareMoreData"] = True
                    elif term.description == "They can download data.":
                        if (
                            term.from_Type == ConnectionTerms.TermFromTo.GUEST
                            and term.to_Type == ConnectionTerms.TermFromTo.HOST
                        ):
                            permissions_guest_to_host["canDownloadData"] = True
                        elif (
                            term.from_Type == ConnectionTerms.TermFromTo.HOST
                            and term.to_Type == ConnectionTerms.TermFromTo.GUEST
                        ):
                            permissions_host_to_guest["canDownloadData"] = True

                # Forbidden terms
                elif term.modality == "forbidden":
                    if (
                        term.from_Type == ConnectionTerms.TermFromTo.GUEST
                        and term.to_Type == ConnectionTerms.TermFromTo.HOST
                    ):
                        forbidden_guest_to_host.append(term_data)
                    elif (
                        term.from_Type == ConnectionTerms.TermFromTo.HOST
                        and term.to_Type == ConnectionTerms.TermFromTo.GUEST
                    ):
                        forbidden_host_to_guest.append(term_data)

            # Prepare response data
            response_data = {
                "connection_type_id": connection_type.connection_type_id,
                "connection_type_name": connection_type.connection_type_name,
                "connection_type_description": connection_type.connection_description,
                "post_conditions": connection_type.post_conditions,
                "host_user": host_user.username,
                "host_locker": host_locker.name,
                "obligations": {
                    "guest_to_host": obligations_guest_to_host,
                    "host_to_guest": obligations_host_to_guest,
                },
                "permissions": {
                    "guest_to_host": permissions_guest_to_host,
                    "host_to_guest": permissions_host_to_guest,
                },
                "forbidden": {
                    "guest_to_host": forbidden_guest_to_host,
                    "host_to_guest": forbidden_host_to_guest,
                },
            }

            # Add guest details if provided
            if guest_user and guest_locker:
                response_data["guest_user"] = guest_user.username
                response_data["guest_locker"] = guest_locker.name

            return JsonResponse({"success": True, "data": response_data}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Host user not found"}, status=404
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Host locker not found"}, status=404
            )
        except ConnectionType.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Connection type not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )

