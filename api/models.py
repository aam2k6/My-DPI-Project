from django.db import models
from django.utils import timezone

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
    description = models.TextField(blank=True, null=True, default=None)  # Allow description to be optional
    #creation_date = models.CharField(max_length=100)    
    user = models.ForeignKey(User, on_delete=models.CASCADE)        #user will be the one logged in 

    def __str__(self):
        return self.name
    
class Connection_type(models.Model):
    type_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=100)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='connection_type_owner')
    locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='connection_type_locker')
    validity = models.CharField(max_length=30)
    created =  models.CharField(max_length=30)

class Connection(models.Model):
    connection_id = models.AutoField(primary_key=True)
    connection_name = models.CharField(max_length=100)
    conn_type_id = models.ForeignKey(Connection_type, on_delete=models.CASCADE, related_name='connection_type', default=None)
    #access_norm = models.ForeignKey(Agreement, on_delete=models.CASCADE, related_name='access_norm', default=None)
    #connection_norm = models.JSONField()
    #access_token = models.CharField(max_length=20, unique=True, default=None)
    source_locker = models.ForeignKey(Locker, on_delete = models.CASCADE, related_name='source_locker')
    target_locker = models.ForeignKey(Locker, on_delete = models.CASCADE, related_name='target_locker')
    source_user = models.ForeignKey(User, on_delete = models.CASCADE, related_name='source_user')
    target_user = models.ForeignKey(User, on_delete = models.CASCADE, related_name='target_user')
    conn_desc = models.CharField(max_length=100)
    requester_consent = models.BooleanField(default=True)
    revoke1 = models.BooleanField(default=True)
    revoke2 = models.BooleanField(default=True)
    validity = models.CharField(max_length=30, default=None)
    created =  models.CharField(max_length=30, default=None)

    def __str__(self):
        return self.connection_name

class Resource(models.Model):
    PUBLIC = 'public'
    PRIVATE = 'private'
    TYPE_CHOICES =[
        (PUBLIC,'Public'),
        (PRIVATE,'Private')
    ]
    resource_id = models.AutoField(primary_key=True)
    document_name = models.CharField(max_length= 50)
    i_node_pointer = models.CharField(max_length=255, default='none')
    locker = models.ForeignKey(Locker, on_delete=models.CASCADE)
    version = models.CharField(max_length=20, default='none')
    connections = models.ManyToManyField(Connection, related_name='connection') 
    owner = models.ForeignKey(User, on_delete = models.CASCADE)
    type = models.CharField(max_length=7, choices=TYPE_CHOICES, default=PRIVATE)

    def __str__(self):
        return self.document_name