"use client";

import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/modal";
import { CheckCircle, Loader2, XCircle, Youtube } from "lucide-react";

interface EndStreamModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isLoading: boolean;
  success: boolean;
  error: string | null;
}

export function EndStreamModal({ isOpen, isLoading, success, error }: EndStreamModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => null}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      className="max-w-lg"
    >
      <ModalHeader onClose={false ? () => null : undefined} showCloseButton={false}>
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg">
            <Youtube className="h-5 w-5 text-white" />
          </div>
          <span>Ending Stream...</span>
        </div>
      </ModalHeader>

      <ModalBody className="text-center space-y-6">
        {isLoading && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 text-red-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Ending your live stream...</h3>
              <p className="text-gray-400">
                Stopping your broadcast and wrapping things up. This may take a moment, please wait.
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
                <h3 className="text-xl font-semibold text-white">Stream has ended successfully!</h3>
                <p className="text-gray-400">
                  Your live stream has been stopped. Taking you back to the dashboard.
                </p>
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
                <h3 className="text-xl font-semibold text-white">Failed to end stream</h3>
                <p className="text-gray-400">
                  We encountered an error while stopping your live stream.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>

              <div className="text-xs text-gray-500 bg-gray-800/30 rounded-lg p-3">
                <p className="font-medium mb-1">🔧 Troubleshooting:</p>
                <ul className="space-y-1 text-left">
                  <li>• Check your internet connection</li>
                  <li>• Verify YouTube streaming permissions</li>
                  <li>• Try ending the stream again</li>
                  <li>• Check YouTube Studio for stream status</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
