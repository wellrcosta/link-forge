import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type PlanRecord = NonNullable<Awaited<ReturnType<PrismaService['plan']['findFirst']>>>;

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findDefault(): Promise<PlanRecord> {
    const plan = await this.prisma.plan.findFirst({ where: { isDefault: true } });
    if (!plan) {
      throw new Error('Default plan not found. Please run database seed.');
    }
    return plan;
  }

  async findById(id: string): Promise<PlanRecord | null> {
    return this.prisma.plan.findUnique({ where: { id } });
  }

  async findAll(): Promise<PlanRecord[]> {
    return this.prisma.plan.findMany();
  }
}
