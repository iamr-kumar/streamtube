import { useState, useEffect, useCallback, useRef } from "react";
import { StreamingWebSocketClient } from "@/lib/streaming-client";
import { StreamConfig, StreamStatus, StreamStats, StreamServerCallbacks } from "@/types/streaming";

interface UseStreamingReturn {
  client: StreamingWebSocketClient | null;
  status: StreamStatus;
  sessionId: string | null;
  stats: StreamStats | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  configureStream: (config: StreamConfig) => boolean;
  startStream: () => boolean;
  stopStream: () => boolean;
  sendStreamData: (data: ArrayBuffer) => boolean;
  clearError: () => void;
}

export function useStreaming(serverUrl: string = "ws://localhost:8080"): UseStreamingReturn {
  const [status, setStatus] = useState<StreamStatus>("disconnected");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<StreamingWebSocketClient | null>(null);

  // Create callbacks for the WebSocket client
  const callbacks: StreamServerCallbacks = {
    onConnected: () => {
      setStatus("connected");
      setError(null);
    },
    onDisconnected: () => {
      setStatus("disconnected");
      setSessionId(null);
      setStats(null);
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
      setStatus("error");
    },
    onStreamStarted: (id: string) => {
      setSessionId(id);
      setStatus("streaming");
      setError(null);
    },
    onStreamStopped: () => {
      setStatus("configured");
      setStats(null);
    },
    onStreamStats: (streamStats: StreamStats) => {
      setStats(streamStats);
    },
    onConfigured: (id: string, config: StreamConfig) => {
      setSessionId(id);
      setStatus("configured");
      setError(null);
      console.log("Stream configured:", config);
    },
  };

  // Initialize client
  useEffect(() => {
    clientRef.current = new StreamingWebSocketClient(serverUrl, callbacks);

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [serverUrl]);

  const connect = useCallback(async (): Promise<void> => {
    if (!clientRef.current) {
      throw new Error("Client not initialized");
    }

    try {
      await clientRef.current.connect();
    } catch (error) {
      console.error("Failed to connect:", error);
      throw error;
    }
  }, []);

  const disconnect = useCallback((): void => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  const configureStream = useCallback((config: StreamConfig): boolean => {
    if (!clientRef.current) {
      setError("Client not initialized");
      return false;
    }

    return clientRef.current.configureStream(config);
  }, []);

  const startStream = useCallback((): boolean => {
    if (!clientRef.current) {
      setError("Client not initialized");
      return false;
    }

    return clientRef.current.startStream();
  }, []);

  const stopStream = useCallback((): boolean => {
    if (!clientRef.current) {
      setError("Client not initialized");
      return false;
    }

    return clientRef.current.stopStream();
  }, []);

  const sendStreamData = useCallback((data: ArrayBuffer): boolean => {
    if (!clientRef.current) {
      console.warn("Client not initialized");
      return false;
    }

    return clientRef.current.sendStreamData(data);
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    client: clientRef.current,
    status,
    sessionId,
    stats,
    error,
    connect,
    disconnect,
    configureStream,
    startStream,
    stopStream,
    sendStreamData,
    clearError,
  };
}
