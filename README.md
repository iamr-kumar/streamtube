# YouTube Live Streaming Platform

A professional live streaming platform that allows users to stream directly to their YouTube channels with camera feed and screen sharing capabilities.

## Architecture

This is a monorepo containing:

- **Frontend** (`apps/web`): Next.js application with streaming interface
- **Backend** (`apps/server`): Node.js WebSocket server for RTMP conversion
- **Shared** (`packages/shared`): Shared utilities and types

## Features

### Frontend Features

- 🔐 Google OAuth authentication with YouTube API integration
- 📹 Camera feed capture with WebRTC
- 🖥️ Screen sharing capabilities
- 🎨 Intelligent canvas composition (PiP mode when both camera and screen are active)
- 🎛️ Real-time media controls (camera, microphone, screen share)
- 📡 WebSocket streaming to backend
- 🎯 Material Design 3 inspired UI
- 📱 Responsive design for all devices

### Backend Features

- 🔌 WebSocket server for real-time data streaming
- 🎬 FFmpeg integration for WebM to RTMP conversion
- 📺 Direct streaming to YouTube's RTMP endpoints
- ⚡ Low-latency stream processing
- 🔄 Automatic reconnection handling

## Setup Instructions

### Prerequisites

- Node.js 18+
- FFmpeg installed on your system
- Google Cloud Console project with YouTube Data API v3 enabled
- YouTube channel with live streaming enabled

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - Your production domain callback URL

### 2. Environment Variables

Create `apps/web/.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Installation

```bash
# Install dependencies
npm install

# Install workspace dependencies
npm run install --workspaces
```

### 4. Development

```bash
# Start both frontend and backend
npm run dev:all

# Or start individually:
npm run dev:web    # Frontend only
npm run dev:server # Backend only
```

### 5. Production Build

```bash
# Build all workspaces
npm run build:all

# Build frontend only
npm run build
```

## Usage

1. **Sign In**: Use Google OAuth to authenticate and authorize YouTube access
2. **Configure Stream**: Set stream title, description, and privacy settings
3. **Enable Media**: Turn on camera, microphone, and/or screen sharing
4. **Start Streaming**: Click "Start Stream" to begin broadcasting to YouTube
5. **Monitor**: Watch the live preview and monitor stream status
6. **Stop Stream**: Click "Stop Stream" to end the broadcast

## Technical Details

### Stream Composition

- **Camera Only**: Full-screen camera feed
- **Screen Only**: Full-screen screen capture
- **Both**: Screen capture as main content with camera as picture-in-picture overlay

### Video Processing Pipeline

1. **Capture**: WebRTC APIs capture camera/screen
2. **Composition**: HTML5 Canvas composites multiple sources
3. **Encoding**: MediaRecorder creates WebM stream
4. **Transport**: WebSocket sends binary data to backend
5. **Conversion**: FFmpeg converts WebM to RTMP/FLV
6. **Delivery**: Stream forwarded to YouTube's RTMP endpoint

### Performance Optimizations

- 30 FPS video capture and processing
- Efficient canvas rendering with RequestAnimationFrame
- Chunked data transmission (100ms intervals)
- Hardware-accelerated encoding when available
- Automatic quality adjustment based on bandwidth

## Browser Compatibility

- Chrome 88+ (recommended)
- Firefox 85+
- Safari 14+
- Edge 88+

**Note**: Screen sharing requires HTTPS in production environments.

## Deployment

### Frontend (Vercel/Netlify)

The Next.js frontend can be deployed to any static hosting provider.

### Backend (Docker/VPS)

The Node.js backend requires FFmpeg and should be deployed to a server environment.

Example Dockerfile:

```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY apps/server/package*.json ./
RUN npm install
COPY apps/server/ ./
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the GitHub Issues
2. Review the documentation
3. Create a new issue with detailed information

---

Built with ❤️ using Next.js, Node.js, and FFmpeg
