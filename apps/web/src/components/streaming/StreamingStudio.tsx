"use client";

import { useEffect, useRef, useState } from "react";
import StreamCanvas from "./StreamCanvas";
import { Button } from "../ui/button";

export default function StreamingStudio() {
  const webSocketRef = useRef<WebSocket | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    webSocketRef.current = new WebSocket("ws://localhost:8080");

    webSocketRef.current.onopen = () => {
      console.log("WebSocket connection established");
    };

    webSocketRef.current.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
    };

    webSocketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      webSocketRef.current?.close();
    };
  }, []);

  return (
    <div>
      <StreamCanvas
        isStreaming={isStreaming}
        webSocketRef={webSocketRef}
        cameraEnabled={cameraEnabled}
        micEnabled={micEnabled}
        screenEnabled={screenEnabled}
      />
      <Button onClick={() => setIsStreaming((prev) => !prev)}>
        {isStreaming ? "Stop Streaming" : "Start Streaming"}
      </Button>
      <Button onClick={() => setCameraEnabled((prev) => !prev)}>
        {cameraEnabled ? "Disable Camera" : "Enable Camera"}
      </Button>
      <Button onClick={() => setMicEnabled((prev) => !prev)}>
        {micEnabled ? "Disable Mic" : "Enable Mic"}
      </Button>
      <Button onClick={() => setScreenEnabled((prev) => !prev)}>
        {screenEnabled ? "Disable Screen" : "Enable Screen"}
      </Button>
    </div>
  );
}
