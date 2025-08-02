import {
  StreamConfig,
  StreamMessage,
  StreamServerCallbacks,
  StreamStatus,
} from "@/types/streaming";

enum OperationType {
  CONFIGURE = "configure",
  START = "start",
  STOP = "stop",
}

export class StreamingClient {
  private webSocket: WebSocket | null = null;
  private url: string;
  private callbacks: StreamServerCallbacks;
  private status: StreamStatus = StreamStatus.DISCONNECTED;
  private sessionId: string | null = null;
  private pendingOperations: Map<
    string,
    { resolve: Function; reject: Function; timeout: NodeJS.Timeout }
  > = new Map();

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
          this.handleMessage(message.data);
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

  public configureStream(config: StreamConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error("Cannot configure stream - not connected"));
        return;
      }

      if (this.status !== StreamStatus.CONNECTED) {
        reject(new Error("Stream is not in a valid state for configuration"));
        return;
      }

      try {
        const timeout = setTimeout(() => {
          this.pendingOperations.delete(OperationType.CONFIGURE);
          reject(new Error("Stream configuration timed out"));
        }, 10000); // 10 seconds timeout

        this.pendingOperations.set(OperationType.CONFIGURE, { resolve, reject, timeout });
        this.sendMessage({
          type: "stream-config",
          payload: { ...config },
          timestamp: Date.now(),
        });
      } catch (error) {
        this.pendingOperations.delete(OperationType.CONFIGURE);
        reject(error);
      }
    });
  }

  public startStream(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error("Cannot start stream - not connected"));
        return;
      }

      if (this.status !== StreamStatus.CONFIGURED) {
        reject(new Error("Stream is not configured"));
        return;
      }

      try {
        const timeout = setTimeout(() => {
          this.pendingOperations.delete(OperationType.START);
          reject(new Error("Stream start timed out"));
        }, 10000); // 10 seconds timeout

        this.pendingOperations.set(OperationType.START, { resolve, reject, timeout });
        this.sendMessage({
          type: "stream-start",
          payload: {},
          timestamp: Date.now(),
        });
      } catch (error) {
        this.pendingOperations.delete(OperationType.START);
        reject(error);
      }
    });
  }

  public stopStream(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error("Cannot stop stream - not connected"));
        return;
      }

      if (this.status !== StreamStatus.STREAMING) {
        reject(new Error("Stream is not currently active"));
        return;
      }

      try {
        const timeout = setTimeout(() => {
          this.pendingOperations.delete(OperationType.STOP);
          reject(new Error("Stream stop timed out"));
        }, 10000); // 10 seconds timeout

        this.pendingOperations.set(OperationType.STOP, { resolve, reject, timeout });
        this.sendMessage({
          type: "stream-stop",
          payload: {},
          timestamp: Date.now(),
        });
      } catch (error) {
        this.pendingOperations.delete(OperationType.STOP);
        reject(error);
      }
    });
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
          this.handleStreamConfigResponse(message);
          break;

        case "stream-start":
          this.handleStreamStartResponse(message);
          break;

        case "stream-stop":
          this.handleStreamStopResponse(message);
          break;

        case "stream-error":
          this.handleStreamError(message);
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
    this.webSocket?.send(JSON.stringify(message));
  }

  private isConnected(): boolean {
    return (
      this.webSocket !== null &&
      this.status !== StreamStatus.DISCONNECTED &&
      this.webSocket.readyState === WebSocket.OPEN
    );
  }

  private handleStreamConfigResponse(message: StreamMessage): void {
    this.sessionId = message.sessionId || null;
    this.status = StreamStatus.CONFIGURED;

    // Resolve pending config operation
    this.resolvePendingOperation(OperationType.CONFIGURE, this.sessionId || "");

    this.callbacks.onConfigUpdate?.(this.sessionId || "", message.payload.config as StreamConfig);
  }

  private handleStreamStartResponse(message: StreamMessage): void {
    this.status = StreamStatus.STREAMING;

    // Resolve pending start operation
    this.resolvePendingOperation(OperationType.START, this.sessionId || "");

    this.callbacks.onStreamStarted?.(this.sessionId || "");
  }

  private handleStreamStopResponse(message: StreamMessage): void {
    this.status = StreamStatus.CONNECTED;

    // Resolve pending stop operation
    this.resolvePendingOperation(OperationType.STOP, this.sessionId || "");

    this.callbacks.onStreamStopped?.(this.sessionId || "");
  }

  private handleStreamError(message: StreamMessage): void {
    this.status = StreamStatus.ERROR;

    // Reject all pending operations with the error
    this.rejectAllPendingOperations(message.payload.error as string);

    this.callbacks.onError?.(message.payload.error as string);
  }

  private resolvePendingOperation(operationType: OperationType, result?: any): void {
    const operation = this.pendingOperations.get(operationType);
    if (operation) {
      clearTimeout(operation.timeout);
      operation.resolve(result);
      this.pendingOperations.delete(operationType);
    }
  }

  private rejectAllPendingOperations(error: string): void {
    this.pendingOperations.forEach((operation) => {
      clearTimeout(operation.timeout);
      operation.reject(new Error(error));
    });
    this.pendingOperations.clear();
  }
}
