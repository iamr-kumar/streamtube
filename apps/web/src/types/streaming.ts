export enum PrivacyStatus {
  PUBLIC = "public",
  UNLISTED = "unlisted",
  PRIVATE = "private",
}

export interface YouTubeError {
  error: {
    code: number;
    message: string;
    errors: Array<{
      domain: string;
      reason: string;
      message: string;
    }>;
  };
}

export interface BroadcastSnippet {
  title: string;
  description: string;
  scheduledStartTime: string;
  thumbnails: Record<string, { url: string; width: number; height: number }>;
  liveChatId: string;
}

export interface BroadcastStatus {
  privacyStatus: PrivacyStatus;
  lifeCycleStatus: string;
  selfDeclaredMadeForKids: boolean;
  recordingStatus: string;
}

export interface BroadcastContentDetails {
  boundStreamId: string;
  monitorStream: {
    enableMonitorStream: boolean;
    broadcastStreamDelayMs: number;
  };
  enableAutoStart: boolean;
  enableAutoStop: boolean;
}

export interface YouTubeBroadcast {
  id: string;
  kind: string;
  etag: string;
  snippet: BroadcastSnippet;
  status: BroadcastStatus;
  contentDetails: BroadcastContentDetails;
}

export interface YouTubeStream {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    title: string;
    description: string;
  };
  cdn: {
    format: string;
    ingestionType: string;
    ingestionInfo: {
      ingestionAddress: string;
      streamName: string;
      backupIngestionAddress: string;
    };
  };
}

export interface StreamRequestBody {
  title: string;
  description?: string;
  privacyStatus: PrivacyStatus;
}

export interface StreamResponse {
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

export type ApiErrorResult = { error: string };
