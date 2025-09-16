import { Controller, Get, Post, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { MonitoringService } from './monitoring.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SystemMetricsDto,
  SimpleMetricsDto,
  HealthStatusDto,
} from './monitoring.dto';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get detailed system metrics (compatible with k6/bash)' })
  @ApiResponse({
    status: 200,
    description: 'Detailed system metrics',
    type: SystemMetricsDto,
  })
  getMetrics(): SystemMetricsDto {
    // 🔹 Agora só consome o DTO pronto vindo do service
    return this.monitoringService.getDetailedMetrics();
  }

  @Get('simple')
  @ApiOperation({ summary: 'Get simple metrics for k6' })
  @ApiResponse({
    status: 200,
    description: 'Simple metrics optimized for k6',
    type: SimpleMetricsDto,
  })
  getSimpleMetrics(): SimpleMetricsDto {
    return this.monitoringService.getSimpleMetrics();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthStatusDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
    type: HealthStatusDto,
  })
  getHealth(@Res() res: Response): void {
    const health = this.monitoringService.getHealthStatus();
    const statusCode =
      health.status === 'healthy'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(health);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset monitoring metrics' })
  @ApiResponse({
    status: 200,
    description: 'Metrics reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Metrics reset successfully' },
      },
    },
  })
  resetMetrics(): { message: string } {
    this.monitoringService.resetMetrics();
    return { message: 'Metrics reset successfully' };
  }
}