import { getServerSession } from "next-auth";
import { authOption } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import {
  StreamResponse,
  ApiErrorResult,
  StreamRequestBody,
  YouTubeStream,
  YouTubeError,
  PrivacyStatus,
  YouTubeBroadcast,
} from "@/types/streaming";

export async function POST(
  request: Request
): Promise<NextResponse<StreamResponse | ApiErrorResult>> {
  try {
    const session = await getServerSession(authOption);
    console.log(session?.accessToken);
    if (!session || !session.accessToken) {
      return NextResponse.json(
        {
          error: "You must be signed in to create a stream.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as StreamRequestBody;
    const { title, description, privacyStatus } = body;

    if (!title || !description || !privacyStatus) {
      return NextResponse.json(
        {
          error: "Title, description, and privacy status are required.",
        },
        { status: 400 }
      );
    }

    const broadcast = await createBroadcast(
      session.accessToken,
      title,
      description || `Live stream created on ${new Date().toLocaleDateString()}`,
      privacyStatus
    );

    if ("error" in broadcast) {
      return NextResponse.json({ error: broadcast.error }, { status: 500 });
    }

    const stream = await createStream(session.accessToken, title);

    if ("error" in stream) {
      return NextResponse.json({ error: stream.error }, { status: 500 });
    }

    const bindResult = await bindBroadcastToStream(session.accessToken, broadcast.id, stream.id);
    if ("error" in bindResult) {
      return NextResponse.json({ error: bindResult.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      broadcast: {
        id: broadcast.id,
        title: broadcast.snippet.title,
        description: broadcast.snippet.description,
        privacyStatus: broadcast.status.privacyStatus,
        url: `https://www.youtube.com/watch?v=${broadcast.id}`,
      },
      stream: {
        id: stream.id,
        title: stream.snippet.title,
        rtmpUrl: stream.cdn.ingestionInfo.ingestionAddress,
        streamKey: stream.cdn.ingestionInfo.streamName,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

async function createBroadcast(
  accessToken: string,
  title: string,
  description: string,
  privacyStatus: PrivacyStatus = PrivacyStatus.UNLISTED
): Promise<YouTubeBroadcast | ApiErrorResult> {
  try {
    const response = await axios.post(
      "https://youtube.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails",
      {
        snippet: {
          title,
          description,
          scheduledStartTime: new Date(Date.now() + 60000).toISOString(),
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: false,
        },
        contentDetails: {
          enableAutoStart: true,
          enableAutoStop: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    // TODO: Remove this console log in production
    if (axios.isAxiosError(error)) {
      // Log the full error response for debugging
      console.error("Axios Error Details:");
      console.error("Status:", error.response?.status);
      console.error("Status Text:", error.response?.statusText);

      // Log the complete response data
      console.error("Response Data:", JSON.stringify(error.response?.data, null, 2));

      // Log headers (may contain relevant info)
      console.error("Response Headers:", error.response?.headers);

      // Log the request that was made
      console.error("Request URL:", error.config?.url);
      console.error("Request Method:", error.config?.method);
      console.error("Request Headers:", error.config?.headers);

      if (error.response?.data?.error?.errors) {
        // Log each specific YouTube API error
        error.response.data.error.errors.forEach((err: any, index: number) => {
          console.error(`YouTube Error #${index + 1}:`, {
            domain: err.domain,
            reason: err.reason,
            message: err.message,
            location: err.location,
            locationType: err.locationType,
          });
        });
      }
    } else {
      console.error("Non-Axios Error:", error);
    }

    return { error: extractErrorMessage(error, "Failed to create a new broadcast") };
  }
}

async function createStream(
  accessToken: string,
  title: string
): Promise<YouTubeStream | ApiErrorResult> {
  try {
    const response = await axios.post(
      "https://youtube.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn",
      {
        snippet: {
          title,
          description: `Live stream created on ${new Date().toLocaleDateString()}`,
        },
        cdn: {
          frameRate: "30fps",
          ingestionType: "rtmp",
          resolution: "1080p",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating stream:", error);
    // TODO: Remove this console log in production
    if (axios.isAxiosError(error)) {
      // Log the full error response for debugging
      console.error("Axios Error Details:");
      console.error("Status:", error.response?.status);
      console.error("Status Text:", error.response?.statusText);

      // Log the complete response data
      console.error("Response Data:", JSON.stringify(error.response?.data, null, 2));

      // Log headers (may contain relevant info)
      console.error("Response Headers:", error.response?.headers);

      // Log the request that was made
      console.error("Request URL:", error.config?.url);
      console.error("Request Method:", error.config?.method);
      console.error("Request Headers:", error.config?.headers);

      if (error.response?.data?.error?.errors) {
        // Log each specific YouTube API error
        error.response.data.error.errors.forEach((err: any, index: number) => {
          console.error(`YouTube Error #${index + 1}:`, {
            domain: err.domain,
            reason: err.reason,
            message: err.message,
            location: err.location,
            locationType: err.locationType,
          });
        });
      }
    } else {
      console.error("Non-Axios Error:", error);
    }
    return { error: extractErrorMessage(error, "Failed to create a new stream") };
  }
}

async function bindBroadcastToStream(
  accessToken: string,
  broadcastId: string,
  streamId: string
): Promise<YouTubeBroadcast | ApiErrorResult> {
  try {
    console.log("Binding broadcast to stream:", { broadcastId, streamId });

    // According to the API docs, id and streamId should be URL parameters, not in the body
    const response = await axios.post(
      `https://youtube.googleapis.com/youtube/v3/liveBroadcasts/bind?part=id,contentDetails,snippet,status&id=${broadcastId}&streamId=${streamId}`,
      null,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Successfully bound broadcast to stream:", response.data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating bound:", error);
    // TODO: Remove this console log in production
    if (axios.isAxiosError(error)) {
      // Log the full error response for debugging
      console.error("Axios Error Details:");
      console.error("Status:", error.response?.status);
      console.error("Status Text:", error.response?.statusText);

      // Log the complete response data
      console.error("Response Data:", JSON.stringify(error.response?.data, null, 2));

      // Log headers (may contain relevant info)
      console.error("Response Headers:", error.response?.headers);

      // Log the request that was made
      console.error("Request URL:", error.config?.url);
      console.error("Request Method:", error.config?.method);
      console.error("Request Headers:", error.config?.headers);

      if (error.response?.data?.error?.errors) {
        // Log each specific YouTube API error
        error.response.data.error.errors.forEach((err: any, index: number) => {
          console.error(`YouTube Error #${index + 1}:`, {
            domain: err.domain,
            reason: err.reason,
            message: err.message,
            location: err.location,
            locationType: err.locationType,
          });
        });
      }
    } else {
      console.error("Non-Axios Error:", error);
    }
    return { error: extractErrorMessage(error, "Failed to bind stream to broadcast") };
  }
}

function extractErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<YouTubeError>;
    if (axiosError.response && axiosError.response.data) {
      const youtubeError = axiosError.response.data as YouTubeError;
      return youtubeError.error.message || fallbackMessage;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }
  return fallbackMessage;
}

function handleApiError(error: unknown): NextResponse<ApiErrorResult> {
  console.error("API Error:", error);

  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<YouTubeError>;
    const status = axiosError.response?.status;

    // Authentication errors
    if (status === 401) {
      return NextResponse.json(
        { error: "Authentication failed. Please sign in again." },
        { status: 401 }
      );
    }

    // Permission errors
    if (status === 403) {
      return NextResponse.json(
        {
          error:
            "YouTube API access denied. Please ensure live streaming is enabled on your YouTube channel.",
        },
        { status: 403 }
      );
    }

    // Other HTTP errors
    if (status) {
      return NextResponse.json(
        {
          error:
            axiosError.response?.data?.error?.message ||
            `YouTube API error (${status}): ${axiosError.message}`,
        },
        { status }
      );
    }

    // Network errors
    return NextResponse.json(
      { error: "Network error when connecting to YouTube API." },
      { status: 500 }
    );
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}
