import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthCheckError,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { RedisHealthIndicator } from './redis-health.indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private redisHealth: RedisHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check system health' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.databaseHealthCheck(),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  private async databaseHealthCheck(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: 'up' } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error';
      throw new HealthCheckError('Database health check failed', {
        database: { status: 'down', message },
      });
    }
  }
}
