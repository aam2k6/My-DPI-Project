from django.utils import timezone
from datetime import timedelta
from api.model.xnode_model import Xnode_V2
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from datetime import timedelta
from django.utils import timezone
from allauth.socialaccount.models import SocialApp
from api.models import GoogleAuthToken
import requests
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from allauth.socialaccount.models import SocialToken

from django.http import  Http404, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseServerError
from googleapiclient.errors import HttpError
import io
import tempfile
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload
import json
import os
import tempfile
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials as GoogleCredentials
from google.oauth2.credentials import Credentials
from django.db import transaction



#for drive permissions adding
def add_drive_permission(owner_token, file_id, target_email, role="reader"):
    """
    Adds a permission to a Google Drive file.
    owner_token: The OAuth access token of the file owner (string)
    file_id: The Google Drive file ID (string)
    target_email: The email to share with (string)
    role: "reader" (view only) or "writer" (edit)
    """
    creds = Credentials(token=owner_token)
    service = build('drive', 'v3', credentials=creds)
    permission = {
        'type': 'user',
        'role': role,
        'emailAddress': target_email,
    }
    try:
        service.permissions().create(
            fileId=file_id,
            body=permission,
            sendNotificationEmail=False  # Set True to notify user by email
        ).execute()
        return True
    except Exception as e:
        print(f"Error adding permission: {e}")
        return 
    
#function to make drive file public  
def make_drive_file_public(owner_user, file_id):
    """
    Converts a Google Drive file to:
    Anyone with the link → Reader
    """

    # Step 1: Get a valid owner access token
    owner_token = get_or_refresh_google_token(owner_user)
    if not owner_token:
        raise Exception("Could not obtain a valid Google token for the file owner.")

    creds = Credentials(token=owner_token)
    service = build('drive', 'v3', credentials=creds)

    # Check if permission already exists
    try:
        permissions = service.permissions().list(fileId=file_id).execute()
        for p in permissions.get("permissions", []):
            if p["type"] == "anyone":
                print("File is already public.")
                return True
    except Exception as e:
        print("Error checking permissions:", e)

    # Create new "anyone with link" permission
    permission = {
        "type": "anyone",
        "role": "reader",
    }

    try:
        service.permissions().create(
            fileId=file_id,
            body=permission,
            sendNotificationEmail=False
        ).execute()
        print("Public permission applied successfully.")
        return True

    except Exception as e:
        print(f"Error making file public: {e}")
        raise Exception(f"Drive permission error: {e}")

    
#function to get the google token from the database
def get_google_token(user):
    """
    Retrieves the Google access token for a given user from the database.
    """
    try:
        token_obj = GoogleAuthToken.objects.get(user=user)
        return token_obj.access_token
    except GoogleAuthToken.DoesNotExist:
        print("No GoogleAuthToken found for user:", user.email)
        return None

#get the valid access_token using refreshtoken
def get_or_refresh_google_token(user):
    """
    Returns a valid Google access token for a given user.
    If expired, it refreshes the token and updates the DB.
    """
    now = timezone.now()
    try:
        token_obj = GoogleAuthToken.objects.get(user=user)
    except GoogleAuthToken.DoesNotExist:
        print("No GoogleAuthToken found for user:", user.email)
        return None

    #  If token is still valid
    if token_obj.expires_at and token_obj.expires_at > now:
        return token_obj.access_token

    #  No refresh token
    if not token_obj.refresh_token:
        print("No refresh token found. Re-authentication required.")
        return None

    #  Refresh the token
    try:
        social_app = SocialApp.objects.get(provider='google')
    except SocialApp.DoesNotExist:
        print("Google OAuth app not configured in admin.")
        return None

    refresh_response = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'client_id': social_app.client_id,
            'client_secret': social_app.secret,
            'refresh_token': token_obj.refresh_token,
            'grant_type': 'refresh_token',
        }
    )

    if refresh_response.status_code != 200:
        print("Failed to refresh token:", refresh_response.json())
        return None

    new_tokens = refresh_response.json()
    token_obj.access_token = new_tokens['access_token']
    token_obj.expires_at = now + timedelta(seconds=new_tokens.get('expires_in', 3600))
    token_obj.save()

    return token_obj.access_token

#function to check if user has access to a drive file
def user_has_drive_access(owner_user, file_id, requester_email, requester_user):
    """
    Determines whether the requester has access to a Google Drive file.

    Logic:
    1. If requester is the file owner → always has access.
    2. Try to check via Drive API (using requester's token).
    3. If requester has no direct Drive permission → fallback to owner's token.
    """

    # Case 1: Owner always has access
    if requester_email == owner_user.email:
        print(f" Owner access confirmed for {requester_email}")
        return True, "Requester is the owner (full access)."

    #  Case 2: Try with requester's token
    print("requester_user =", requester_user, "type:", type(requester_user))

    requester_token = get_or_refresh_google_token(requester_user)
    if requester_token:
        try:
            creds = Credentials(token=requester_token)
            drive_service = build('drive', 'v3', credentials=creds)

            drive_service.files().get(
                fileId=file_id,
                fields='id',
                supportsAllDrives=True
            ).execute()

            print(f" File access confirmed for requester {requester_email}")
            return True, "Requester has direct Drive access."

        except HttpError as error:
            if error.resp.status in [403, 404]:
                print(f" Requester lacks direct access ({error.resp.status}). Falling back to owner's token.")
            else:
                return False, f"Drive API error: {error}"
        except Exception as e:
            print(f" Unexpected error using requester token: {e}")

    # Case 3: Fallback — Try owner's token (shared access via consent)
    print(f"Attempting fallback using owner's token for {requester_email}")
    owner_token = get_or_refresh_google_token(owner_user)
    if not owner_token:
        return False, "Error fetching valid owner token — access restricted."

    try:
        creds = Credentials(token=owner_token)
        drive_service = build('drive', 'v3', credentials=creds)

        drive_service.files().get(
            fileId=file_id,
            fields='id',
            supportsAllDrives=True
        ).execute()

        print(f"Access granted via owner's token for requester {requester_email}")
        return True, "Access granted via owner's shared consent."

    except HttpError as error:
        if error.resp.status == 403:
            return False, "Access denied even via owner token (403 Forbidden)."
        if error.resp.status == 404:
            return False, "File not found (404 Not Found)."
        return False, f"Drive API error via owner token: {error}"

    except Exception as e:
        return False, f"Unexpected error while using owner's token: {e}"



#for transferring drive file ownership

# akshar
TEMP_DIR = tempfile.gettempdir()

def try_transfer_ownership_via_permission(drive_service, file_id, new_owner_email):
    """Attempts to transfer ownership to another Google account."""
    body = {
        "type": "user",
        "role": "owner",
        "emailAddress": new_owner_email,
    }
    try:
        return drive_service.permissions().create(
            fileId=file_id,
            body=body,
            transferOwnership=True,
            fields="id"
        ).execute()
    except HttpError as e:
        print("Ownership transfer failed:", e)
        raise

def download_file_to_temp(drive_service, file_id, dest_path):
    """Downloads a Drive file to local temporary storage."""
    request = drive_service.files().get_media(fileId=file_id)
    with io.FileIO(dest_path, "wb") as fh:
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
            print(f"Download progress: {int(status.progress() * 100)}%" if status else "Starting...")

def upload_file_from_temp(drive_service, dest_folder_id, src_path, name, mimetype=None):
    """Uploads a file from temp storage to Drive."""
    metadata = {"name": name}
    if dest_folder_id:
        metadata["parents"] = [dest_folder_id]
    media = MediaIoBaseUpload(io.FileIO(src_path, "rb"), mimetype or "application/octet-stream", resumable=True)
    return drive_service.files().create(body=metadata, media_body=media, fields="id, mimeType").execute()

def delete_drive_file(drive_service, file_id):
    """Deletes a file from Drive."""
    try:
        drive_service.files().delete(fileId=file_id).execute()
        return True
    except HttpError as e:
        print(f"Delete failed: {e}")
        return False

def get_file_metadata(drive_service, file_id):
    """Fetches minimal metadata of a Drive file."""
    return drive_service.files().get(fileId=file_id, fields="id, name, mimeType, owners").execute()

#for transfer and collateral helpers

DRIVE_API_SCOPES = ["https://www.googleapis.com/auth/drive"]
TEMP_DIR = tempfile.gettempdir()



# Helper: build drive service from access token
def get_drive_service_from_token(access_token):
    creds = Credentials(token=access_token)
    return build("drive", "v3", credentials=creds)



def _drive_copy_return_new_file_id(resource_obj, sender_user, receiver_user, receiver_locker):
    print("\n========== DRIVE COPY START ==========")

    if not resource_obj or not getattr(resource_obj, "i_node_pointer", None):
        print("Resource has no drive file id")
        raise Exception("Resource has no drive file id")

    old_file_id = resource_obj.i_node_pointer
    print("Old file ID:", old_file_id)

    # --------------------------------
    # Tokens
    # --------------------------------
    sender_token = get_or_refresh_google_token(sender_user)
    receiver_token = get_or_refresh_google_token(receiver_user)

    if not sender_token:
        raise Exception("Sender Google token unavailable")
    if not receiver_token:
        raise Exception("Receiver Google token unavailable")

    print("Tokens ready")

    sender_drive = get_drive_service_from_token(sender_token)
    receiver_drive = get_drive_service_from_token(receiver_token)
    print("Drive services created")

    # --------------------------------
    # Metadata
    # --------------------------------
    meta = get_file_metadata(sender_drive, old_file_id)
    name = meta.get("name") or resource_obj.document_name or f"resource_{resource_obj.resource_id}"
    mimetype = meta.get("mimeType")

    print("File:", name)
    print("MIME:", mimetype)

    # --------------------------------
    # Temp file
    # --------------------------------
    ext = os.path.splitext(name)[1]
    temp_path = os.path.join(
        TEMP_DIR,
        f"transfer_{resource_obj.resource_id}_{int(timezone.now().timestamp())}{ext}"
    )
    print("Temp path:", temp_path)

    try:
        # Download
        print("Downloading...")
        download_file_to_temp(sender_drive, old_file_id, temp_path)
        print("Download done")

        # Resolve destination folder
        dest_folder_id = None
        if hasattr(receiver_locker, "drive_folder_id"):
            dest_folder_id = receiver_locker.drive_folder_id
        elif hasattr(receiver_locker, "drive_folder"):
            dest_folder_id = receiver_locker.drive_folder
        elif hasattr(receiver_locker, "folder_id"):
            dest_folder_id = receiver_locker.folder_id
        elif hasattr(receiver_locker, "node_information"):
            dest_folder_id = receiver_locker.node_information.get("drive_folder_id")

        print("Upload destination:", dest_folder_id or "ROOT")

        # Upload
        print("Uploading...")
        upload_resp = upload_file_from_temp(
            receiver_drive,
            dest_folder_id,
            temp_path,
            name,
            mimetype
        )
        print("Upload response:", upload_resp)

        new_file_id = upload_resp.get("id")
        if not new_file_id:
            raise Exception("Upload failed")

        # Delete original (best-effort)
        print("Deleting original (best-effort)...")
        delete_drive_file(sender_drive, old_file_id)
        print("Delete Done")

        print("========== DRIVE COPY SUCCESS ==========")

        return {
            "new_file_id": new_file_id,
            "new_mime": upload_resp.get("mimeType"),
            "name": name,
        }

    except Exception as e:
        print("DRIVE COPY FAILED:", e)
        import traceback
        traceback.print_exc()
        raise

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                print("Temp file removed")
            except Exception as e:
                print("Temp cleanup failed:", e)

