"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EndStreamModal } from "@/components/streaming/EndStreamModal";
import { LivePreviewPanel } from "@/components/streaming/LivePreviewPanel";
import { MediaControlsPanel } from "@/components/streaming/MediaControlsPanel";
import { QuickActionsPanel } from "@/components/streaming/QuickActionsPanel";
import { StartStreamModal } from "@/components/streaming/StartStreamModal";
import { StreamControlsPanel } from "@/components/streaming/StreamControlsPanel";
import { StreamStatusPanel } from "@/components/streaming/StreamStatusPanel";
import { Button } from "@/components/ui/button";
import { useMediaControls } from "@/hooks";
import { useStream } from "@/hooks/useStream";
import { StreamStatus } from "@/types/streaming";
import { Home, LogOut, User, Youtube } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function StudioPage() {
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showEndStreamModal, setShowEndStreamModal] = useState(false);
  const [endStreamLoading, setEndStreamLoading] = useState(false);
  const [endStreamSuccess, setEndStreamSuccess] = useState(false);
  const [endStreamError, setEndStreamError] = useState<string | null>(null);

  const { status, sendData, handleStartStream, handleStopStream } = useStream({
    actions: {
      onStreamStarting: () => {
        openModal();
        setModalLoading(true);
      },
      onStreamStarted: () => {
        setModalLoading(false);
        setModalSuccess(true);
      },
      onStreamError: (error) => {
        setModalLoading(false);
        setModalError(error);
      },
      onStreamEnding: () => {
        openEndStreamModal();
        setEndStreamLoading(true);
      },
      onStreamEnded: () => {
        setEndStreamLoading(false);
        setEndStreamSuccess(true);
        setEndStreamError(null);
        router.replace("/dashboard");
      },
    },
  });
  const {
    cameraEnabled,
    micEnabled,
    screenEnabled,
    setCameraEnabled,
    setMicEnabled,
    setScreenEnabled,
  } = useMediaControls();

  const isStreaming = useMemo(() => status === StreamStatus.STREAMING, [status]);

  const router = useRouter();

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

  const openEndStreamModal = () => {
    setShowEndStreamModal(true);
    setEndStreamLoading(false);
    setEndStreamSuccess(false);
    setEndStreamError(null);
  };

  const closeEndStreamModal = () => {
    setShowEndStreamModal(false);
    setEndStreamLoading(false);
    setEndStreamSuccess(false);
    setEndStreamError(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface-primary">
        {/* Header */}
        <header className="bg-[var(--bg-primary)]/85 backdrop-blur-sm border-b border-[var(--border-soft)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-[var(--accent-red)] text-white">
                  <Youtube className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                  Streaming <span className="text-[var(--accent-red)]">Studio</span>
                </h1>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                  <User className="h-4 w-4" />
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
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
            <LivePreviewPanel
              isStreaming={isStreaming}
              cameraEnabled={cameraEnabled}
              screenEnabled={screenEnabled}
              micEnabled={micEnabled}
              onStreamData={(data) => {
                sendData(data);
              }}
            />

            <MediaControlsPanel
              cameraEnabled={cameraEnabled}
              micEnabled={micEnabled}
              screenEnabled={screenEnabled}
              onToggleCamera={() => setCameraEnabled(!cameraEnabled)}
              onToggleMic={() => setMicEnabled(!micEnabled)}
              onToggleScreen={() => setScreenEnabled(!screenEnabled)}
              disabled={false}
            />
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            <StreamControlsPanel
              isStreaming={isStreaming}
              onStartStream={handleStartStream}
              onStopStream={handleStopStream}
              disabled={false}
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
        <EndStreamModal
          isOpen={showEndStreamModal}
          onClose={closeEndStreamModal}
          isLoading={endStreamLoading}
          success={endStreamSuccess}
          error={endStreamError}
        />
      </div>
    </ProtectedRoute>
  );
}
