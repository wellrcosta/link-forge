import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const client = new Redis({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password') || undefined,
          retryStrategy: (times) => {
            if (times > 10) return null;
            return Math.min(times * 100, 3000);
          },
          enableOfflineQueue: true,
          maxRetriesPerRequest: null,
        });

        client.on('connect', () => {
          console.log('Redis connection established');
        });

        client.on('error', (err) => {
          console.error('Redis connection error:', err.message);
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
