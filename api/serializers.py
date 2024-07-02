from rest_framework import serializers
from .models import User, Locker, Connection, Resource, ConnectionType, ConnectionTerms, Snode, Vnode


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["user_id", "username", "description"]


class LockerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locker
        fields = ["locker_id", "name", "description", "user"]


class ConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Connection
        fields = ["connection_id", "connection_name", "connection_type_id", "source_locker", "target_locker",
                  "source_user", "target_user", "connection_description", "requester_consent", "revoke_source",
                  "revoke_target", "validity_time", "created_time"]


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ["resource_id", "document_name", "i_node_pointer", "locker", "version", "connections", "owner", "type"]


class SnodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Snode
        fields = ["resource", "source_locker", "target_locker", "operator_constraints"]


class VnodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vnode
        fields = ["resource_id", "source_locker", "target_locker", "connection", "operator_constraints"]


class ConnectionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionType
        fields = ["connection_type_id", "connection_type_name", "connection_description", "owner_user", "owner_locker",
                  "validity_time", "created_time"]


class ConnectionTermsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionTerms
        fields = ["terms_id", "conn_type", "modality", "data_element_name", "data_type", "sharing_type", "description"]
