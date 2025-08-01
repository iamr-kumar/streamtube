import {
  StreamConfig,
  StreamMessage,
  StreamServerCallbacks,
  StreamStatus,
} from "@/types/streaming";

export class StreamingClient {
  private webSocket: WebSocket | null = null;
  private url: string;
  private callbacks: StreamServerCallbacks;
  private status: StreamStatus = StreamStatus.DISCONNECTED;
  private sessionId: string | null = null;

  constructor(url: string, callbacks: StreamServerCallbacks) {
    this.url = url;
    this.callbacks = callbacks;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.webSocket) {
        reject(new Error("Already connected"));
        return;
      }
      try {
        this.webSocket = new WebSocket(this.url);

        this.webSocket.onopen = () => {
          this.status = StreamStatus.CONNECTED;
          this.callbacks.onConnected?.();
          resolve();
        };

        this.webSocket.onmessage = (message) => {
          // this.handleMessage(message.data);
        };

        this.webSocket.onerror = (error) => {
          this.status = StreamStatus.ERROR;
          this.callbacks.onError?.(`WebSocket error: ${error}`);
          reject(error);
        };

        this.webSocket.onclose = () => {
          this.status = StreamStatus.DISCONNECTED;
          this.callbacks.onDisconnected?.();
        };
      } catch (error) {
        console.error("WebSocket connection error:", error);
      }
    });
  }

  public disconnect(): void {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }

    this.status = StreamStatus.DISCONNECTED;
    this.sessionId = null;
    this.callbacks.onDisconnected?.();
  }

  public configureStream(config: StreamConfig): boolean {
    if (!this.isConnected()) {
      console.error("Cannot configure stream - not connected");
      return false;
    }
    try {
      this.sendMessage({
        type: "stream-config",
        payload: { ...config },
        timestamp: Date.now(),
      });
      return true;
    } catch (error) {
      console.error("Error configuring stream:", error);
      return false;
    }
  }

  public startStream(): boolean {
    if (!this.isConnected()) {
      console.error("Cannot start stream - not connected");
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
      console.error("Error starting stream:", error);
      return false;
    }
  }

  public stopStream(): boolean {
    if (!this.isConnected()) {
      console.error("Cannot stop stream - not connected");
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
      console.error("Error stopping stream:", error);
      return false;
    }
  }

  public sendData(data: Blob): void {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not open. Cannot send data.");
      return;
    }
    try {
      this.webSocket.send(data);
    } catch (error) {
      console.error("Error sending data over WebSocket:", error);
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: StreamMessage = JSON.parse(data);
      switch (message.type) {
        case "stream-config":
          this.sessionId = message.sessionId || null;
          this.status = StreamStatus.CONFIGURED;
          this.callbacks.onConfigUpdate?.(
            this.sessionId || "",
            message.payload.config as StreamConfig
          );
          break;

        case "stream-start":
          this.status = StreamStatus.STREAMING;
          this.callbacks.onStreamStarted?.(this.sessionId || "");
          break;

        case "stream-stop":
          this.status = StreamStatus.CONNECTED;
          this.callbacks.onStreamStopped?.(this.sessionId || "");
          break;

        case "stream-error":
          this.status = StreamStatus.ERROR;
          this.callbacks.onError?.(message.payload.error as string);
          break;
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
      this.callbacks.onError?.("Failed to parse message from server");
    }
  }

  private sendMessage(message: Omit<StreamMessage, "sessionId">): void {
    if (!this.isConnected()) {
      console.error("Cannot send message - not connected");
      return;
    }

    // isConnected ensures that webSocket is not null and readyState is OPEN
    this.webSocket!.send(JSON.stringify(message));
  }

  private isConnected(): boolean {
    return (
      this.webSocket !== null &&
      this.status !== StreamStatus.DISCONNECTED &&
      this.webSocket.readyState === WebSocket.OPEN
    );
  }
}
