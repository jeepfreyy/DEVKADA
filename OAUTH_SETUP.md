# Google Calendar OAuth Setup Guide

## Quick Steps for OAuth User Account

### Step 1: Extract Credentials from Your JSON File

Open your downloaded OAuth JSON file. It should look like this:

```json
{
  "web": {
    "client_id": "123456789-abc123.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "GOCSPX-your-secret-here",
    "redirect_uris": ["http://localhost:3000/api/auth/google/callback"]
  }
}
```

### Step 2: Add to `.env.local`

Add these three values from your JSON file:

```env
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**Note:** 
- `client_id` comes from `web.client_id` in your JSON
- `client_secret` comes from `web.client_secret` in your JSON
- `GOOGLE_REDIRECT_URI` should match what you set in Google Cloud Console

### Step 3: Get Your Refresh Token

1. Make sure your dev server is running: `npm run dev`
2. Open your browser and visit: **http://localhost:3000/api/auth/google**
3. You'll be redirected to Google to authorize the app
4. Click "Allow" to grant calendar access
5. You'll be redirected back and see a page with your **refresh token**
6. Copy the refresh token
7. Add it to your `.env.local`:
   ```env
   GOOGLE_REFRESH_TOKEN=your_refresh_token_here
   ```

### Step 4: Restart Your Server

After adding the refresh token, restart your dev server:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

### Step 5: Test It!

Try in the chat:
- "Schedule a meeting tomorrow at 2pm about the project"

The event should be created in your Google Calendar!

## Troubleshooting

### "No refresh token received"
- This happens if you've already authorized the app before
- Solution:
  1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
  2. Find your app and click "Remove access"
  3. Try the authorization flow again at `/api/auth/google`

### "Redirect URI mismatch"
- Make sure the redirect URI in Google Cloud Console matches exactly:
  - For local: `http://localhost:3000/api/auth/google/callback`
  - For production: `https://yourdomain.com/api/auth/google/callback`

### "Invalid credentials"
- Double-check that you copied `client_id` and `client_secret` correctly
- Make sure there are no extra spaces or quotes in `.env.local`

## What Each Field Does

- **`GOOGLE_CLIENT_ID`**: Identifies your app to Google
- **`GOOGLE_CLIENT_SECRET`**: Proves your app is authorized
- **`GOOGLE_REFRESH_TOKEN`**: Allows your app to get new access tokens (this is the key one!)
- **`GOOGLE_REDIRECT_URI`**: Where Google sends users after authorization

The refresh token is the most important - it lets your app access the calendar without user interaction after the first authorization.

