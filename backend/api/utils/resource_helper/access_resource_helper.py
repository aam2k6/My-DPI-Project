
from api.models import Locker, Resource, CustomUser, Connection ,Notification , ConnectionType
from api.model.xnode_model import Xnode_V2



#access through xnode_id and trace back the original inode
def access_Resource(xnode_id: int) -> Xnode_V2:
    xnode_List = Xnode_V2.objects.filter(id=xnode_id)
    print(xnode_List)
    if xnode_List.exists():
        xnode = xnode_List.first()
        if xnode.xnode_Type == Xnode_V2.XnodeType.INODE:
            return xnode
        elif xnode.xnode_Type == Xnode_V2.XnodeType.VNODE:
            return access_Resource(xnode_id=xnode.node_information["link"])
        elif xnode.xnode_Type == Xnode_V2.XnodeType.SNODE:
            return access_Resource(xnode_id=xnode.node_information["inode_or_snode_id"])
    else:
        return None
    
# Build the access path from the initial xnode up to the root INODE
def build_access_path_from_nodes(xnode: Xnode_V2):
    access_path = []
    current_node = xnode

    while current_node:
        parent_xnode_id = None
        if current_node.xnode_Type == "VNODE":
            parent_xnode_id = current_node.node_information.get("link")
        elif current_node.xnode_Type == "SNODE":
            parent_xnode_id = current_node.node_information.get("inode_or_snode_id")
        elif current_node.xnode_Type == "INODE":
            break

        if parent_xnode_id is None:
            break

        try:
            parent_node = Xnode_V2.objects.get(id=parent_xnode_id)
        except Xnode_V2.DoesNotExist:
            break

        conn = current_node.connection

        # Determine from_user_id
        if parent_node.xnode_Type in ["SNODE", "INODE"]:
            from_user_id = parent_node.node_information.get("primary_owner")
        else:
            from_user_id = parent_node.node_information.get("current_owner")

        # Determine to_user_id
        if current_node.xnode_Type in ["SNODE", "INODE"]:
            to_user_id = current_node.node_information.get("primary_owner")
        else:
            to_user_id = current_node.node_information.get("current_owner")

        # Get usernames
        try:
            from_user = CustomUser.objects.get(user_id=from_user_id).username
        except CustomUser.DoesNotExist:
            from_user = "unknown"

        try:
            to_user = CustomUser.objects.get(user_id=to_user_id).username
        except CustomUser.DoesNotExist:
            to_user = "unknown"

        # Get locker names from each node (assumes node has locker FK)
        from_locker = getattr(parent_node.locker, 'name', 'unknown')
        to_locker = getattr(current_node.locker, 'name', 'unknown')

        if conn:
            conn_type = conn.connection_type
        else:
            conn_type = "Direct"

        access_path.append({
            "from_user": from_user,
            "to_user": to_user,
            "from_locker": from_locker,
            "to_locker": to_locker,
            "connection_type": conn_type,
            "via_node_type": current_node.xnode_Type
        })

        current_node = parent_node

    return list(reversed(access_path))

# Format the access path into a readable string
def format_access_path(access_path, accessing_user, resource_name, accessed_locker, final_connection_name):
    message = (
        f"User '{accessing_user}' has accessed the resource '{resource_name}' from locker' {accessed_locker}'"
        f"from the connection' {final_connection_name}'.\n\n"
        f"Access Path:\n"
    )

    for i, step in enumerate(access_path, start=1):
        message += (
            f"{i}. {step['from_user']} (Locker: {step['from_locker']})\n"
            f"   --> shared with {step['to_user']} (Locker: {step['to_locker']}) via \"{step['connection_type']}\"\n\n"
        )

    return message


# Check if the xnode is approved for access
def is_xnode_approved(connection, xnode_id):
    approved_ids = []

    for terms in filter(None, [connection.terms_value, connection.terms_value_reverse]):
        for key, value in terms.items():
            if not isinstance(value, str) or '|' not in value or ';' not in value:
                continue
            try:
                _, rest = value.split("|")
                x_id, status = rest.split(";")
                if status.strip() == "T":
                    approved_ids.append(x_id)
            except ValueError:
                continue

    return str(xnode_id) in approved_ids

