import { StreamingClient } from "@/lib/StreamingClient";
import { StreamServerCallbacks, StreamStatus } from "@/types/streaming";
import { useCallback, useEffect, useRef, useState } from "react";

export function useStream(url: string = "ws://localhost:8080") {
  const [status, setStatus] = useState<StreamStatus>(StreamStatus.DISCONNECTED);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const streamClientRef = useRef<StreamingClient | null>(null);

  const callbacks: StreamServerCallbacks = {
    onConnected: () => {
      setStatus(StreamStatus.CONNECTED);
      console.log("WebSocket connected");
    },
    onDisconnected: () => {
      setStatus(StreamStatus.DISCONNECTED);
      console.log("WebSocket disconnected");
    },
    onError: (error) => {
      setStatus(StreamStatus.ERROR);
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
    connect,
    sendData,
  };
}
