


from http import HTTPStatus
from django.http import JsonResponse,HttpRequest
from django.utils import timezone
from api.models import Locker, CustomUser, Connection, Resource, Notification, ConnectionType, ConnectionTerms
from api.model.xnode_model import Xnode_V2
from datetime import timedelta

def get_provenance_stack(xnode, connection, share_type, xnode_id):
    xnode = Xnode_V2.objects.get(id=xnode)
    print("xnode provenance:")
    print(xnode.provenance_stack)
    print("details")
    print(f"connection: {connection}, xnode_id = {xnode_id}, t_o_s = {str(xnode.provenance_stack[0]['type_of_share']).lower()}")
    
    for item in xnode.provenance_stack:
        conn = item.get('connection')
        print(f"l {connection} l connection:{conn}")
        x_id = item.get('xnode_id')
        print(f"l {xnode_id} l xnode_id:{x_id}")
        type_o_s =  item.get('type_of_share', '')
        print(f"l {type_o_s} l type_of_share:{type_o_s}")
        # if str(conn) == str(connection):
        if str(x_id) == str(xnode_id):
            if type_o_s == share_type:
                print("---------")
                print(f"item:{item}")
                return {
                    "connection": item.get("connection"),
                    "from_user": item.get("from_user"),
                    "to_user": item.get("to_user"),
                    "from_locker": item.get("from_locker"),
                    "to_locker": item.get("to_locker"),
                    "type_of_share": item.get("type_of_share"),
                    "reverse": item.get("reverse"),
                    "xnode_id": item.get("xnode_id"),
                    "xnode_post_conditions": item.get("xnode_post_conditions")
                }
            else:
                print("share not matched")
        else:
            print("xnode id not matched")
        # else:
        #     print("connection not matched")

    return None  # Return None if no match found

def delete_vnode(target, connections, notification_message):
    try:
        target = int(target)
        # Build mapping from child -> parent and parent -> list of children
        child_to_parent = {}
        parent_to_children = {}

        for relation in connections:
            for child, parent in relation.items():
                child_to_parent[int(child)] = int(parent)
                parent_to_children.setdefault(int(parent), []).append(int(child))

        deleted_pairs = []
        print(f"child_to_parent: {child_to_parent}")
        print(f"parent_to_children: {parent_to_children}")
        def delete_recursively(node):
            # Get children of the current node
            children = parent_to_children.get(node, [])
            print(f"children: {children}")
            print("he 1 re")
            for child in children:
                # Recurse if the child has further children
                if child in parent_to_children:
                    print(f"he 2 re {child}")
                    delete_recursively(child)
                print("he 3 re")
                child_xnode = Xnode_V2.objects.get(id=int(child))
                parent_xnode = Xnode_V2.objects.get(id=int(child_to_parent[child]))
                p_stack = get_provenance_stack(parent_xnode.id, parent_xnode.connection, "Share", child_xnode.id)
                link_connection = Connection.objects.get(connection_id=p_stack.get("connection"))
                print("he 4 re")
                Notification.objects.create(
                    connection=link_connection,
                    guest_user= CustomUser.objects.get(user_id=p_stack.get("to_user")),
                    host_user= CustomUser.objects.get(user_id=p_stack.get("to_user")),
                    guest_locker= Locker.objects.get(locker_id=p_stack.get("to_locker")),
                    host_locker= Locker.objects.get(locker_id=p_stack.get("to_locker")),
                    connection_type=link_connection.connection_type, 
                    created_at=timezone.now(),
                    message=notification_message,
                    notification_type="node_deleted",
                    target_type="xnode",
                    target_id=str(child_xnode.id),
                    extra_data={
                        "xnode_id": child_xnode.id,
                        "xnode_type": child_xnode.xnode_Type,
                        "locker_id": p_stack.get("to_locker"),
                        "locker_name": Locker.objects.get(locker_id=p_stack.get("to_locker")).name,
                        "user_id": p_stack.get("to_user"),
                        "username": CustomUser.objects.get(user_id=p_stack.get("to_user")).username,
                        "connection_id": link_connection.connection_id,
                        "connection_name": link_connection.connection_name,
                    }
                )
                print(f"Notification sent to {p_stack.get('to_user')} for affected locker {p_stack.get('to_locker')}")

                try:
                    temp_id = parent_xnode.id    
                    while True:
                        temp = Xnode_V2.objects.get(id=temp_id)
                        print("here 4.6")
                        if str(child_xnode.id) in map(str, temp.vnode_list):
                            temp.vnode_list = [v for v in temp.vnode_list if str(v) != str(child_xnode.id)]
                            temp.save(update_fields=["vnode_list"])
                        if temp.xnode_Type == Xnode_V2.XnodeType.INODE or temp.xnode_Type == Xnode_V2.XnodeType.SNODE:
                            break
                        elif temp.xnode_Type == Xnode_V2.XnodeType.VNODE:
                            temp_id = temp.node_information["link"]
                        else:
                            break  # or raise an error if other types should not appear
                except Xnode_V2.DoesNotExist:
                    return JsonResponse({"success": False, "error": "Inode does not exist"}, status=400)

                child_xnode.delete()

                # Then delete the leaf child
                print(f"Deleting node: {child}")
                deleted_pairs.append({child: child_to_parent[child]})
                parent_to_children.pop(child, None)

            # Finally delete the current node
            # if node in child_to_parent:  # don't include the root if it's not a child
            #     print(f"Deleting node: {node}")
            #     deleted_pairs.append({node: child_to_parent[node]})
            # parent_to_children.pop(node, None)

        delete_recursively(target)
        return deleted_pairs
    except Exception as e:
        print(f"error deleting vnodes {str(e)}")






def get_defalut_validity():
       return timezone.now() + timedelta(days=14)


### Node Lock Checker Class start ###
class NodeLockChecker:
    """Class to check if a node is locked before resource exchange,transfer locking, collateral locking, and confer locking."""

    def __init__(self, node):
        self.node = node

    def is_locked(self):
        """Checks if the node is locked based on type and ownership for transfer."""
        node_type = self.node.xnode_Type
        print(f"Node Type is: {node_type}")

        # SNODE and INODE: Locked if primary_owner not equals to current_owner
        if node_type in ("SNODE", "INODE"):
            primary_owner = self.node.node_information.get("primary_owner")
            current_owner = self.node.node_information.get("current_owner")
            return primary_owner != current_owner

        # Default to locked if the node type is unknown
        return True


    def is_transfer_locked(self):
        """Checks if the node is locked based on type and ownership for transfer."""
        node_type = self.node.xnode_Type
        print(f"Node Type is: {node_type}")

        # VNODE is **never locked** for transfer
        if node_type == "VNODE":
            return False

        # SNODE and INODE: Locked if primary_owner not equals to current_owner
        if node_type in ("SNODE", "INODE"):
            primary_owner = self.node.node_information.get("primary_owner")
            current_owner = self.node.node_information.get("current_owner")
            return primary_owner != current_owner

        # Default to locked if the node type is unknown
        return True

    def is_collateral_locked(self):
        """Checks if a node is locked for collateral purposes."""
        node_type = self.node.xnode_Type
        print(f"Checking collateral lock for Node Type: {node_type}")

        # VNODE **cannot** be used as collateral
        if node_type == "VNODE":
            return True  # Always locked for collateral

        # SNODE and INODE: Locked for collateral if primary_owner not equals to current_owner
        if node_type in ("SNODE", "INODE"):
            primary_owner = self.node.node_information.get("primary_owner")
            current_owner = self.node.node_information.get("current_owner")
            return primary_owner != current_owner

        # Default to locked if the node type is unknown
        return True

    def is_confer_locked(self):
        """Checks if a node is locked for confer purposes."""
        node_type = self.node.xnode_Type
        print(f"Checking confer lock for Node Type: {node_type}")

        # VNODE is ** locked** for confer
        if node_type == "VNODE":
            return True  

        # INODE: Locked if primary_owner not equals to current_owner
        if node_type in ("SNODE", "INODE"):
            primary_owner = self.node.node_information.get("primary_owner")
            current_owner = self.node.node_information.get("current_owner")
            return primary_owner != current_owner

        # Default to locked if the node type is unknown
        return True


 ### This is the end of the NodeLockChecker class definition.


def compute_terms_status(terms_value):
    count_T = 0
    count_F = 0
    count_R = 0
    filled = 0
    empty = 0

    if terms_value:
        filtered_terms = {
            key: value
            for key, value in terms_value.items()
            if key != "canShareMoreData"
        }

        for key, value in filtered_terms.items():
            value = value.strip()
            if value.endswith("; T") or value.endswith(";T"):
                count_T += 1
            elif value.endswith("; F") or value.endswith(";F"):
                count_F += 1
            elif value.endswith("; R") or value.endswith(";R"):
                count_R += 1

            stripped_value = (
                value.rstrip("; T")
                .rstrip(";T")
                .rstrip("; F")
                .rstrip(";F")
                .rstrip("; R")
                .rstrip(";R")
                .strip()
            )
            if stripped_value:
                filled += 1
            else:
                empty += 1

        total_terms = count_T + count_F + count_R
        if total_terms > 0:
            empty = total_terms - filled
    else:
        total_terms = 0
        empty = 0
        filled = 0

    return {
        "count_T": count_T,
        "count_F": count_F,
        "count_R": count_R,
        "empty": empty,
        "filled": filled,
    }


def append_xnode_provenance(
    xnode_instance,
    connection_id,
    from_locker,
    to_locker,
    from_user,
    to_user,
    type_of_share,
    xnode_post_conditions,
    reverse
):
    """
    Appends a full snapshot of the Xnode_V2 instance to the provenance stack.
    """
    xnode = Xnode_V2.objects.get(id=xnode_instance.id)
    # Serialize the full model instance as a dictionary
    # serialized_data = json.loads(serializers.serialize("json", [xnode_instance]))[0]["fields"]

    new_entry = {
        "connection": connection_id,
        "from_locker": from_locker,
        "to_locker": to_locker,
        "from_user": from_user,
        "to_user": to_user,
        "type_of_share": type_of_share,
        "xnode_id": xnode_instance.id,
        "xnode_post_conditions": xnode_post_conditions,
        # "xnode_snapshot": serialized_data,  # 💾 Full snapshot here
        "reverse": reverse
    }

    if not isinstance(xnode.provenance_stack, list):
        xnode.provenance_stack = []

    xnode.provenance_stack.append(new_entry)
    xnode.save(update_fields=["provenance_stack"])


def remove_xnode_provenance_entry(
    xnode_instance,
    connection_id,
    from_locker,
    to_locker,
    from_user,
    to_user,
    xnode_id,
    type_of_share
):
    xnode = Xnode_V2.objects.get(id=xnode_instance)
    xnode.refresh_from_db()
    # Ensure the provenance_stack is a list
    if not isinstance(xnode.provenance_stack, list):
        # print(error)
        return  # or raise error if needed

    # Define match criteria
    def is_matching_entry(entry):
        print("Parameters:", connection_id, from_locker, to_locker, from_user, to_user, type_of_share, xnode_id)
        print("Checking entry:", entry)

        try:
            match = (
                int(entry.get("connection")) == int(connection_id) and
                int(entry.get("from_locker")) == int(from_locker) and
                int(entry.get("to_locker")) == int(to_locker) and
                int(entry.get("from_user")) == int(from_user) and
                int(entry.get("to_user")) == int(to_user) and
                entry.get("type_of_share") == type_of_share and
                int(entry.get("xnode_id")) == int(xnode_id)
            )

            print("Match result:", match)
            return match

        except Exception as e:
            print(f"Error in matching: {e}")
            return False


    original_len = len(xnode.provenance_stack)
    xnode.provenance_stack = [
        entry for entry in xnode.provenance_stack
        if not is_matching_entry(entry)
    ]
    print(f"Removed {original_len - len(xnode.provenance_stack)} entries")

    xnode.save(update_fields=["provenance_stack"])
    xnode.refresh_from_db()
    print("Updated provenance_stack:", xnode.provenance_stack)
