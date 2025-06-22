/**
 * Logger utility for the streaming server
 * Provides structured logging with different levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private logLevel: LogLevel;
  private serviceName: string;

  constructor(serviceName = "StreamingServer", logLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.logLevel = logLevel;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}] [${this.serviceName}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: any): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(this.formatMessage("DEBUG", message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(this.formatMessage("INFO", message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage("WARN", message, meta));
    }
  }

  error(message: string, meta?: any): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(this.formatMessage("ERROR", message, meta));
    }
  }

  // Specific logging methods for streaming events
  streamEvent(event: string, sessionId: string, meta?: any): void {
    this.info(`Stream Event: ${event}`, { sessionId, ...meta });
  }

  ffmpegEvent(event: string, sessionId: string, meta?: any): void {
    this.debug(`FFmpeg Event: ${event}`, { sessionId, ...meta });
  }

  wsEvent(event: string, remoteAddress?: string, meta?: any): void {
    this.debug(`WebSocket Event: ${event}`, { remoteAddress, ...meta });
  }

  performance(operation: string, duration: number, sessionId?: string): void {
    this.info(`Performance: ${operation} took ${duration}ms`, { sessionId });
  }
}

// Create singleton logger instance
export const logger = new Logger(
  "StreamTube",
  process.env.LOG_LEVEL === "debug" ? LogLevel.DEBUG : LogLevel.INFO
);
