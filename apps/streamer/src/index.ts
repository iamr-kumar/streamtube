import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { StreamManager } from "./services/StreamManager";
import { StreamConfig, WebSocketMessage } from "./types";
import { ConfigValidator } from "./services/ConfigValidator";
import type { WebSocket as WsWebSocket } from "ws";
import cors from "cors";

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

const streamManager = StreamManager.getInstance();

app.get("/streams", (req, res) => {
  const activeStreams = streamManager.getActiveStreams();
  const streamInfo = activeStreams.map((stream) => ({
    id: stream.id,
    isActive: stream.isActive,
    startTime: stream.startTime,
    config: {
      resolution: stream.config.resolution,
      frameRate: stream.config.frameRate,
      bitrate: stream.config.bitrate,
    },
    lastHeartBeat: stream.lastHeartBeat,
  }));

  res.json({
    count: streamInfo.length,
    streams: streamInfo,
  });
});

wss.on("connection", (ws: WsWebSocket, request) => {
  const streamConfig: StreamConfig = {
    rtmpUrl: "rtmp://example.com/live",
    streamKey: "stream-key",
    resolution: {
      width: 1280,
      height: 720,
    },
    frameRate: 30,
    bitrate: 2500,
    audioSampleRate: 44100,
    audioChannels: 2,
  };
  const sessionId = streamManager.createSession(ws, streamConfig);
  streamManager.startStream(sessionId);
  ws.send(
    JSON.stringify({
      type: "connection",
      payload: {
        message: "Connected to StreaTube streaming service",
      },
      timestamp: Date.now(),
    })
  );

  ws.on("message", async (data: Buffer) => {
    // const messageStr = data.toString();
    // let message: WebSocketMessage;

    // try {
    //   message = JSON.parse(messageStr);
    //   console.log("Received message:", message);
    // } catch (error) {
    //   // treat as binary data if parsing fails
    //   // console.error("Failed to parse message as JSON, treating as binary data:", error);
    //   handleBinaryData(ws, data);
    //   return;
    // }
    // switch (message.type) {
    //   case "stream-config":
    //     await handleStreamConfig(ws, message);
    //     break;
    //   case "stream-start":
    //     await handleStreamStart(ws, message);
    //     break;
    //   case "stream-stop":
    //     await handleStreamStop(ws, message);
    //     break;
    //   default:
    //     console.warn(`Unknown message type: ${message.type}`);
    //     sendError(ws, "Unknown message type");
    // }

    // Create session
    console.log(`Received binary data for session ${sessionId}`);
    console.log(data);
    handleBinaryData(ws, data);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
    streamManager.removeSession(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    streamManager.removeSession(ws);
  });
});

const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log("WebSocket server is ready to accept connections");
});

const handleStreamConfig = async (ws: WsWebSocket, message: WebSocketMessage) => {
  try {
    const config: Partial<StreamConfig> = message.payload;
    const validation = ConfigValidator.validateConfig(config);
    if (!validation.isValid) {
      console.error("Invalid stream configuration:", validation.errors);
      sendError(ws, `Invalid stream configuration: ${validation.errors.join(", ")}`);
      return;
    }

    const sessionId = streamManager.createSession(ws, validation.sanitizedConfig!);
    console.log(`Stream session created with ID: ${sessionId}`);
    ws.send(
      JSON.stringify({
        type: "stream-config",
        streamId: sessionId,
        payload: {
          sessionId,
          config: validation.sanitizedConfig,
          message: "Stream configuration accepted",
        },
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("Error handling stream configuration:", error);
    sendError(ws, "Failed to process stream configuration");
  }
};

const handleStreamStart = async (ws: WsWebSocket, message: WebSocketMessage) => {
  try {
    const session = streamManager.getSessionByWebSocket(ws);
    if (!session) {
      sendError(ws, "No active session found for this WebSocket connection");
      return;
    }

    const success = await streamManager.startStream(session.id);
    console.log(`Stream started for session ID: ${session.id}`);
    if (!success) {
      sendError(ws, "Failed to start stream. Please check your configuration.");
      return;
    }
    ws.send(
      JSON.stringify({
        type: "stream-start",
        streamId: session.id,
        payload: {
          message: "Stream started successfully",
          sessionId: session.id,
        },
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("Error starting stream:", error);
    sendError(ws, "Failed to start stream due to an internal error");
  }
};

const handleStreamStop = async (ws: WsWebSocket, message: WebSocketMessage) => {
  try {
    const session = streamManager.getSessionByWebSocket(ws);
    if (!session) {
      sendError(ws, "No active session found for this WebSocket connection");
      return;
    }

    const success = await streamManager.stopStream(session.id);
    if (!success) {
      sendError(ws, "Failed to stop stream. Please try again.");
      return;
    }

    ws.send(
      JSON.stringify({
        type: "stream-stop",
        streamId: session.id,
        payload: {
          message: "Stream stopped successfully",
          sessionId: session.id,
        },
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("Error stopping stream:", error);
    sendError(ws, "Failed to stop stream due to an internal error");
  }
};

const handleBinaryData = (ws: WsWebSocket, data: Buffer) => {
  try {
    const session = streamManager.getSessionByWebSocket(ws);
    if (!session || !session.isActive) {
      console.warn("Received binary data but no active session found");
      return;
    }

    // Just write the data - no rate limiting!
    const success = streamManager.writeStreamData(session.id, data);
    if (!success) {
      console.warn("Failed to write binary data to stream");
    }
  } catch (error) {
    console.error("Error handling binary data:", error);
  }
};

const sendError = (ws: WsWebSocket, message: string) => {
  if (ws.readyState == WebSocket.OPEN) {
    try {
      ws.send(
        JSON.stringify({
          type: "error",
          payload: {
            message,
          },
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error sending WebSocket error message:", error);
    }
  }
};

// Graceful shutdown handlers
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  gracefulShutdown();
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", { error: error.message, stack: error.stack });
  gracefulShutdown(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", { promise, reason });
  gracefulShutdown(1);
});

function gracefulShutdown(exitCode = 0): void {
  console.log("Starting graceful shutdown...");
  // Stop accepting new connections
  wss.close(() => {
    console.log("WebSocket server closed");
  });

  // Destroy all components
  streamManager.destroy();

  // Close HTTP server
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(exitCode);
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10000);
}
