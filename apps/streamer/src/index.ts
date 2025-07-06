import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { StreamManager } from "./services/StreamManager";

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

wss.on("connection", (ws: WebSocket, request) => {
  ws.send(
    JSON.stringify({
      type: "connection",
      payload: {
        message: "Connected to StreaTube streaming service",
      },
      timestamp: Date.now(),
    })
  );
});

const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log("WebSocket server is ready to accept connections");
});
