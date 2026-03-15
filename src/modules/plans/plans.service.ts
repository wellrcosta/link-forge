import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Plan } from '@prisma/client';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findDefault(): Promise<Plan> {
    const plan = await this.prisma.plan.findFirst({ where: { isDefault: true } });
    if (!plan) {
      throw new Error('Default plan not found. Please run database seed.');
    }
    return plan;
  }

  async findById(id: string): Promise<Plan | null> {
    return this.prisma.plan.findUnique({ where: { id } });
  }

  async findAll(): Promise<Plan[]> {
    return this.prisma.plan.findMany();
  }
}
