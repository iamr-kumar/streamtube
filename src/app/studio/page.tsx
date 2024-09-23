"use client";
import React, { useRef, useEffect } from "react";

export default function Studio() {
  const videoRef = useRef<HTMLVideoElement>(null);

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
  }, []);

  return (
    <div className="p-12">
      <video ref={videoRef} autoPlay></video>
      <button className="mt-4 p-2 bg-blue-500 text-white rounded">Start</button>
    </div>
  );
}
