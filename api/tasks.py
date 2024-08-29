# This file maintains all the cron jobs that have to performed in the project.
from django.utils import timezone
from api.models import Connection, Resource


def check_connections_valid_until():
    now = timezone.now()
    expired_connections = Connection.objects.filter(validity_time__lt=now)
    count, _ = expired_connections.delete()
    print(f"Deleted {count} expired connections.")


def transfer_resource_Cron_Job():
    connections = Connection.objects.all()
    for connection in connections:
        for key, value in connection.terms_value.items():
            host_user = connection.host_user
            host_locker = connection.host_locker
            if "; T" in value:
                doc_path = value.split("; T")[0].strip()
                print(f"Document path: {doc_path}")

                # Find the i_node_pointer from the resource list
                try:
                    resource = Resource.objects.get(i_node_pointer=doc_path)
                    if resource.owner == host_user:
                        print("Transfer already happened!!")
                        return
                    resource.owner = host_user
                    resource.locker = host_locker
                    resource.save()
                except Resource.DoesNotExist:
                    print(f"Resource with i_node_pointer {doc_path} does not exist.")
