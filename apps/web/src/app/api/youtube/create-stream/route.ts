import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import {
  ApiErrorResult,
  CreateBroadcastRequest,
  StreamInfo,
  PrivacyStatus,
} from "@/types/streaming";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest
): Promise<NextResponse<StreamInfo | ApiErrorResult>> {
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
    const body: CreateBroadcastRequest = await request.json();
    const { title, description, privacyStatus } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Stream title is required" }, { status: 400 });
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
          privacyStatus: privacyStatus || PrivacyStatus.UNLISTED,
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

    return NextResponse.json<StreamInfo>({
      success: true,
      broadcast: {
        id: broadcastId,
        title: title.trim(),
        description: description || "",
        privacyStatus: privacyStatus || PrivacyStatus.UNLISTED,
        url: `https://www.youtube.com/watch?v=${broadcastId}`,
      },
      stream: {
        id: streamId,
        title: `${title.trim()} - Stream`,
        rtmpUrl: rtmpUrl,
        streamKey: streamKey,
      },
    });
  } catch (error: unknown) {
    console.error("Error creating YouTube stream:", error);

    // Handle specific YouTube API errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = (error as { code?: number })?.code;

    if (errorCode === 403) {
      return NextResponse.json(
        {
          error:
            "YouTube API access denied. Please ensure live streaming is enabled on your YouTube channel.",
        },
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
