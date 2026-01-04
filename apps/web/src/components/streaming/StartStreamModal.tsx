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
          <div className="p-2 rounded-lg bg-[var(--accent-red)] text-white">
            <Youtube className="h-5 w-5" />
          </div>
          <span>Going Live...</span>
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
                Setting things up for you. This may take a moment, please wait.
              </p>
            </div>
          </>
        )}

        {success && (
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
                <p className="text-[var(--text-muted)]">You are now live on YouTube!</p>
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
                <p className="text-[var(--text-muted)]">We encountered an error going live.</p>
              </div>

              <div className="bg-[var(--accent-red-muted)] border border-[var(--accent-red)]/40 rounded-lg p-4">
                <p className="text-[var(--accent-red)] text-sm font-medium">{error}</p>
              </div>

              <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border-soft)]">
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
        <div className="p-6 border-t border-[var(--border-soft)]">
          <div className="flex justify-end space-x-3">
            {success && (
              <Button
                variant="default"
                onClick={handleClose}
                className="bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)]"
              >
                Close
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
