import { useState, useEffect } from "react";
import { VIDEO_CONFIG } from "../lib/constants";

interface MediaConfig {
  cameraEnabled: boolean;
  screenEnabled: boolean;
  micEnabled: boolean;
}

interface MediaStreams {
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
  micStream: MediaStream | null;
}

/**
 * Custom hook for managing media device access and stream lifecycle.
 * Handles camera, screen sharing, and microphone stream acquisition and cleanup.
 */
export const useMediaDevices = ({ cameraEnabled, screenEnabled, micEnabled }: MediaConfig) => {
  const [streams, setStreams] = useState<MediaStreams>({
    cameraStream: null,
    screenStream: null,
    micStream: null,
  });

  useEffect(() => {
    if (cameraEnabled) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: VIDEO_CONFIG.CAMERA.WIDTH,
            height: VIDEO_CONFIG.CAMERA.HEIGHT,
            frameRate: VIDEO_CONFIG.CAMERA.FRAME_RATE,
          },
        })
        .then((stream) => {
          setStreams((prev) => ({ ...prev, cameraStream: stream }));
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
        });
    } else {
      setStreams((prev) => {
        if (prev.cameraStream) {
          prev.cameraStream.getTracks().forEach((track) => track.stop());
        }
        return { ...prev, cameraStream: null };
      });
    }
  }, [cameraEnabled]);

  useEffect(() => {
    if (screenEnabled) {
      navigator.mediaDevices
        .getDisplayMedia({
          video: {
            width: VIDEO_CONFIG.SCREEN.WIDTH,
            height: VIDEO_CONFIG.SCREEN.HEIGHT,
            frameRate: VIDEO_CONFIG.SCREEN.FRAME_RATE,
          },
          audio: true,
        })
        .then((stream) => {
          setStreams((prev) => ({ ...prev, screenStream: stream }));
        })
        .catch((err) => {
          console.error("Error accessing screen:", err);
        });
    } else {
      setStreams((prev) => {
        if (prev.screenStream) {
          prev.screenStream.getTracks().forEach((track) => track.stop());
        }
        return { ...prev, screenStream: null };
      });
    }
  }, [screenEnabled]);

  useEffect(() => {
    if (micEnabled) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setStreams((prev) => ({ ...prev, micStream: stream }));
        })
        .catch((err) => {
          console.error("Error accessing microphone:", err);
        });
    } else {
      setStreams((prev) => {
        if (prev.micStream) {
          prev.micStream.getTracks().forEach((track) => track.stop());
        }
        return { ...prev, micStream: null };
      });
    }
  }, [micEnabled]);

  useEffect(() => {
    return () => {
      Object.values(streams).forEach((stream) => {
        if (stream) {
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
      });
    };
  }, []);

  return streams;
};
