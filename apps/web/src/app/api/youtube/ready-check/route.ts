import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const broadcastId = searchParams.get("broadcastId");

    if (!broadcastId) {
      return NextResponse.json({ error: "Broadcast ID required" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: (session as any).accessToken,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Get broadcast info
    const broadcastResponse = await youtube.liveBroadcasts.list({
      part: ["status", "contentDetails"],
      id: [broadcastId],
    });

    const broadcast = broadcastResponse.data.items?.[0];
    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    const broadcastStatus = broadcast.status?.lifeCycleStatus;
    const boundStreamId = broadcast.contentDetails?.boundStreamId;

    let streamActive = false;
    let streamHealthy = false;

    // Check stream if bound
    if (boundStreamId) {
      const streamResponse = await youtube.liveStreams.list({
        part: ["status"],
        id: [boundStreamId],
      });

      const stream = streamResponse.data.items?.[0];
      if (stream) {
        streamActive = stream.status?.streamStatus === "active";
        streamHealthy = ["good", "ok"].includes(stream.status?.healthStatus?.status || "");
      }
    }

    const broadcastReady =
      broadcastStatus === "ready" || broadcastStatus === "testing" || broadcastStatus === "live";
    const streamReady = streamActive && streamHealthy;
    const canGoLive = broadcastReady && streamReady;

    let message = "Checking...";
    if (canGoLive) {
      message = "Ready to go live!";
    } else if (!broadcastReady) {
      message = "Broadcast not ready";
    } else if (!streamActive) {
      message = "Waiting for stream data";
    } else if (!streamHealthy) {
      message = "Stream quality issues";
    }

    console.log(`Broadcast status: ${broadcastStatus}`);
    console.log(`Stream active: ${streamActive}, Healthy: ${streamHealthy}`);

    return NextResponse.json({
      canGoLive,
      broadcastReady,
      streamReady,
      message,
      details: {
        broadcastStatus,
        streamActive,
        streamHealthy,
      },
    });
  } catch (error: any) {
    console.error("YouTube readiness check error:", error);

    if (error.code === 403) {
      return NextResponse.json({ error: "YouTube API access denied" }, { status: 403 });
    }
    if (error.code === 401) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to check readiness" }, { status: 500 });
  }
}
