import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../database/redis.module';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

@Injectable()
export class RateLimitService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async check(key: string, max: number, ttlSeconds: number): Promise<RateLimitResult> {
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, ttlSeconds);
    }

    const ttl = await this.redis.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);
    const remaining = Math.max(0, max - current);
    const allowed = current <= max;

    return { allowed, remaining, resetAt };
  }

  async checkGlobal(ip: string, max: number, ttlSeconds: number): Promise<RateLimitResult> {
    const key = `rate:global:${ip}`;
    return this.check(key, max, ttlSeconds);
  }

  async checkIp(ip: string, max: number, ttlSeconds: number): Promise<RateLimitResult> {
    const key = `rate:ip:${ip}`;
    return this.check(key, max, ttlSeconds);
  }

  async checkUser(userId: string, action: string, max: number, ttlSeconds: number): Promise<RateLimitResult> {
    const key = `rate:user:${userId}:${action}`;
    return this.check(key, max, ttlSeconds);
  }

  async checkSlug(slug: string, max: number, ttlSeconds: number): Promise<RateLimitResult> {
    const key = `rate:slug:${slug}`;
    return this.check(key, max, ttlSeconds);
  }
}
