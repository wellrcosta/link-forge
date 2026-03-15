import { Module } from '@nestjs/common';
import { RedirectService } from './redirect.service';
import { RedirectController } from './redirect.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';

@Module({
  imports: [AnalyticsModule, RateLimitModule],
  controllers: [RedirectController],
  providers: [RedirectService],
})
export class RedirectModule {}
