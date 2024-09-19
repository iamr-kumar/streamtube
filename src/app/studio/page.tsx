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
    </div>
  );
}
