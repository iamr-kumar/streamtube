"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

export default function Studio() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchParams = useSearchParams();
  const rtmpUrl = searchParams.get("rtmpUrl");
  console.log("rtmpUrl: ", rtmpUrl);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [socketIo, setSocketIo] = useState<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    async function getVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setUserStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam: ", err);
      }
    }

    getVideo();

    const socket = io("http://localhost:3001");
    setSocketIo(socket);

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const onStart = async () => {
    if (!userStream || !socketIo) return;
    const mediaRecorder = new MediaRecorder(userStream, {
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 2500000,
      mimeType: "video/webm",
    });

    console.log("mediaRecorder: ", mediaRecorder);

    mediaRecorder.ondataavailable = (event) => {
      socketIo.emit("videoData", event.data);
    };

    mediaRecorder.start(25);
  };

  return (
    <div className="p-12">
      <video ref={videoRef} autoPlay></video>
      <button
        className="mt-4 p-2 bg-blue-500 text-white rounded"
        onClick={onStart}
      >
        Start
      </button>
    </div>
  );
}
