import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import dotenv from "dotenv";
import { StreamManager } from "./stream-manager";
import { WebSocketMessage, StreamConfig } from "./types";
import { ConfigValidator } from "./config-validator";
import { logger } from "./logger";
import { MetricsCollector } from "./metrics";
import { SecurityManager } from "./security";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Initialize stream manager and utilities
const streamManager = new StreamManager();
const metricsCollector = new MetricsCollector();
const securityManager = new SecurityManager({
  windowMs: 60000, // 1 minute window
  maxRequests: 200, // 200 requests per minute per IP
  maxDataSize: 100 * 1024 * 1024, // 100MB per minute per IP
  banDuration: 10 * 60000, // 10 minute ban
});

// Health check endpoint
app.get("/health", (req, res) => {
  const serverMetrics = metricsCollector.getServerMetrics();
  const clientStats = securityManager.getClientStats();
  const performanceSummary = metricsCollector.getPerformanceSummary();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    server: serverMetrics,
    security: clientStats,
    performance: performanceSummary,
  });
});

// Metrics endpoint for monitoring
app.get("/metrics", (req, res) => {
  const allMetrics = metricsCollector.getAllMetrics();
  res.json(allMetrics);
});

// Active streams endpoint
app.get("/streams", (req, res) => {
  const activeStreams = streamManager.getActiveStreams();
  const streamsInfo = activeStreams.map((stream) => ({
    id: stream.id,
    isActive: stream.isActive,
    startTime: stream.startTime,
    config: {
      resolution: stream.config.resolution,
      frameRate: stream.config.frameRate,
      bitrate: stream.config.bitrate,
    },
    lastHeartbeat: stream.lastHeartbeat,
  }));

  res.json({
    count: streamsInfo.length,
    streams: streamsInfo,
  });
});

// WebSocket connection handling
wss.on("connection", (ws: WebSocket, request) => {
  const clientIp = request.socket.remoteAddress || "unknown";
  logger.wsEvent("connection", clientIp);

  // Check rate limiting
  const rateLimitCheck = securityManager.checkRateLimit(clientIp);
  if (!rateLimitCheck.allowed) {
    logger.warn(`Connection rejected for ${clientIp}: ${rateLimitCheck.reason}`);
    ws.close(1008, rateLimitCheck.reason);
    return;
  }

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "connection",
      payload: {
        message: "Connected to StreamTube streaming server",
        serverId: process.env.SERVER_ID || "main",
        version: process.env.npm_package_version || "1.0.0",
      },
      timestamp: Date.now(),
    })
  );

  // Handle incoming messages
  ws.on("message", async (data: Buffer) => {
    const startTime = Date.now();

    try {
      // Rate limit check for message
      const rateLimitCheck = securityManager.checkRateLimit(clientIp, data.length);
      if (!rateLimitCheck.allowed) {
        logger.warn(`Message rejected for ${clientIp}: ${rateLimitCheck.reason}`);
        sendError(ws, rateLimitCheck.reason || "Rate limit exceeded");
        return;
      }

      // Try to parse as JSON message
      const messageStr = data.toString();
      let message: WebSocketMessage;

      try {
        message = JSON.parse(messageStr);
        logger.wsEvent("message", clientIp, { type: message.type });
      } catch (parseError) {
        // If not JSON, treat as binary stream data
        handleBinaryData(ws, data, clientIp);
        return;
      }

      // Handle different message types
      switch (message.type) {
        case "stream-config":
          await handleStreamConfig(ws, message, clientIp);
          break;

        case "stream-start":
          await handleStreamStart(ws, message, clientIp);
          break;

        case "stream-stop":
          await handleStreamStop(ws, message, clientIp);
          break;

        case "ping":
          handlePing(ws, message, clientIp);
          break;

        default:
          logger.warn(`Unknown message type: ${message.type} from ${clientIp}`);
          sendError(ws, `Unknown message type: ${message.type}`);
      }

      // Log performance
      const duration = Date.now() - startTime;
      if (duration > 100) {
        // Log slow operations
        logger.performance(`Message handling: ${message.type}`, duration);
      }
    } catch (error) {
      logger.error("Error handling WebSocket message:", { clientIp, error });
      sendError(ws, "Error processing message");
    }
  });

  // Handle connection close
  ws.on("close", (code, reason) => {
    logger.wsEvent("close", clientIp, { code, reason: reason?.toString() });
    streamManager.removeSession(ws);
  });

  // Handle connection errors
  ws.on("error", (error) => {
    logger.error("WebSocket error:", { clientIp, error: error.message });
    streamManager.removeSession(ws);
  });
});

// Message handlers
async function handleStreamConfig(
  ws: WebSocket,
  message: WebSocketMessage,
  clientIp: string
): Promise<void> {
  try {
    const config: Partial<StreamConfig> = message.payload;
    logger.streamEvent("config-request", "pending", { clientIp, config });

    // Additional security validation
    if (config.rtmpUrl && !securityManager.validateRtmpUrl(config.rtmpUrl)) {
      sendError(ws, "Invalid RTMP URL");
      return;
    }

    if (config.streamKey && !securityManager.validateStreamKey(config.streamKey)) {
      sendError(ws, "Invalid stream key");
      return;
    }

    // Validate configuration
    const validation = ConfigValidator.validateStreamConfig(config);

    if (!validation.isValid) {
      logger.warn("Stream config validation failed", { clientIp, errors: validation.errors });
      sendError(ws, `Invalid configuration: ${validation.errors.join(", ")}`);
      return;
    }

    const sessionId = streamManager.createSession(ws, validation.sanitizedConfig!);

    // Start metrics collection
    metricsCollector.startStreamMetrics(sessionId);

    ws.send(
      JSON.stringify({
        type: "stream-config",
        payload: {
          sessionId,
          config: validation.sanitizedConfig,
          message: "Stream configuration received and validated",
        },
        streamId: sessionId,
        timestamp: Date.now(),
      })
    );

    logger.streamEvent("configured", sessionId, { clientIp });
  } catch (error) {
    logger.error("Error handling stream config:", { clientIp, error });
    sendError(ws, "Invalid stream configuration");
  }
}

async function handleStreamStart(
  ws: WebSocket,
  message: WebSocketMessage,
  clientIp: string
): Promise<void> {
  try {
    const session = streamManager.getSessionByWebSocket(ws);
    if (!session) {
      logger.warn("Stream start attempted without session", { clientIp });
      sendError(ws, "No stream session found. Please configure stream first.");
      return;
    }

    logger.streamEvent("start-request", session.id, { clientIp });

    const success = streamManager.startStream(session.id);

    if (success) {
      // Update metrics
      metricsCollector.updateStreamMetrics(session.id, {
        startTime: new Date(),
      });

      ws.send(
        JSON.stringify({
          type: "stream-start",
          payload: {
            message: "Stream started successfully",
            sessionId: session.id,
          },
          streamId: session.id,
          timestamp: Date.now(),
        })
      );

      logger.streamEvent("started", session.id, { clientIp });
    } else {
      logger.error("Failed to start stream", { sessionId: session.id, clientIp });
      sendError(ws, "Failed to start stream");
    }
  } catch (error) {
    logger.error("Error starting stream:", { clientIp, error });
    sendError(ws, "Error starting stream");
  }
}

async function handleStreamStop(
  ws: WebSocket,
  message: WebSocketMessage,
  clientIp: string
): Promise<void> {
  try {
    const session = streamManager.getSessionByWebSocket(ws);
    if (!session) {
      logger.warn("Stream stop attempted without session", { clientIp });
      sendError(ws, "No stream session found");
      return;
    }

    logger.streamEvent("stop-request", session.id, { clientIp });

    const success = streamManager.stopStream(session.id);

    if (success) {
      // Finalize metrics
      const finalMetrics = metricsCollector.endStreamMetrics(session.id);
      if (finalMetrics) {
        logger.info("Stream completed", {
          sessionId: session.id,
          duration: finalMetrics.duration,
          frames: finalMetrics.totalFrames,
          dataTransferred: finalMetrics.dataTransferred,
        });
      }

      ws.send(
        JSON.stringify({
          type: "stream-stop",
          payload: {
            message: "Stream stopped successfully",
            sessionId: session.id,
            metrics: finalMetrics,
          },
          streamId: session.id,
          timestamp: Date.now(),
        })
      );

      logger.streamEvent("stopped", session.id, { clientIp });
    } else {
      logger.error("Failed to stop stream", { sessionId: session.id, clientIp });
      sendError(ws, "Failed to stop stream");
    }
  } catch (error) {
    logger.error("Error stopping stream:", { clientIp, error });
    sendError(ws, "Error stopping stream");
  }
}

function handlePing(ws: WebSocket, message: WebSocketMessage, clientIp: string): void {
  streamManager.updateHeartbeat(ws);

  ws.send(
    JSON.stringify({
      type: "pong",
      payload: {
        message: "pong",
        serverTime: Date.now(),
      },
      timestamp: Date.now(),
    })
  );

  logger.wsEvent("ping", clientIp);
}

function handleBinaryData(ws: WebSocket, data: Buffer, clientIp: string): void {
  try {
    const session = streamManager.getSessionByWebSocket(ws);
    if (!session) {
      logger.warn("Received binary data but no session found", { clientIp });
      return;
    }

    if (!session.isActive) {
      logger.warn("Received binary data but stream not active", {
        sessionId: session.id,
        clientIp,
      });
      return;
    }

    // Update metrics
    metricsCollector.updateStreamMetrics(session.id, {
      dataTransferred:
        (metricsCollector.getStreamMetrics(session.id)?.dataTransferred || 0) + data.length,
      totalFrames: (metricsCollector.getStreamMetrics(session.id)?.totalFrames || 0) + 1,
    });

    const success = streamManager.writeStreamData(session.id, data);

    if (!success) {
      logger.warn("Failed to write stream data", {
        sessionId: session.id,
        clientIp,
        dataSize: data.length,
      });
      metricsCollector.updateStreamMetrics(session.id, {
        droppedFrames: (metricsCollector.getStreamMetrics(session.id)?.droppedFrames || 0) + 1,
      });
    }
  } catch (error) {
    logger.error("Error handling binary data:", { clientIp, error });
  }
}

function sendError(ws: WebSocket, message: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message },
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      logger.error("Failed to send error message:", { error });
    }
  }
}

// Graceful shutdown handlers
process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  gracefulShutdown();
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", { error: error.message, stack: error.stack });
  gracefulShutdown(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
  gracefulShutdown(1);
});

function gracefulShutdown(exitCode = 0): void {
  logger.info("Starting graceful shutdown...");

  // Stop accepting new connections
  wss.close(() => {
    logger.info("WebSocket server closed");
  });

  // Destroy all components
  streamManager.destroy();
  securityManager.destroy();

  // Close HTTP server
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(exitCode);
  });

  // Force exit after timeout
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

// Start server
const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, () => {
  logger.info(`StreamTube WebSocket server running on ${HOST}:${PORT}`);
  logger.info(`Health endpoint: http://${HOST}:${PORT}/health`);
  logger.info(`Metrics endpoint: http://${HOST}:${PORT}/metrics`);
  logger.info(`Streams endpoint: http://${HOST}:${PORT}/streams`);

  // Log server configuration
  logger.info("Server configuration:", {
    cors_origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    log_level: process.env.LOG_LEVEL || "info",
    node_env: process.env.NODE_ENV || "development",
  });
});

// Handle server errors
server.on("error", (error) => {
  logger.error("Server error:", { error: error.message });
  gracefulShutdown(1);
});

export { streamManager, metricsCollector, securityManager };
