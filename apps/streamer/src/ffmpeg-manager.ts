import { spawn, ChildProcess } from "child_process";
import { StreamConfig, FFmpegStats } from "./types";
import { logger } from "./logger";

export class FFmpegManager {
  private process: ChildProcess | null = null;
  private inputBuffer: Buffer[] = [];
  private isProcessing = false;
  private config: StreamConfig;
  private onStats?: (stats: FFmpegStats) => void;
  private onError?: (error: string) => void;
  private onEnd?: () => void;
  private sessionId: string;
  private startTime?: Date;
  private lastStatsTime = 0;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(
    config: StreamConfig,
    sessionId: string,
    callbacks: {
      onStats?: (stats: FFmpegStats) => void;
      onError?: (error: string) => void;
      onEnd?: () => void;
    } = {}
  ) {
    this.config = config;
    this.sessionId = sessionId;
    this.onStats = callbacks.onStats;
    this.onError = callbacks.onError;
    this.onEnd = callbacks.onEnd;
  }

  public start(): boolean {
    try {
      this.startTime = new Date();
      const ffmpegArgs = this.buildFFmpegArgs();

      logger.ffmpegEvent("starting", this.sessionId, {
        args: ffmpegArgs.join(" "),
        config: this.config,
      });

      this.process = spawn("ffmpeg", ffmpegArgs, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.setupProcessHandlers();
      this.isProcessing = true;

      logger.ffmpegEvent("started", this.sessionId);
      return true;
    } catch (error) {
      logger.error("Failed to start FFmpeg:", { sessionId: this.sessionId, error });
      this.onError?.(`Failed to start FFmpeg: ${error}`);
      return false;
    }
  }

  public writeData(data: Buffer): boolean {
    if (!this.process || !this.process.stdin || !this.isProcessing) {
      logger.warn("FFmpeg process not ready, buffering data", {
        sessionId: this.sessionId,
        bufferSize: this.inputBuffer.length,
        dataSize: data.length,
      });

      // Limit buffer size to prevent memory issues
      if (this.inputBuffer.length < 100) {
        this.inputBuffer.push(data);
      } else {
        logger.warn("Input buffer full, dropping data", { sessionId: this.sessionId });
        return false;
      }
      return false;
    }

    try {
      // Flush any buffered data first
      while (this.inputBuffer.length > 0) {
        const bufferedData = this.inputBuffer.shift();
        if (bufferedData) {
          this.process.stdin.write(bufferedData);
        }
      }

      // Write current data
      const success = this.process.stdin.write(data);

      if (!success) {
        logger.warn("FFmpeg stdin buffer full", {
          sessionId: this.sessionId,
          dataSize: data.length,
        });
      }

      return success;
    } catch (error) {
      logger.error("Error writing to FFmpeg stdin:", {
        sessionId: this.sessionId,
        error,
        dataSize: data.length,
      });
      this.onError?.(`Error writing data: ${error}`);
      return false;
    }
  }

  public stop(): void {
    if (!this.process) return;

    logger.ffmpegEvent("stopping", this.sessionId);
    this.isProcessing = false;

    try {
      // Close stdin to signal end of input
      if (this.process.stdin) {
        this.process.stdin.end();
      }

      // Send SIGTERM for graceful shutdown
      this.process.kill("SIGTERM");

      // Force kill after timeout
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          logger.warn("Force killing FFmpeg process", { sessionId: this.sessionId });
          this.process.kill("SIGKILL");
        }
      }, 5000);
    } catch (error) {
      logger.error("Error stopping FFmpeg:", { sessionId: this.sessionId, error });
    }
  }

  private buildFFmpegArgs(): string[] {
    const { rtmpUrl, streamKey, resolution, frameRate, bitrate, audioSampleRate, audioChannels } =
      this.config;

    return [
      // Input configuration
      "-f",
      "webm",
      "-i",
      "-", // Read from stdin

      // Video codec settings
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-tune",
      "zerolatency",
      "-profile:v",
      "baseline",
      "-level",
      "3.1",

      // Video quality settings
      "-b:v",
      `${bitrate}k`,
      "-maxrate",
      `${Math.floor(bitrate * 1.2)}k`,
      "-bufsize",
      `${Math.floor(bitrate * 2)}k`,
      "-g",
      String(frameRate * 2), // Keyframe interval
      "-keyint_min",
      String(frameRate),
      "-sc_threshold",
      "0",

      // Video format settings
      "-s",
      `${resolution.width}x${resolution.height}`,
      "-r",
      String(frameRate),
      "-pix_fmt",
      "yuv420p",

      // Audio codec settings
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ar",
      String(audioSampleRate),
      "-ac",
      String(audioChannels),
      "-af",
      "aresample=async=1:min_hard_comp=0.100000:first_pts=0",

      // Output format
      "-f",
      "flv",
      "-flvflags",
      "no_duration_filesize",

      // Streaming optimizations
      "-avoid_negative_ts",
      "make_zero",
      "-fflags",
      "+genpts",
      "-flags",
      "+global_header",

      // Progress and error handling
      "-progress",
      "pipe:2",
      "-v",
      "info",
      "-stats",

      // Output URL
      `${rtmpUrl}/${streamKey}`,
    ];
  }

  private setupProcessHandlers(): void {
    if (!this.process) return;

    this.process.stdout?.on("data", (data) => {
      console.log("FFmpeg stdout:", data.toString());
    });

    this.process.stderr?.on("data", (data) => {
      const output = data.toString();

      // Parse FFmpeg stats
      if (output.includes("frame=")) {
        const stats = this.parseFFmpegStats(output);
        if (stats) {
          this.onStats?.(stats);
        }
      }

      // Log other stderr output
      if (!output.includes("frame=") && !output.includes("progress=")) {
        console.log("FFmpeg stderr:", output);
      }
    });

    this.process.on("close", (code) => {
      console.log(`FFmpeg process closed with code: ${code}`);
      this.isProcessing = false;
      this.process = null;
      this.onEnd?.();
    });

    this.process.on("error", (error) => {
      console.error("FFmpeg process error:", error);
      this.isProcessing = false;
      this.onError?.(`FFmpeg error: ${error.message}`);
    });

    // Handle process crashes
    this.process.on("exit", (code, signal) => {
      console.log(`FFmpeg process exited with code ${code} and signal ${signal}`);
      this.isProcessing = false;

      if (code !== 0 && code !== null) {
        this.onError?.(`FFmpeg exited with code ${code}`);
      }
    });
  }

  private parseFFmpegStats(output: string): FFmpegStats | null {
    try {
      const lines = output.split("\n");
      const stats: Partial<FFmpegStats> = {};

      for (const line of lines) {
        if (line.includes("frame=")) {
          const frameMatch = line.match(/frame=\s*(\d+)/);
          if (frameMatch) stats.frame = parseInt(frameMatch[1]);

          const fpsMatch = line.match(/fps=\s*([\d.]+)/);
          if (fpsMatch) stats.fps = parseFloat(fpsMatch[1]);

          const bitrateMatch = line.match(/bitrate=\s*([\d.]+\w*)/);
          if (bitrateMatch) stats.bitrate = bitrateMatch[1];

          const sizeMatch = line.match(/size=\s*(\d+\w*)/);
          if (sizeMatch) stats.totalSize = sizeMatch[1];

          const speedMatch = line.match(/speed=\s*([\d.]+x)/);
          if (speedMatch) stats.speed = speedMatch[1];
        }

        if (line.includes("progress=")) {
          const progressMatch = line.match(/progress=(\w+)/);
          if (progressMatch) stats.progress = progressMatch[1];
        }
      }

      return stats as FFmpegStats;
    } catch (error) {
      console.error("Error parsing FFmpeg stats:", error);
      return null;
    }
  }

  public isRunning(): boolean {
    return this.isProcessing && this.process !== null;
  }

  public getConfig(): StreamConfig {
    return { ...this.config };
  }
}
