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
    description = models.TextField(blank=True, null=True)  # Allow description to be optional
    #creation_date = models.CharField(max_length=100)    
    user = models.ForeignKey(User, on_delete=models.CASCADE)        #user will be the one logged in 

    def __str__(self):
        return self.name

class Agreement(models.Model):
    agreement_id = models.AutoField(primary_key=True)
    agreement_text = models.JSONField()
    
    signee1 = models.ForeignKey(User, on_delete= models.CASCADE, related_name='signee1')
    signee2 = models.ForeignKey(User, on_delete= models.CASCADE, related_name='signee2')

    consent1 = models.BooleanField(default=False)
    consent2 = models.BooleanField(default=False)
    revoke1 = models.BooleanField(default=False)
    revoke2 = models.BooleanField(default=False)

    validity = models.DateTimeField(default=timezone.now)
    created = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.agreement_text

class Connection(models.Model):
    connection_id = models.AutoField(primary_key=True)
    connection_name = models.CharField(max_length=100)
    access_norm = models.ForeignKey(Agreement, on_delete=models.CASCADE)
    #connection_norm = models.JSONField()
    access_token = models.CharField(max_length=20, unique=True, default=None)
    source_locker = models.ForeignKey(Locker, on_delete = models.CASCADE, related_name='source_locker')
    target_locker = models.ForeignKey(Locker, on_delete = models.CASCADE, related_name='target_locker')
    source_user = models.ForeignKey(User, on_delete = models.CASCADE, related_name='source_user')
    target_user = models.ForeignKey(User, on_delete = models.CASCADE, related_name='target_user')

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

class Snode(models.Model):
    snode_name = models.CharField(max_length=30, default='test')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    source_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='snode_source_locker')
    target_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='snode_target_locker')
    operator_constraints = models.JSONField()

    def __str__(self):
        return self.snode_name

class Vnode(models.Model):
    vnode_name = models.CharField(max_length=30, default='test')
    resource_id = models.ForeignKey(Resource, on_delete=models.CASCADE)
    source_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='vnode_source_locker')
    target_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='vnode_target_locker')
    connection = models.ManyToManyField(Connection, related_name='vnode_connection')  
    operator_constraints = models.JSONField()

    def __str__(self):
        return self.vnode_name
