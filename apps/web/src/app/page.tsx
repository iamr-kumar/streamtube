"use client";
import { useRef, useState, useCallback, useEffect } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const drawVideoToCanvas = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }, []);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onplay = () => {
          // Start drawing to canvas once video is playing
          startCanvasDrawing();
        };
        videoRef.current.play();
      }

      setMediaStream(stream);
      setIsStreaming(true);

      webSocketRef.current = new WebSocket("ws://localhost:8080");
      webSocketRef.current.onopen = () => {
        console.log("WebSocket connection established");

        if (!canvasRef.current) return;

        // Get canvas stream with higher frame rate
        const canvasStream = canvasRef.current.captureStream(30);

        // Add audio track from original stream if available
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }

        const mediaRecorder = new MediaRecorder(canvasStream, {
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
