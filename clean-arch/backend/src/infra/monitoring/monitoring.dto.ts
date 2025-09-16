import { ApiProperty } from '@nestjs/swagger';

export class MemoryMetricsDto {
  @ApiProperty({ description: 'Resident Set Size - total memory allocated for the process execution', example: 52428800 })
  rss: number;

  @ApiProperty({ description: 'Total size of the heap in bytes', example: 16777216 })
  heapTotal: number;

  @ApiProperty({ description: 'Actually used heap size in bytes', example: 12345678 })
  heapUsed: number;

  @ApiProperty({ description: 'Memory usage of C++ objects bound to JavaScript objects managed by V8', example: 1048576 })
  external: number;

  @ApiProperty({ description: 'Memory allocated for ArrayBuffers and SharedArrayBuffers', example: 8192 })
  arrayBuffers: number;

  @ApiProperty({ description: 'Heap utilization percentage', example: 73.5 })
  heapUtilization: number;
}

export class CpuMetricsDto {
  @ApiProperty({ description: 'CPU usage percentage', example: 45.2 })
  usage: number;

  @ApiProperty({ description: 'System load averages for 1, 5, and 15 minutes', example: [0.5, 0.4, 0.3] })
  loadAverage: number[];

  @ApiProperty({ description: 'Number of CPU cores', example: 8 })
  cores: number;
}

export class EventLoopDto {
  @ApiProperty({ description: 'Event loop lag in milliseconds', example: 1.23 })
  lag: number;
}

export class ProcessMetricsDto {
  @ApiProperty({ description: 'Process ID', example: 12345 })
  pid: number;

  @ApiProperty({ description: 'Node.js version', example: 'v18.17.0' })
  version: string;

  @ApiProperty({ description: 'Operating system platform', example: 'linux' })
  platform: string;

  @ApiProperty({ description: 'CPU architecture', example: 'x64' })
  arch: string;
}

export class SystemInfoDto {
  @ApiProperty({ description: 'Free system memory in bytes', example: 8589934592 })
  freeMemory: number;

  @ApiProperty({ description: 'Total system memory in bytes', example: 17179869184 })
  totalMemory: number;

  @ApiProperty({ description: 'System hostname', example: 'server-01' })
  hostname: string;
}

export class PerformanceMetricsDto {
  @ApiProperty({ description: 'Total number of requests processed', example: 1542 })
  requestCount: number;

  @ApiProperty({ description: 'Requests per second', example: 25.7 })
  throughput: number;

  @ApiProperty({ description: 'Average CPU usage percentage', example: 42.8 })
  averageCpu: number;
}

export class SystemMetricsDto {
  @ApiProperty({ description: 'Timestamp when metrics were collected', example: '2024-01-15T10:30:45.123Z' })
  timestamp: string;

  @ApiProperty({ description: 'Application uptime in seconds', example: 3600.5 })
  uptime: number;

  @ApiProperty({ type: MemoryMetricsDto })
  memory: MemoryMetricsDto;

  @ApiProperty({ type: CpuMetricsDto })
  cpu: CpuMetricsDto;

  @ApiProperty({ type: EventLoopDto })
  eventLoop: EventLoopDto;

  @ApiProperty({ type: ProcessMetricsDto })
  process: ProcessMetricsDto;

  @ApiProperty({ type: SystemInfoDto })
  system: SystemInfoDto;

  @ApiProperty({ type: PerformanceMetricsDto })
  performance: PerformanceMetricsDto;
}

export class SimpleMetricsDto {
  @ApiProperty({
    description: 'Memory metrics',
    example: {
      heapUsed: 12345678,
      heapTotal: 16777216,
      rss: 52428800
    }
  })
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };

  @ApiProperty({
    description: 'CPU metrics',
    example: { usage: 45.2 }
  })
  cpu: {
    usage: number;
  };

  @ApiProperty({
    description: 'Event loop metrics',
    example: { lag: 1.23 }
  })
  eventLoop: {
    lag: number;
  };
}

export class HealthStatusDto {
  @ApiProperty({ description: 'Health status', enum: ['healthy', 'unhealthy'], example: 'healthy' })
  status: 'healthy' | 'unhealthy';

  @ApiProperty({
    description: 'Memory usage at health check',
    example: {
      rss: 52428800,
      heapTotal: 16777216,
      heapUsed: 12345678,
      external: 1048576,
      arrayBuffers: 8192
    }
  })
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers?: number;
  };

  @ApiProperty({ description: 'Event loop lag in milliseconds', example: 1.23 })
  eventLoopLag: number;

  @ApiProperty({ description: 'Application uptime in seconds', example: 3600.5 })
  uptime: number;
}