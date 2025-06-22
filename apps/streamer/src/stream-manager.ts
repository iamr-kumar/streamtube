import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { StreamSession, StreamConfig, WebSocketMessage } from "./types";
import { FFmpegManager } from "./ffmpeg-manager";

export class StreamManager {
  private sessions = new Map<string, StreamSession>();
  private wsToSession = new Map<WebSocket, string>();
  private heartbeatInterval: NodeJS.Timeout;

  constructor() {
    // Start heartbeat checker
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, 30000); // Check every 30 seconds
  }

  public createSession(ws: WebSocket, config: StreamConfig): string {
    const sessionId = uuidv4();

    const session: StreamSession = {
      id: sessionId,
      config,
      isActive: false,
      startTime: new Date(),
      lastHeartbeat: new Date(),
    };

    this.sessions.set(sessionId, session);
    this.wsToSession.set(ws, sessionId);

    console.log(`Created stream session: ${sessionId}`);
    console.log(`Session config:`, config);

    return sessionId;
  }

  public startStream(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`Session not found: ${sessionId}`);
      return false;
    }

    if (session.isActive) {
      console.warn(`Stream already active for session: ${sessionId}`);
      return true;
    }

    try {
      const ffmpegManager = new FFmpegManager(session.config, sessionId, {
        onStats: (stats: any) => {
          console.log(`Stream stats for ${sessionId}:`, stats);
          this.broadcastToSession(sessionId, {
            type: "stream-data",
            payload: { type: "stats", data: stats },
          });
        },
        onError: (error: any) => {
          console.error(`FFmpeg error for ${sessionId}:`, error);
          this.broadcastToSession(sessionId, {
            type: "stream-data",
            payload: { type: "error", data: error },
          });
          this.stopStream(sessionId);
        },
        onEnd: () => {
          console.log(`FFmpeg ended for session: ${sessionId}`);
          this.stopStream(sessionId);
        },
      });

      if (ffmpegManager.start()) {
        session.ffmpegProcess = ffmpegManager;
        session.isActive = true;
        session.startTime = new Date();

        console.log(`Stream started for session: ${sessionId}`);
        return true;
      } else {
        console.error(`Failed to start FFmpeg for session: ${sessionId}`);
        return false;
      }
    } catch (error) {
      console.error(`Error starting stream for ${sessionId}:`, error);
      return false;
    }
  }

  public stopStream(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`Session not found: ${sessionId}`);
      return false;
    }

    if (!session.isActive) {
      console.warn(`Stream not active for session: ${sessionId}`);
      return true;
    }

    try {
      if (session.ffmpegProcess) {
        session.ffmpegProcess.stop();
        session.ffmpegProcess = undefined;
      }

      session.isActive = false;
      console.log(`Stream stopped for session: ${sessionId}`);

      this.broadcastToSession(sessionId, {
        type: "stream-data",
        payload: { type: "stopped" },
      });

      return true;
    } catch (error) {
      console.error(`Error stopping stream for ${sessionId}:`, error);
      return false;
    }
  }

  public writeStreamData(sessionId: string, data: Buffer): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive || !session.ffmpegProcess) {
      console.warn(`Cannot write data - session not active: ${sessionId}`);
      return false;
    }

    try {
      session.lastHeartbeat = new Date();
      return session.ffmpegProcess.writeData(data);
    } catch (error) {
      console.error(`Error writing stream data for ${sessionId}:`, error);
      return false;
    }
  }

  public removeSession(ws: WebSocket): void {
    const sessionId = this.wsToSession.get(ws);
    if (!sessionId) return;

    console.log(`Removing session: ${sessionId}`);

    // Stop stream if active
    this.stopStream(sessionId);

    // Clean up
    this.sessions.delete(sessionId);
    this.wsToSession.delete(ws);
  }

  public getSession(sessionId: string): StreamSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getSessionByWebSocket(ws: WebSocket): StreamSession | undefined {
    const sessionId = this.wsToSession.get(ws);
    return sessionId ? this.sessions.get(sessionId) : undefined;
  }

  public getAllSessions(): StreamSession[] {
    return Array.from(this.sessions.values());
  }

  public getActiveStreams(): StreamSession[] {
    return Array.from(this.sessions.values()).filter((session) => session.isActive);
  }

  public updateHeartbeat(ws: WebSocket): void {
    const sessionId = this.wsToSession.get(ws);
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastHeartbeat = new Date();
      }
    }
  }

  private broadcastToSession(sessionId: string, message: WebSocketMessage): void {
    // Find WebSocket for this session
    for (const [ws, id] of this.wsToSession.entries()) {
      if (id === sessionId && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(
            JSON.stringify({
              ...message,
              streamId: sessionId,
              timestamp: Date.now(),
            })
          );
        } catch (error) {
          console.error(`Error sending message to session ${sessionId}:`, error);
        }
        break;
      }
    }
  }

  private checkHeartbeats(): void {
    const now = new Date();
    const timeout = 60000; // 60 seconds timeout

    for (const [ws, sessionId] of this.wsToSession.entries()) {
      const session = this.sessions.get(sessionId);
      if (session) {
        const timeSinceHeartbeat = now.getTime() - session.lastHeartbeat.getTime();

        if (timeSinceHeartbeat > timeout) {
          console.log(`Session ${sessionId} timed out, removing...`);
          ws.terminate();
          this.removeSession(ws);
        }
      }
    }
  }

  public destroy(): void {
    // Stop all active streams
    for (const session of this.sessions.values()) {
      if (session.isActive) {
        this.stopStream(session.id);
      }
    }

    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all WebSocket connections
    for (const ws of this.wsToSession.keys()) {
      ws.terminate();
    }

    // Clear all data
    this.sessions.clear();
    this.wsToSession.clear();

    console.log("StreamManager destroyed");
  }
}
