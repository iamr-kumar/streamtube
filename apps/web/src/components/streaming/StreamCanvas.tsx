"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface StreamCanvasProps {
  isStreaming: boolean;
  cameraEnabled: boolean;
  screenEnabled: boolean;
  micEnabled: boolean;
  onStreamData: (data: Blob) => void;
}

export default function StreamCanvas({
  isStreaming,
  cameraEnabled,
  screenEnabled,
  micEnabled,
  onStreamData,
}: StreamCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera stream
  useEffect(() => {
    if (cameraEnabled) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 25 },
          },
        })
        .then((stream) => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
        });
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }
  }, [cameraEnabled]);

  // Initialize screen share
  useEffect(() => {
    if (screenEnabled) {
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
    } else {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
    }
  }, [screenEnabled]);

  // Initialize microphone
  useEffect(() => {
    if (micEnabled) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setMicStream(stream);
        })
        .catch((err) => {
          console.error("Error accessing microphone:", err);
        });
    } else {
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
        setMicStream(null);
      }
    }
  }, [micEnabled]);

  // Canvas drawing function
  const drawToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
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
            const pipSize = Math.min(canvas.width * 0.35, 300);
            const pipX = canvas.width - pipSize - 20;
            const pipY = canvas.height - pipSize - 20;

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
          canvas.width * 0.7
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
      ctx.fillStyle = "#374151";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#9CA3AF";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let message = "Enable camera or screen share to start streaming";
      if (cameraEnabled || screenEnabled) {
        message = "Loading media...";
      }

      ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }
  }, [cameraEnabled, screenEnabled]);

  // Canvas composition using only setInterval
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start interval-based rendering at 25 FPS
    intervalRef.current = setInterval(drawToCanvas, 1000 / 25); // 40ms interval for 25 FPS

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [drawToCanvas, cameraStream, screenStream]);

  // MediaRecorder setup and management
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Stop existing recorder
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    if (!isStreaming) {
      return;
    }

    const setupRecorder = async () => {
      try {
        // Get video track from canvas
        const videoTrack = canvas.captureStream(25).getVideoTracks()[0];
        if (!videoTrack) {
          console.error("Could not get video track from canvas");
          return;
        }

        // Collect all available audio tracks
        const audioTracks = [
          ...(micStream?.getAudioTracks() || []),
          ...(screenStream?.getAudioTracks() || []),
        ];

        // Create a new stream for the recorder
        const finalStream = new MediaStream([videoTrack, ...audioTracks]);

        // Use better codec options
        const mimeType = (() => {
          if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
            return "video/webm;codecs=vp8,opus";
          } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
            return "video/webm;codecs=vp8";
          } else if (MediaRecorder.isTypeSupported("video/webm")) {
            return "video/webm";
          } else {
            return "";
          }
        })();

        const recorder = new MediaRecorder(finalStream, {
          mimeType,
          videoBitsPerSecond: 2000000, // Reduced to 2 Mbps for better stability
          audioBitsPerSecond: 128000, // 128 kbps
        });

        // Accumulate chunks for more complete segments
        let recordedChunks: Blob[] = [];
        let chunkCount = 0;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && isStreaming) {
            onStreamData(event.data);
          }
        };

        recorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
        };

        recorder.onstart = () => {
          console.log("MediaRecorder started with codec:", mimeType);
        };

        recorder.onstop = () => {
          // Send any remaining chunks

          console.log("MediaRecorder stopped");
        };

        // Use longer intervals to reduce fragmentation
        recorder.start(33); // 33ms chunks
        recorderRef.current = recorder;

        console.log("MediaRecorder started with codec:", mimeType);
      } catch (error) {
        console.error("MediaRecorder setup error:", error);
      }
    };

    setupRecorder();

    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, [isStreaming, micStream, screenStream, onStreamData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full h-auto bg-gray-900 rounded-lg shadow-2xl"
      />

      {/* Hidden video elements for canvas composition */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />
      <video ref={screenVideoRef} autoPlay muted playsInline className="hidden" />

      {/* Status overlay */}
      <div className="absolute top-4 left-4 flex flex-col space-y-2">
        <div className="flex space-x-2">
          {cameraEnabled && (
            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
              Camera Active
            </div>
          )}
          {screenEnabled && (
            <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
              Screen Sharing
            </div>
          )}
          {micEnabled && (
            <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
              Mic Active
            </div>
          )}
          {isStreaming && (
            <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
              Live Streaming
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
