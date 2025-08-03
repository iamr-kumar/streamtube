"use client";

import { useEffect, useRef, useState } from "react";
import StreamCanvas from "./StreamCanvas";
import { Button } from "../ui/button";
import { useStream } from "@/hooks/useStream";
import { Separator } from "@radix-ui/react-separator";
import {
  Youtube,
  User,
  Home,
  LogOut,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Square,
  Play,
} from "lucide-react";
import { signOut } from "next-auth/react";
import router from "next/router";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { StartStreamModal } from "./StartStreamModal";
import { StreamConfig, StreamInfo, StreamStatus } from "@/types/streaming";
import axios from "axios";

export default function StreamingStudio() {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const { status, connect, sendData, configureStream, disconnect, startStream, stopStream } =
    useStream();

  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const openModal = () => {
    setShowModal(true);
    setModalLoading(false);
    setModalSuccess(false);
    setModalError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalLoading(false);
    setModalSuccess(false);
    setModalError(null);
  };

  useEffect(() => {
    const connectToWebSocket = () => {
      connect().catch((error) => {
        console.error("Error connecting to WebSocket:", error);
      });
    };

    connectToWebSocket();
  }, []);

  useEffect(() => {
    const activeStream = localStorage.getItem("activeStream");
    if (activeStream) {
      const streamData: StreamInfo = JSON.parse(activeStream);
      setStreamInfo(streamData);
    }
  }, []);

  const sendDataOverWebSocket = (data: Blob) => {
    sendData(data);
  };

  const handleStartStream = async () => {
    if (!streamInfo) {
      console.error("No active stream found");
      return;
    }

    const streamConfig: StreamConfig = {
      rtmpUrl: streamInfo.stream.rtmpUrl,
      streamKey: streamInfo.stream.streamKey,
      resolution: { width: 1280, height: 720 },
      frameRate: 25,
      bitrate: 2500,
      audioSampleRate: 44100,
      audioChannels: 2,
    };
    openModal();
    setModalLoading(true);
    try {
      // Configure the stream
      const sessionId = await configureStream(streamConfig);
      console.log("Stream configured with session ID:", sessionId);

      // Start the stream
      await startStream();
      console.log("Stream started successfully");
      setIsStreaming(true);

      // Start sending data and wait for YouTube stream to be ready
      const streamIsReady = await waitForYouTubeStreamToBeReady();

      if (!streamIsReady) {
        throw new Error(
          "YouTube stream is not ready. Please ensure your connection is stable and try again."
        );
      }

      const transitionSuccess = await transitionBroadcastToLive();
      if (!transitionSuccess) {
        throw new Error("Failed to transition broadcast to live.");
      }

      console.log("Broadcast transitioned to live successfully");
      setModalLoading(false);
      setModalSuccess(true);
    } catch (error) {
      console.error("Error in stream start process:", error);

      // Attempt to clean up on error
      try {
        await stopStream();
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      setModalError(`Failed to start stream: ${errorMessage}`);
      setModalLoading(false);
    }
  };

  const waitForYouTubeStreamToBeReady = async (): Promise<boolean> => {
    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 3000; // 3 seconds
    const maxAttempts = Math.ceil(maxWaitTime / checkInterval);

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `/api/youtube/ready-check?broadcastId=${streamInfo?.broadcast.id}`
        );
        const { message, canGoLive, broadcastReady } = response.data;

        console.log("YouTube stream readiness check:", message);

        if (canGoLive) {
          return true;
        }

        if (attempt < maxAttempts) {
          console.log(`Waiting for YouTube stream to be ready... (${attempt + 1}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
        }
      } catch (error) {
        console.error("Error checking YouTube stream readiness:", error);

        // If attempts still remaining, wait and retry
        if (attempt < maxAttempts && axios.isAxiosError(error)) {
          console.log(`Retrying readiness check... (${attempt + 1}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
          continue;
        }

        // Break if attempts exhausted or error is not recoverable
        console.error("Failed to check YouTube stream readiness after multiple attempts.");
        return false;
      }
    }
    return false; // If we reach here, it means the stream is not ready
  };

  const transitionBroadcastToLive = async (): Promise<boolean> => {
    try {
      const response = await axios.post("/api/youtube/transition-stream", {
        broadcastId: streamInfo?.broadcast.id,
      });
      if (response.data.success) {
        return true;
      }
    } catch (error) {
      console.error("Error transitioning broadcast:", error);
    }
    return false;
  };

  const handleStopStream = async () => {
    try {
      await stopStream();
      setIsStreaming(false);
      console.log("Stream stopped successfully");
      localStorage.removeItem("activeStream");
    } catch (error) {
      console.error("Error stopping stream:", error);
    }
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
                onClick={() => router.push("/dashboard")}
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
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

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-4 gap-6">
        {/* Main Canvas Area */}
        <div className="lg:col-span-3 space-y-6">
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
                isStreaming={isStreaming}
                cameraEnabled={cameraEnabled}
                screenEnabled={screenEnabled}
                micEnabled={micEnabled}
                onStreamData={(data) => {
                  sendDataOverWebSocket(data);
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

        {/* Controls Panel */}
        <div className="space-y-6">
          {/* Stream Controls */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Stream Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="text-sm text-gray-400">
                  {isStreaming ? "Stream is live!" : "Ready to stream"}
                </div>
                <Button
                  onClick={isStreaming ? handleStopStream : handleStartStream}
                  className={`w-full py-3 text-lg font-semibold rounded-xl transition-all duration-300 ${
                    isStreaming
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                {!isStreaming && (
                  <div className="text-xs text-gray-500 text-center">
                    Make sure to create a stream from the dashboard first
                  </div>
                )}
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

          {/* Quick Actions */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full border-white/10 hover:bg-white/10 text-white"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/10 hover:bg-white/10 text-white"
                disabled
              >
                <Monitor className="h-4 w-4 mr-2" />
                Stream Settings
                <span className="text-xs text-gray-400 ml-auto">(Soon)</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Stream Creation Modal */}
      <StartStreamModal
        isOpen={showModal}
        onClose={closeModal}
        isLoading={modalLoading}
        success={modalSuccess}
        error={modalError}
      />
    </div>
  );
}
