import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';
import { REDIS_CLIENT } from '../../database/redis.module';

const mockRedis = {
  incr: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
};

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should allow requests under the limit', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const result = await service.check('test-key', 10, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should block requests over the limit', async () => {
      mockRedis.incr.mockResolvedValue(11);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(30);

      const result = await service.check('test-key', 10, 60);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should set expiry on first request', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      await service.check('new-key', 10, 60);

      expect(mockRedis.expire).toHaveBeenCalledWith('new-key', 60);
    });

    it('should not reset expiry on subsequent requests', async () => {
      mockRedis.incr.mockResolvedValue(5);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(45);

      await service.check('existing-key', 10, 60);

      expect(mockRedis.expire).not.toHaveBeenCalled();
    });
  });
});
