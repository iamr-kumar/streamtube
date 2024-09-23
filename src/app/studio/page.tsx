"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import io from "socket.io-client";

export default function Studio() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchParams = useSearchParams();
  const rtmpUrl = searchParams.get("rtmpUrl");
  console.log(rtmpUrl);

  useEffect(() => {
    async function getVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam: ", err);
      }
    }

    getVideo();

    const socketIo = io("http://localhost:3001");

    // Set up socket event listeners
    socketIo.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socketIo.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    // Clean up connection on component unmount
    return () => {
      socketIo.disconnect();
    };
  }, []);

  return (
    <div className="p-12">
      <video ref={videoRef} autoPlay></video>
      <button className="mt-4 p-2 bg-blue-500 text-white rounded">Start</button>
    </div>
  );
}
