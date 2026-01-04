"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StreamCreationModal } from "@/components/streaming/StreamCreationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StreamInfo, PrivacyStatus } from "@/types/streaming";
import axios from "axios";
import { LogOut, Play, User, Youtube, Settings, Monitor } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface StreamSettings {
  title: string;
  description: string;
  privacyStatus: PrivacyStatus;
}

export default function StudioDashboard() {
  const router = useRouter();
  const [streamSettings, setStreamSettings] = useState<StreamSettings>({
    title: "",
    description: "",
    privacyStatus: PrivacyStatus.UNLISTED,
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [broadcastData, setBroadcastData] = useState<StreamInfo | null>(null);

  // Reset modal state when opening
  const openModal = () => {
    setShowModal(true);
    setModalLoading(false);
    setModalSuccess(false);
    setModalError(null);
    setBroadcastData(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalLoading(false);
    setModalSuccess(false);
    setModalError(null);
    setBroadcastData(null);
  };

  const handleGoToStudio = () => {
    if (broadcastData) {
      localStorage.setItem("activeStream", JSON.stringify(broadcastData));
    }
    closeModal();
    router.push("/studio");
  };

  const createNewStream = async () => {
    // Form validation
    if (!streamSettings.title.trim()) {
      setModalError("Please enter a stream title");
      openModal();
      return;
    }

    if (!streamSettings.description.trim()) {
      setModalError("Please enter a stream description");
      openModal();
      return;
    }

    // Open modal and start loading
    openModal();
    setModalLoading(true);

    try {
      // Create YouTube live stream
      const response = await axios.post("/api/youtube/create-stream", {
        title: streamSettings.title,
        description: streamSettings.description,
        privacyStatus: streamSettings.privacyStatus,
      });

      const { success, broadcast, stream } = response.data as StreamInfo;
      console.log("API Response:", response.data);

      if (!success) {
        throw new Error("Failed to create stream");
      }

      console.log("Stream created:", broadcast, stream);

      // Update modal state for success
      setModalLoading(false);
      setModalSuccess(true);
      setBroadcastData(response.data);
    } catch (error) {
      setModalLoading(false);

      // Type narrowing for Axios errors
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error || error.message;

        // Handle different error status codes
        if (statusCode === 401) {
          setModalError("Authentication failed. Please sign in again.");
        } else if (statusCode === 403) {
          setModalError("Permission denied. Please check your YouTube channel permissions.");
        } else if (statusCode === 400) {
          setModalError("Invalid request. Please check your stream settings.");
        } else if (statusCode === 429) {
          setModalError("Too many requests. Please try again later.");
        } else {
          setModalError(`Failed to create stream: ${errorMessage}`);
        }
      } else {
        // Handle non-Axios errors
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        setModalError(`Failed to create stream: ${errorMessage}`);
      }

      console.error("Error creating stream:", error);
    }
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
                  Stream<span className="text-[var(--accent-red)]">Tube</span>
                </h1>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                  <User className="h-4 w-4" />
                </div>

                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Welcome Section */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold text-[var(--text-primary)]">
              Welcome to your streaming dashboard
            </h2>
            <p className="text-[var(--text-secondary)]/90 text-lg">
              Prepare your broadcast with calm, layered controls before you go live.
            </p>
          </div>

          {/* Stream Creation Form */}
          <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)] flex items-center space-x-2">
                <Settings className="h-5 w-5 text-[var(--accent-red)]" />
                <span>Create new live stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Stream Title *</Label>
                    <Input
                      id="title"
                      value={streamSettings.title}
                      onChange={(e) =>
                        setStreamSettings((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter your stream title..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      id="description"
                      value={streamSettings.description}
                      onChange={(e) =>
                        setStreamSettings((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe your stream content..."
                      rows={4}
                      className="w-full px-3 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-soft)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Privacy Settings *</Label>
                    <div className="space-y-3">
                      {[PrivacyStatus.PUBLIC, PrivacyStatus.UNLISTED, PrivacyStatus.PRIVATE].map(
                        (option) => {
                          const isActive = streamSettings.privacyStatus === option;
                          const labels = {
                            [PrivacyStatus.PUBLIC]: {
                              title: "Public",
                              hint: "Anyone can search and view",
                            },
                            [PrivacyStatus.UNLISTED]: {
                              title: "Unlisted",
                              hint: "Only viewable with link",
                            },
                            [PrivacyStatus.PRIVATE]: {
                              title: "Private",
                              hint: "Only you can view",
                            },
                          }[option];

                          return (
                            <div
                              key={option}
                              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                                isActive
                                  ? "border-[var(--accent-red)]/80 bg-[var(--accent-red-muted)]"
                                  : "border-[var(--border-soft)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80"
                              }`}
                              onClick={() =>
                                setStreamSettings((prev) => ({
                                  ...prev,
                                  privacyStatus: option,
                                }))
                              }
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    isActive
                                      ? "border-[var(--accent-red)]"
                                      : "border-[var(--border-soft)]"
                                  }`}
                                >
                                  {isActive && (
                                    <div className="w-2 h-2 rounded-full bg-[var(--accent-red)]"></div>
                                  )}
                                </div>
                                <div>
                                  <span className="text-sm text-[var(--text-primary)] font-medium">
                                    {labels.title}
                                  </span>
                                  <p className="text-xs text-[var(--text-muted)]">{labels.hint}</p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-center">
                <Button
                  onClick={createNewStream}
                  disabled={!streamSettings.title.trim() || !streamSettings.description.trim()}
                  size="lg"
                  className="px-8"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Create Live Stream
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stream Creation Modal */}
        <StreamCreationModal
          isOpen={showModal}
          onClose={closeModal}
          onGoToStudio={handleGoToStudio}
          isLoading={modalLoading}
          success={modalSuccess}
          error={modalError}
          broadcastData={broadcastData}
        />
      </div>
    </ProtectedRoute>
  );
}
