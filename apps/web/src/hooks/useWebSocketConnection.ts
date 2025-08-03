import { useEffect } from "react";
import { useStream } from "@/hooks/useStream";

export const useWebSocketConnection = () => {
  const { status, connect, sendData } = useStream();

  useEffect(() => {
    const connectToWebSocket = async () => {
      try {
        await connect();
        console.log("WebSocket connected successfully");
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
      }
    };

    connectToWebSocket();
  }, [connect]);

  return {
    status,
    sendData,
  };
};
