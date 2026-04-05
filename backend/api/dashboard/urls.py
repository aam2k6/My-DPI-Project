# api/dashboard/urls.py
from django.urls import path
# dashboard
from .views.get_stats import get_stats
from .views.user_directory import user_directory

urlpatterns = [
    path("user-directory/", user_directory, name="user_directory"),
    path("stats/", get_stats, name="get_stats"),
]
