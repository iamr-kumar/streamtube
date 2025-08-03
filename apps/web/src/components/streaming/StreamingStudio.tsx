"use client";

import React from "react";
import {
  useStreamInfo,
  useMediaControls,
  useModal,
  useStreamingOperations,
  useWebSocketConnection,
} from "@/hooks";
import { StreamingStudioHeader } from "./StreamingStudioHeader";
import { LivePreviewPanel } from "./LivePreviewPanel";
import { MediaControlsPanel } from "./MediaControlsPanel";
import { StreamControlsPanel } from "./StreamControlsPanel";
import { StreamStatusPanel } from "./StreamStatusPanel";
import { QuickActionsPanel } from "./QuickActionsPanel";
import { StartStreamModal } from "./StartStreamModal";

export default function StreamingStudio() {
  // Custom hooks for state management
  const { streamInfo, clearStreamInfo } = useStreamInfo();
  const { cameraEnabled, micEnabled, screenEnabled, toggleCamera, toggleMic, toggleScreen } =
    useMediaControls();

  const {
    isOpen: showModal,
    isLoading: modalLoading,
    isSuccess: modalSuccess,
    error: modalError,
    openModal,
    closeModal,
    setLoading,
    setSuccess,
    setError,
  } = useModal();

  const { sendData } = useWebSocketConnection();

  // Streaming operations with callbacks
  const { isStreaming, handleStartStream, handleStopStream } = useStreamingOperations({
    streamInfo,
    onStreamStart: () => {
      setSuccess(true);
    },
    onStreamStop: () => {
      clearStreamInfo();
    },
    onError: (error) => {
      setError(`Failed to start stream: ${error}`);
    },
  });

  // Event handlers
  const handleStreamStart = async () => {
    if (!streamInfo) {
      setError("No active stream found");
      return;
    }

    openModal();
    setLoading(true);

    try {
      await handleStartStream();
    } catch (error) {
      // Error handling is done in the hook
      console.error("Stream start failed:", error);
    }
  };

  const handleStreamStop = async () => {
    try {
      await handleStopStream();
    } catch (error) {
      console.error("Stream stop failed:", error);
    }
  };

  const handleStreamData = (data: Blob) => {
    sendData(data);
  };

  // Determine if controls should be disabled
  const controlsDisabled = modalLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <StreamingStudioHeader />

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-4 gap-6">
        {/* Main Canvas Area */}
        <div className="lg:col-span-3 space-y-6">
          <LivePreviewPanel
            isStreaming={isStreaming}
            cameraEnabled={cameraEnabled}
            screenEnabled={screenEnabled}
            micEnabled={micEnabled}
            onStreamData={handleStreamData}
          />

          <MediaControlsPanel
            cameraEnabled={cameraEnabled}
            micEnabled={micEnabled}
            screenEnabled={screenEnabled}
            onToggleCamera={toggleCamera}
            onToggleMic={toggleMic}
            onToggleScreen={toggleScreen}
            disabled={controlsDisabled}
          />
        </div>

        {/* Controls Panel */}
        <div className="space-y-6">
          <StreamControlsPanel
            isStreaming={isStreaming}
            onStartStream={handleStreamStart}
            onStopStream={handleStreamStop}
            disabled={controlsDisabled}
          />

          <StreamStatusPanel
            cameraEnabled={cameraEnabled}
            micEnabled={micEnabled}
            screenEnabled={screenEnabled}
            isStreaming={isStreaming}
          />

          <QuickActionsPanel />
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
