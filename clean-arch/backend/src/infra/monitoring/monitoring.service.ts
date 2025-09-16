import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as os from 'os';
import { monitorEventLoopDelay, performance } from 'perf_hooks';
import {
  SystemMetricsDto,
  SimpleMetricsDto,
  HealthStatusDto,
} from './monitoring.dto';

@Injectable()
export class MonitoringService implements OnModuleInit, OnModuleDestroy {
  private eventLoopLagHistogram: ReturnType<typeof monitorEventLoopDelay>;
  private cpuUsageHistory: number[] = [];
  private requestCount = 0;
  private lastCpuUsage = process.cpuUsage();
  private lastMeasureTime = performance.now();
  private cpuInterval: NodeJS.Timeout;

  onModuleInit() {
    this.startMetricsCollection();
  }

  onModuleDestroy() {
    this.stopMetricsCollection();
  }

  private startMetricsCollection() {
    // 🔹 medir lag do event loop (nativo do Node >=14)
    this.eventLoopLagHistogram = monitorEventLoopDelay({ resolution: 20 });
    this.eventLoopLagHistogram.enable();

    // 🔹 calcular CPU a cada 1s
    this.cpuInterval = setInterval(() => {
      this.calculateCpuUsage();
    }, 1000);
  }

  private stopMetricsCollection() {
    if (this.cpuInterval) {
      clearInterval(this.cpuInterval);
    }
    if (this.eventLoopLagHistogram) {
      this.eventLoopLagHistogram.disable();
    }
  }

  private calculateCpuUsage() {
    const currentCpu = process.cpuUsage();
    const now = performance.now();
    const elapsedMs = now - this.lastMeasureTime;

    // diferença desde última medição
    const userDiff = currentCpu.user - this.lastCpuUsage.user;
    const systemDiff = currentCpu.system - this.lastCpuUsage.system;
    const totalDiff = userDiff + systemDiff; // microssegundos

    const cpuPercent =
      elapsedMs > 0
        ? Math.min(100, (totalDiff / (elapsedMs * 1000 * os.cpus().length)) * 100)
        : 0;

    this.cpuUsageHistory.push(cpuPercent);
    if (this.cpuUsageHistory.length > 10) {
      this.cpuUsageHistory.shift();
    }

    this.lastCpuUsage = currentCpu;
    this.lastMeasureTime = now;
  }

  private getEventLoopLag(): number {
    if (!this.eventLoopLagHistogram) return 0;
    return this.eventLoopLagHistogram.mean / 1e6; // ns → ms
  }

  incrementRequestCount() {
    this.requestCount++;
  }

  resetMetrics() {
    this.requestCount = 0;
    this.cpuUsageHistory = [];
    this.lastCpuUsage = process.cpuUsage();
    this.lastMeasureTime = performance.now();
    if (this.eventLoopLagHistogram) {
      this.eventLoopLagHistogram.reset();
    }
  }

  getDetailedMetrics(): SystemMetricsDto {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const currentCpu =
      this.cpuUsageHistory.length > 0
        ? this.cpuUsageHistory[this.cpuUsageHistory.length - 1]
        : 0;

    const throughput = uptime > 0 ? this.requestCount / uptime : 0;

    return {
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
        heapUtilization:
          memoryUsage.heapTotal > 0
            ? (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
            : 0,
      },
      cpu: {
        usage: currentCpu,
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      eventLoop: {
        lag: this.getEventLoopLag(),
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      system: {
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        hostname: os.hostname(),
      },
      performance: {
        requestCount: this.requestCount,
        throughput,
        averageCpu:
          this.cpuUsageHistory.length > 0
            ? this.cpuUsageHistory.reduce((a, b) => a + b, 0) /
              this.cpuUsageHistory.length
            : 0,
      },
    };
  }

  getSimpleMetrics(): SimpleMetricsDto {
    const memoryUsage = process.memoryUsage();
    const currentCpu =
      this.cpuUsageHistory.length > 0
        ? this.cpuUsageHistory[this.cpuUsageHistory.length - 1]
        : 0;

    return {
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
      },
      cpu: {
        usage: currentCpu,
      },
      eventLoop: {
        lag: this.getEventLoopLag(),
      },
    };
  }

  getHealthStatus(): HealthStatusDto {
    const memoryUsage = process.memoryUsage();
    const isHealthy =
      memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9 &&
      this.getEventLoopLag() < 100;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      memory: memoryUsage,
      eventLoopLag: this.getEventLoopLag(),
      uptime: process.uptime(),
    };
  }

  startConsoleLogging(intervalMs = 5000) {
    setInterval(() => {
      const metrics = this.getDetailedMetrics();

      console.log('\n--- Server Metrics ---');
      console.log(
        `Memory: ${(metrics.memory.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(metrics.memory.heapTotal / 1024 / 1024).toFixed(2)}MB (${metrics.memory.heapUtilization.toFixed(1)}%)`,
      );
      console.log(`CPU Usage: ${metrics.cpu.usage.toFixed(2)}%`);
      console.log(`Event Loop Lag: ${metrics.eventLoop.lag.toFixed(2)}ms`);
      console.log(`Total Requests: ${metrics.performance.requestCount}`);
      console.log(`Throughput: ${metrics.performance.throughput.toFixed(2)} req/s`);
      console.log(`Uptime: ${metrics.uptime.toFixed(2)}s`);
      console.log('--------------------\n');
    }, intervalMs);
  }
}