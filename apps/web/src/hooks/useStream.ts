import { StreamingClient } from "@/lib/StreamingClient";
import { StreamConfig, StreamServerCallbacks, StreamStatus } from "@/types/streaming";
import { useCallback, useEffect, useRef, useState } from "react";

export function useStream(serverUrl: string = "ws://localhost:8080") {
  const [status, setStatus] = useState<StreamStatus>(StreamStatus.DISCONNECTED);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamClientRef = useRef<StreamingClient | null>(null);

  const callbacks: StreamServerCallbacks = {
    onConnected: () => {
      setStatus(StreamStatus.CONNECTED);
      setError(null);
    },
    onStreamStarted: () => {
      setStatus(StreamStatus.STREAMING);
      setError(null);
    },
    onError: (error) => {
      setError(error);
      setStatus(StreamStatus.ERROR);
    },
    onDisconnected: () => {
      setStatus(StreamStatus.DISCONNECTED);
      setSessionId(null);
      setError(null);
    },
    onConfigUpdate: (id, config) => {
      setSessionId(id);
      setStatus(StreamStatus.CONNECTED);
      setError(null);
      console.log(`Stream config updated for session ${id}:`, config);
    },
  };

  useEffect(() => {
    streamClientRef.current = new StreamingClient(serverUrl, callbacks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  const connect = useCallback(async (): Promise<void> => {
    if (!streamClientRef.current) {
      console.error("Streaming client is not initialized");
      return;
    }
    try {
      await streamClientRef.current.connect();
    } catch (error) {
      console.error("Failed to connect to streaming server:", error);
    }
  }, []);

  const disconnect = useCallback((): void => {
    if (streamClientRef.current) {
      streamClientRef.current.disconnect();
    }
  }, []);

  const configureStream = useCallback((config: StreamConfig): boolean => {
    if (streamClientRef.current) {
      return streamClientRef.current.configureStream(config);
    } else {
      console.error("Streaming client is not initialized");
      return false;
    }
  }, []);

  const startStream = useCallback((): boolean => {
    if (streamClientRef.current) {
      return streamClientRef.current.startStream();
    } else {
      console.error("Streaming client is not initialized");
      return false;
    }
  }, []);

  const stopStream = useCallback((): boolean => {
    if (streamClientRef.current) {
      return streamClientRef.current.stopStream();
    } else {
      console.error("Streaming client is not initialized");
      return false;
    }
  }, []);

  const sendStreamData = useCallback((data: Blob): void => {
    if (streamClientRef.current) {
      streamClientRef.current.sendData(data);
    } else {
      console.error("Streaming client is not initialized");
    }
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    client: streamClientRef.current,
    status,
    sessionId,
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
