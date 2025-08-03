import { useRef, useEffect, useCallback } from "react";
import { VIDEO_CONFIG, CANVAS_CONFIG } from "../lib/streamingConstants";

interface CanvasRendererConfig {
  cameraEnabled: boolean;
  screenEnabled: boolean;
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
}

export const useCanvasRenderer = ({
  cameraEnabled,
  screenEnabled,
  cameraStream,
  screenStream,
}: CanvasRendererConfig) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update video elements when streams change
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play();
    }
  }, [cameraStream]);

  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play();
    }
  }, [screenStream]);

  // Canvas drawing function
  const drawToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let hasContent = false;

    // If screen sharing is enabled, draw screen as main content
    if (screenEnabled && screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
      const screenVideo = screenVideoRef.current;
      if (screenVideo.videoWidth > 0 && screenVideo.videoHeight > 0) {
        const aspectRatio = screenVideo.videoWidth / screenVideo.videoHeight;

        let drawWidth = canvas.width;
        let drawHeight = canvas.width / aspectRatio;

        if (drawHeight > canvas.height) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * aspectRatio;
        }

        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;

        ctx.drawImage(screenVideo, x, y, drawWidth, drawHeight);
        hasContent = true;

        // Draw camera as picture-in-picture if both are enabled
        if (cameraEnabled && videoRef.current && videoRef.current.readyState >= 2) {
          const cameraVideo = videoRef.current;
          if (cameraVideo.videoWidth > 0 && cameraVideo.videoHeight > 0) {
            const pipSize = Math.min(
              canvas.width * CANVAS_CONFIG.PIP_SIZE_RATIO,
              CANVAS_CONFIG.PIP_MAX_SIZE
            );
            const pipX = canvas.width - pipSize - CANVAS_CONFIG.PIP_MARGIN;
            const pipY = canvas.height - pipSize - CANVAS_CONFIG.PIP_MARGIN;

            ctx.save();
            ctx.beginPath();
            const radius = pipSize / 2;
            const centerX = pipX + radius;
            const centerY = pipY + radius;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(pipX, pipY, pipSize, pipSize);
            ctx.drawImage(cameraVideo, pipX, pipY, pipSize, pipSize);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }
    }
    // If only camera is enabled, show camera full screen
    else if (cameraEnabled && videoRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const aspectRatio = video.videoWidth / video.videoHeight;

        let drawWidth = canvas.width;
        let drawHeight = canvas.width / aspectRatio;

        if (drawHeight > canvas.height) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * aspectRatio;
        }

        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;

        ctx.drawImage(video, x, y, drawWidth, drawHeight);

        // Add a subtle vignette effect
        const gradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * CANVAS_CONFIG.VIGNETTE_RADIUS_RATIO
        );
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        hasContent = true;
      }
    }

    // Show placeholder if no media is enabled or ready
    if (!hasContent) {
      ctx.fillStyle = CANVAS_CONFIG.PLACEHOLDER_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = CANVAS_CONFIG.TEXT_COLOR;
      ctx.font = CANVAS_CONFIG.FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let message = "Enable camera or screen share magic";
      if (cameraEnabled || screenEnabled) {
        message = "Loading media...";
      }

      ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }
  }, [cameraEnabled, screenEnabled]);

  // Canvas composition using setInterval
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start interval-based rendering at 25 FPS
    intervalRef.current = setInterval(drawToCanvas, 1000 / VIDEO_CONFIG.CANVAS.FPS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [drawToCanvas, cameraStream, screenStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    canvasRef,
    videoRef,
    screenVideoRef,
  };
};
