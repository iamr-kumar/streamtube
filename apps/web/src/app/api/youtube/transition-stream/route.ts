import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session or access token" },
        { status: 401 }
      );
    }

    const { broadcastId } = await request.json();

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: (session as any).accessToken,
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const broadcast = await youtube.liveBroadcasts.list({
      part: ["status"],
      id: [broadcastId],
    });
    const broadcastData = broadcast.data.items?.[0];
    if (!broadcastData) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }
    const currentStatus = broadcastData.status?.lifeCycleStatus;
    let nextStatus = currentStatus === "testing" ? "live" : "testing";
    let result = await youtube.liveBroadcasts.transition({
      part: ["status"],
      broadcastStatus: nextStatus,
      id: broadcastId,
    });

    const newStatus = result.data.status?.lifeCycleStatus;
    if (!newStatus) {
      throw new Error(`Failed to transition broadcast ${broadcastId} to status ${nextStatus}`);
    }
    console.log(`Broadcast ${broadcastId} transitioned to ${newStatus}`);
    // set timeout for 10 seconds and wait
    await new Promise((resolve) => setTimeout(resolve, 10000));

    if (nextStatus !== "live") {
      nextStatus = "live";
      result = await youtube.liveBroadcasts.transition({
        part: ["status"],
        broadcastStatus: nextStatus,
        id: broadcastId,
      });
    }

    console.log("Transition successful:");

    return NextResponse.json(
      { success: true, message: "Stream transitioned to live" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error transitioning stream:", error);
    return NextResponse.json(
      { success: false, message: "Failed to transition stream" },
      { status: 500 }
    );
  }
}
