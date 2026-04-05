
from django.http import HttpRequest, HttpResponse
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes



@extend_schema(
    summary="Home endpoint",
    description="Welcome page for Anumati API",
    responses={200: OpenApiTypes.STR},
    tags=['General']
)
def home(request: HttpRequest) -> HttpResponse:
    return HttpResponse("<h1>Wellcome to Anumati</h1>")


