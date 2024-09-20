import googleapiclient.discovery
from google.oauth2.credentials import Credentials

def get_gmail_emails():
    # Set up the Gmail API
    creds = Credentials.from_authorized_user_file('token.json', ['https://www.googleapis.com/auth/gmail.readonly'])
    service = googleapiclient.discovery.build('gmail', 'v1', credentials=creds)
    
    # Call the Gmail API to fetch the user's emails
    results = service.users().messages().list(userId='me', maxResults=10).execute()
    messages = results.get('messages', [])
    
    if not messages:
        print('No messages found.')
    else:
        print('Messages:')
        for message in messages:
            msg = service.users().messages().get(userId='me', id=message['id']).execute()
            print(msg['snippet'])