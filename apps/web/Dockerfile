# Use Node.js Alpine as base image
FROM node:22.14.0-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.6

# Copy package.json files and pnpm workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/web/src ./apps/web/src
COPY apps/web/next.config.js ./apps/web/
COPY apps/web/next.config.ts ./apps/web/
COPY apps/web/tailwind.config.js ./apps/web/
COPY apps/web/postcss.config.js ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/next-env.d.ts ./apps/web/
COPY tsconfig.json ./

# Build the Next.js application
RUN pnpm --filter web build

# Expose port
EXPOSE 3001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the server
CMD ["pnpm", "--filter", "web", "start", "-p", "3001"]
