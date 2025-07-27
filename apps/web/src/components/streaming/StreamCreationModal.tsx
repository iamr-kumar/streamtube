"use client";

import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/modal";
import { StreamInfo } from "@/types/streaming";
import { CheckCircle, ExternalLink, Loader2, XCircle, Youtube } from "lucide-react";

interface StreamCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToStudio?: () => void;
  isLoading: boolean;
  success: boolean;
  error: string | null;
  broadcastData: StreamInfo | null;
}

export function StreamCreationModal({
  isOpen,
  onClose,
  onGoToStudio,
  isLoading,
  success,
  error,
  broadcastData,
}: StreamCreationModalProps) {
  const canClose = !isLoading;

  const handleClose = () => {
    if (canClose) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOverlayClick={canClose}
      closeOnEscape={canClose}
      className="max-w-lg"
    >
      <ModalHeader onClose={canClose ? handleClose : undefined} showCloseButton={canClose}>
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg">
            <Youtube className="h-5 w-5 text-white" />
          </div>
          <span>Create Live Stream</span>
        </div>
      </ModalHeader>

      <ModalBody className="text-center space-y-6">
        {isLoading && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Creating your live stream...</h3>
              <p className="text-gray-400">
                Setting up your broadcast on YouTube. This may take a few moments.
              </p>
            </div>
          </>
        )}

        {success && broadcastData && (
          <>
            <div className="flex justify-center">
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Youtube className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">New live stream created!</h3>
                <p className="text-gray-400">
                  Your YouTube live stream has been successfully created and is ready to go.
                </p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
                <div className="text-left space-y-1">
                  <p className="text-sm font-medium text-gray-300">Stream Title</p>
                  <p className="text-white font-semibold">{broadcastData.broadcast.title}</p>
                </div>

                <div className="text-left space-y-1">
                  <p className="text-sm font-medium text-gray-300">Privacy</p>
                  <p className="text-white capitalize">{broadcastData.broadcast.privacyStatus}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                  <span className="text-sm font-medium text-gray-300">Broadcast URL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                  >
                    <a
                      href={broadcastData.broadcast.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1"
                    >
                      <span className="text-xs">View on YouTube</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-gray-800/30 rounded-lg p-3">
                <p className="font-medium mb-1">💡 Next Steps:</p>
                <ul className="space-y-1 text-left">
                  <li>• Configure your camera and microphone settings</li>
                  <li>• Click &ldquo;Start Stream&rdquo; to begin broadcasting</li>
                  <li>• Share your broadcast URL with viewers</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {error && (
          <>
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Stream creation failed</h3>
                <p className="text-gray-400">
                  We encountered an error while creating your live stream.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>

              <div className="text-xs text-gray-500 bg-gray-800/30 rounded-lg p-3">
                <p className="font-medium mb-1">🔧 Troubleshooting:</p>
                <ul className="space-y-1 text-left">
                  <li>• Check your internet connection</li>
                  <li>• Verify YouTube channel permissions</li>
                  <li>• Ensure live streaming is enabled on your channel</li>
                  <li>• Try again in a few moments</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </ModalBody>

      {canClose && (
        <div className="p-6 border-t border-gray-700">
          <div className="flex justify-end space-x-3">
            {success && onGoToStudio && (
              <Button
                variant="default"
                onClick={onGoToStudio}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                Go to Studio
              </Button>
            )}
            {success && !onGoToStudio && (
              <Button
                variant="default"
                onClick={handleClose}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                Continue to Stream Setup
              </Button>
            )}
            {error && (
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Close
              </Button>
            )}
            {!success && !error && !isLoading && (
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
