"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StreamConfig, StreamInfo, StreamStatus } from "@/types/streaming";
import {
  LogOut,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Play,
  Square,
  User,
  Video,
  VideoOff,
  Youtube,
  Home,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import StreamCanvas from "./StreamCanvas";
import { useStream } from "@/hooks/useStream";
import { StartStreamModal } from "./StartStreamModal";

export default function StreamingStudio() {
  const router = useRouter();
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);

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

  const {
    status,
    connect,
    configureStream,
    disconnect,
    startStream: startStreamClient,
    stopStream: stopStreamClient,
    sendStreamData,
  } = useStream();

  useEffect(() => {
    // Initialize WebSocket connection to backend
    const connectWebSocket = () => {
      connect().catch((error) => {
        console.error("WebSocket connection error:", error);
      });
    };

    //   connectWebSocket();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    const activeStream = localStorage.getItem("activeStream");
    if (activeStream) {
      const streamData: StreamInfo = JSON.parse(activeStream);
      setStreamInfo(streamData);
    }
  }, []);

  useEffect(() => {
    if (showModal && modalLoading && status === StreamStatus.STREAMING) {
      setModalLoading(false);
      setModalSuccess(true);
      setModalError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const startStream = () => {
    if (!streamInfo) {
      console.error("No active stream found. Please create a stream from the dashboard.");
      return;
    }
    const streamConfig: StreamConfig = {
      rtmpUrl: streamInfo.stream.rtmpUrl, // This should come from created broadcast
      streamKey: streamInfo.stream.streamKey, // This should come from created broadcast
      resolution: { width: 1280, height: 720 },
      frameRate: 25,
      bitrate: 2500,
      audioSampleRate: 44100,
      audioChannels: 2,
    };

    openModal();
    setModalLoading(true);

    if (configureStream(streamConfig) && startStreamClient()) {
      setIsStreaming(true);
      console.log(isStreaming ? "Stream started successfully" : "Failed to start stream");
    }
  };

  const stopStream = () => {
    if (stopStreamClient()) {
      setIsStreaming(false);
    }
    setIsStreaming(false);
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
                  sendStreamData(data);
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
                  onClick={isStreaming ? stopStream : startStream}
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
