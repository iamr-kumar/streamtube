"use client";
import { useRef, useState, useCallback, useEffect } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      })
      .then((stream) => {
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
      });

    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 25 },
        },
        audio: true,
      })
      .then((stream) => {
        setScreenStream(stream);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.play();
        }
      })
      .catch((err) => {
        console.error("Error accessing screen:", err);
      });

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setMicStream(stream);
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
      });

    startCanvasDrawing();
  }, []);

  const drawVideoToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    console.log("Here");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    console.log("Context:", context);
    if (!context) return;

    console.log("Here again");

    context.fillStyle = "#1a1a1a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    console.log(screenVideoRef.current);
    if (screenVideoRef.current) {
      const screenVideo = screenVideoRef.current;
      console.log("Inside if");
      if (screenVideo.videoHeight > 0 && screenVideo.videoWidth > 0) {
        const aspectRatio = screenVideo.videoWidth / screenVideo.videoHeight;

        let drawWidth = canvas.width;
        let drawHeight = canvas.width / aspectRatio;

        if (drawHeight > canvas.height) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * aspectRatio;
        }

        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;
        context.drawImage(screenVideo, x, y, drawWidth, drawHeight);

        if (videoRef.current && videoRef.current.readyState >= 2) {
          const cameraVideo = videoRef.current;
          if (cameraVideo.videoWidth > 0 && cameraVideo.videoHeight > 0) {
            const pipSize = Math.min(canvas.width * 0.35, 300);
            const pipX = canvas.width - pipSize - 20;
            const pipY = canvas.height - pipSize - 20;

            context.save();
            context.beginPath();

            const radius = pipSize / 2;
            const centerX = pipX + radius;
            const centerY = pipY + radius;

            context.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
            context.closePath();
            context.clip();

            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(pipX, pipY, pipSize, pipSize);
            context.drawImage(cameraVideo, pipX, pipY, pipSize, pipSize);
            context.restore();

            context.beginPath();
            context.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
            context.strokeStyle = "rgba(255, 255, 255, 0.8)";
            context.lineWidth = 2;
            context.stroke();
          }
        }
      }
    } else if (videoRef.current && videoRef.current.readyState >= 2) {
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

        context.drawImage(video, x, y, drawWidth, drawHeight);

        // Add a subtle vignette effect
        const gradient = context.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.7
        );
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [screenStream, videoRef]);

  const startCanvasDrawing = useCallback(() => {
    // Use setInterval instead of requestAnimationFrame to avoid tab throttling
    intervalRef.current = setInterval(drawVideoToCanvas, 1000 / 30); // 30 FPS
  }, [drawVideoToCanvas]);

  const stopCanvasDrawing = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleStartStreaming = async () => {
    try {
      setIsStreaming(true);

      webSocketRef.current = new WebSocket("ws://localhost:8080");
      webSocketRef.current.onopen = () => {
        console.log("WebSocket connection established");

        if (!canvasRef.current) return;

        // Get canvas stream with higher frame rate
        const canvasStream = canvasRef.current.captureStream(25).getVideoTracks()[0];

        // Add audio track from original stream if available
        const audioTracks = [
          ...(micStream?.getAudioTracks() || []),
          ...(screenStream?.getAudioTracks() || []),
        ];
        const finalStream = new MediaStream([canvasStream, ...audioTracks]);

        const mediaRecorder = new MediaRecorder(finalStream, {
          mimeType: "video/webm; codecs=vp8,opus",
          videoBitsPerSecond: 2500000, // 2.5 Mbps
          audioBitsPerSecond: 128000, // 128 kbps
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (
            event.data.size > 0 &&
            webSocketRef.current &&
            webSocketRef.current.readyState === WebSocket.OPEN
          ) {
            webSocketRef.current.send(event.data);
          }
        };

        // Send data more frequently for smoother streaming
        mediaRecorder.start(100); // Send data every 100ms
      };

      webSocketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      webSocketRef.current.onclose = () => {
        console.log("WebSocket connection closed");
      };
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const handleStopStreaming = () => {
    // Stop canvas drawing
    stopCanvasDrawing();

    // Stop media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Close WebSocket
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }

    // Stop media stream
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }

    setIsStreaming(false);
  };

  // Handle page visibility changes to maintain streaming when tab is not focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isStreaming) {
        console.log("Tab hidden - maintaining stream");
        // Optionally reduce quality or frame rate when hidden
      } else if (!document.hidden && isStreaming) {
        console.log("Tab visible - resuming full quality");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isStreaming]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Live Streaming from Canvas</h1>

      <div className="w-full max-w-4xl space-y-4">
        {/* Original video (hidden, used as source for canvas) */}
        <video ref={videoRef} autoPlay muted playsInline className="hidden" />
        <video ref={screenVideoRef} autoPlay muted playsInline className="hidden" />

        {/* Canvas that shows the processed video */}
        <div className="bg-black rounded-lg shadow-lg overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-auto" />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={handleStartStreaming}
          disabled={isStreaming}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-full text-xl font-semibold transition-colors disabled:bg-gray-500"
        >
          {isStreaming ? "Streaming..." : "Start Streaming"}
        </button>

        <button
          onClick={handleStopStreaming}
          disabled={!isStreaming}
          className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-full text-xl font-semibold transition-colors disabled:bg-gray-500"
        >
          Stop Streaming
        </button>
      </div>

      {isStreaming && (
        <div className="mt-4 text-sm text-gray-400">
          <p>Keep this tab active for optimal streaming quality</p>
        </div>
      )}
    </div>
  );
}
