from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from api.models import Resource, Notification
from api.model.xnode_model import Xnode_V2
from api.utils.resource_helper.access_resource_helper import access_Resource
from rest_framework_simplejwt.authentication import JWTAuthentication

from drf_spectacular.utils import extend_schema, OpenApiResponse

@extend_schema(
    description="Reject a request to revert consent.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'xnode_id': {'type': 'string'},
                'revert_reject_reason': {'type': 'string'}
            },
            'required': ['xnode_id']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Revert request rejected successfully",
            response={
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"}
                },
                "example": {
                    "success": True,
                    "message": "Revert request rejected."
                }
            }
        ),
        400: OpenApiResponse(description="Missing xnode_id or reason"),
        404: OpenApiResponse(description="Xnode not found")
    }
)
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def reject_revert_consent(request):
    print("Reject Revert Consent Initiated")

    user = request.user
    xnode_id = request.data.get("xnode_id")
    reason = request.data.get("revert_reject_reason", "").strip()

    if not xnode_id :
        return JsonResponse({"success": False, "error": "Missing xnode_id or reason"}, status=400)

    try:
        xnode = Xnode_V2.objects.get(id=xnode_id)
    except Xnode_V2.DoesNotExist:
        return JsonResponse({"success": False, "error": "Xnode not found"}, status=404)

    connection = xnode.connection
    host_user = connection.host_user
    guest_user = connection.guest_user
    host_locker = connection.host_locker
    guest_locker = connection.guest_locker

    # Determine if the rejector is host or guest
    is_host = (user == host_user)
    user_locker = host_locker if is_host else guest_locker
    target_user = guest_user if is_host else host_user
    target_locker = guest_locker if is_host else host_locker

    if xnode.reverted:
        return JsonResponse({"success": False, "message": "This consent has already been reverted."})

    # Prevent same user from rejecting their own request
    if xnode.host_revert_status == 1 and is_host:
        return JsonResponse({"success": False, "error": "You cannot reject your own revert request."})

    if xnode.guest_revert_status == 1 and not is_host:
        return JsonResponse({"success": False, "error": "You cannot reject your own revert request."})

    # Get document name
    document_name = "Unknown Resource"
    inode = access_Resource(xnode_id=xnode.id)
    if inode:
        try:
            res_id = inode.node_information.get("resource_id")
            resource = Resource.objects.get(resource_id=res_id)
            document_name = resource.document_name
        except:
            pass

    # Prepare list of nodes to update 
    xnodes_to_update = [xnode]  # Always include the request node

    # Handle parent → child
    if xnode.xnode_Type in [Xnode_V2.XnodeType.INODE, Xnode_V2.XnodeType.SNODE]:
        possible_children = Xnode_V2.objects.filter(connection=connection, xnode_Type="SNODE")
        for child in possible_children:
            if str(child.node_information.get("inode_or_snode_id")) == str(xnode.id):
                print("Matched child node:", child.id)
                xnodes_to_update.append(child)
                break

    # Handle child → parent
    if xnode.xnode_Type == Xnode_V2.XnodeType.SNODE:
        parent_id = xnode.node_information.get("inode_or_snode_id")
        if parent_id:
            try:
                parent_node = Xnode_V2.objects.get(id=parent_id, connection=connection)
                print("Matched parent node:", parent_node.id)
                xnodes_to_update.append(parent_node)
            except Xnode_V2.DoesNotExist:
                print("No parent node found for id:", parent_id)

    print("Final nodes to update for rejection:")
    for node in xnodes_to_update:
        print("Rejecting:", node.id, "Type:", node.xnode_Type)

    # Clear approval flags (host_revert_status, guest_revert_status) and revert_reason
    for node in xnodes_to_update:
        if is_host:
            node.host_revert_status = 0
            node.guest_revert_status = 0
        else:
            node.guest_revert_status = 0
            node.host_revert_status = 0

        node.save(update_fields=["host_revert_status", "guest_revert_status"])

    # Send notification to the party who originally requested revert
    Notification.objects.create(
        connection=connection,
        host_user=target_user,
        guest_user=user,
        host_locker=target_locker,
        guest_locker=user_locker,
        connection_type=connection.connection_type,
        created_at=timezone.now(),
        message=f"User '{user.username}' has rejected the request to revert the collateral consent for '{document_name}'.",
        notification_type="revert_rejected",
        target_type="xnode",
        target_id=str(xnode.id),
        extra_data={
            "xnode_id": xnode.id,
            "connection_id": connection.connection_id,
            "revert_reject_reason": reason,
            "resource_name": document_name,
            "user_details": {
                            "id": user.user_id,
                            "username": user.username,
                            "description": getattr(user, "description", ""),
                            "user_type": getattr(user, "user_type", "user"),
                        },
        }
    )

    # NOTIFICATION UPDATE AFTER REJECT
    notif_to_update = None
    for node in xnodes_to_update:
        notif = Notification.objects.filter(
            target_id=str(node.id),
            target_type="xnode",
            connection=connection,
            notification_type="revert_approval_pending"
        ).order_by("-created_at").first()

        if notif:
            notif_to_update = notif
            print(f"Found revert notification for node {node.id}")
            break

    if notif_to_update:
        notif_to_update.notification_type = "revert_approved_or_rejected"
        notif_to_update.save()
        print("Notification updated.")
    else:
        print("No revert notification found to update.")

    return JsonResponse({"success": True, "message": "Revert request rejected."})
    
