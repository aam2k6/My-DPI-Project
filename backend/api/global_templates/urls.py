# api/global_templates/urls.py
from django.urls import path
#global templates
from api.global_templates.views.create_global_connection_templates import create_Global_Connection_Type_Template, global_Connection_CRUD, get_Connection_Link_Regulation_For_Connection_Type, connect_Global_Connection_Type_Template_And_Connection_Type
from api.global_templates.views.create_global_connection_terms import create_Global_Connection_Terms
from api.global_templates.views.get_global_connection_templates import get_Global_Connection_Type, get_All_Connection_Terms_For_Global_Connection_Type_Template


urlpatterns = [

    path("get-connection-terms-for-global-template/",get_All_Connection_Terms_For_Global_Connection_Type_Template,name="get_Connection_Terms_For_Global_Template",),
    path("add-global-template/",create_Global_Connection_Type_Template,name="create_global_template",),
    path("connect-type-to-template/",connect_Global_Connection_Type_Template_And_Connection_Type,name="connect_type_to_template",),
    path("get-template-or-templates/",get_Global_Connection_Type,name="get_template_or_templates",),
    path("get-link-regulation-for-connection-type/",get_Connection_Link_Regulation_For_Connection_Type,name="get_link_for_connection_type",),
    path("create-global-terms/",create_Global_Connection_Terms,name="create_global_terms",),
    path("global-connection-template-put-get-delete/",global_Connection_CRUD,name="global_connection_template_put_get_delete"),
]
