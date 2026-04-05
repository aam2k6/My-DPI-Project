# This file maintains all the cron jobs that have to performed in the project.
from django.utils import timezone
from api.models import Connection


def check_connections_valid_until():
    now = timezone.now()
    expired_connections = Connection.objects.filter(validity_time__lt=now)
    count, _ = expired_connections.delete()
    print(f"Deleted {count} expired connections.")
