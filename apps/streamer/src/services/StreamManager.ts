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

  private constructor() {
    this.heartBeatInterval = setInterval(() => {
      this.checkHeartBeats();
    }, 30000); // Check heartbeats every 30 seconds
  }

  /**
   * Creates a new stream session and associates it with the given WebSocket connection.
   * @param ws The WebSocket connection for the stream
   * @param config The configuration for the stream session
   * @returns A unique session ID for the created stream session
   */
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

  /**
   * Starts a stream session using FFmpeg.
   * This method initializes the FFmpeg process with the provided configuration and sets
   * it up to handle the stream data. It also sets up event handlers for
   * FFmpeg process events such as stats, errors, and end.
   * @param sessionId The unique identifier for the stream session to start
   * @returns true if the stream was started successfully, false otherwise
   */
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

  /**
   * Stops a stream session and cleans up the associated resources.
   * @param sessionId The unique identifier for the stream session to stop
   * @returns true if the stream was stopped successfully, false otherwise
   */
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

  /**
   * Writes data to the active stream session and internally passes onto the FFmpeg process.
   * @param sessionId The unique identifier for the stream session to write data to
   * @param data The data to write to the stream, typically a Buffer containing video/audio data
   * @returns
   */
  public writeStreamData(sessionId: string, data: Buffer): boolean {
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

  /**
   * Removes a stream session associated with the given WebSocket connection.
   * This method stops the stream if it is active, cleans up the session data,
   * and removes the WebSocket association.
   * @param ws The WebSocket connection to remove
   * @returns No return value
   */
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

  /**
   * Gets a stream session by its unique identifier.
   * @param sessionId The unique identifier for the stream session to retrieve
   * @returns The StreamSession object if found, or undefined if not found
   */
  public getSession(sessionId: string): StreamSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Gets a stream session associated with a specific WebSocket connection.
   * @param ws The WebSocket connection to retrieve the session for
   * @returns StreamSession object if found, or undefined if not found
   */
  public getSessionByWebSocket(ws: WebSocket): StreamSession | undefined {
    const sessionId = this.wsToSession.get(ws);
    return sessionId ? this.sessions.get(sessionId) : undefined;
  }

  /**
   * Gets all stream sessions.
   * @returns An array of all active stream sessions.
   */
  public getAllSessions(): StreamSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Gets all active stream sessions.
   * @returns An array of all active stream sessions.
   */
  public getActiveStreams(): StreamSession[] {
    return Array.from(this.sessions.values()).filter((session) => session.isActive);
  }

  /**
   * Broadcasts a message to the WebSocket connection associated with a specific stream session.
   * @param sessionId The unique identifier for the stream session to broadcast the message to
   * @param message The message to broadcast to the session
   */
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

  /**
   * Updates the heartbeat for a specific WebSocket connection.
   * This method is called periodically to ensure that the session is still active.
   * @param ws The WebSocket connection to update the heartbeat for
   */
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

  /**
   * Checks the heartbeats of all active sessions and removes those that have timed out.
   * This method runs periodically to ensure that inactive sessions are cleaned up.
   */
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

  /**
   * Destroys the StreamManager instance, cleaning up all sessions and WebSocket connections.
   */
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
