import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { PaginationDto } from './dto/pagination.dto';
import { generateSlug, isUrlSafe } from './slug.util';
import { Link } from '@prisma/client';

type LinkWithShortUrl = Link & { shortUrl: string };

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateLinkDto): Promise<LinkWithShortUrl> {
    if (!isUrlSafe(dto.originalUrl)) {
      throw new BadRequestException('URL protocol not allowed');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true, overrides: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const maxLinks = user.overrides?.customMaxLinks ?? user.plan.maxLinks;

    const linkCount = await this.prisma.link.count({ where: { userId } });
    if (linkCount >= maxLinks) {
      throw new UnprocessableEntityException(
        `Link quota exceeded. Maximum ${maxLinks} links allowed on your plan.`,
      );
    }

    let slug: string;
    if (dto.slug) {
      const existing = await this.prisma.link.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Slug already in use');
      slug = dto.slug;
    } else {
      slug = await this.generateUniqueSlug();
    }

    const link = await this.prisma.link.create({
      data: {
        userId,
        slug,
        originalUrl: dto.originalUrl,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return this.withShortUrl(link);
  }

  async findAllByUser(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.link.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.link.count({ where: { userId } }),
    ]);

    return {
      data: data.map((link) => this.withShortUrl(link)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<LinkWithShortUrl> {
    const link = await this.prisma.link.findFirst({ where: { id, userId } });
    if (!link) throw new NotFoundException('Link not found');
    return this.withShortUrl(link);
  }

  async disable(id: string, userId: string): Promise<LinkWithShortUrl> {
    const link = await this.prisma.link.findFirst({ where: { id, userId } });
    if (!link) throw new NotFoundException('Link not found');
    if (!link.isActive) throw new ConflictException('Link is already disabled');

    const updated = await this.prisma.link.update({
      where: { id },
      data: { isActive: false, disabledAt: new Date() },
    });

    return this.withShortUrl(updated);
  }

  async enable(id: string, userId: string): Promise<LinkWithShortUrl> {
    const link = await this.prisma.link.findFirst({ where: { id, userId } });
    if (!link) throw new NotFoundException('Link not found');
    if (link.isActive) throw new ConflictException('Link is already active');

    const updated = await this.prisma.link.update({
      where: { id },
      data: { isActive: true, disabledAt: null },
    });

    return this.withShortUrl(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.link.delete({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Link | null> {
    return this.prisma.link.findUnique({ where: { slug } });
  }

  private async generateUniqueSlug(attempts = 0): Promise<string> {
    if (attempts > 10) throw new Error('Failed to generate unique slug after 10 attempts');

    const length = 6 + Math.floor(attempts / 3);
    const slug = generateSlug(Math.min(length, 8));
    const existing = await this.prisma.link.findUnique({ where: { slug } });

    if (!existing) return slug;
    return this.generateUniqueSlug(attempts + 1);
  }

  private withShortUrl(link: Link): LinkWithShortUrl {
    const baseUrl = (process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`)
      .trim()
      .replace(/\/+$/, '');

    return {
      ...link,
      shortUrl: `${baseUrl}/${link.slug}`,
    };
  }
}
