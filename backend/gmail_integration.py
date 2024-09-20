import googleapiclient.discovery
from google.oauth2 import service_account

def get_gmail_emails():
    SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
    SERVICE_ACCOUNT_FILE = 'path/to/credentials.json'
    
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    
    service = googleapiclient.discovery.build('gmail', 'v1', credentials=credentials)
    results = service.users().messages().list(userId='me', labelIds=['INBOX']).execute()
    messages = results.get('messages', [])

    return messages

def send_email_notification(to_email, subject, body):
    # Example implementation
    print(f"Sending email to {to_email} with subject '{subject}' and body '{body}'")
    # Implement actual email sending logic here
    pass