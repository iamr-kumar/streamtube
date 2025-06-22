/**
 * Rate limiting and security utilities for WebSocket connections
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  maxDataSize: number; // Max data size per request in bytes
  banDuration: number; // Ban duration in milliseconds
}

interface ClientInfo {
  ip: string;
  requests: number[];
  totalDataSize: number;
  isBanned: boolean;
  banExpiry?: Date;
  lastActivity: Date;
}

export class SecurityManager {
  private clients = new Map<string, ClientInfo>();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: 60000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      maxDataSize: 50 * 1024 * 1024, // 50MB per minute
      banDuration: 10 * 60000, // 10 minutes ban
      ...config,
    };

    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60000);
  }

  public checkRateLimit(
    ip: string,
    dataSize = 0
  ): {
    allowed: boolean;
    reason?: string;
    resetTime?: Date;
  } {
    const now = new Date();
    let client = this.clients.get(ip);

    if (!client) {
      client = {
        ip,
        requests: [],
        totalDataSize: 0,
        isBanned: false,
        lastActivity: now,
      };
      this.clients.set(ip, client);
    }

    // Check if client is banned
    if (client.isBanned && client.banExpiry && now < client.banExpiry) {
      return {
        allowed: false,
        reason: "IP banned for rate limit violation",
        resetTime: client.banExpiry,
      };
    }

    // Unban if ban period expired
    if (client.isBanned && client.banExpiry && now >= client.banExpiry) {
      client.isBanned = false;
      client.banExpiry = undefined;
      client.requests = [];
      client.totalDataSize = 0;
    }

    // Clean old requests outside the window
    const windowStart = now.getTime() - this.config.windowMs;
    client.requests = client.requests.filter((reqTime) => reqTime > windowStart);

    // Reset data size counter for new window
    if (client.requests.length === 0) {
      client.totalDataSize = 0;
    }

    // Check request rate limit
    if (client.requests.length >= this.config.maxRequests) {
      this.banClient(ip, "Too many requests");
      return {
        allowed: false,
        reason: "Rate limit exceeded - too many requests",
        resetTime: client.banExpiry,
      };
    }

    // Check data size limit
    if (client.totalDataSize + dataSize > this.config.maxDataSize) {
      this.banClient(ip, "Data size limit exceeded");
      return {
        allowed: false,
        reason: "Rate limit exceeded - data size limit",
        resetTime: client.banExpiry,
      };
    }

    // Update client info
    client.requests.push(now.getTime());
    client.totalDataSize += dataSize;
    client.lastActivity = now;

    return { allowed: true };
  }

  public validateStreamKey(streamKey: string): boolean {
    // Basic stream key validation
    if (!streamKey || streamKey.length < 10) {
      return false;
    }

    // Check for common patterns that might indicate injection attempts
    const suspiciousPatterns = [
      /[<>]/g, // HTML tags
      /javascript:/gi, // JavaScript protocol
      /data:/gi, // Data protocol
      /vbscript:/gi, // VBScript protocol
      /on\w+=/gi, // Event handlers
      /\x00/g, // Null bytes
    ];

    return !suspiciousPatterns.some((pattern) => pattern.test(streamKey));
  }

  public validateRtmpUrl(rtmpUrl: string): boolean {
    try {
      const url = new URL(rtmpUrl);

      // Only allow RTMP/RTMPS protocols
      if (!["rtmp:", "rtmps:"].includes(url.protocol)) {
        return false;
      }

      // Validate hostname (no localhost, private IPs for production)
      const hostname = url.hostname;
      if (process.env.NODE_ENV === "production") {
        // Block localhost and private IP ranges in production
        const privateIpRanges = [
          /^127\./,
          /^10\./,
          /^192\.168\./,
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
          /^localhost$/i,
        ];

        if (privateIpRanges.some((pattern) => pattern.test(hostname))) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  public sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, "") // Remove HTML tags
      .replace(/['"]/g, "") // Remove quotes
      .replace(/\x00/g, "") // Remove null bytes
      .trim();
  }

  private banClient(ip: string, reason: string): void {
    const client = this.clients.get(ip);
    if (client) {
      client.isBanned = true;
      client.banExpiry = new Date(Date.now() + this.config.banDuration);
      console.warn(`Banned IP ${ip}: ${reason}. Ban expires at ${client.banExpiry}`);
    }
  }

  private cleanup(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [ip, client] of this.clients.entries()) {
      const age = now.getTime() - client.lastActivity.getTime();

      // Remove old entries
      if (age > maxAge && !client.isBanned) {
        this.clients.delete(ip);
      }

      // Remove expired bans
      if (client.isBanned && client.banExpiry && now >= client.banExpiry) {
        client.isBanned = false;
        client.banExpiry = undefined;
        client.requests = [];
        client.totalDataSize = 0;
      }
    }
  }

  public getClientStats(): {
    totalClients: number;
    bannedClients: number;
    activeClients: number;
  } {
    const now = new Date();
    const recentActivity = 5 * 60 * 1000; // 5 minutes

    let bannedClients = 0;
    let activeClients = 0;

    for (const client of this.clients.values()) {
      if (client.isBanned) {
        bannedClients++;
      }

      if (now.getTime() - client.lastActivity.getTime() < recentActivity) {
        activeClients++;
      }
    }

    return {
      totalClients: this.clients.size,
      bannedClients,
      activeClients,
    };
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clients.clear();
  }
}
