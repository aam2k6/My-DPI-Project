from django.db import models
from django.utils import timezone
from datetime import timedelta


# Create your models here.
class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    description = models.CharField(max_length=200, default=None)
    username = models.CharField(max_length=30)

    def __str__(self):
        return self.username


class Locker(models.Model):
    locker_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=30)
    description = models.TextField(blank=True, null=True)  # Allow description to be optional
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # User will be the one logged in

    def __str__(self):
        return self.name


class ConnectionType(models.Model):
    connection_type_id = models.AutoField(primary_key=True)
    connection_type_name = models.CharField(max_length=50)
    connection_description = models.TextField(blank=True, null=True)
    owner_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owner_user')
    owner_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='owner_locker')
    validity_time = models.DateTimeField(
        default=lambda: timezone.now() + timedelta(days=7))  # Validity is set for 7 days from now by default.
    created_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.connection_type_name


class Connection(models.Model):
    connection_id = models.AutoField(primary_key=True)
    connection_name = models.CharField(max_length=100)
    connection_type_id = models.ForeignKey(ConnectionType, on_delete=models.CASCADE, related_name='connection_type')
    source_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='source_locker')
    target_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='target_locker')
    source_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='source_user')
    target_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='target_user')
    connection_description = models.TextField(blank=True, null=True)
    requester_consent = models.BooleanField(default=False)
    revoke_source = models.BooleanField(default=False)
    revoke_target = models.BooleanField(default=False)
    validity_time = models.DateTimeField(
        default=lambda: timezone.now() + timedelta(days=7))  # Validity is set for 7 days from now by default.
    created_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.connection_name


class Resource(models.Model):
    PUBLIC = 'public'
    PRIVATE = 'private'
    TYPE_CHOICES = [
        (PUBLIC, 'Public'),
        (PRIVATE, 'Private')
    ]
    resource_id = models.AutoField(primary_key=True)
    document_name = models.CharField(max_length=50)
    i_node_pointer = models.CharField(max_length=255, default='none')
    locker = models.ForeignKey(Locker, on_delete=models.CASCADE)
    version = models.CharField(max_length=20, default='none')
    connections = models.ManyToManyField(Connection, related_name='connection')
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=7, choices=TYPE_CHOICES, default=PRIVATE)

    def __str__(self):
        return self.document_name

class ConnectionTerms(models.Model):
    MODALITY_CHOICES = [
        ('obligatory', 'Obligatory'),
        ('permissive', 'Permissive'),
        ('forbidden', 'Forbidden')
    ]
    terms_id=models.AutoField(primary_key=True)
    conn_type=models.ForeignKey(ConnectionType,on_delete=models.CASCADE)
    modality=models.CharField(max_length=50,choices=MODALITY_CHOICES)
    data_element_name=models.CharField(max_length=50)
    data_type=models.CharField(max_length=50)
    sharing_type=models.CharField(max_length=50)
    description=models.TextField(blank=True,null=True)

    def __str__(self):
        return f"{self.modality} - {self.data_element_name}"
