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

export interface StreamInfo {
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

export enum StreamStatus {
  DISCONNECTED = "disconnected",
  CONFIGURED = "configured",
  CONNECTED = "connected",
  STREAMING = "streaming",
  ERROR = "error",
}

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

export interface StreamMessage {
  type:
    | "connection"
    | "stream-config"
    | "stream-start"
    | "stream-stop"
    | "stream-data"
    | "stream-error";
  payload: Record<string, unknown>;
  sessionId?: string;
  timestamp: number;
}

export interface StreamServerCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
  onStreamStarted?: (sessionId: string) => void;
  onStreamStopped?: (sessionId: string) => void;
  onConfigUpdate?: (sessionId: string | null, config: StreamConfig) => void;
}
