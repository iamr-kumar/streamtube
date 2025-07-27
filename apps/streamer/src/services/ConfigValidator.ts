import { StreamConfig } from "../types";

export class ConfigValidator {
  public static validateConfig(config: Partial<StreamConfig>): {
    isValid: boolean;
    errors: string[];
    sanitizedConfig?: StreamConfig;
  } {
    const errors: string[] = [];
    if (!config.rtmpUrl) {
      errors.push("RTMP URL is required");
    } else if (!this.validUrl(config.rtmpUrl)) {
      errors.push("Invalid RTMP URL format");
    }

    if (!config.streamKey) {
      errors.push("Stream key is required");
    } else if (config.streamKey.length < 5) {
      errors.push("Stream key must be at least 5 characters long");
    }

    const resolution = config.resolution || { width: 1920, height: 1080 };
    if (resolution.width < 320 || resolution.width > 3840) {
      errors.push("Width must be between 320 and 3840 pixels");
    }
    if (resolution.height < 180 || resolution.height > 2160) {
      errors.push("Height must be between 180 and 2160 pixels");
    }

    // Frame rate validation
    const frameRate = config.frameRate || 30;
    if (frameRate < 15 || frameRate > 60) {
      errors.push("Frame rate must be between 15 and 60 FPS");
    }

    // Bitrate validation
    const bitrate = config.bitrate || 2500;
    if (bitrate < 500 || bitrate > 10000) {
      errors.push("Bitrate must be between 500 and 10000 kbps");
    }

    // Audio settings validation
    const audioSampleRate = config.audioSampleRate || 44100;
    const validSampleRates = [44100, 48000, 96000];
    if (!validSampleRates.includes(audioSampleRate)) {
      errors.push("Audio sample rate must be one of 44100, 48000, or 96000 Hz");
    }

    const audioChannels = config.audioChannels || 2;
    if (audioChannels < 1 || audioChannels > 2) {
      errors.push("Audio channels must be either 1 (mono) or 2 (stereo)");
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Sanitize and return the validated config
    const sanitizedConfig: StreamConfig = {
      rtmpUrl: config.rtmpUrl!,
      streamKey: config.streamKey!,
      resolution: {
        width: resolution.width,
        height: resolution.height,
      },
      frameRate: frameRate,
      bitrate: bitrate,
      audioSampleRate: audioSampleRate,
      audioChannels: audioChannels,
    };

    return { isValid: true, errors: [], sanitizedConfig };
  }

  private static validUrl(url: string): boolean {
    const regex = /^(rtmp|rtmps|ftp|http|https):\/\/[^ "]+$/;
    return regex.test(url);
  }
}
