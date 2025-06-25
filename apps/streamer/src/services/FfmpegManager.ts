import { spawn, ChildProcess } from "child_process";
import { FfmpegStats, StreamConfig } from "../types";

/**
 * FfmpegManager is responsible for managing the ffmpeg process for streaming.
 * It handles starting, stopping, and writing data to the ffmpeg process,
 * as well as parsing ffmpeg output for statistics and progress updates.
 * This class is designed to provides a simple interface for
 * streaming video/audio data to an RTMP server.
 */
export class FfmpegManager {
  private process: ChildProcess | null = null;
  // Temprorily store input buffers until ffmpeg is ready
  private inputBuffer: Buffer[] = [];
  private isProcessing = false;
  private config: StreamConfig;
  private onStats?: (stats: FfmpegStats) => void;
  private onError?: (error: string) => void;
  private onEnd?: () => void;
  private sessionId: string;
  private startTime: Date | null = null;
  private lastStatsTime = 0;

  constructor(
    config: StreamConfig,
    sessionId: string,
    callbacks: {
      onStats?: (stats: FfmpegStats) => void;
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

  /**
   * Starts the ffmpeg process with the configured settings.
   * This method builds the ffmpeg command arguments based on the provided configuration,
   * spawns the ffmpeg process, and sets up the necessary event handlers for stdout, stderr, and process events.
   * It also initializes the start time for the session.
   * @returns true if the ffmpeg process was started successfully, false otherwise.
   */
  public start(): boolean {
    try {
      this.startTime = new Date();
      const ffmpegArgs = this.buildFfmpegArgs();

      // Spwan the ffmpeg process
      this.process = spawn("ffmpeg", ffmpegArgs, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.setupProcessHandlers();
      this.isProcessing = true;

      return true;
    } catch (error) {
      console.error(`Error starting ffmpeg process: ${error}`);
      return false;
    }
  }

  /**
   * Write data to the ffmpeg process stdin.
   * If the ffmpeg process is not ready or the stdin is not available, it buffers
   * the data until the process is ready.
   * If the input buffer exceeds a certain size (100 items), it drops the data.
   * This method is used to send video/audio data to the ffmpeg process for streaming.
   * @param data - The data to write to the ffmpeg process stdin.
   * @returns true if the data was successfully written, false if the ffmpeg process is not ready or the input buffer is full.
   */
  public writeData(data: Buffer): boolean {
    if (!this.process || !this.process.stdin || !this.isProcessing) {
      console.log(
        JSON.stringify({
          sessionId: this.sessionId,
          error: "FFmpeg process is not ready, buffering data",
          bufferSize: this.inputBuffer.length,
          dataSize: data.length,
        })
      );

      if (this.inputBuffer.length < 100) {
        this.inputBuffer.push(data);
        return true;
      } else {
        console.warn("Input buffer is full, dropping data");
        return false;
      }
    }

    try {
      // Flush any buffered data before writing new data
      while (this.inputBuffer.length > 0) {
        const bufferedData = this.inputBuffer.shift();
        if (bufferedData) {
          this.process.stdin.write(bufferedData);
        }
      }

      // Write the new data to ffmpeg stdin
      const sucess = this.process.stdin.write(data);
      if (!sucess) {
        console.warn("FFmpeg stdin write failed, dropping data");
      }

      return sucess;
    } catch (error) {
      console.error(`Error writing data to ffmpeg stdin: ${error}`);
      this.onError?.(`Error writing data: ${error}`);
      return false;
    }
  }

  /**
   * This method stops the ffmpeg process gracefully.
   * It sends a SIGTERM signal to the process, allowing it to finish processing any remaining data.
   * If the process does not exit after a timeout, it forcefully kills the process with SIGKILL.
   * It also clears the input buffer and resets the processing state.
   * This method is used to stop the streaming session and clean up resources.
   * It does not return a value, but it updates the internal state to indicate that processing has stopped.
   * @returns true if the ffmpeg process is currently processing data, false otherwise.
   */
  public stop(): void {
    if (!this.process) return;
    console.log(`Stopping ffmpeg process for session ${this.sessionId}`);
    this.isProcessing = false;

    try {
      if (this.process.stdin) {
        this.process.stdin.end();
      }

      // Send SIGTERM to gracefully stop ffmpeg
      // SIGTEMR allows ffmpeg to finish processing any remaining data
      this.process.kill("SIGTERM");

      // Force kill if it doesn't exit after a timeout
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          console.warn(`FFmpeg process did not exit, forcing kill for session ${this.sessionId}`);
          // SIGKILL forcefully kills the process
          this.process.kill("SIGKILL");
        }
      }, 5000); // Wait 5 seconds before force killing
    } catch (error) {
      console.error(`Error stopping ffmpeg process: ${error}`);
    }
  }

  private buildFfmpegArgs(): string[] {
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

      // Output URL to stream to YouTube or other RTMP server
      `${rtmpUrl}/${streamKey}`,
    ];
  }

  /**
   * This method sets up the event handlers for the ffmpeg process.
   * It listens for data on stdout and stderr, handles errors, and manages the process lifecycle.
   * It parses the ffmpeg output to extract statistics and progress updates, which are then passed
   * to the provided callback functions.
   * This method is called after the ffmpeg process is spawned to ensure that all events are
   * properly handled and that the application can respond to ffmpeg's output in real-time.
   * @returns void
   */
  private setupProcessHandlers(): void {
    if (!this.process) {
      console.error("FFmpeg process is not initialized");
      return;
    }

    this.process.stdout?.on("data", (data: Buffer) => {
      console.log(`FFmpeg stdout: ${data.toString()}`);
    });

    // Ref: https://nodejs.org/api/child_process.html#subprocessstdout
    this.process.stderr?.on("data", (data: Buffer) => {
      const output = data.toString();

      if (output.includes("frame=")) {
        const stats = this.parseFfmpegStates(output);
        if (stats) {
          this.onStats?.(stats);
          this.lastStatsTime = Date.now();
        }
      }

      if (!output.includes("frame=") && !output.includes("progress=")) {
        console.log("FFmpeg stderr:", output);
      }
    });

    // Ref: https://nodejs.org/api/child_process.html#event-error
    this.process.on("error", (error: Error) => {
      console.error(`FFmpeg process error: ${error.message}`);
      this.isProcessing = false;
      this.onError?.(`FFmpeg process error: ${error.message}`);
    });

    this.process.on("close", (code: number) => {
      console.log(`FFmpeg process closed with code ${code} for session ${this.sessionId}`);
      this.isProcessing = false;
      this.process = null;
      this.onEnd?.();
    });

    // Handle process crashes
    this.process.on("exit", (code: number, signal: string) => {
      console.log(
        `FFmpeg process exited with code ${code} and signal ${signal} for session ${this.sessionId}`
      );
      this.isProcessing = false;
      this.process = null;

      if (code != 0 && code !== null) {
        this.onError?.(`FFmpeg process exited with code ${code} and signal ${signal}`);
      }
    });
  }

  /**
   * This method parses the output from ffmpeg's stderr or progress output.
   * The output is of the form:
   * ```
   * frame= 123 fps= 30.0 bitrate= 1000k size= 500k speed= 1.0x
   * progress=end
   * ```
   * It extracts relevant statistics such as frame count, FPS, bitrate, total size, speed, and progress.
   * @param output The output string from ffmpeg's stderr or progress output.
   * @returns FfmpegStats object containing parsed statistics or null if parsing fails.
   */
  private parseFfmpegStates(output: string): FfmpegStats | null {
    try {
      const lines = output.split("\n");
      const stats: Partial<FfmpegStats> = {};

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

      return stats as FfmpegStats;
    } catch (error) {
      console.error(`Error parsing ffmpeg stats: ${error}`);
      return null;
    }
  }

  public isRunning(): boolean {
    return this.isProcessing && this.process !== null && !this.process.killed;
  }

  public getConfig(): StreamConfig {
    return { ...this.config };
  }
}
