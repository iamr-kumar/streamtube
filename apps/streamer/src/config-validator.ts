import { StreamConfig } from "./types";

export class ConfigValidator {
  public static validateStreamConfig(config: Partial<StreamConfig>): {
    isValid: boolean;
    errors: string[];
    sanitizedConfig?: StreamConfig;
  } {
    const errors: string[] = [];

    // Required fields
    if (!config.rtmpUrl) {
      errors.push("RTMP URL is required");
    } else if (!this.isValidUrl(config.rtmpUrl)) {
      errors.push("Invalid RTMP URL format");
    }

    if (!config.streamKey) {
      errors.push("Stream key is required");
    } else if (config.streamKey.length < 10) {
      errors.push("Stream key must be at least 10 characters");
    }

    // Resolution validation
    const resolution = config.resolution || { width: 1920, height: 1080 };
    if (resolution.width < 480 || resolution.width > 3840) {
      errors.push("Resolution width must be between 480 and 3840");
    }
    if (resolution.height < 360 || resolution.height > 2160) {
      errors.push("Resolution height must be between 360 and 2160");
    }

    // Frame rate validation
    const frameRate = config.frameRate || 30;
    if (frameRate < 15 || frameRate > 60) {
      errors.push("Frame rate must be between 15 and 60");
    }

    // Bitrate validation
    const bitrate = config.bitrate || 2500;
    if (bitrate < 500 || bitrate > 10000) {
      errors.push("Bitrate must be between 500 and 10000 kbps");
    }

    // Audio validation
    const audioSampleRate = config.audioSampleRate || 44100;
    const validSampleRates = [22050, 44100, 48000];
    if (!validSampleRates.includes(audioSampleRate)) {
      errors.push("Audio sample rate must be 22050, 44100, or 48000");
    }

    const audioChannels = config.audioChannels || 2;
    if (audioChannels < 1 || audioChannels > 2) {
      errors.push("Audio channels must be 1 or 2");
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Return sanitized config
    const sanitizedConfig: StreamConfig = {
      rtmpUrl: config.rtmpUrl!,
      streamKey: config.streamKey!,
      resolution,
      frameRate,
      bitrate,
      audioSampleRate,
      audioChannels,
    };

    return { isValid: true, errors: [], sanitizedConfig };
  }

  private static isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "rtmp:" || parsedUrl.protocol === "rtmps:";
    } catch {
      return false;
    }
  }

  public static getOptimalBitrate(resolution: { width: number; height: number }): number {
    const pixels = resolution.width * resolution.height;

    if (pixels <= 480 * 360) return 800; // 360p
    if (pixels <= 854 * 480) return 1200; // 480p
    if (pixels <= 1280 * 720) return 2000; // 720p
    if (pixels <= 1920 * 1080) return 3000; // 1080p
    return 5000; // 4K+
  }

  public static getRecommendedSettings(
    targetQuality: "low" | "medium" | "high"
  ): Partial<StreamConfig> {
    switch (targetQuality) {
      case "low":
        return {
          resolution: { width: 1280, height: 720 },
          frameRate: 30,
          bitrate: 1500,
          audioSampleRate: 44100,
          audioChannels: 2,
        };
      case "medium":
        return {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          bitrate: 2500,
          audioSampleRate: 44100,
          audioChannels: 2,
        };
      case "high":
        return {
          resolution: { width: 1920, height: 1080 },
          frameRate: 60,
          bitrate: 4000,
          audioSampleRate: 48000,
          audioChannels: 2,
        };
      default:
        return {};
    }
  }
}
