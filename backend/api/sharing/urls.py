# api/sharing/urls.py
from django.urls import path
#share
from .views.intiation_of_transaction import process_resource_consent_guest,process_resource_consent_host
from .views.share_approve import share_resource_approve_reverse_v2,share_resource_approve_v2
from .views.confer_approve import confer_resource_approve_reverse_v2,confer_resource_approve_v2
from .views.transfer_approve import transfer_resource,transfer_resource_reverse
from .views.condition_check_share import check_conditions,reshare_Allowed_Or_Not
from .views.collateral_approve import collateral_resource,collateral_resource_reverse
from .views.revocation import revoke_consent, revert_consent


urlpatterns = [
    path('intiation-guest/',process_resource_consent_guest,name='intiation-guest'),
    path('intiation-host/',process_resource_consent_host,name='intiation-host'),
    path('share-resource-approve-guest/',share_resource_approve_v2,name='share-resource-approve-guest/'),
    path('share-resource-approve-host/',share_resource_approve_reverse_v2,name='share-resource-approve-host'),

    path('confer-resource-approve-guest/',confer_resource_approve_v2,name='confer-resource-approve-guest'),
    path('confer-resource-approve-host/',confer_resource_approve_reverse_v2,name='confer-resource-approve-host'),
    path('transfer-resource-guest/', transfer_resource, name='transfer-resource-guest'),
    path('transfer-resource-host/', transfer_resource_reverse, name='transfer-resource-host'),

    path("check-conditions/",check_conditions,name="check_conditions",),
    path("reshare-check/",reshare_Allowed_Or_Not,name="reshare_check"),
    path('collateral-resource-guest/', collateral_resource, name='collateral-resource-guest'),
    path('collateral-resource-host/', collateral_resource_reverse, name='collateral-resource-host'),
    path("revoke-consent/",revoke_consent,name="revoke_consent"),
    path("revert-consent/",revert_consent,name="revert_consent"),


]
