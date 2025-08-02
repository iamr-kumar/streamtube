import { StreamingClient } from "@/lib/StreamingClient";
import { StreamConfig, StreamServerCallbacks, StreamStatus } from "@/types/streaming";
import { useCallback, useEffect, useRef, useState } from "react";

export function useStream(url: string = "ws://localhost:8080") {
  const [status, setStatus] = useState<StreamStatus>(StreamStatus.DISCONNECTED);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamClientRef = useRef<StreamingClient | null>(null);

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

  useEffect(() => {
    streamClientRef.current = new StreamingClient(url, callbacks);
  }, [url]);

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
  };
}
