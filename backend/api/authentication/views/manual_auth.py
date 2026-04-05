
from django.contrib.auth import login, authenticate
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.models import (
    CustomUser,
)
from api.serializers import UserSerializer
from django.http import HttpRequest, JsonResponse, FileResponse, HttpResponse

from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes


@extend_schema(
    summary="Manual user login",
    description=(
        "Authenticate a user using username or email and password. "
        "Google-linked accounts cannot log in using this endpoint."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {
                    "type": "string",
                    "description": "Username or email of the user",
                },
                "password": {
                    "type": "string",
                    "format": "password",
                    "description": "User password",
                },
            },
            "required": ["username", "password"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Login successful",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "user": {"type": "object"},
                    "access": {"type": "string"},
                    "refresh": {"type": "string"},
                },
            },
        ),
        400: OpenApiResponse(description="Invalid credentials or validation error"),
    },
    # tags=["Authentication"],
)

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    User = get_user_model()

    if not username:
        return Response(
            {"success": False, "error": "Username is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Try to find user by username or email
    try:
        user = User.objects.get(email=username)  # try email
    except User.DoesNotExist:
        try:
            user = User.objects.get(username=username)  # try username
        except User.DoesNotExist:
            user = None

    if user and user.login_method == 'google':
        return Response(
            {"success": False, "error": "This account is linked with Google. Please log in using Google."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not password:
        return Response(
            {"success": False, "error": "Password is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Proceed with standard Django authentication
    user = authenticate(request=request, username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            "success": True,
            "user": user_data,
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }, status=status.HTTP_200_OK)
    else:
        return Response({"success": False, "error": "Invalid email or username or password. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

#manual signup
@extend_schema(
    methods=["POST"],
    summary="User Signup",
    description="Register a new user using username, email, description and password.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {"type": "string"},
                "email": {"type": "string", "format": "email"},
                "description": {"type": "string"},
                "password": {"type": "string", "format": "password"},
            },
            "required": ["username", "email", "description", "password"],
        }
    },
    responses={
        201: OpenApiResponse(description="User registered successfully"),
        400: OpenApiResponse(description="Validation error"),
    },
)

@extend_schema(
    methods=["PUT"],
    summary="Update User",
    description="Update username, description or password using existing username.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {"type": "string"},
                "new_name": {"type": "string"},
                "new_description": {"type": "string"},
                "new_password": {"type": "string", "format": "password"},
            },
            "required": ["username"],
        }
    },
    responses={
        200: OpenApiResponse(description="User updated successfully"),
        404: OpenApiResponse(description="User not found"),
    },
)
@api_view(["POST", "PUT"])
@permission_classes([AllowAny])
def signup_user(request):
    if request.method == "POST":
        try:
            username = request.data.get("username")
            email = request.data.get("email")
            description = request.data.get("description")
            password = request.data.get("password")

            if not username:
                return Response({"success": False, "error": "Username is required"}, status=400)
            if not email:
                return Response({"success": False, "error": "Email is required"}, status=400)
            if not description:
                return Response({"success": False, "error": "Description is required"}, status=400)
            if not password:
                return Response({"success": False, "error": "Password is required"}, status=400)
            
            # Checking the uniqueness
            if CustomUser.objects.filter(username=username).exists():
                return Response({"success": False, "error": "This username is already registered. Please log in or try a different username."
}, status=400)
            if CustomUser.objects.filter(email=email).exists():
                return Response({"success": False, "error": "This email is already registered. Please log in or try a different email."

}, status=400)

            new_user = CustomUser(username=username, 
                                  email=email, 
                                  description=description,
                                  is_profile_complete=True, 
                                  login_method='manual'
                                  )
            new_user.set_password(password)
            new_user.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(new_user)

            user_data = UserSerializer(new_user).data

            return Response({
                "success": True,
                "user": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=400)
            

    if request.method == "PUT":
            """
            Expected JSON data:
            {
                "username": value,
                "new_name": value,
                "new_description": value,
                "new_password": value
            }
            """
            data = request.data
            username = data.get("username")
            new_name = data.get("new_name")
            new_description = data.get("new_description")
            new_password = data.get("new_password")

            if not username:
                return JsonResponse(
                    {"success": False, "error": "Username must be provided."}, status=400
                )

            user = CustomUser.objects.filter(username=username).first()
            if user:
                if new_name:
                    user.username = new_name
                if new_description:
                    user.description = new_description
                if new_password:
                    user.set_password(new_password)
                user.save()
                return JsonResponse(
                    {"success": True, "message": "User updated successfully."}
                )

            return JsonResponse(
                {"success": False, "error": "User does not exist."}, status=404
            )

    return JsonResponse(
        {"success": False, "error": "Invalid request method"}, status=405
    )
