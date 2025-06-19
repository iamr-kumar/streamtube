"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  LogOut,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Play,
  Settings,
  Square,
  User,
  Video,
  VideoOff,
  Youtube,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import StreamCanvas from "./StreamCanvas";

interface StreamSettings {
  title: string;
  description: string;
  privacy: "public" | "unlisted" | "private";
}

export default function StreamingStudio() {
  // const { data: session } = useSession();
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [streamSettings, setStreamSettings] = useState<StreamSettings>({
    title: "",
    description: "",
    privacy: "unlisted",
  });

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection to backend
    const connectWebSocket = () => {
      wsRef.current = new WebSocket("ws://localhost:8080");

      wsRef.current.onopen = () => {
        console.log("Connected to streaming server");
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("Failed to connect to streaming server");
      };

      wsRef.current.onclose = () => {
        console.log("Disconnected from streaming server");
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const startStream = async () => {
    try {
      // Create YouTube live stream
      const response = await fetch("/api/youtube/create-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(streamSettings),
      });

      if (!response.ok) {
        throw new Error("Failed to create YouTube stream");
      }

      const { streamKey, rtmpUrl } = await response.json();

      // Send stream configuration to backend
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "start-stream",
            rtmpUrl,
            streamKey,
          })
        );
      }

      setIsStreaming(true);
      toast.success("Stream started successfully!");
    } catch (error) {
      console.error("Error starting stream:", error);
      toast.error("Failed to start stream");
    }
  };

  const stopStream = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "stop-stream",
        })
      );
    }

    setIsStreaming(false);
    toast.success("Stream stopped");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg">
                <Youtube className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Streaming Studio</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="h-4 w-4" />
                {/* <span className="text-sm">{session?.user?.name}</span> */}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-9xl mx-auto p-6 grid lg:grid-cols-3 gap-6 px-12 lg:px-48">
        {/* Main Canvas Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Live Preview</span>
                {isStreaming && (
                  <div className="flex items-center space-x-2 ml-auto">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-sm font-medium">LIVE</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StreamCanvas
                cameraEnabled={cameraEnabled}
                screenEnabled={screenEnabled}
                micEnabled={micEnabled}
                onStreamData={(data) => {
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(data);
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Media Controls */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Media Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center space-x-4">
                <Button
                  variant={cameraEnabled ? "default" : "secondary"}
                  size="lg"
                  onClick={() => setCameraEnabled(!cameraEnabled)}
                  className={`${
                    cameraEnabled
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-600 hover:bg-gray-700"
                  } text-white px-6 py-3 rounded-xl transition-all duration-300`}
                >
                  {cameraEnabled ? (
                    <Video className="h-5 w-5 mr-2" />
                  ) : (
                    <VideoOff className="h-5 w-5 mr-2" />
                  )}
                  Camera
                </Button>

                <Button
                  variant={micEnabled ? "default" : "secondary"}
                  size="lg"
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`${
                    micEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
                  } text-white px-6 py-3 rounded-xl transition-all duration-300`}
                >
                  {micEnabled ? (
                    <Mic className="h-5 w-5 mr-2" />
                  ) : (
                    <MicOff className="h-5 w-5 mr-2" />
                  )}
                  Microphone
                </Button>

                <Button
                  variant={screenEnabled ? "default" : "secondary"}
                  size="lg"
                  onClick={() => setScreenEnabled(!screenEnabled)}
                  className={`${
                    screenEnabled
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-600 hover:bg-gray-700"
                  } text-white px-6 py-3 rounded-xl transition-all duration-300`}
                >
                  {screenEnabled ? (
                    <Monitor className="h-5 w-5 mr-2" />
                  ) : (
                    <MonitorOff className="h-5 w-5 mr-2" />
                  )}
                  Screen Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Stream Settings */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Stream Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300">
                  Stream Title
                </Label>
                <Input
                  id="title"
                  value={streamSettings.title}
                  onChange={(e) =>
                    setStreamSettings((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter stream title..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">
                  Description
                </Label>
                <textarea
                  id="description"
                  value={streamSettings.description}
                  onChange={(e) =>
                    setStreamSettings((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Stream description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-4">
                <Button
                  onClick={isStreaming ? stopStream : startStream}
                  // disabled={!streamSettings.title.trim()}
                  className={`w-full py-3 text-lg font-semibold rounded-xl transition-all duration-300 ${
                    isStreaming
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                  }`}
                >
                  {isStreaming ? (
                    <>
                      <Square className="h-5 w-5 mr-2" />
                      Stop Stream
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start Stream
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stream Status */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Stream Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Camera</span>
                <div
                  className={`w-3 h-3 rounded-full ${
                    cameraEnabled ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Microphone</span>
                <div
                  className={`w-3 h-3 rounded-full ${micEnabled ? "bg-green-500" : "bg-gray-500"}`}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Screen Share</span>
                <div
                  className={`w-3 h-3 rounded-full ${
                    screenEnabled ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></div>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Stream Status</span>
                <span
                  className={`text-sm font-medium ${
                    isStreaming ? "text-red-400" : "text-gray-400"
                  }`}
                >
                  {isStreaming ? "LIVE" : "OFFLINE"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
