# StreamTube

A modern streaming platform built with Next.js and Express WebSocket server.

## Project Structure

This is a monorepo managed with pnpm workspaces containing:

- **apps/web**: Next.js frontend application with TypeScript and Tailwind CSS
- **apps/streamer**: Express WebSocket server with TypeScript

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Getting Started

### Install dependencies

```bash
pnpm install
```

### Development

Run both applications in development mode:

```bash
pnpm dev
```

Or run individually:

```bash
# Web app (Next.js)
pnpm dev:web

# Streamer server (Express WebSocket)
pnpm dev:streamer
```

### Build

Build all applications:

```bash
pnpm build
```

Or build individually:

```bash
pnpm build:web
pnpm build:streamer
```

### Production

Start all applications in production mode:

```bash
pnpm start
```

## Applications

### Web App (Next.js)

- Port: 3000
- TypeScript
- Tailwind CSS
- App Router

### Streamer Server (Express WebSocket)

- Port: 3001
- TypeScript
- WebSocket support
- Nodemon for development

## Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm start` - Start all apps in production mode
- `pnpm lint` - Lint all apps
- `pnpm type-check` - Type check all apps
