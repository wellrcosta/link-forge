import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor } from './analytics.processor';
import { AnalyticsController } from './analytics.controller';
import { ANALYTICS_QUEUE } from '../../queues/analytics.queue';

@Module({
  imports: [BullModule.registerQueue({ name: ANALYTICS_QUEUE })],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsProcessor],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
