import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from './plans.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  plan: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('PlansService', () => {
  let service: PlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDefault', () => {
    it('should return the default plan', async () => {
      mockPrisma.plan.findFirst.mockResolvedValue({
        id: 'plan-id',
        name: 'FREE',
        isDefault: true,
        maxLinks: 10,
      });

      const plan = await service.findDefault();
      expect(plan.name).toBe('FREE');
    });

    it('should throw if no default plan exists', async () => {
      mockPrisma.plan.findFirst.mockResolvedValue(null);
      await expect(service.findDefault()).rejects.toThrow('Default plan not found');
    });
  });
});
