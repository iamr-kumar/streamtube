import { useState, useEffect } from "react";
import { StreamInfo } from "@/types/streaming";

export const useStreamInfo = () => {
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);

  useEffect(() => {
    const activeStream = localStorage.getItem("activeStream");
    if (activeStream) {
      try {
        const streamData: StreamInfo = JSON.parse(activeStream);
        setStreamInfo(streamData);
      } catch (error) {
        console.error("Failed to parse active stream data:", error);
        localStorage.removeItem("activeStream");
      }
    }
  }, []);

  const clearStreamInfo = () => {
    setStreamInfo(null);
    localStorage.removeItem("activeStream");
  };

  return {
    streamInfo,
    setStreamInfo,
    clearStreamInfo,
  };
};
