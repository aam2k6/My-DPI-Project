# from rest_framework import serializers
# from .models import CustomUser, Locker, Connection, Resource, ConnectionType, ConnectionTerms, Snode, Vnode


# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = CustomUser
#         fields = ["user_id", "username", "description", "user_type"]


# class LockerSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Locker
#         fields = ["locker_id", "name", "description", "user", "is_frozen"]


# class ConnectionSerializer(serializers.ModelSerializer):
#     host_user = UserSerializer(many=False, read_only=True)
#     guest_user = UserSerializer(many=False, read_only=True)
#     host_locker = LockerSerializer(many=False, read_only=True)
#     guest_locker = LockerSerializer(many=False, read_only=True)

#     class Meta:
#         model = Connection
#         fields = ["connection_id", "connection_name", "connection_type", "host_locker", "guest_locker",
#                   "host_user", "guest_user", "connection_description", "requester_consent", "revoke_host",
#                   "revoke_guest", "validity_time", "created_time", "is_frozen", "terms_value", "resources"]


# class ResourceSerializer(serializers.ModelSerializer):
#     connections = ConnectionSerializer(many=True, read_only=True)

#     class Meta:
#         model = Resource
#         fields = ["resource_id", "document_name", "i_node_pointer", "locker", "version", "connections", "owner", "type"]


# class SnodeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Snode
#         fields = ["resource", "host_locker", "guest_locker", "operator_constraints"]


# class VnodeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Vnode
#         fields = ["resource_id", "host_locker", "guest_locker", "connection", "operator_constraints"]


# class ConnectionTypeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ConnectionType
#         fields = ["connection_type_id", "connection_type_name", "connection_description", "owner_user", "owner_locker",
#                   "validity_time", "created_time"]


# class ConnectionTermsSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ConnectionTerms
#         fields = ["terms_id", "conn_type", "modality", "data_element_name", "data_type", "sharing_type", "description",
#                   "host_permissions"]


# class ConnectionFilterSerializer(serializers.ModelSerializer):
#     host_user = UserSerializer(many=False, read_only=True)
#     guest_user = UserSerializer(many=False, read_only=True)
#     host_locker = LockerSerializer(many=False, read_only=True)
#     guest_locker = LockerSerializer(many=False, read_only=True)

#     class Meta:
#         model = Connection
#         fields = ["connection_id", "connection_name", "connection_type", "host_locker", "guest_locker",
#                   "host_user", "guest_user", "validity_time", "is_frozen"]

from rest_framework import serializers
from .models import (
    CustomUser,
    Locker,
    Connection,
    Resource,
    ConnectionType,
    ConnectionTerms,
    Snode,
    Vnode,
    GlobalConnectionTypeTemplate,
    ConnectionTypeRegulationLinkTable,
)
from .models import (
    CustomUser,
    Locker,
    Connection,
    Resource,
    ConnectionType,
    ConnectionTerms,
    Snode,
    Vnode,
    GlobalConnectionTypeTemplate,
    ConnectionTypeRegulationLinkTable,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["user_id", "username", "description", "user_type"]


class LockerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locker
        fields = ["locker_id", "name", "description", "user", "is_frozen"]


class ConnectionSerializer(serializers.ModelSerializer):
    host_user = UserSerializer(many=False, read_only=True)
    guest_user = UserSerializer(many=False, read_only=True)
    host_locker = LockerSerializer(many=False, read_only=True)
    guest_locker = LockerSerializer(many=False, read_only=True)

    class Meta:
        model = Connection
        fields = [
            "connection_id",
            "connection_name",
            "connection_type",
            "host_locker",
            "guest_locker",
            "host_user",
            "guest_user",
            "connection_description",
            "requester_consent",
            "revoke_host",
            "revoke_guest",
            "validity_time",
            "created_time",
            "is_frozen",
            "terms_value",
            "resources",
        ]
        fields = [
            "connection_id",
            "connection_name",
            "connection_type",
            "host_locker",
            "guest_locker",
            "host_user",
            "guest_user",
            "connection_description",
            "requester_consent",
            "revoke_host",
            "revoke_guest",
            "validity_time",
            "created_time",
            "is_frozen",
            "terms_value",
            "resources",
        ]


class ResourceSerializer(serializers.ModelSerializer):
    connections = ConnectionSerializer(many=True, read_only=True)

    class Meta:
        model = Resource
        fields = [
            "resource_id",
            "document_name",
            "i_node_pointer",
            "locker",
            "version",
            "connections",
            "owner",
            "type",
        ]
        fields = [
            "resource_id",
            "document_name",
            "i_node_pointer",
            "locker",
            "version",
            "connections",
            "owner",
            "type",
        ]


class SnodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Snode
        fields = ["resource", "host_locker", "guest_locker", "operator_constraints"]


class VnodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vnode
        fields = [
            "resource",
            "host_locker",
            "guest_locker",
            "connection",
            "operator_constraints",
            "vnode_id"
        ]
        depth = 1
        fields = [
            "resource",
            "host_locker",
            "guest_locker",
            "connection",
            "operator_constraints",
            "vnode_id"
        ]
        depth = 1


class ConnectionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionType
        fields = [
            "connection_type_id",
            "connection_type_name",
            "connection_description",
            "owner_user",
            "owner_locker",
            "validity_time",
            "created_time",
        ]
        fields = [
            "connection_type_id",
            "connection_type_name",
            "connection_description",
            "owner_user",
            "owner_locker",
            "validity_time",
            "created_time",
        ]


class ConnectionTermsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionTerms
        fields = [
            "terms_id",
            "conn_type",
            "global_conn_type",
            "modality",
            "data_element_name",
            "data_type",
            "sharing_type",
            "description",
            "host_permissions",
        ]
        fields = [
            "terms_id",
            "conn_type",
            "global_conn_type",
            "modality",
            "data_element_name",
            "data_type",
            "sharing_type",
            "description",
            "host_permissions",
        ]


class ConnectionFilterSerializer(serializers.ModelSerializer):
    host_user = UserSerializer(many=False, read_only=True)
    guest_user = UserSerializer(many=False, read_only=True)
    host_locker = LockerSerializer(many=False, read_only=True)
    guest_locker = LockerSerializer(many=False, read_only=True)

    class Meta:
        model = Connection
        fields = [
            "connection_id",
            "connection_name",
            "connection_type",
            "host_locker",
            "guest_locker",
            "host_user",
            "guest_user",
            "validity_time",
            "is_frozen",
        ]


class GlobalConnectionTypeTemplatePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalConnectionTypeTemplate
        exclude = ["global_connection_type_template_id"]
        depth = 1


class GlobalConnectionTypeTemplateGetSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalConnectionTypeTemplate
        fields = "__all__"
        depth = 1


class ConnectionTypeRegulationLinkTablePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionTypeRegulationLinkTable
        exclude = ["link_Id"]
        depth = 1


class ConnectionTypeRegulationLinkTableGetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionTypeRegulationLinkTable
        fields = "__all__"
        depth = 1