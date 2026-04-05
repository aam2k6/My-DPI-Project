
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views.manual_auth import login_view, signup_user
from .views.google_auth import (
    GoogleSignupViewWithJWT,
    GoogleLoginViewWithJWT,
    complete_profile,
    get_valid_google_access_token,
)
from .views.system_admin import (
    demote_sys_admin_to_user,
    demote_sys_moderator_to_user,
    promote_user_to_moderator,
    promote_user_to_sys_admin,
)

urlpatterns = [
    # path('dj-rest-auth/', include('dj_rest_auth.urls')),
    # path('dj-rest-auth/registration/', include('dj_rest_auth.registration.urls')),

    path("signup/", signup_user),
    path("login/", login_view),
    path('google/login/', GoogleLoginViewWithJWT.as_view()),
    path('google/signup/', GoogleSignupViewWithJWT.as_view()),
    path('google/complete-profile/', complete_profile),
    path('google/get-valid-google-access-token/', get_valid_google_access_token),
    path('token/refresh/', TokenRefreshView.as_view()),

    path("promote_user_to_sys_admin/", promote_user_to_sys_admin),
    path("promote_user_to_moderator/", promote_user_to_moderator),
    path("demote_sys_admin_to_user/", demote_sys_admin_to_user),
    path("demote_sys_moderator_to_user/", demote_sys_moderator_to_user),
]
