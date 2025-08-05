import { StreamingClient } from "@/lib/StreamingClient";
import { StreamConfig, StreamServerCallbacks, StreamStatus } from "@/types/streaming";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStreamInfo } from "./useStreamInfo";
import axios from "axios";

interface StreamActions {
  onStreamStarting: () => void;
  onStreamStarted: () => void;
  onStreamEnding: () => void;
  onStreamEnded: () => void;
  onStreamError: (error: string) => void;
}

export function useStream({
  url = "ws://localhost:8080",
  actions,
}: {
  url?: string;
  actions: StreamActions;
}) {
  const [status, setStatus] = useState<StreamStatus>(StreamStatus.DISCONNECTED);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamClientRef = useRef<StreamingClient | null>(null);
  const { streamInfo, clearStreamInfo } = useStreamInfo();
  const { onStreamStarting, onStreamStarted, onStreamEnding, onStreamEnded, onStreamError } =
    actions;

  useEffect(() => {
    const connectToWebSocket = async () => {
      try {
        await connect();
        console.log("WebSocket connected successfully");
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
      }
    };
    streamClientRef.current = new StreamingClient(url, callbacks);
    connectToWebSocket();
  }, []);

  const callbacks: StreamServerCallbacks = {
    onConnected: () => {
      setStatus(StreamStatus.CONNECTED);
      console.log("WebSocket connected");
      setError(null);
    },
    onStreamStarted: () => {
      setStatus(StreamStatus.STREAMING);
      setError(null);
    },
    onConfigUpdate: (sessionId, config) => {
      setSessionId(sessionId);
      setStatus(StreamStatus.CONFIGURED);
      setError(null);
      console.log("Stream configuration updated:", config);
    },
    onStreamStopped: () => {
      setStatus(StreamStatus.CONNECTED);
      setSessionId(null);
      console.log("Stream stopped");
    },
    onDisconnected: () => {
      setStatus(StreamStatus.DISCONNECTED);
      console.log("WebSocket disconnected");
    },
    onError: (error) => {
      setStatus(StreamStatus.ERROR);
      setError(error);
      console.error("WebSocket error:", error);
    },
  };

  const connect = useCallback(async (): Promise<void> => {
    if (!streamClientRef.current) {
      console.error("Streaming client is not initialized");
      return;
    }
    try {
      await streamClientRef.current.connect();
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
    }
  }, []);

  const disconnect = useCallback((): void => {
    if (streamClientRef.current) {
      streamClientRef.current.disconnect();
      setSessionId(null);
      setStatus(StreamStatus.DISCONNECTED);
      console.log("WebSocket disconnected");
    }
  }, []);

  const configureStream = useCallback(async (config: StreamConfig): Promise<string> => {
    if (!streamClientRef.current) {
      throw new Error("Streaming client is not initialized");
    }
    try {
      const sessionId = await streamClientRef.current.configureStream(config);
      return sessionId;
    } catch (error) {
      console.error("Error configuring stream:", error);
      throw error;
    }
  }, []);

  const startStream = useCallback(async (): Promise<void> => {
    if (!streamClientRef.current) {
      throw new Error("Streaming client is not initialized");
    }
    try {
      await streamClientRef.current.startStream();
    } catch (error) {
      console.error("Error starting stream:", error);
      throw error;
    }
  }, []);

  const stopStream = useCallback(async (): Promise<void> => {
    if (!streamClientRef.current) {
      throw new Error("Streaming client is not initialized");
    }
    try {
      await streamClientRef.current.stopStream();
    } catch (error) {
      console.error("Error stopping stream:", error);
      throw error;
    }
  }, []);

  const sendData = useCallback((data: Blob) => {
    if (!streamClientRef.current) {
      console.error("Streaming client is not initialized");
      return;
    }
    try {
      streamClientRef.current.sendData(data);
    } catch (error) {
      console.error("Error sending data to WebSocket:", error);
    }
  }, []);

  const handleStartStream = async () => {
    if (!streamInfo) {
      console.error("No active stream found");
      return;
    }
    console.log(status);

    const streamConfig: StreamConfig = {
      rtmpUrl: streamInfo.stream.rtmpUrl,
      streamKey: streamInfo.stream.streamKey,
      resolution: { width: 1280, height: 720 },
      frameRate: 25,
      bitrate: 2500,
      audioSampleRate: 44100,
      audioChannels: 2,
    };
    onStreamStarting();
    try {
      // Configure the stream
      const sessionId = await configureStream(streamConfig);
      console.log("Stream configured with session ID:", sessionId);

      // Start the stream
      await startStream();
      console.log("Stream started successfully");

      // Start sending data and wait for YouTube stream to be ready
      const streamIsReady = await waitForYouTubeStreamToBeReady();

      if (!streamIsReady) {
        throw new Error(
          "YouTube stream is not ready. Please ensure your connection is stable and try again."
        );
      }

      const transitionSuccess = await transitionBroadcastStatus("live");
      if (!transitionSuccess) {
        throw new Error("Failed to transition broadcast to live.");
      }

      console.log("Broadcast transitioned to live successfully");
      onStreamStarted();
    } catch (error) {
      console.error("Error in stream start process:", error);

      // Attempt to clean up on error
      try {
        await stopStream();
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      onStreamError(`Failed to start stream: ${errorMessage}`);
    }
  };

  const waitForYouTubeStreamToBeReady = async (): Promise<boolean> => {
    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 3000; // 3 seconds
    const maxAttempts = Math.ceil(maxWaitTime / checkInterval);

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `/api/youtube/ready-check?broadcastId=${streamInfo?.broadcast.id}`
        );
        const { message, canGoLive, broadcastReady } = response.data;

        console.log("YouTube stream readiness check:", message);

        if (canGoLive) {
          return true;
        }

        if (attempt < maxAttempts) {
          console.log(`Waiting for YouTube stream to be ready... (${attempt + 1}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
        }
      } catch (error) {
        console.error("Error checking YouTube stream readiness:", error);

        // If attempts still remaining, wait and retry
        if (attempt < maxAttempts && axios.isAxiosError(error)) {
          console.log(`Retrying readiness check... (${attempt + 1}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
          continue;
        }

        // Break if attempts exhausted or error is not recoverable
        console.error("Failed to check YouTube stream readiness after multiple attempts.");
        return false;
      }
    }
    return false; // If we reach here, it means the stream is not ready
  };

  const transitionBroadcastStatus = async (status: "live" | "complete"): Promise<boolean> => {
    try {
      const response = await axios.post("/api/youtube/transition-stream", {
        broadcastId: streamInfo?.broadcast.id,
        status,
      });
      if (response.data.success) {
        return true;
      }
    } catch (error) {
      console.error("Error transitioning broadcast:", error);
    }
    return false;
  };

  const handleStopStream = async () => {
    try {
      onStreamEnding();
      await stopStream();
      // transition broadcast status to complete
      await transitionBroadcastStatus("complete");
      console.log("Stream stopped successfully");
      localStorage.removeItem("activeStream");
      onStreamEnded();
    } catch (error) {
      console.error("Error stopping stream:", error);
    }
  };

  return {
    status,
    sessionId,
    error,
    connect,
    configureStream,
    startStream,
    stopStream,
    disconnect,
    sendData,
    handleStartStream,
    handleStopStream,
  };
}
