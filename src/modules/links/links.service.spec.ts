import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { LinksService } from './links.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  link: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('LinksService', () => {
  let service: LinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw UnprocessableEntityException when link quota is exceeded', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        plan: { maxLinks: 5 },
        overrides: null,
      });
      mockPrisma.link.count.mockResolvedValue(5);

      await expect(
        service.create('user-id', { originalUrl: 'https://example.com' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw ConflictException when custom slug is taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        plan: { maxLinks: 10 },
        overrides: null,
      });
      mockPrisma.link.count.mockResolvedValue(2);
      mockPrisma.link.findUnique.mockResolvedValue({ id: 'existing-link' });

      await expect(
        service.create('user-id', { originalUrl: 'https://example.com', slug: 'taken-slug' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject javascript: URLs', async () => {
      await expect(
        service.create('user-id', { originalUrl: 'javascript:alert(1)' }),
      ).rejects.toThrow();
    });

    it('should create a link with auto-generated slug', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        plan: { maxLinks: 10 },
        overrides: null,
      });
      mockPrisma.link.count.mockResolvedValue(0);
      mockPrisma.link.findUnique.mockResolvedValue(null);
      mockPrisma.link.create.mockResolvedValue({
        id: 'link-id',
        slug: 'abc123',
        originalUrl: 'https://example.com',
      });

      const result = await service.create('user-id', {
        originalUrl: 'https://example.com',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.link.create).toHaveBeenCalled();
    });
  });
});
