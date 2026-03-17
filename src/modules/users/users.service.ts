import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { PlansService } from '../plans/plans.service';
import { CreateUserDto } from './dto/create-user.dto';

type UserRecord = NonNullable<Awaited<ReturnType<PrismaService['user']['findUnique']>>>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plansService: PlansService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserRecord> {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const defaultPlan = await this.plansService.findDefault();
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        planId: defaultPlan.id,
      },
    });
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdWithPlan(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        plan: true,
        overrides: true,
      },
    });
  }

  async findByIdOrThrow(id: string): Promise<UserRecord> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
