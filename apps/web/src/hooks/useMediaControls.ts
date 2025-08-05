import { useState } from "react";

interface MediaControlsState {
  cameraEnabled: boolean;
  micEnabled: boolean;
  screenEnabled: boolean;
}

/**
 * Custom hook for managing media control states (camera, microphone, screen sharing).
 * Provides toggle functions and state management for streaming controls.
 */
export const useMediaControls = (initialState: Partial<MediaControlsState> = {}) => {
  const [cameraEnabled, setCameraEnabled] = useState(initialState.cameraEnabled ?? true);
  const [micEnabled, setMicEnabled] = useState(initialState.micEnabled ?? true);
  const [screenEnabled, setScreenEnabled] = useState(initialState.screenEnabled ?? false);

  const toggleCamera = () => setCameraEnabled((prev) => !prev);
  const toggleMic = () => setMicEnabled((prev) => !prev);
  const toggleScreen = () => setScreenEnabled((prev) => !prev);

  const resetControls = () => {
    setCameraEnabled(true);
    setMicEnabled(true);
    setScreenEnabled(false);
  };

  return {
    cameraEnabled,
    micEnabled,
    screenEnabled,
    setCameraEnabled,
    setMicEnabled,
    setScreenEnabled,
    toggleCamera,
    toggleMic,
    toggleScreen,
    resetControls,
  };
};
