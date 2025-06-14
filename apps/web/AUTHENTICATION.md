# NextAuth Configuration

This application uses NextAuth.js for authentication with Google OAuth provider.

## Setup Instructions

1. **Google OAuth Setup**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API and YouTube Data API v3
   - Go to "Credentials" and create a new "OAuth 2.0 Client ID"
   - Set the authorized redirect URI to: `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID and Client Secret

2. **Environment Variables**
   Create a `.env.local` file in the `apps/web` directory with:
   ```bash
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret-string
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

## Features

- Google OAuth authentication
- Session management
- YouTube API access scope included
- Automatic redirect to sign-in for protected routes
- Secure session storage

## Pages

- `/` - Home page with conditional sign-in/dashboard access
- `/auth/signin` - Sign-in page with Google OAuth
- `/studio` - Protected studio page (requires authentication)

## API Routes

- `/api/auth/[...nextauth]` - NextAuth.js API route handling all authentication

The application will redirect unauthenticated users trying to access protected routes to the sign-in page, and authenticated users will be redirected to the studio page after signing in.