export enum PrivacyStatus {
  PUBLIC = "public",
  UNLISTED = "unlisted",
  PRIVATE = "private",
}

export interface CreateBroadcastRequest {
  title: string;
  description?: string;
  privacyStatus: PrivacyStatus;
}

export interface CreateBroadcastResponse {
  success: boolean;
  broadcast: {
    id: string;
    title: string;
    description: string;
    privacyStatus: PrivacyStatus;
    url: string;
  };
  stream: {
    id: string;
    title: string;
    rtmpUrl: string;
    streamKey: string;
  };
}

export type ApiErrorResult = {
  error: string;
};

export interface StreamConfig {
  rtmpUrl: string;
  streamKey: string;
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  bitrate: number;
  audioSampleRate: number;
  audioChannels: number;
}

export interface StreamStats {
  frame: number;
  fps: number;
  bitrate: string;
  totalSize: string;
  speed: string;
  progress: string;
}

export interface StreamServerMessage {
  type:
    | "connection"
    | "stream-config"
    | "stream-start"
    | "stream-stop"
    | "stream-data"
    | "error"
    | "pong";
  payload: Record<string, unknown>;
  streamId?: string;
  timestamp: number;
}

export interface StreamServerCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
  onStreamStarted?: (sessionId: string) => void;
  onStreamStopped?: () => void;
  onStreamStats?: (stats: StreamStats) => void;
  onConfigured?: (sessionId: string, config: StreamConfig) => void;
}

export type StreamStatus = "disconnected" | "connected" | "configured" | "streaming" | "error";
