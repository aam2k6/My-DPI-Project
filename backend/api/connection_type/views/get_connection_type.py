import base64
import os
import json
from django.conf import settings
from django.contrib.auth import login, authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils import timezone
from django.utils.timezone import now
from django.utils.timezone import make_aware
import shutil
from rest_framework import status
from rest_framework.authentication import BasicAuthentication
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
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
from rest_framework import serializers

from drf_spectacular.types import OpenApiTypes
from rest_framework.response import Response
from api.serializers import (
    ResourceSerializer,
    ConnectionTypeSerializer,
    ConnectionSerializer,
    ConnectionTermsSerializer,
    ConnectionFilterSerializer,
    GlobalConnectionTypeTemplateGetSerializer,
    GlobalConnectionTypeTemplatePostSerializer,
    ConnectionTypeRegulationLinkTableGetSerializer,
    ConnectionTypeRegulationLinkTablePostSerializer,
    
)
from api.models import (
    Resource,
    Locker,
    CustomUser,
    Connection,
    ConnectionType,
    ConnectionTerms,
    GlobalConnectionTypeTemplate,
    ConnectionTypeRegulationLinkTable,
    Notification,
    GoogleAuthToken
)
from api.serializers import ResourceSerializer, LockerSerializer, UserSerializer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse
from django.db import models
from rest_framework.parsers import JSONParser
from django.views.decorators.http import require_POST
from django.core.exceptions import ObjectDoesNotExist
from django.utils.dateparse import parse_datetime
from datetime import datetime
from collections import defaultdict
from pypdf import PdfReader, PdfWriter
from IPython.display import FileLink
from django.db.models import Q

#google
from rest_framework_simplejwt.authentication import JWTAuthentication
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialAccount
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied

from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
import requests
from api.model.xnode_model import Xnode_V2
from django.db import transaction 

@extend_schema(
    summary="Get user's connection types",
    description="Retrieve all connection types belonging to the authenticated user.",
    responses={
        200: OpenApiResponse(
            description="Connection types retrieved successfully",
            response=inline_serializer(
                name="GetConnectionTypeResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "connection_types": ConnectionTypeSerializer(many=True),
                },
            ),
        ),
        404: OpenApiResponse(
            description="No connection types found",
            response=inline_serializer(
                name="GetConnectionTypeNotFound",
                fields={
                    "success": serializers.BooleanField(),
                    "message": serializers.CharField(),
                },
            ),
        ),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_type(request):
    """
    Retrieve all connection types of the authenticated user.

    This view uses the GET method through which exisitng connection types of the authenticated user is seen.
    Connection types are listed out in the admin view of the user.

     Parameters:
        - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - username of the authenticated user.

    Returns:
        - JsonResponse: A JSON object containing a list of lockers or an error message.

    Response Codes:
        - 200: Successful retrieval of connection types.
        - 404: No connection types found.
        - 405: Request method not allowed (if not GET).
    """

    if request.method == "GET":
        try:
            user = request.user
            connection_types = ConnectionType.objects.all()

            user_connection_type = connection_types.filter(owner_user=user)

            if not user_connection_type.exists():
                return JsonResponse(
                    {"success": False, "message": "No connection types"}, status=404
                )

            serializer = ConnectionTypeSerializer(user_connection_type, many=True)
            return JsonResponse(
                {"success": True, "connection_types": serializer.data}, status=200
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@extend_schema(
    summary="Get other connection types",
    description=(
        "Retrieve connection types of a specific guest locker that the "
        "authenticated user is not yet connected to."
    ),
    parameters=[
        OpenApiParameter(
            name="guest_username",
            type=OpenApiTypes.STR,
            description="Username of the guest user",
            required=True,
        ),
        OpenApiParameter(
            name="guest_locker_name",
            type=OpenApiTypes.STR,
            description="Name of the guest locker",
            required=True,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Other connection types retrieved successfully",
            response=inline_serializer(
                name="GetOtherConnectionTypesResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "connection_types": ConnectionTypeSerializer(many=True),
                },
            ),
        ),
        401: OpenApiResponse(
            description="Unauthorized",
            response=inline_serializer(
                name="GetOtherConnectionTypesUnauthorized",
                fields={
                    "error": serializers.CharField(),
                },
            ),
        ),
        404: OpenApiResponse(
            description="User, locker, or connection types not found",
            response=inline_serializer(
                name="GetOtherConnectionTypesNotFound",
                fields={
                    "success": serializers.BooleanField(),
                    "message": serializers.CharField(),
                },
            ),
        ),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_other_connection_types(request):
    """
    Retrieve all the connection types of guest_locker of the guest_user that the authenticated user
    does not have a connection with.

    This view uses GET request to fetch all connection types of the current user
    (refering to the guest_user_id and guest_locker_id). Further, the values of guest_user/host_user
    and guest_locker/host_locker is compared with guest_user_id and guest_locker_id, each. If a match is found,
    that connection gets fetched.

    Parameters:
       - request: HttpRequest object containing metadata about the request.

    Query Parameters:
        - guest_username
        - guest_locker_name

    Returns:
       - JsonResponse: A JSON object containing a list of all users or an error message.

    Response Codes:
       - 200: Successful connetion_types of users.
       - 400: No connections types are found.
       - 404: User not found / Locker not found.
       - 405: Request method not allowed (if not GET).
    """

    if request.method == "GET":

        if request.user.is_authenticated:
            current_user = request.user  # Use the authenticated user
        else:
            return JsonResponse({"error": "User not authenticated"}, status=401)

        try:
            guest_username = request.GET.get("guest_username")
            guest_locker_name = request.GET.get("guest_locker_name")
            guest_user = CustomUser.objects.get(
                username=guest_username
            )  # Fetch user by username
            guest_locker = Locker.objects.get(
                name=guest_locker_name, user=guest_user
            )  # Fetch locker by lockername
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"success": False, "message": "User not found"}, status=404
            )
        except Locker.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Locker not found for the specified username",
                },
                status=404,
            )

        # This is for Rohith viewing IIITB's Transcripts Locker. Fetch all the connection types of
        # IIITB's Transcripts Locker. Fetch, these connection types' connection ids.

        connection_types_iiitb_transcripts_ids = ConnectionType.objects.filter(
            owner_user=guest_user, owner_locker=guest_locker
        ).values_list("connection_type_id", flat=True)

        if not connection_types_iiitb_transcripts_ids:
            return JsonResponse(
                {"success": False, "message": "No connection types found"}, status=404
            )

        # Now fetch, all the connections where Rohith is either the host_user or guest_user. (Or more formally, it
        # would be the current authenticated user)

        rohith_connections = Connection.objects.filter(
           
        Q(
            (Q(host_user=current_user) | Q(guest_user=current_user)) &
            ~Q(connection_status="closed")
        ))

        rohith_connection_type_ids = rohith_connections.values_list(
            "connection_type_id", flat=True
        ).distinct()

        # Converting QuerySets to sets, for finding easy set difference.
        rohith_connection_type_ids_set = set(rohith_connection_type_ids)
        connection_types_iiitb_transcripts_set = set(
            connection_types_iiitb_transcripts_ids
        )

        # So finally, the list of connection type ids that Rohith has not yet initiated a connection to, with
        # IIITB's Transcripts locker are :
        difference_ids_set = (
            connection_types_iiitb_transcripts_set - rohith_connection_type_ids_set
        )

        if not difference_ids_set:
            return JsonResponse(
                {
                    "success": False,
                    "message": "No other connection types to connect to.",
                },
                status=404,
            )

        difference_connection_types = ConnectionType.objects.filter(
            connection_type_id__in=difference_ids_set
        )
        serializer = ConnectionTypeSerializer(difference_connection_types, many=True)

        return JsonResponse(
            {"success": True, "connection_types": serializer.data}, status=200
        )
    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@extend_schema(
    summary="Get connection types by user and locker",
    description="Retrieve connection types filtered by a specific username and locker name.",
    parameters=[
        OpenApiParameter(
            name="username",
            type=OpenApiTypes.STR,
            description="Username of the user",
            required=False,
        ),
        OpenApiParameter(
            name="locker_name",
            type=OpenApiTypes.STR,
            description="Name of the locker",
            required=True,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Connection types retrieved successfully",
            response=inline_serializer(
                name="GetConnectionTypeByUserByLockerResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "connection_types": ConnectionTypeSerializer(many=True),
                },
            ),
        ),
        400: OpenApiResponse(
            description="Bad request",
            response=inline_serializer(
                name="GetConnectionTypeByUserByLockerBadRequest",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(),
                },
            ),
        ),
        401: OpenApiResponse(
            description="Unauthorized",
            response=inline_serializer(
                name="GetConnectionTypeByUserByLockerUnauthorized",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(),
                },
            ),
        ),
        404: OpenApiResponse(
            description="User, locker, or connection types not found",
            response=inline_serializer(
                name="GetConnectionTypeByUserByLockerNotFound",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(required=False),
                    "message": serializers.CharField(required=False),
                },
            ),
        ),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_type_by_user_by_locker(request):
    """
    Retrieve connection types by locker and user.

    Parameters:
    - request: HttpRequest object containing metadata about the request.

    Query Parameters:
    - username: The username of the user.
    - locker_name: The name of the locker.

    Returns:
    - JsonResponse: A JSON object containing a list of connection types or an error message.

    Response Codes:
    - 200: Successful retrieval of connection types.
    - 404: Specified user or locker not found.
    - 405: Request method not allowed (if not GET).
    - 400: Bad request (missing parameters).
    """
    if request.method == "GET":
        username = request.GET.get("username")
        locker_name = request.GET.get("locker_name")

        if not locker_name:
            return JsonResponse(
                {"success": False, "error": "Locker name is required"}, status=400
            )

        try:
            if username:
                try:
                    user = CustomUser.objects.get(username=username)
                except CustomUser.DoesNotExist:
                    return JsonResponse(
                        {"success": False, "error": "User not found"}, status=404
                    )
            else:
                if request.user.is_authenticated:
                    user = request.user
                else:
                    return JsonResponse(
                        {"success": False, "error": "User not authenticated"},
                        status=401,
                    )

            try:
                locker = Locker.objects.get(name=locker_name, user=user)
            except Locker.DoesNotExist:
                return JsonResponse(
                    {"success": False, "error": "Locker not found"}, status=404
                )

            connection_types = ConnectionType.objects.filter(
                owner_user=user, owner_locker=locker
            )

            if not connection_types.exists():
                return JsonResponse(
                    {
                        "success": False,
                        "message": "No connection types found for this user and locker",
                    },
                    status=404,
                )

            serializer = ConnectionTypeSerializer(connection_types, many=True)
            return JsonResponse(
                {"success": True, "connection_types": serializer.data}, status=200
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )


@extend_schema(
    summary="Get connection types for authenticated user",
    description="Retrieve all connection types associated with the currently authenticated user.",
    responses={
        200: OpenApiResponse(
            description="Connection types retrieved successfully",
            response=inline_serializer(
                name="GetConnectionTypeByUserResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "connection_types": ConnectionTypeSerializer(many=True),
                },
            ),
        ),
        404: OpenApiResponse(
            description="No connection types found",
            response=inline_serializer(
                name="GetConnectionTypeByUserNotFound",
                fields={
                    "success": serializers.BooleanField(),
                    "message": serializers.CharField(),
                },
            ),
        ),
        400: OpenApiResponse(
            description="Unexpected error",
            response=inline_serializer(
                name="GetConnectionTypeByUserBadRequest",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(),
                },
            ),
        ),
        405: OpenApiResponse(
            description="Invalid request method",
            response=inline_serializer(
                name="GetConnectionTypeByUserMethodNotAllowed",
                fields={
                    "success": serializers.BooleanField(),
                    "error": serializers.CharField(),
                },
            ),
        ),
    },
)
@csrf_exempt
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_connection_type_by_user(request):
    """
    Retrieve connection types for the authenticated user.

    Returns:
    - JsonResponse: A list of connection types associated with the authenticated user.
    """
    if request.method == "GET":
        try:
            user = request.user  #  Authenticated user from BasicAuthentication

            connection_types = ConnectionType.objects.filter(owner_user=user)

            if not connection_types.exists():
                return JsonResponse(
                    {"success": False, "message": "No connection types found for this user"},
                    status=404,
                )

            serializer = ConnectionTypeSerializer(connection_types, many=True)
            return JsonResponse(
                {"success": True, "connection_types": serializer.data}, status=200
            )

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )
