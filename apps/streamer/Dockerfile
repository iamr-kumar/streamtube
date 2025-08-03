FROM node:22.14.0-alpine


RUN apk add --no-cache \
    ffmpeg \
    wget \
    curl \
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
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://127.0.0.1:8080/health || exit 1


CMD ["pnpm", "--filter", "streamer", "start"]
