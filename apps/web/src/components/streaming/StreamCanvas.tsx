"use client";

import { useRef, useEffect, useState } from "react";

interface StreamCanvasProps {
  cameraEnabled: boolean;
  screenEnabled: boolean;
  micEnabled: boolean;
  onStreamData: (data: ArrayBuffer) => void;
}

export default function StreamCanvas({
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

  // Initialize camera stream
  useEffect(() => {
    if (cameraEnabled) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
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
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
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

  // Canvas composition logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;
    let recorder: MediaRecorder | null = null;

    const draw = () => {
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

          console.log(drawWidth, drawHeight, x, y);

          ctx.drawImage(screenVideo, x, y, drawWidth, drawHeight);
          hasContent = true;

          // Draw camera as picture-in-picture if both are enabled
          if (cameraEnabled && videoRef.current && videoRef.current.readyState >= 2) {
            const cameraVideo = videoRef.current;
            if (cameraVideo.videoWidth > 0 && cameraVideo.videoHeight > 0) {
              // Make the PiP larger - increase from 0.25 to 0.35 of canvas width
              const pipSize = Math.min(canvas.width * 0.35, 300); // Larger maximum size
              const pipX = canvas.width - pipSize - 20;
              const pipY = canvas.height - pipSize - 20;

              // Save the current context state before clipping
              ctx.save();

              // Create circular clipping path
              ctx.beginPath();
              const radius = pipSize / 2;
              const centerX = pipX + radius;
              const centerY = pipY + radius;
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
              ctx.closePath();
              ctx.clip();

              // Draw a background for the circular PiP
              ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
              ctx.fillRect(pipX, pipY, pipSize, pipSize);

              // Draw the camera feed in a circle
              ctx.drawImage(cameraVideo, pipX, pipY, pipSize, pipSize);

              // Restore the context to remove the clipping
              ctx.restore();

              // Draw border for the circular PiP
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

          // Draw the camera feed
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

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    // Set up MediaRecorder after a short delay to ensure streams are ready
    const setupRecorder = () => {
      try {
        const stream = canvas.captureStream(30);

        // Add audio track if microphone is enabled
        if (micStream) {
          const audioTrack = micStream.getAudioTracks()[0];
          if (audioTrack) {
            stream.addTrack(audioTrack);
          }
        }

        // Check if MediaRecorder supports the desired format
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";

        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 128000,
        });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            event.data.arrayBuffer().then((buffer) => {
              onStreamData(buffer);
            });
          }
        };

        recorder.start(100); // Send data every 100ms
      } catch (error) {
        console.error("MediaRecorder setup error:", error);
      }
    };

    // Wait a bit for streams to be ready
    const timeout = setTimeout(setupRecorder, 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    };
  }, [
    cameraEnabled,
    screenEnabled,
    micEnabled,
    cameraStream,
    screenStream,
    micStream,
    onStreamData,
  ]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
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
        </div>
      </div>
    </div>
  );
}

// // Demo component to test the StreamCanvas
// function StreamCanvasDemo() {
//   const [cameraEnabled, setCameraEnabled] = useState(false);
//   const [screenEnabled, setScreenEnabled] = useState(false);
//   const [micEnabled, setMicEnabled] = useState(false);

//   const handleStreamData = (data: ArrayBuffer) => {
//     // Mock handler for stream data
//     console.log("Received stream data:", data.byteLength, "bytes");
//   };

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <h1 className="text-2xl font-bold mb-6">StreamCanvas Debug Test</h1>

//       <div className="mb-6 flex space-x-4">
//         <button
//           onClick={() => setCameraEnabled(!cameraEnabled)}
//           className={`px-4 py-2 rounded ${
//             cameraEnabled
//               ? 'bg-green-600 text-white'
//               : 'bg-gray-600 text-white hover:bg-gray-500'
//           }`}
//         >
//           {cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
//         </button>

//         <button
//           onClick={() => setScreenEnabled(!screenEnabled)}
//           className={`px-4 py-2 rounded ${
//             screenEnabled
//               ? 'bg-blue-600 text-white'
//               : 'bg-gray-600 text-white hover:bg-gray-500'
//           }`}
//         >
//           {screenEnabled ? 'Stop Screen Share' : 'Start Screen Share'}
//         </button>

//         <button
//           onClick={() => setMicEnabled(!micEnabled)}
//           className={`px-4 py-2 rounded ${
//             micEnabled
//               ? 'bg-purple-600 text-white'
//               : 'bg-gray-600 text-white hover:bg-gray-500'
//           }`}
//         >
//           {micEnabled ? 'Disable Mic' : 'Enable Mic'}
//         </button>
//       </div>

//       <StreamCanvas
//         cameraEnabled={cameraEnabled}
//         screenEnabled={screenEnabled}
//         micEnabled={micEnabled}
//         onStreamData={handleStreamData}
//       />
//     </div>
//   );
// }

// export default StreamCanvas;
