FROM node:22.14.0-alpine


RUN apk add --no-cache \
    ffmpeg \
    && npm install -g pnpm@8.15.6


WORKDIR /app


COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/streamer/package.json ./apps/streamer/

RUN pnpm install --frozen-lockfile

COPY apps/streamer/src ./apps/streamer/src
COPY apps/streamer/tsconfig.json ./apps/streamer/
COPY tsconfig.json ./

RUN pnpm --filter streamer build

EXPOSE 8080

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1


CMD ["pnpm", "--filter", "streamer", "start"]
