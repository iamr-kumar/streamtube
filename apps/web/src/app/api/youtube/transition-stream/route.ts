import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { google, youtube_v3 } from "googleapis";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session or access token" },
        { status: 401 }
      );
    }

    // Check if there's a token refresh error
    if ((session as any).error === "RefreshAccessTokenError") {
      return NextResponse.json(
        { error: "Authentication expired. Please sign in again." },
        { status: 401 }
      );
    }

    const { broadcastId, status } = await request.json();

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: (session as any).accessToken,
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    let result;
    if (status === "live") {
      result = await handleTransitionToLive(broadcastId, youtube);
    } else if (status === "complete") {
      result = await handleTransitionToCompleted(broadcastId, youtube);
    } else {
      return NextResponse.json(
        { success: false, message: `Invalid status: ${status}. Use 'live' or 'complete'` },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error transitioning stream:", error);
    return NextResponse.json(
      { success: false, message: "Failed to transition stream" },
      { status: 500 }
    );
  }
}

const handleTransitionToLive = async (
  broadcastId: string,
  youtube: youtube_v3.Youtube
): Promise<{ success: boolean; message: string }> => {
  const broadcast = await youtube.liveBroadcasts.list({
    part: ["status"],
    id: [broadcastId],
  });

  const broadcastData = broadcast.data.items?.[0];
  if (!broadcastData) {
    throw new Error("Broadcast not found");
  }

  const currentStatus = broadcastData.status?.lifeCycleStatus;
  if (currentStatus === "live") {
    return { success: true, message: "Stream is already live" };
  }
  console.log(currentStatus);

  // First transition to testing if not already
  let nextStatus =
    currentStatus === "testing" || currentStatus === "testStarting" ? "live" : "testing";
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

  // Wait for 15 seconds for the transition to complete
  // This is a workaround for API inconsistencies
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // If we're not live yet, transition to live
  if (nextStatus !== "live") {
    nextStatus = "live";
    result = await youtube.liveBroadcasts.transition({
      part: ["status"],
      broadcastStatus: nextStatus,
      id: broadcastId,
    });
  }

  return { success: true, message: "Stream transitioned to live" };
};

const handleTransitionToCompleted = async (
  broadcastId: string,
  youtube: youtube_v3.Youtube
): Promise<{ success: boolean; message: string }> => {
  const broadcast = await youtube.liveBroadcasts.list({
    part: ["status"],
    id: [broadcastId],
  });

  const broadcastData = broadcast.data.items?.[0];
  if (!broadcastData) {
    throw new Error("Broadcast not found");
  }

  const currentStatus = broadcastData.status?.lifeCycleStatus;
  if (currentStatus === "complete") {
    return { success: true, message: "Stream is already completed" };
  }

  // Can only transition to complete from live status
  if (currentStatus !== "live") {
    throw new Error(
      `Cannot transition to complete from ${currentStatus}. Stream must be live first.`
    );
  }

  const result = await youtube.liveBroadcasts.transition({
    part: ["status"],
    broadcastStatus: "complete",
    id: broadcastId,
  });

  const newStatus = result.data.status?.lifeCycleStatus;
  if (!newStatus) {
    throw new Error(`Failed to transition broadcast ${broadcastId} to complete`);
  }

  console.log(`Broadcast ${broadcastId} transitioned to ${newStatus}`);

  return { success: true, message: "Stream transitioned to completed" };
};
