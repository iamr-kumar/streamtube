import { StreamServerCallbacks, StreamStatus } from "@/types/streaming";

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
}
