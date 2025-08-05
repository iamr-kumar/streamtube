import { useRef, useEffect, useCallback } from "react";

interface AudioMixerConfig {
  micEnabled: boolean;
  screenEnabled: boolean;
  micStream: MediaStream | null;
  screenStream: MediaStream | null;
}

/**
 * Custom hook for managing audio mixing using Web Audio API.
 * Combines microphone and screen audio streams into a single mixed output.
 */
export const useAudioMixer = ({
  micEnabled,
  screenEnabled,
  micStream,
  screenStream,
}: AudioMixerConfig) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixerNodeRef = useRef<GainNode | null>(null);
  const audioSourcesRef = useRef<MediaStreamAudioSourceNode[]>([]);
  const mixedAudioStreamRef = useRef<MediaStream | null>(null);

  // Initialize persistent audio mixing setup
  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create a gain node for mixing
        mixerNodeRef.current = audioContextRef.current.createGain();
        mixerNodeRef.current.gain.value = 1.0;

        // Create a media stream destination
        const destination = audioContextRef.current.createMediaStreamDestination();
        mixerNodeRef.current.connect(destination);

        mixedAudioStreamRef.current = destination.stream;
      } catch (error) {
        console.error("Failed to create audio context:", error);
      }
    }

    return () => {
      // Cleanup audio context on unmount
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle audio sources and mixing
  const updateAudioMixing = useCallback(() => {
    if (!audioContextRef.current || !mixerNodeRef.current) return;

    // Disconnect all existing sources
    audioSourcesRef.current.forEach((source) => {
      try {
        source.disconnect();
      } catch (e) {
        // Source may already be disconnected
      }
    });
    audioSourcesRef.current = [];

    // Connect current audio streams
    const currentAudioStreams = [
      ...(micEnabled && micStream ? [micStream] : []),
      ...(screenEnabled && screenStream ? [screenStream] : []),
    ];

    currentAudioStreams.forEach((stream) => {
      try {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          const source = audioContextRef.current!.createMediaStreamSource(stream);
          source.connect(mixerNodeRef.current!);
          audioSourcesRef.current.push(source);
        }
      } catch (error) {
        console.error("Error connecting audio source:", error);
      }
    });
  }, [micEnabled, micStream, screenEnabled, screenStream]);

  /**
   * Executes the function only when the function itself changes
   * Since the function only changes when its dependencies change,
   * this effectively runs when dependencies change
   */
  useEffect(() => {
    updateAudioMixing();
  }, [updateAudioMixing]);

  useEffect(() => {
    return () => {
      audioSourcesRef.current.forEach((source) => {
        try {
          source.disconnect();
        } catch (e) {
          // Error means source already disconnected
        }
      });
    };
  }, []);

  return {
    mixedAudioStream: mixedAudioStreamRef.current,
    audioContext: audioContextRef.current,
    updateAudioMixing,
  };
};
