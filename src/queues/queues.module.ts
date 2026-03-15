import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ANALYTICS_QUEUE } from './analytics.queue';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
        },
      }),
    }),
    BullModule.registerQueue({ name: ANALYTICS_QUEUE }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
