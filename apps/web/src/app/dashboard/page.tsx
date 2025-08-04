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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg">
                  <Youtube className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">StreamTube</h1>
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

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">Welcome to Your Streaming Dashboard</h2>
            <p className="text-gray-300 text-lg">
              Create and manage your live streams with ease. Set up your stream details and go live
              on YouTube.
            </p>
          </div>

          {/* Stream Creation Form */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Create New Live Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">
                      Stream Title *
                    </Label>
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
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">
                      Description *
                    </Label>
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
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Privacy Settings *</Label>
                    <div className="space-y-3">
                      <div
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                          streamSettings.privacyStatus === PrivacyStatus.PUBLIC
                            ? "bg-purple-900/50 border-purple-500"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                        onClick={() =>
                          setStreamSettings((prev) => ({
                            ...prev,
                            privacyStatus: PrivacyStatus.PUBLIC,
                          }))
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              streamSettings.privacyStatus === PrivacyStatus.PUBLIC
                                ? "border-purple-500"
                                : "border-white/30"
                            }`}
                          >
                            {streamSettings.privacyStatus === PrivacyStatus.PUBLIC && (
                              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            )}
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium">Public</span>
                            <p className="text-xs text-gray-400">Anyone can search and view</p>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                          streamSettings.privacyStatus === PrivacyStatus.UNLISTED
                            ? "bg-purple-900/50 border-purple-500"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                        onClick={() =>
                          setStreamSettings((prev) => ({
                            ...prev,
                            privacyStatus: PrivacyStatus.UNLISTED,
                          }))
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              streamSettings.privacyStatus === PrivacyStatus.UNLISTED
                                ? "border-purple-500"
                                : "border-white/30"
                            }`}
                          >
                            {streamSettings.privacyStatus === PrivacyStatus.UNLISTED && (
                              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            )}
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium">Unlisted</span>
                            <p className="text-xs text-gray-400">Only viewable with link</p>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                          streamSettings.privacyStatus === PrivacyStatus.PRIVATE
                            ? "bg-purple-900/50 border-purple-500"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                        onClick={() =>
                          setStreamSettings((prev) => ({
                            ...prev,
                            privacyStatus: PrivacyStatus.PRIVATE,
                          }))
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              streamSettings.privacyStatus === PrivacyStatus.PRIVATE
                                ? "border-purple-500"
                                : "border-white/30"
                            }`}
                          >
                            {streamSettings.privacyStatus === PrivacyStatus.PRIVATE && (
                              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            )}
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium">Private</span>
                            <p className="text-xs text-gray-400">Only you can view</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="flex justify-center">
                <Button
                  onClick={createNewStream}
                  disabled={!streamSettings.title.trim() || !streamSettings.description.trim()}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
