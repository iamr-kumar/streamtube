import { FfmpegManager } from "./services/FfmpegManager";

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

export interface WebSocketMessage {
  type: "stream-start" | "stream-stop" | "stream-data" | "stream-config" | "connection" | "error";
  payload?: any;
  streamId?: string;
  timestamp?: number;
}

export interface StreamSession {
  id: string;
  config: StreamConfig;
  isActive: boolean;
  startTime: Date;
  ffmpegProcess: FfmpegManager | null;
  lastHeartBeat: Date;
}

export interface FfmpegStats {
  frame: number;
  fps: number;
  bitrate: string;
  totalSize: string;
  outTimeUs: number;
  dupFrames: number;
  dropFrames: number;
  speed: string;
  progress: string;
}
