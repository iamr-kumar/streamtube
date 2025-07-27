import {
  StreamConfig,
  StreamMessage,
  StreamServerCallbacks,
  StreamStatus,
} from "@/types/streaming";

export class StreamingClient {
  private ws: WebSocket | null = null;
  private url: string;
  private status: StreamStatus = StreamStatus.DISCONNECTED;
  private sessionId: string | null = null;
  private callbacks: StreamServerCallbacks;

  constructor(url: string, callbacks: StreamServerCallbacks) {
    this.callbacks = callbacks;
    this.url = url;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.status = StreamStatus.CONNECTED;
          console.log("WebSocket connection established");
          this.callbacks.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (message) => {
          this.handleMessage(message.data);
        };

        this.ws.onclose = (event) => {
          this.status = StreamStatus.DISCONNECTED;
          console.log("WebSocket connection closed", event);
          this.sessionId = null;
          this.callbacks.onDisconnected?.();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.status = StreamStatus.ERROR;
          this.callbacks.onError?.("Connection error");
          reject(new Error("WebSocket connection error"));
        };
      } catch (error) {
        console.error("WebSocket connection error:", error);
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = StreamStatus.DISCONNECTED;
    this.sessionId = null;
    this.callbacks.onDisconnected?.();
  }

  public configureStream(config: StreamConfig): boolean {
    if (!this.isConnected()) {
      console.error("Cannot configure stream: WebSocket is not connected");
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
      console.error("Failed to configure stream:", error);
      return false;
    }
  }

  public startStream(): boolean {
    if (!this.isConnected()) {
      console.error("Cannot start stream: WebSocket is not connected");
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
    if (!this.isConnected()) {
      console.error("Cannot stop stream: WebSocket is not connected");
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

  public sendData(data: Blob): boolean {
    // if (!this.isStreaming()) {
    //   console.error("Cannot send data: Stream is not active");
    //   return false;
    // }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("Cannot send data: WebSocket is not connected");
      console.log("Current status:", this.ws);
      console.log("WebSocket readyState:", this.ws?.readyState);
      return false;
    }

    try {
      this.ws.send(data);
      return true;
    } catch (error) {
      console.error("Failed to send data:", error);
      return false;
    }
  }

  private isStreaming(): boolean {
    return this.status === StreamStatus.STREAMING;
  }

  private isConnected(): boolean {
    return (
      this.ws !== null &&
      this.status !== StreamStatus.DISCONNECTED &&
      this.ws.readyState === WebSocket.OPEN
    );
  }

  private sendMessage(message: Omit<StreamMessage, "sessionId">): void {
    if (!this.ws) {
      throw new Error("WebSocket is not connected");
    }

    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: string) {
    try {
      const message: StreamMessage = JSON.parse(data);
      switch (message.type) {
        case "connection":
          console.log("Connected to streaming server");
          break;

        case "stream-config":
          this.sessionId = message.sessionId || null;
          console.log("Stream configuration received:", message.payload);
          this.status = StreamStatus.CONFIGURED;
          this.callbacks.onConfigUpdate?.(
            this.sessionId || "",
            message.payload.config as StreamConfig
          );
          break;

        case "stream-start":
          this.status = StreamStatus.STREAMING;
          console.log("Stream started");
          this.callbacks.onStreamStarted?.(this.sessionId || "");
          break;

        case "stream-stop":
          this.status = StreamStatus.CONNECTED;
          console.log("Stream stopped");
          this.callbacks.onStreamStopped?.(this.sessionId || "");
          break;

        // case "stream-data":
        //   this.handleStreamData(message.payload);
        //   break;

        case "stream-error":
          console.error("Stream error:", message.payload);
          this.status = StreamStatus.ERROR;
          this.callbacks.onError?.(message.payload.message as string);
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
      return;
    }
  }
}
