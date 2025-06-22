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
