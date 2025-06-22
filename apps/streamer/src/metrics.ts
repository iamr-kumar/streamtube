/**
 * Performance monitoring and metrics collection for the streaming server
 */

interface StreamMetrics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalFrames: number;
  droppedFrames: number;
  avgBitrate: number;
  peakBitrate: number;
  duration: number; // in seconds
  dataTransferred: number; // in bytes
  reconnections: number;
  errors: string[];
}

interface ServerMetrics {
  totalSessions: number;
  activeSessions: number;
  totalDataTransferred: number;
  uptime: number;
  cpuUsage?: number;
  memoryUsage?: number;
  ffmpegProcesses: number;
}

export class MetricsCollector {
  private streamMetrics = new Map<string, StreamMetrics>();
  private serverStartTime = new Date();

  public startStreamMetrics(sessionId: string): void {
    const metrics: StreamMetrics = {
      sessionId,
      startTime: new Date(),
      totalFrames: 0,
      droppedFrames: 0,
      avgBitrate: 0,
      peakBitrate: 0,
      duration: 0,
      dataTransferred: 0,
      reconnections: 0,
      errors: [],
    };

    this.streamMetrics.set(sessionId, metrics);
  }

  public updateStreamMetrics(sessionId: string, update: Partial<StreamMetrics>): void {
    const metrics = this.streamMetrics.get(sessionId);
    if (metrics) {
      Object.assign(metrics, update);
    }
  }

  public endStreamMetrics(sessionId: string): StreamMetrics | null {
    const metrics = this.streamMetrics.get(sessionId);
    if (metrics) {
      metrics.endTime = new Date();
      metrics.duration = (metrics.endTime.getTime() - metrics.startTime.getTime()) / 1000;
      return metrics;
    }
    return null;
  }

  public getStreamMetrics(sessionId: string): StreamMetrics | null {
    return this.streamMetrics.get(sessionId) || null;
  }

  public removeStreamMetrics(sessionId: string): void {
    this.streamMetrics.delete(sessionId);
  }

  public getServerMetrics(): ServerMetrics {
    const now = new Date();
    const uptime = (now.getTime() - this.serverStartTime.getTime()) / 1000;

    // Calculate total data transferred
    let totalDataTransferred = 0;
    for (const metrics of this.streamMetrics.values()) {
      totalDataTransferred += metrics.dataTransferred;
    }

    return {
      totalSessions: this.streamMetrics.size,
      activeSessions: Array.from(this.streamMetrics.values()).filter((m) => !m.endTime).length,
      totalDataTransferred,
      uptime,
      ffmpegProcesses: this.getActiveFFmpegProcesses(),
    };
  }

  public getActiveStreamsMetrics(): StreamMetrics[] {
    return Array.from(this.streamMetrics.values()).filter((m) => !m.endTime);
  }

  public getAllMetrics(): {
    server: ServerMetrics;
    streams: StreamMetrics[];
  } {
    return {
      server: this.getServerMetrics(),
      streams: Array.from(this.streamMetrics.values()),
    };
  }

  private getActiveFFmpegProcesses(): number {
    // This would typically count actual FFmpeg processes
    // For now, return the count of active streams
    return this.getActiveStreamsMetrics().length;
  }

  public recordError(sessionId: string, error: string): void {
    const metrics = this.streamMetrics.get(sessionId);
    if (metrics) {
      metrics.errors.push(error);
    }
  }

  public recordReconnection(sessionId: string): void {
    const metrics = this.streamMetrics.get(sessionId);
    if (metrics) {
      metrics.reconnections++;
    }
  }

  // Helper method to get performance summary
  public getPerformanceSummary(): {
    avgStreamDuration: number;
    avgBitrate: number;
    totalErrors: number;
    successRate: number;
  } {
    const completedStreams = Array.from(this.streamMetrics.values()).filter((m) => m.endTime);

    if (completedStreams.length === 0) {
      return {
        avgStreamDuration: 0,
        avgBitrate: 0,
        totalErrors: 0,
        successRate: 100,
      };
    }

    const avgStreamDuration =
      completedStreams.reduce((sum, m) => sum + m.duration, 0) / completedStreams.length;
    const avgBitrate =
      completedStreams.reduce((sum, m) => sum + m.avgBitrate, 0) / completedStreams.length;
    const totalErrors = completedStreams.reduce((sum, m) => sum + m.errors.length, 0);
    const successfulStreams = completedStreams.filter((m) => m.errors.length === 0).length;
    const successRate = (successfulStreams / completedStreams.length) * 100;

    return {
      avgStreamDuration,
      avgBitrate,
      totalErrors,
      successRate,
    };
  }
}
