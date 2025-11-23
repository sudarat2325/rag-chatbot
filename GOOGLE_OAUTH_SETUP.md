# Google OAuth Setup Guide

This guide explains how to set up Google OAuth for the FoodHub application.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "FoodHub")
5. Click "CREATE"

### 2. Enable Google+ API

1. In your Google Cloud project, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "ENABLE"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Click "CREATE"
4. Fill in the required fields:
   - **App name**: FoodHub (or your app name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "SAVE AND CONTINUE"
6. Skip the "Scopes" section (click "SAVE AND CONTINUE")
7. Add test users if needed (for development)
8. Click "SAVE AND CONTINUE"

### 4. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: FoodHub Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:3001` (if you use a different port)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `http://localhost:3001/api/auth/callback/google`
5. Click "CREATE"
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret** that appear

### 5. Update Environment Variables

1. Open the `.env` file in your project root
2. Update the following lines with your credentials:

```env
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

3. Save the file

### 6. Restart the Development Server

```bash
npm run dev
```

## Testing Google Login

1. Go to `http://localhost:3000/login`
2. Click the "เข้าสู่ระบบด้วย Google" (Sign in with Google) button
3. You should be redirected to Google's login page
4. After successful login, you'll be redirected back to the food page (`/food`)

## Production Setup

For production deployment:

1. Add your production domain to:
   - **Authorized JavaScript origins**: `https://yourdomain.com`
   - **Authorized redirect URIs**: `https://yourdomain.com/api/auth/callback/google`

2. Update your `.env.production` file:

```env
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
```

3. Consider moving the OAuth consent screen from "Testing" to "In Production"

## Troubleshooting

### "redirect_uri_mismatch" Error

This means the redirect URI doesn't match what you configured in Google Cloud Console.

**Solution**: Make sure the redirect URI in Google Console exactly matches:
- `http://localhost:3000/api/auth/callback/google` (for local development)
- `https://yourdomain.com/api/auth/callback/google` (for production)

### "Access blocked: This app's request is invalid"

This usually happens when:
- The OAuth consent screen is not properly configured
- Required scopes are missing

**Solution**:
1. Go to OAuth consent screen in Google Console
2. Make sure all required information is filled in
3. Add test users if the app is in "Testing" mode

### User gets logged in but no data is saved

**Solution**:
1. Make sure MongoDB is running
2. Check that the Prisma schema is up to date: `npx prisma generate`
3. Check that the database is synced: `npx prisma db push`

### "Invalid client_id" Error

**Solution**:
1. Double-check that you copied the Client ID correctly
2. Make sure there are no extra spaces in the `.env` file
3. Restart your development server after changing `.env`

## Security Notes

⚠️ **Important Security Reminders**:

1. **Never commit `.env` to version control** - It contains sensitive credentials
2. **Use different credentials for development and production**
3. **Regularly rotate your client secret** in production
4. **Enable 2FA** on your Google Cloud account
5. **Monitor the OAuth usage** in Google Cloud Console

## Next Steps

After setting up Google OAuth:

1. Test the login flow thoroughly
2. Consider adding more OAuth providers (Facebook, GitHub, etc.)
3. Implement proper error handling for OAuth failures
4. Add user profile management
5. Consider implementing email verification for users who sign up without OAuth

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Prisma Adapter for NextAuth](https://authjs.dev/reference/adapter/prisma)
