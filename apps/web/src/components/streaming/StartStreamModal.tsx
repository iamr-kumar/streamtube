"use client";

import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/modal";
import { CheckCircle, Loader2, XCircle, Youtube } from "lucide-react";

interface StartStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  isLoading: boolean;
  success: boolean;
  error: string | null;
}

export function StartStreamModal({
  isOpen,
  onClose,
  onRetry,
  isLoading,
  success,
  error,
}: StartStreamModalProps) {
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
          <span>Going Live...</span>
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
                Setting things up for you. This may take a moment, please wait.
              </p>
            </div>
          </>
        )}

        {success && (
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
                <p className="text-gray-400">Your are now live on YouTube!</p>
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
                <p className="text-gray-400">We encountered an error going live.</p>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>

              <div className="text-xs text-gray-500 bg-gray-800/30 rounded-lg p-3">
                <p className="font-medium mb-1">🔧 Troubleshooting:</p>
                <ul className="space-y-1 text-left">
                  <li>• Check your internet connection</li>
                  <li>• Verify YouTube channel permissions</li>
                  <li>• Ensure a new broadcast was created successfully</li>
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
            {success && (
              <Button
                variant="default"
                onClick={handleClose}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                Close
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
