
from django.utils import timezone
from rest_framework import status
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from api.serializers import (
 UserSerializer   
)
from api.models import (
    CustomUser,
    GoogleAuthToken
)

from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialAccount
from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
import requests
from api.utils.google_drive_helper.drive_helper import get_or_refresh_google_token
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes


User = get_user_model()



GOOGLE_CLIENT_TYPES = ("web", "Android","iOS")


class GoogleSignupViewWithJWT(APIView):
    """Handles new Google signups only. Rejects existing users."""
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Google Signup",
        description=(
            "Signup using Google OAuth authorization code. "
            "Creates a new user if the Google account or email does not already exist. "
            "Returns JWT tokens on successful signup."
        ),
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "Google OAuth authorization code"
                    }
                },
                "required": ["code"],
            }
        },
        responses={
            201: OpenApiResponse(description="Signup successful, JWT returned"),
            400: OpenApiResponse(description="Authorization code missing or token exchange failed"),
            403: OpenApiResponse(description="User already exists or email collision"),
            500: OpenApiResponse(description="Google OAuth configuration or server error"),
        },
       # tags=["Authentication"],
    )
    
    def post(self, request):
        client_type = request.data.get("client_type", "web")

        if client_type not in GOOGLE_CLIENT_TYPES:
            return Response(
                {"error": "Unsupported client_type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = request.data.get("code")
        if not code:
            return Response(
                {"error": "Authorization code required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            social_app = SocialApp.objects.get(provider="google")

            # Token exchange (correct for all clients)
            token_data = {
                "code": code,
                "client_id": social_app.client_id,
                "client_secret": social_app.secret,
                "grant_type": "authorization_code",
            }

            # redirect_uri ONLY for web
            if client_type == "web":
                token_data["redirect_uri"] = "postmessage"

            token_response = requests.post(
                "https://oauth2.googleapis.com/token",
                data=token_data,
                timeout=10,
            )

            if token_response.status_code != 200:
                return Response(
                    {
                        "error": "Token exchange failed",
                        "details": token_response.json(),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            
            tokens = token_response.json()
            access_token = tokens.get('access_token')
            refresh_token = tokens.get('refresh_token')
            
            userinfo = requests.get('https://www.googleapis.com/oauth2/v2/userinfo', headers={'Authorization': f'Bearer {access_token}'}).json()
            email = userinfo.get('email')
            google_id = userinfo.get('id')
            
            # 2. CHECK FOR EXISTING ACCOUNTS (Signup Failure Logic)
            
            # A. Check for existing Google Social Account
            if SocialAccount.objects.filter(provider='google', uid=google_id).exists():
                return Response(
                    {'error': "This account is already registered with this Google account. Please log in."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # B. Check for existing email (manual or Google collision)
            if User.objects.filter(email=email).exists():
                existing_user = User.objects.get(email=email)
                
                if existing_user.login_method != 'google':
                    # Manual collision: direct to password login
                    return Response(
                        {'error': 'This email is registered manually. Please login using your password.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                else:
                    # Google collision (user exists, but SocialAccount DNE): direct to login
                    return Response(
                        {'error': "This account is already registered with this Google account. Please log in."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # 3. CREATE NEW USER
            
            # Generate unique temporary username
            temp_username = f"google_{email.split('@')[0]}"
            counter = 1
            while User.objects.filter(username=temp_username).exists():
                temp_username = f"google_{email.split('@')[0]}{counter}"
                counter += 1
            
            user = User.objects.create_user(username=temp_username, email=email)
            
            # Set Google-specific fields
            user.login_method = 'google'
            user.is_profile_complete = False
            user.description = "" 
            user.user_type = 'user'
            user.save()
            
            # Create social account entry
            social_account = SocialAccount.objects.create(
                user=user, provider='google', uid=google_id, extra_data=userinfo
            )
            
            # 4. STORE TOKENS (Crucial for future authorization)
            
            # Update custom GoogleAuthToken (assuming it exists)

            expires_in = tokens.get('expires_in', 3600)
            expires_at = timezone.now() + timedelta(seconds=expires_in)

            # --- GoogleAuthToken ---
            defaults = {
                'access_token': access_token,
                'expires_at': expires_at,
            }
            if refresh_token:
                defaults['refresh_token'] = refresh_token

            GoogleAuthToken.objects.update_or_create(user=user, defaults=defaults)
                
    
            # --- allauth SocialToken ---
            defaults = {
                'token': access_token,
                'expires_at': expires_at,
            }
            if refresh_token:
                defaults['token_secret'] = refresh_token

            SocialToken.objects.update_or_create(account=social_account, defaults=defaults)
            
            # 5. Generate and return JWT
            refresh_jwt = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            
            response = Response({
                'refresh': str(refresh_jwt),
                'access': str(refresh_jwt.access_token),
                'user': user_data,
                'message': 'Signup successful.'
            }, status=status.HTTP_201_CREATED) # Use 201 for resource creation
            
            # Set HTTP-only cookie
            response.set_cookie(key='refresh_token', value=str(refresh_jwt), httponly=True, secure=False, samesite='Lax', max_age=7*24*60*60)
            
            return response
            
        except SocialApp.DoesNotExist:
             return Response({'error': 'Google OAuth app not configured in Django admin.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

# --------------------------------------------------------------------------
#login using google account
class GoogleLoginViewWithJWT(APIView):
    """Handles existing Google users login only. Rejects new users."""
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Google Login",
        description=(
            "Login for existing users using Google OAuth authorization code. "
            "Rejects new users who have not signed up yet. "
            "Returns JWT tokens on successful login."
        ),
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "Google OAuth authorization code"
                    }
                },
                "required": ["code"],
            }
        },
        responses={
            200: OpenApiResponse(description="Login successful, JWT returned"),
            400: OpenApiResponse(description="Authorization code missing or token exchange failed"),
            403: OpenApiResponse(description="Manual account collision or invalid login method"),
            404: OpenApiResponse(description="Account not found, signup required"),
            500: OpenApiResponse(description="Google OAuth configuration or server error"),
        },
        # tags=["Authentication"],
    )
    
    def post(self, request):

        client_type = request.data.get("client_type", "web")

        if client_type not in GOOGLE_CLIENT_TYPES:
            return Response(
                {"error": "Unsupported client_type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = request.data.get("code")
        if not code:
            return Response(
                {"error": "Authorization code required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            social_app = SocialApp.objects.get(provider="google")

            # token exchange
            token_data = {
                "code": code,
                "client_id": social_app.client_id,
                "client_secret": social_app.secret,
                "grant_type": "authorization_code",
            }

            # redirect_uri ONLY for web
            if client_type == "web":
                token_data["redirect_uri"] = "postmessage"

            token_response = requests.post(
                "https://oauth2.googleapis.com/token",
                data=token_data,
                timeout=10,
            )

            if token_response.status_code != 200:
                return Response(
                    {
                        "error": "Token exchange failed",
                        "details": token_response.json(),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            tokens = token_response.json()
            access_token = tokens.get('access_token')
            refresh_token = tokens.get('refresh_token')
            
            userinfo = requests.get('https://www.googleapis.com/oauth2/v2/userinfo', headers={'Authorization': f'Bearer {access_token}'}).json()
            google_id = userinfo.get('id')
            email = userinfo.get('email')
            
            user = None
            social_account = None

            # 2. CORE LOGIN LOGIC: Find existing user
            
            # A. Attempt to find SocialAccount (Primary Check)
            try:
                social_account = SocialAccount.objects.get(provider='google', uid=google_id)
                user = social_account.user
                
                if user.login_method != 'google':
                    return Response({'error': 'This account is registered manually. Please use password login.'}, status=status.HTTP_403_FORBIDDEN)
                
            except SocialAccount.DoesNotExist:
                # B. SocialAccount missing, check email for recovery/collision
                if User.objects.filter(email=email).exists():
                    existing_user = User.objects.get(email=email)
                    
                    if existing_user.login_method != 'google':
                        # Manual Collision: Fail
                        return Response({'error': 'This email is registered manually. Please use password login.'}, status=status.HTTP_403_FORBIDDEN)
                    else:
                        # RECOVERY CASE: User exists (google login_method) but SocialAccount DNE. Recreate SocialAccount.
                        user = existing_user
                        social_account = SocialAccount.objects.create(
                            user=user, provider='google', uid=google_id, extra_data=userinfo
                        )
                else:
                    # C. User does not exist at all. Direct to Signup.
                    return Response({'error': 'Account not found. Please sign up first.'}, status=status.HTTP_404_NOT_FOUND)
            
            # 3. Success: UPDATE TOKENS
            
            # Update custom GoogleAuthToken
            expires_in = tokens.get('expires_in', 3600)
            expires_at = timezone.now() + timedelta(seconds=expires_in)

            # --- GoogleAuthToken ---
            defaults = {
                'access_token': access_token,
                'expires_at': expires_at,
            }
            if refresh_token:
                defaults['refresh_token'] = refresh_token

            GoogleAuthToken.objects.update_or_create(user=user, defaults=defaults)

            # --- SocialToken ---
            defaults = {
                'token': access_token,
                'expires_at': expires_at,
            }
            if refresh_token:
                defaults['token_secret'] = refresh_token

            SocialToken.objects.update_or_create(account=social_account, defaults=defaults)

            # 4. Generate and return JWT
            refresh_jwt = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            
            response_data = {
                'refresh': str(refresh_jwt),
                'access': str(refresh_jwt.access_token),
                'user': user_data,
                'message': 'Login successful.'
            }
            
            if not user.is_profile_complete:
                response_data['profile_incomplete'] = True
            
            response = Response(response_data, status=status.HTTP_200_OK)
            response.set_cookie(
                'refresh_token', str(refresh_jwt), httponly=True, secure=False, samesite='Lax', max_age=7*24*60*60
            )
            
            return response
            
        except SocialApp.DoesNotExist:
             return Response({'error': 'Google OAuth app not configured in Django admin.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#profile complete
@extend_schema(
    summary="Complete user profile",
    description=(
        "Completes the user profile after Google signup. "
        "Updates username and description and marks the profile as complete. "
        "Requires authentication."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {
                    "type": "string",
                    "description": "New unique username"
                },
                "description": {
                    "type": "string",
                    "description": "User description"
                }
            },
            "required": ["username", "description"],
        }
    },
    responses={
        200: OpenApiResponse(description="Profile updated successfully"),
        400: OpenApiResponse(description="Profile already complete or validation error"),
        401: OpenApiResponse(description="Authentication credentials were not provided"),
    },
    # tags=["Authentication"],
)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_profile(request):
    user = request.user
    
    if user.is_profile_complete:
        return Response({"success": False, "error": "Profile is already complete."}, status=status.HTTP_400_BAD_REQUEST)
    
    new_username = request.data.get("username")
    new_description = request.data.get("description")

    if not new_username or not new_description:
        return Response({"success": False, "error": "Username and description are required."}, status=status.HTTP_400_BAD_REQUEST)
    
    if CustomUser.objects.filter(username=new_username).exclude(pk=user.pk).exists():
        return Response({"success": False, "error": "Username already taken."}, status=status.HTTP_400_BAD_REQUEST)

    user.username = new_username
    user.description = new_description
    user.is_profile_complete = True
    user.save()

    return Response({"success": True, "message": "Profile updated successfully."}, status=status.HTTP_200_OK)

#get the valid auth token
@extend_schema(
    summary="Get valid Google access token",
    description=(
        "Returns a valid Google access token for the authenticated user. "
        "If the existing token is expired, it will be refreshed automatically. "
        "Requires authentication."
    ),
    responses={
        200: {
            "type": "object",
            "properties": {
                "access_token": {
                    "type": "string",
                    "description": "Valid Google OAuth access token"
                },
                "expires_in": {
                    "type": "number",
                    "description": "Seconds until the access token expires"
                }
            }
        },
        401: OpenApiResponse(
            description="User not authenticated or token refresh failed"
        ),
    },
    # tags=["Authentication"],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_valid_google_access_token(request):
    user = request.user
    access_token = get_or_refresh_google_token(user)

    if not access_token:
        return Response({'error': 'Unable to fetch valid token. Please re-authenticate.'}, status=401)

    token_obj = GoogleAuthToken.objects.get(user=user)
    now = timezone.now()
    return Response({
        'access_token': access_token,
        'expires_in': (token_obj.expires_at - now).total_seconds()
    })
