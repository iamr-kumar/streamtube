import { useState, useEffect } from "react";
import { StreamInfo } from "@/types/streaming";

/**
 * Custom hook for managing active stream information persistence in localStorage.
 * Handles stream data retrieval, storage, and cleanup operations.
 */
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

  /**
   * Clears stream information from state and localStorage.
   */
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
