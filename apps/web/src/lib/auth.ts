import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: any) {
  try {
    console.log("🔄 Attempting to refresh access token...");

    const url = "https://oauth2.googleapis.com/token";
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: params,
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in ?? 3600) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined, // Clear any previous errors
    };
  } catch (error: any) {
    console.error("💥 Refresh token error:", error);

    // If it's an invalid_grant error, the refresh token is no longer valid
    // We should clear the session to force re-authentication
    if (error?.error === "invalid_grant") {
      return {
        ...token,
        accessToken: undefined,
        refreshToken: undefined,
        accessTokenExpires: 0,
        error: "RefreshAccessTokenError",
      };
    }

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    // Reduce session max age to 24 hours instead of default 30 days
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        console.log("🔐 New OAuth token received");
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Check if we have a refresh token before attempting refresh
      if (!token.refreshToken) {
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;

      // Log session state for debugging
      console.log("📋 Session callback:", {
        hasAccessToken: !!session.accessToken,
        hasError: !!session.error,
        error: session.error,
      });

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
