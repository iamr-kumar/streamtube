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
          <div className="p-2 rounded-lg bg-[var(--accent-red)] text-white">
            <Youtube className="h-5 w-5" />
          </div>
          <span>Ending Stream...</span>
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
                Ending your live stream...
              </h3>
              <p className="text-[var(--text-muted)]">
                Stopping your broadcast and wrapping things up. This may take a moment, please wait.
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
                  Stream has ended successfully!
                </h3>
                <p className="text-[var(--text-muted)]">
                  Your live stream has been stopped. Taking you back to the dashboard.
                </p>
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
                  Failed to end stream
                </h3>
                <p className="text-[var(--text-muted)]">
                  We encountered an error while stopping your live stream.
                </p>
              </div>

              <div className="bg-[var(--accent-red-muted)] border border-[var(--accent-red)]/40 rounded-lg p-4">
                <p className="text-[var(--accent-red)] text-sm font-medium">{error}</p>
              </div>

              <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border-soft)]">
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
