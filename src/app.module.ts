import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './database/redis.module';
import { QueuesModule } from './queues/queues.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PlansModule } from './modules/plans/plans.module';
import { LinksModule } from './modules/links/links.module';
import { RedirectModule } from './modules/redirect/redirect.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RateLimitModule } from './modules/rate-limit/rate-limit.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    DatabaseModule,
    RedisModule,
    QueuesModule,
    HealthModule,
    PlansModule,
    UsersModule,
    AuthModule,
    LinksModule,
    AnalyticsModule,
    RateLimitModule,
    RedirectModule,
    AdminModule,
  ],
})
export class AppModule {}
