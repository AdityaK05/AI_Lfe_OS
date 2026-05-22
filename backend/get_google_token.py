import os
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# Scopes required for Gmail and Calendar
SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
]

def main():
    print("Welcome to the Google Auth Token Generator!")
    print("------------------------------------------")
    print("You will need a 'credentials.json' file downloaded from the Google Cloud Console.")
    print("Place it in this backend folder before continuing.\n")
    
    if not os.path.exists("credentials.json"):
        print("ERROR: 'credentials.json' not found in the backend folder.")
        print("Please follow the instructions in the chat to download it, then run this script again.")
        return

    flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
    
    # This will open a browser window for you to log in
    print("Opening browser for authentication...")
    creds = flow.run_local_server(port=0)

    print("\n✅ Authentication Successful! Copy the following lines into your backend/.env file:\n")
    print("--------------------------------------------------")
    print(f"GOOGLE_CLIENT_ID={creds.client_id}")
    print(f"GOOGLE_CLIENT_SECRET={creds.client_secret}")
    print(f"GOOGLE_ACCESS_TOKEN={creds.token}")
    print(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}")
    print("--------------------------------------------------")

if __name__ == '__main__':
    main()
