import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Define auth options inline to match the configuration in [...nextauth]/route.ts
const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Use type assertion to add accessToken to session
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export async function POST(request: NextRequest) {
  try {
    // Get the session to access the user's access token
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session or access token" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { title, description, privacy } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Stream title is required" },
        { status: 400 }
      );
    }

    // Set up YouTube API client with the user's access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: (session as any).accessToken,
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    // Create a live broadcast
    const broadcastResponse = await youtube.liveBroadcasts.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: title.trim(),
          description: description || "",
          scheduledStartTime: new Date().toISOString(),
        },
        status: {
          privacyStatus: privacy || "unlisted",
        },
      },
    });

    const broadcastId = broadcastResponse.data.id;

    if (!broadcastId) {
      throw new Error("Failed to create broadcast - no broadcast ID returned");
    }

    // Create a live stream
    const streamResponse = await youtube.liveStreams.insert({
      part: ["snippet", "cdn"],
      requestBody: {
        snippet: {
          title: `${title.trim()} - Stream`,
          description: description || "",
        },
        cdn: {
          frameRate: "30fps",
          ingestionType: "rtmp",
          resolution: "720p",
        },
      },
    });

    const streamId = streamResponse.data.id;
    const streamKey = streamResponse.data.cdn?.ingestionInfo?.streamName;
    const rtmpUrl = streamResponse.data.cdn?.ingestionInfo?.ingestionAddress;

    if (!streamId || !streamKey || !rtmpUrl) {
      throw new Error("Failed to create stream - missing stream details");
    }

    // Bind the stream to the broadcast
    await youtube.liveBroadcasts.bind({
      part: ["id"],
      id: broadcastId,
      streamId: streamId,
    });

    return NextResponse.json({
      success: true,
      broadcastId,
      streamId,
      streamKey,
      rtmpUrl,
    });

  } catch (error: unknown) {
    console.error("Error creating YouTube stream:", error);
    
    // Handle specific YouTube API errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = (error as { code?: number })?.code;
    
    if (errorCode === 403) {
      return NextResponse.json(
        { error: "YouTube API access denied. Please ensure live streaming is enabled on your YouTube channel." },
        { status: 403 }
      );
    }
    
    if (errorCode === 401) {
      return NextResponse.json(
        { error: "Authentication failed. Please sign in again." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: errorMessage || "Failed to create YouTube stream" },
      { status: 500 }
    );
  }
}