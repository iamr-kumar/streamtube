import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { useStream } from "@/hooks/useStream";
import { StreamConfig, StreamInfo } from "@/types/streaming";

interface StreamingOperationsConfig {
  streamInfo: StreamInfo | null;
  onStreamStarting: () => void;
  onStreamStarted: () => void;
  onStreamEnding: () => void;
  onStreamEnded: () => void;
  onError: (error: string) => void;
}

export const useStreamingOperations = ({
  streamInfo,
  onStreamStarting,
  onStreamStarted,
  onStreamEnding,
  onStreamEnded,
  onError,
}: StreamingOperationsConfig) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const { configureStream, startStream, stopStream, connect, sendData } = useStream();

  useEffect(() => {
    const connectToWebSocket = () => {
      connect().catch((error) => {
        console.error("Error connecting to WebSocket:", error);
      });
    };

    connectToWebSocket();
  }, []);

  const waitForYouTubeStreamToBeReady = useCallback(async (): Promise<boolean> => {
    if (!streamInfo?.broadcast?.id) {
      console.error("No broadcast ID available");
      return false;
    }

    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 3000; // 3 seconds
    const maxAttempts = Math.ceil(maxWaitTime / checkInterval);

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `/api/youtube/ready-check?broadcastId=${streamInfo.broadcast.id}`
        );
        const { message, canGoLive } = response.data;

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

        if (attempt < maxAttempts && axios.isAxiosError(error)) {
          console.log(`Retrying readiness check... (${attempt + 1}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
          continue;
        }

        console.error("Failed to check YouTube stream readiness after multiple attempts.");
        return false;
      }
    }
    return false;
  }, [streamInfo]);

  const transitionBroadcastToLive = useCallback(async (): Promise<boolean> => {
    if (!streamInfo?.broadcast?.id) {
      console.error("No broadcast ID available for transition");
      return false;
    }

    try {
      const response = await axios.post("/api/youtube/transition-stream", {
        broadcastId: streamInfo.broadcast.id,
      });
      return response.data.success;
    } catch (error) {
      console.error("Error transitioning broadcast:", error);
      return false;
    }
  }, [streamInfo]);

  const handleStartStream = useCallback(async (): Promise<void> => {
    if (!streamInfo) {
      throw new Error("No active stream found");
    }

    const streamConfig: StreamConfig = {
      rtmpUrl: streamInfo.stream.rtmpUrl,
      streamKey: streamInfo.stream.streamKey,
      resolution: { width: 1280, height: 720 },
      frameRate: 25,
      bitrate: 2500,
      audioSampleRate: 44100,
      audioChannels: 2,
    };

    try {
      // Configure the stream
      onStreamStarting();
      const sessionId = await configureStream(streamConfig);
      console.log("Stream configured with session ID:", sessionId);

      // Start the stream
      await startStream();
      console.log("Stream started successfully");
      setIsStreaming(true);

      // Wait for YouTube stream to be ready
      const streamIsReady = await waitForYouTubeStreamToBeReady();
      if (!streamIsReady) {
        throw new Error(
          "YouTube stream is not ready. Please ensure your connection is stable and try again."
        );
      }

      // Transition broadcast to live
      const transitionSuccess = await transitionBroadcastToLive();
      if (!transitionSuccess) {
        throw new Error("Failed to transition broadcast to live.");
      }
      onStreamStarted();

      console.log("Broadcast transitioned to live successfully");
    } catch (error) {
      console.error("Error in stream start process:", error);

      // Cleanup on error
      try {
        await stopStream();
        setIsStreaming(false);
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      onError(errorMessage);
      throw error;
    }
  }, [
    streamInfo,
    configureStream,
    startStream,
    stopStream,
    waitForYouTubeStreamToBeReady,
    transitionBroadcastToLive,
    onStreamStarting,
    onStreamStarted,
    onError,
  ]);

  const handleStopStream = useCallback(async (): Promise<void> => {
    try {
      onStreamEnding();
      await stopStream();
      setIsStreaming(false);
      onStreamEnded();
    } catch (error) {
      console.error("Error stopping stream:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      onError(errorMessage);
      throw error;
    }
  }, [stopStream, onStreamEnding, onStreamEnded, onError]);

  const sendDataOverWebSocket = useCallback(
    (data: Blob) => {
      sendData(data);
    },
    [sendData]
  );

  return {
    isStreaming,
    handleStartStream,
    handleStopStream,
    sendDataOverWebSocket,
  };
};
