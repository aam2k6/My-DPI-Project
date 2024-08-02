from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone
from datetime import timedelta

class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        """
        Creates and saves a User with the given email and password.
        """
        if not username:
            raise ValueError('The username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given username and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, **extra_fields)


class CustomUser(AbstractBaseUser):
    SYS_ADMIN = 'system_admin'
    MODERATOR = 'moderator'
    USER = 'user'
    TYPE_CHOICES = [(SYS_ADMIN, 'System Admin'), (MODERATOR, 'Moderator'), (USER, 'User')]
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=200, default=None)
    user_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=USER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_login = models.DateTimeField(blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'

    def __str__(self):
        return self.username


class Locker(models.Model):
    locker_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=30)
    description = models.TextField(blank=True, null=True, default=None)  # Allow description to be optional
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)  # user will be the one logged in
    is_frozen = models.BooleanField(default=False)


    def __str__(self):
        return self.name


def default_validity_time():
    return timezone.now() + timedelta(days=7)


class ConnectionType(models.Model):
    connection_type_id = models.AutoField(primary_key=True)
    connection_type_name = models.CharField(max_length=50)
    connection_description = models.TextField(blank=True, null=True)
    owner_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='owner_user')
    owner_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='owner_locker')
    created_time = models.DateTimeField(auto_now_add=True)
    validity_time = models.DateTimeField(default=default_validity_time)

    def __str__(self):
        return self.connection_type_name


class Connection(models.Model):
    connection_id = models.AutoField(primary_key=True)
    connection_name = models.CharField(max_length=100)
    connection_type = models.ForeignKey(ConnectionType, on_delete=models.CASCADE, related_name='connection_type')
    host_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='host_locker')
    guest_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='guest_locker')
    host_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='host_user')
    guest_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='guest_user')
    connection_description = models.TextField(blank=True, null=True)
    requester_consent = models.BooleanField(default=False)
    revoke_host = models.BooleanField(default=False)
    revoke_guest = models.BooleanField(default=False)
    is_frozen = models.BooleanField(default=False)
    resources = models.JSONField(default=dict)
    terms_value = models.JSONField(default=dict)
    validity_time = models.DateTimeField(default=default_validity_time)
    created_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.connection_name


class Resource(models.Model):
    PUBLIC = 'public'
    PRIVATE = 'private'
    TYPE_CHOICES = [(PUBLIC, 'Public'), (PRIVATE, 'Private')]
    resource_id = models.AutoField(primary_key=True)
    document_name = models.CharField(max_length=50)
    i_node_pointer = models.CharField(max_length=255, default='none')
    locker = models.ForeignKey(Locker, on_delete=models.CASCADE)
    version = models.CharField(max_length=20, default='none')
    connections = models.ManyToManyField(Connection, related_name='connection')
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    type = models.CharField(max_length=7, choices=TYPE_CHOICES, default=PRIVATE)

    def __str__(self):
        return self.document_name


class ConnectionTerms(models.Model):
    MODALITY_CHOICES = [('obligatory', 'Obligatory'), ('permissive', 'Permissive'), ('forbidden', 'Forbidden')]
    terms_id = models.AutoField(primary_key=True)
    conn_type = models.ForeignKey(ConnectionType, on_delete=models.CASCADE)
    modality = models.CharField(max_length=50, choices=MODALITY_CHOICES, default='obligatory')
    data_element_name = models.CharField(max_length=50)
    host_permissions = models.JSONField(default=list)
    data_type = models.CharField(max_length=50)
    sharing_type = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.modality} - {self.data_element_name}"


class Vnode(models.Model):
    vnode_id = models.AutoField(primary_key=True)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    guest_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='vnode_guest_locker')
    host_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='vnode_host_locker')
    connection = models.ForeignKey(Connection, on_delete=models.CASCADE)
    operator_constraints = models.JSONField(default=dict)

    def __str__(self):
        return self.vnode_id


class Snode(models.Model):
    snode_id = models.AutoField(primary_key=True)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    host_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='snode_host_locker')
    guest_locker = models.ForeignKey(Locker, on_delete=models.CASCADE, related_name='snode_guest_locker')
    operator_constraints = models.JSONField(default=dict)

    def __str__(self):
        return self.snode_id


class GlobalConnectionTypeTemplate(models.Model):
    connection_Type_Template_Id = models.AutoField(primary_key=True)
    connection_Type_Name = models.CharField(max_length=200, default="Test type name")
    connection_Type_Description = models.CharField(max_length=200, default="test type description")

class ConnectionTypeRegulationLinkTable(models.Model):
    link_Id = models.AutoField(primary_key=True)
    connection_Type_Id = models.ForeignKey(to=ConnectionType, on_delete=models.CASCADE, null=True)
    conection_Template_Id = models.ForeignKey(to=GlobalConnectionTypeTemplate, on_delete=models.CASCADE, null=True)