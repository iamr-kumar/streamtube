import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { StreamConfig, StreamSession, WebSocketMessage } from "../types";
import { FfmpegManager } from "./FfmpegManager";

export class StreamManager {
  private static instance: StreamManager;
  private sessions = new Map<string, StreamSession>();
  private wsToSession = new Map<WebSocket, string>();
  private heartBeatInterval: NodeJS.Timeout;

  // Singleton pattern to ensure only one instance of StreamManager
  public static getInstance(): StreamManager {
    if (!StreamManager.instance) {
      StreamManager.instance = new StreamManager();
    }
    return StreamManager.instance;
  }

  constructor() {
    this.heartBeatInterval = setInterval(() => {
      this.checkHeartBeats();
    }, 30000); // Check heartbeats every 30 seconds
  }

  public createSession(ws: WebSocket, config: StreamConfig): string {
    const sessionId = uuidv4();
    const session: StreamSession = {
      id: sessionId,
      config,
      isActive: false,
      startTime: new Date(),
      ffmpegProcess: null,
      lastHeartBeat: new Date(),
    };

    this.sessions.set(sessionId, session);
    this.wsToSession.set(ws, sessionId);

    console.log(`Created new stream session: ${sessionId}`);
    console.log(`Session config: ${JSON.stringify(config)}`);

    return sessionId;
  }

  public startStream(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return false;
    }

    if (session.isActive) {
      console.warn(`Stream session ${sessionId} is already active`);
      return false;
    }

    try {
      const ffmpegManager = new FfmpegManager(session.config, sessionId, {
        onStats: (stats: any) => {
          console.log(`FFmpeg stats for session ${sessionId}:`, stats);
        },
        onError: (error: string) => {
          console.error(`FFmpeg error for session ${sessionId}:`, error);
        },
        onEnd: () => {
          console.log(`FFmpeg process ended for session ${sessionId}`);
          this.stopStream(sessionId);
        },
      });

      if (ffmpegManager.start()) {
        session.ffmpegProcess = ffmpegManager;
        session.isActive = true;
        session.startTime = new Date();
        console.log(`Started stream session: ${sessionId}`);
        return true;
      } else {
        console.error(`Failed to start FFmpeg process for session ${sessionId}`);
        return false;
      }
    } catch (error) {
      console.error(`Error starting stream for session ${sessionId}:`, error);
      return false;
    }
  }

  public stopStream(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return false;
    }

    if (!session.isActive) {
      console.warn(`Stream session ${sessionId} is not active`);
      return false;
    }

    try {
      if (session.ffmpegProcess) {
        session.ffmpegProcess.stop();
        console.log(`Stopped FFmpeg process for session ${sessionId}`);
        session.ffmpegProcess = null;
      }
      session.isActive = false;
      this.broadcastToSession(sessionId, {
        type: "stream-data",
        payload: { type: "stopped" },
      });
      return true;
    } catch (error) {
      console.error(`Error stopping stream for session ${sessionId}:`, error);
      return false;
    }
  }

  public wrtieStreamData(sessionId: string, data: Buffer): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive || !session.ffmpegProcess) {
      console.error(`Session ${sessionId} is not active or does not have an FFmpeg process`);
      return false;
    }

    try {
      session.lastHeartBeat = new Date();
      return session.ffmpegProcess.writeData(data);
    } catch (error) {
      console.error(`Error writing stream data for session ${sessionId}:`, error);
      return false;
    }
  }

  public removeSession(ws: WebSocket): void {
    const sessionId = this.wsToSession.get(ws);
    if (!sessionId) {
      console.warn("WebSocket not associated with any session");
      return;
    }

    console.log(`Removing stream session: ${sessionId}`);

    this.stopStream(sessionId);

    // Cleanup
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

  public getActivStreams(): StreamSession[] {
    return Array.from(this.sessions.values()).filter((session) => session.isActive);
  }

  private broadcastToSession(sessionId: string, message: WebSocketMessage): void {
    for (const [ws, id] of this.wsToSession.entries()) {
      if (id === sessionId) {
        try {
          ws.send(
            JSON.stringify({
              ...message,
              streamId: sessionId,
              timestamp: new Date(),
            })
          );
        } catch (error) {
          console.error(`Error sending message to session ${sessionId}:`, error);
        }
        break;
      }
    }
  }

  public updateHeartBeat(ws: WebSocket): void {
    const sessionId = this.wsToSession.get(ws);
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastHeartBeat = new Date();
        console.log(`Updated heartbeat for session ${sessionId}`);
      }
    }
  }

  private checkHeartBeats(): void {
    const now = new Date();
    const threshold = 60000; // 1 minute

    for (const [ws, sessionId] of this.wsToSession.entries()) {
      const session = this.sessions.get(sessionId);
      if (session) {
        const timeSinceHeartBeat = now.getTime() - session.lastHeartBeat.getTime();
        if (timeSinceHeartBeat > threshold) {
          console.log(`Session ${sessionId} has timed out, removing it`);
          // Forcefully close the WebSocket connection
          ws.terminate();
          this.removeSession(ws);
        }
      }
    }
  }

  public destroy(): void {
    for (const session of this.sessions.values()) {
      if (session.isActive) {
        this.stopStream(session.id);
      }
    }

    if (this.heartBeatInterval) {
      clearInterval(this.heartBeatInterval);
    }

    for (const ws of this.wsToSession.keys()) {
      ws.terminate();
    }

    this.sessions.clear();
    this.wsToSession.clear();
    console.log("StreamManager destroyed and all sessions cleared.");
  }
}
