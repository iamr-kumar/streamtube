import { WebSocketServer, WebSocket } from "ws";
import { spawn } from "child_process";

const wss = new WebSocketServer({ port: 8080 });

const rtmpUrl = "rtmp://a.rtmp.youtube.com/live2/61yg-chav-0y7b-bqzw-0rwm";

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  const ffmpeg = spawn("ffmpeg", [
    "-i",
    "-",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-tune",
    "zerolatency",
    "-c:a",
    "aac",
    "-ar",
    "44100",
    "-f",
    "flv",
    rtmpUrl,
  ]);

  ffmpeg.stdout.on("data", (data) => {
    console.log(`ffmpeg stdout: ${data}`);
  });

  ffmpeg.stderr.on("data", (data) => {
    console.error(`ffmpeg stderr: ${data}`);
  });

  ffmpeg.on("close", (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
  });

  ws.on("message", (message: Buffer) => {
    console.log(`Received message of size: ${message.length}`);
    ffmpeg.stdin.write(message);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    ffmpeg.stdin.end();
  });
});

console.log("WebSocket server started on port 8080");
