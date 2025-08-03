import { useRef, useEffect } from "react";
import { RECORDING_CONFIG, SUPPORTED_MIME_TYPES, VIDEO_CONFIG } from "../lib/streamingConstants";

interface MediaRecorderConfig {
  isStreaming: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mixedAudioStream: MediaStream | null;
  audioContext: AudioContext | null;
  micEnabled: boolean;
  screenEnabled: boolean;
  micStream: MediaStream | null;
  screenStream: MediaStream | null;
  onStreamData: (data: Blob) => void;
}

export const useMediaRecorder = ({
  isStreaming,
  canvasRef,
  mixedAudioStream,
  audioContext,
  micEnabled,
  screenEnabled,
  micStream,
  screenStream,
  onStreamData,
}: MediaRecorderConfig) => {
  const recorderRef = useRef<MediaRecorder | null>(null);

  const getSupportedMimeType = (): string => {
    for (const type of SUPPORTED_MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const createRecorder = async (): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not available for recording");
      return;
    }

    try {
      console.log("Setting up MediaRecorder...");

      // Get video track from canvas
      const canvasStream = canvas.captureStream(VIDEO_CONFIG.CANVAS.FPS);
      const videoTrack = canvasStream.getVideoTracks()[0];

      if (!videoTrack) {
        console.error("Could not get video track from canvas");
        return;
      }

      // Get audio tracks - prefer mixed audio, fallback to direct tracks
      let audioTracks: MediaStreamTrack[] = [];

      if (mixedAudioStream && audioContext?.state === "running") {
        audioTracks = mixedAudioStream.getAudioTracks();
        console.log("Using mixed audio tracks:", audioTracks.length);
      } else {
        // Fallback to direct audio tracks
        const directAudioTracks = [
          ...(micEnabled && micStream ? micStream.getAudioTracks() : []),
          ...(screenEnabled && screenStream ? screenStream.getAudioTracks() : []),
        ];
        audioTracks = directAudioTracks;
        console.log("Using direct audio tracks:", audioTracks.length);
      }

      // Create the final stream
      const finalStream = new MediaStream([videoTrack, ...audioTracks]);
      console.log("Final stream tracks:", finalStream.getTracks().length);

      const mimeType = getSupportedMimeType();
      console.log("Using MIME type:", mimeType);

      const recorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: RECORDING_CONFIG.VIDEO_BITRATE,
        audioBitsPerSecond: RECORDING_CONFIG.AUDIO_BITRATE,
      });

      // Set up event handlers
      recorder.ondataavailable = (event) => {
        console.log("Data available:", event.data.size, "bytes");
        if (event.data.size > 0 && isStreaming) {
          onStreamData(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
      };

      recorder.onstart = () => {
        console.log("MediaRecorder started with codec:", mimeType);
      };

      recorder.onstop = () => {
        console.log("MediaRecorder stopped");
      };

      // Start recording
      recorder.start(RECORDING_CONFIG.CHUNK_SIZE);
      recorderRef.current = recorder;

      console.log("MediaRecorder created and started successfully");
    } catch (error) {
      console.error("MediaRecorder setup error:", error);
    }
  };

  const stopRecorder = (): void => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      console.log("Stopping MediaRecorder...");
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  };

  // MediaRecorder lifecycle management
  useEffect(() => {
    console.log("MediaRecorder effect triggered:", {
      isStreaming,
      hasCanvas: !!canvasRef.current,
      hasRecorder: !!recorderRef.current,
    });

    if (isStreaming && !recorderRef.current) {
      // Add a small delay to ensure canvas is ready
      const timeoutId = setTimeout(() => {
        createRecorder();
      }, 100);

      return () => clearTimeout(timeoutId);
    } else if (!isStreaming && recorderRef.current) {
      stopRecorder();
    }
  }, [isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecorder();
    };
  }, []);

  return {
    recorder: recorderRef.current,
    isRecording: recorderRef.current?.state === "recording",
  };
};
