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

/**
 * Streaming client for managing WebSocket connections and stream operations.
 * This class handles the connection lifecycle, stream configuration, and message handling.
 */
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

  /**
   * Establishes WebSocket connection and sets up event handlers.
   */
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
          console.log("CONNECTED!");
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

  /**
   * Closes WebSocket connection and resets client state.
   */
  public disconnect(): void {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }

    this.status = StreamStatus.DISCONNECTED;
    this.sessionId = null;
    this.callbacks.onDisconnected?.();
  }

  /**
   * Configures stream parameters on the server and returns session ID.
   * Must be called after connection and before starting stream.
   */
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

  /**
   * Starts the configured stream session for live broadcasting.
   */
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

  /**
   * Stops the active stream session and cleans up resources.
   */
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

  /**
   * Sends binary stream data to the server via WebSocket.
   */
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

  /**
   * Parses incoming WebSocket messages and routes to appropriate handlers.
   */
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

  /**
   * Sends JSON message to server via WebSocket connection.
   */
  private sendMessage(message: Omit<StreamMessage, "sessionId">): void {
    if (!this.isConnected()) {
      console.error("Cannot send message - not connected");
      return;
    }

    // isConnected ensures that webSocket is not null and readyState is OPEN
    this.webSocket?.send(JSON.stringify(message));
  }

  /**
   * Checks if WebSocket is connected and ready for communication.
   */
  private isConnected(): boolean {
    return (
      this.webSocket !== null &&
      this.status !== StreamStatus.DISCONNECTED &&
      this.webSocket.readyState === WebSocket.OPEN
    );
  }

  /**
   * Handles stream configuration response and updates client state.
   */
  private handleStreamConfigResponse(message: StreamMessage): void {
    this.sessionId = message.sessionId || null;
    this.status = StreamStatus.CONFIGURED;

    // Resolve pending config operation
    this.resolvePendingOperation(OperationType.CONFIGURE, this.sessionId || "");

    this.callbacks.onConfigUpdate?.(this.sessionId || "", message.payload.config as StreamConfig);
  }

  /**
   * Handles stream start response and updates status to streaming.
   */
  private handleStreamStartResponse(message: StreamMessage): void {
    this.status = StreamStatus.STREAMING;

    // Resolve pending start operation
    this.resolvePendingOperation(OperationType.START, this.sessionId || "");

    this.callbacks.onStreamStarted?.(this.sessionId || "");
  }

  /**
   * Handles stream stop response and resets streaming state.
   */
  private handleStreamStopResponse(message: StreamMessage): void {
    this.status = StreamStatus.CONNECTED;

    // Resolve pending stop operation
    this.resolvePendingOperation(OperationType.STOP, this.sessionId || "");

    this.callbacks.onStreamStopped?.(this.sessionId || "");
  }

  /**
   * Handles error messages from server and rejects pending operations.
   */
  private handleStreamError(message: StreamMessage): void {
    this.status = StreamStatus.ERROR;

    // Reject all pending operations with the error
    this.rejectAllPendingOperations(message.payload.error as string);

    this.callbacks.onError?.(message.payload.error as string);
  }

  /**
   * Resolves a pending operation and cleans up its timeout.
   */
  private resolvePendingOperation(operationType: OperationType, result?: any): void {
    const operation = this.pendingOperations.get(operationType);
    if (operation) {
      clearTimeout(operation.timeout);
      operation.resolve(result);
      this.pendingOperations.delete(operationType);
    }
  }

  /**
   * Rejects all pending operations with error and clears operation queue.
   */
  private rejectAllPendingOperations(error: string): void {
    this.pendingOperations.forEach((operation) => {
      clearTimeout(operation.timeout);
      operation.reject(new Error(error));
    });
    this.pendingOperations.clear();
  }
}
