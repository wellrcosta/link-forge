import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserOverrideDto } from './dto/update-user-override.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          planId: true,
          createdAt: true,
          plan: { select: { name: true } },
          overrides: true,
          _count: { select: { links: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateUserOverride(userId: string, dto: UpdateUserOverrideDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.userOverride.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  async removeUserOverride(userId: string) {
    const override = await this.prisma.userOverride.findUnique({ where: { userId } });
    if (!override) throw new NotFoundException('Override not found');
    return this.prisma.userOverride.delete({ where: { userId } });
  }

  async disableUserLink(linkId: string) {
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Link not found');

    return this.prisma.link.update({
      where: { id: linkId },
      data: { isActive: false, disabledAt: new Date() },
    });
  }

  async enableUserLink(linkId: string) {
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Link not found');

    return this.prisma.link.update({
      where: { id: linkId },
      data: { isActive: true, disabledAt: null },
    });
  }

  async getSystemStats() {
    const [totalUsers, totalLinks, totalClicks] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.link.count(),
      this.prisma.clickEvent.count(),
    ]);

    return { totalUsers, totalLinks, totalClicks };
  }
}
