from django.conf import settings
from django.conf.urls.static import static
from . import views
from django.urls import path, include

urlpatterns = [
    path("",view=views.home,name="home"),
    path("auth/", include("api.authentication.urls")),
    path("locker/", include("api.locker.urls")),
    path("resource/", include("api.resource.urls")),
    path("sharing/", include("api.sharing.urls")),
    path("connection/", include("api.connections.urls")),
    path("notification/", include("api.notifications.urls")),
    path("dashboard/", include("api.dashboard.urls")),
    path("connectionType/", include("api.connection_type.urls")),
    path("globalTemplate/", include("api.global_templates.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
