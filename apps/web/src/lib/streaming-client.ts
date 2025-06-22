import {
  StreamConfig,
  StreamServerMessage,
  StreamServerCallbacks,
  StreamStatus,
  StreamStats,
} from "@/types/streaming";

export class StreamingWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private status: StreamStatus = "disconnected";
  private sessionId: string | null = null;
  private callbacks: StreamServerCallbacks;
  private serverUrl: string;

  constructor(serverUrl: string, callbacks: StreamServerCallbacks = {}) {
    this.serverUrl = serverUrl;
    this.callbacks = callbacks;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log("Connected to streaming server");
          this.status = "connected";
          this.reconnectAttempts = 0;
          this.startPingInterval();
          this.callbacks.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log("Disconnected from streaming server:", event.code, event.reason);
          this.status = "disconnected";
          this.sessionId = null;
          this.stopPingInterval();
          this.callbacks.onDisconnected?.();

          // Attempt reconnection
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.callbacks.onError?.("Connection error");
          reject(new Error("Failed to connect to streaming server"));
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopPingInterval();
    this.status = "disconnected";
    this.sessionId = null;
  }

  public configureStream(config: StreamConfig): boolean {
    if (!this.isConnected()) {
      console.error("Not connected to streaming server");
      return false;
    }

    try {
      this.sendMessage({
        type: "stream-config",
        payload: config,
        timestamp: Date.now(),
      });
      return true;
    } catch (error) {
      console.error("Failed to configure stream:", error);
      return false;
    }
  }

  public startStream(): boolean {
    if (!this.isConfigured()) {
      console.error("Stream not configured");
      return false;
    }

    try {
      this.sendMessage({
        type: "stream-start",
        payload: {},
        timestamp: Date.now(),
      });
      return true;
    } catch (error) {
      console.error("Failed to start stream:", error);
      return false;
    }
  }

  public stopStream(): boolean {
    if (!this.isStreaming()) {
      console.error("Stream not active");
      return false;
    }

    try {
      this.sendMessage({
        type: "stream-stop",
        payload: {},
        timestamp: Date.now(),
      });
      return true;
    } catch (error) {
      console.error("Failed to stop stream:", error);
      return false;
    }
  }

  public sendStreamData(data: ArrayBuffer): boolean {
    if (!this.isStreaming()) {
      console.warn("Stream not active, cannot send data");
      return false;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not ready, cannot send data");
      return false;
    }

    try {
      this.ws.send(data);
      return true;
    } catch (error) {
      console.error("Failed to send stream data:", error);
      return false;
    }
  }

  public getStatus(): StreamStatus {
    return this.status;
  }

  public getSessionId(): string | null {
    return this.sessionId;
  }

  public isConnected(): boolean {
    return this.status !== "disconnected" && this.ws?.readyState === WebSocket.OPEN;
  }

  public isConfigured(): boolean {
    return this.status === "configured" || this.status === "streaming";
  }

  public isStreaming(): boolean {
    return this.status === "streaming";
  }

  private handleMessage(data: string): void {
    try {
      const message: StreamServerMessage = JSON.parse(data);

      switch (message.type) {
        case "connection":
          console.log("Server connection confirmed");
          break;

        case "stream-config":
          this.status = "configured";
          this.sessionId = message.streamId || null;
          console.log("Stream configured:", message.payload);
          this.callbacks.onConfigured?.(
            message.streamId || "",
            message.payload.config as StreamConfig
          );
          break;

        case "stream-start":
          this.status = "streaming";
          console.log("Stream started:", message.payload);
          this.callbacks.onStreamStarted?.(message.streamId || "");
          break;

        case "stream-stop":
          this.status = "configured";
          console.log("Stream stopped:", message.payload);
          this.callbacks.onStreamStopped?.();
          break;

        case "stream-data":
          this.handleStreamData(message.payload);
          break;

        case "error":
          console.error("Server error:", message.payload);
          this.status = "error";
          this.callbacks.onError?.(message.payload.message as string);
          break;

        case "pong":
          // Heartbeat response
          break;

        default:
          console.warn("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Failed to parse server message:", error);
    }
  }

  private handleStreamData(payload: Record<string, unknown>): void {
    if (payload.type === "stats" && payload.data) {
      this.callbacks.onStreamStats?.(payload.data as StreamStats);
    } else if (payload.type === "error") {
      this.callbacks.onError?.(payload.data as string);
    } else if (payload.type === "stopped") {
      this.status = "configured";
      this.callbacks.onStreamStopped?.();
    }
  }

  private sendMessage(message: Omit<StreamServerMessage, "streamId">): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    this.ws.send(JSON.stringify(message));
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: "ping",
          payload: {},
          timestamp: Date.now(),
        });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    setTimeout(() => {
      if (this.status === "disconnected") {
        this.connect().catch(console.error);
      }
    }, delay);
  }
}
