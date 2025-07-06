"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  overlayClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, closeOnEscape]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-black/60 backdrop-blur-sm",
        overlayClassName
      )}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-md rounded-lg bg-gray-900 shadow-2xl",
          "border border-gray-700 backdrop-blur-md",
          "transform transition-all duration-200 ease-out",
          "max-h-[90vh] overflow-y-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export function ModalHeader({
  children,
  onClose,
  showCloseButton = true,
  className,
}: ModalHeaderProps) {
  return (
    <div
      className={cn("flex items-center justify-between p-6 border-b border-gray-700", className)}
    >
      <div className="text-lg font-semibold text-white">{children}</div>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn("flex items-center justify-end gap-3 p-6 border-t border-gray-700", className)}
    >
      {children}
    </div>
  );
}
