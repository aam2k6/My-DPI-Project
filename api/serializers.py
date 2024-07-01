from rest_framework import serializers
from .models import User, Locker, Connection, Resource, Connection_type

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["user_id","username"]

class LockerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locker
        fields = ["locker_id","name","description","user"]

# class AgreementSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Agreement
#         fields = ["agreement_id","agreement_text","signee1","signee2"]

class ConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Connection
        fields = ["connection_name","connection_norm","access_norm","source_locker","target_locker","source_user","target_user"]

class ResourceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Resource
        fields = ["resource_id", "document_name", "i_node_pointer", "locker", "version", "connections", "owner", "type"] 

# class SnodeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Snode
#         fields = ["resource","source_locker","target_locker","operator_constraints"]

# class VnodeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Snode
#         fields = ["resource_id","source_locker","target_locker","connection","operator_constraints"]

class ConnectionTypeSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Connection_type
        fields = ["type_id","name", "description", "owner", "locker", "validity", "created"]