import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { spawn } from "child_process";

dotenv.config();
const app: Express = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your Next.js app URL in production
    methods: ["GET", "POST"],
    credentials: true,
  })
);
const options = [
  "-i",
  "-",
  "-c:v",
  "libx264",
  "-preset",
  "ultrafast",
  "-tune",
  "zerolatency",
  "-r",
  "25",
  "-g",
  `${25 * 2}`,
  "-keyint_min",
  "25",
  "-crf",
  "25",
  "-pix_fmt",
  "yuv420p",
  "-sc_threshold",
  "0",
  "-profile:v",
  "main",
  "-level",
  "3.1",
  "-c:a",
  "aac",
  "-b:a",
  "128k",
  "-ar",
  `${128000 / 4}`,
  "-f",
  "flv",
  `rtmp://a.rtmp.youtube.com/live2/`,
];

const ffmpegProcess = spawn("ffmpeg", options);

ffmpegProcess.stdout.on("data", (data) => {
  console.log(`ffmpeg stdout: ${data}`);
});

ffmpegProcess.stderr.on("data", (data) => {
  console.error(`ffmpeg stderr: ${data}`);
});

ffmpegProcess.on("close", (code) => {
  console.log(`ffmpeg process exited with code ${code}`);
});

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const port = process.env.PORT || 3001;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

io.on("connection", (socket) => {
  console.log("Socket Connected", socket.id);
  socket.on("videoData", (stream) => {
    ffmpegProcess.stdin.write(stream, (err) => {
      console.log("Err", err);
    });
  });
});

httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
