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
          <div className="p-2 rounded-lg bg-[var(--accent-red)] text-white">
            <Youtube className="h-5 w-5" />
          </div>
          <span>Create Live Stream</span>
        </div>
      </ModalHeader>

      <ModalBody className="text-center space-y-6">
        {isLoading && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 text-[var(--accent-red)] animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                Creating your live stream...
              </h3>
              <p className="text-[var(--text-muted)]">
                Setting up your broadcast on YouTube. This may take a few moments.
              </p>
            </div>
          </>
        )}

        {success && broadcastData && (
          <>
            <div className="flex justify-center">
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-[var(--accent-red)]" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[var(--accent-red)] rounded-full flex items-center justify-center">
                  <Youtube className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  New live stream created!
                </h3>
                <p className="text-[var(--text-muted)]">
                  Your YouTube live stream has been successfully created and is ready to go.
                </p>
              </div>

              <div className="bg-[var(--bg-tertiary)] border border-[var(--border-soft)] rounded-lg p-4 space-y-3">
                <div className="text-left space-y-1">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Stream Title</p>
                  <p className="text-[var(--text-primary)] font-semibold">
                    {broadcastData.broadcast.title}
                  </p>
                </div>

                <div className="text-left space-y-1">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Privacy</p>
                  <p className="text-[var(--text-primary)] capitalize">
                    {broadcastData.broadcast.privacyStatus}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-soft)]">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Broadcast URL
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-[var(--accent-red)] hover:text-[var(--accent-red-hover)] hover:bg-[var(--accent-red-muted)]"
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

              <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border-soft)]">
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
              <XCircle className="h-16 w-16 text-[var(--accent-red)]" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  Stream creation failed
                </h3>
                <p className="text-[var(--text-muted)]">
                  We encountered an error while creating your live stream.
                </p>
              </div>

              <div className="bg-[var(--accent-red-muted)] border border-[var(--accent-red)]/40 rounded-lg p-4">
                <p className="text-[var(--accent-red)] text-sm font-medium">{error}</p>
              </div>

              <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border-soft)]">
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
        <div className="p-6 border-t border-[var(--border-soft)]">
          <div className="flex justify-end space-x-3">
            {success && onGoToStudio && (
              <Button
                variant="default"
                onClick={onGoToStudio}
                className="bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)]"
              >
                Go to Studio
              </Button>
            )}
            {success && !onGoToStudio && (
              <Button
                variant="default"
                onClick={handleClose}
                className="bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)]"
              >
                Continue to Stream Setup
              </Button>
            )}
            {error && (
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-[var(--border-soft)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                Close
              </Button>
            )}
            {!success && !error && !isLoading && (
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-[var(--border-soft)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
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
