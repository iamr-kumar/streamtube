import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

let currentContainerCount = 0;

// async function findAvailablePort(start: number, end: number): Promise<number> {
//   for (let port = start; port <= end; port++) {
//     if (await isPortAvailable(port)) {
//       return port;
//     }
//   }
//   throw new Error("No available ports found");
// }

// async function isPortAvailable(port: number): Promise<boolean> {
//   try {
//     const { stdout } = await execPromise(`netstat -an | grep ${port}`);
//     return !stdout.includes(`:${port}`);
//   } catch (error) {
//     console.error("Error checking port availability:", error);
//     return true;
//   }
// }

export async function POST(req: Request) {
  const body = await req.json();
  const { url } = body;

  try {
    currentContainerCount++;
    const port = 3000 + currentContainerCount;
    // const containerName = `streamer-${currentContainerCount}`;

    const { stdout, stderr } = await execPromise(
      `docker run --name streamer-app-${port} -d -e APP_PORT=${port} -p ${port}:${port} streamer-app`
    );

    if (stderr) {
      console.error("Error starting Docker container:", stderr);
      return NextResponse.json(
        { error: "Failed to start Docker container" },
        { status: 500 }
      );
    }

    const containerId = stdout.trim();
    console.log("Docker container ID:", containerId);
    return NextResponse.json({
      url,
      port: 3000 + currentContainerCount,
      containerId,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to find available port or start Docker container" },
      { status: 500 }
    );
  }
}
