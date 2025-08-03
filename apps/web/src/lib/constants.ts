// Video configuration constants
export const VIDEO_CONFIG = {
  CANVAS: {
    WIDTH: 1280,
    HEIGHT: 720,
    FPS: 25,
  },
  CAMERA: {
    WIDTH: { ideal: 1280 },
    HEIGHT: { ideal: 720 },
    FRAME_RATE: { ideal: 25 },
  },
  SCREEN: {
    WIDTH: { ideal: 1280 },
    HEIGHT: { ideal: 720 },
    FRAME_RATE: { ideal: 25 },
  },
} as const;

// Recording configuration constants
export const RECORDING_CONFIG = {
  VIDEO_BITRATE: 2500000, // 2.5 Mbps
  AUDIO_BITRATE: 128000, // 128 kbps
  CHUNK_SIZE: 100, // milliseconds
} as const;

// Supported MIME types in order of preference
export const SUPPORTED_MIME_TYPES = [
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp8",
  "video/webm",
] as const;

// Canvas drawing constants
export const CANVAS_CONFIG = {
  BACKGROUND_COLOR: "#1a1a1a",
  PLACEHOLDER_COLOR: "#374151",
  TEXT_COLOR: "#9CA3AF",
  FONT: "24px sans-serif",
  PIP_SIZE_RATIO: 0.2,
  PIP_MAX_SIZE: 200,
  PIP_MARGIN: 20,
  VIGNETTE_RADIUS_RATIO: 0.7,
} as const;
