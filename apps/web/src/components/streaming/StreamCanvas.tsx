"use client";

import { useAudioMixer, useCanvasRenderer, useMediaDevices, useMediaRecorder } from "../../hooks";
import { VIDEO_CONFIG } from "../../lib/constants";

interface StreamCanvasProps {
  isStreaming: boolean;
  cameraEnabled: boolean;
  screenEnabled: boolean;
  micEnabled: boolean;
  onStreamData: (data: Blob) => void;
}

export default function StreamCanvas({
  isStreaming,
  cameraEnabled,
  screenEnabled,
  micEnabled,
  onStreamData,
}: StreamCanvasProps) {
  // Get media streams using custom hook
  const { cameraStream, screenStream, micStream } = useMediaDevices({
    cameraEnabled,
    screenEnabled,
    micEnabled,
  });

  // Set up audio mixing
  const { mixedAudioStream, audioContext } = useAudioMixer({
    micEnabled,
    screenEnabled,
    micStream,
    screenStream,
  });

  // Set up canvas rendering
  const { canvasRef, videoRef, screenVideoRef } = useCanvasRenderer({
    cameraEnabled,
    screenEnabled,
    cameraStream,
    screenStream,
  });

  // Set up media recording
  useMediaRecorder({
    isStreaming,
    canvasRef,
    mixedAudioStream,
    audioContext,
    micEnabled,
    screenEnabled,
    micStream,
    screenStream,
    onStreamData,
  });

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={VIDEO_CONFIG.CANVAS.WIDTH}
        height={VIDEO_CONFIG.CANVAS.HEIGHT}
        className="w-full h-auto rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-soft)] shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
      />

      {/* Hidden video elements for canvas composition */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />
      <video ref={screenVideoRef} autoPlay muted playsInline className="hidden" />
    </div>
  );
}
