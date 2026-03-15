import {
  Injectable,
  NotFoundException,
  GoneException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  async resolveSlug(
    slug: string,
    clientIp: string,
    referer?: string,
    userAgent?: string,
  ): Promise<string> {
    const globalMax = this.configService.get<number>('rateLimit.global.max');
    const globalTtl = this.configService.get<number>('rateLimit.global.ttl');
    const globalResult = await this.rateLimitService.checkGlobal(clientIp, globalMax, globalTtl);
    if (!globalResult.allowed) {
      throw new HttpException('Global rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    const ipMax = this.configService.get<number>('rateLimit.ip.max');
    const ipTtl = this.configService.get<number>('rateLimit.ip.ttl');
    const ipResult = await this.rateLimitService.checkIp(clientIp, ipMax, ipTtl);
    if (!ipResult.allowed) {
      throw new HttpException('IP rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    const slugMax = this.configService.get<number>('rateLimit.slug.max');
    const slugTtl = this.configService.get<number>('rateLimit.slug.ttl');
    const slugResult = await this.rateLimitService.checkSlug(slug, slugMax, slugTtl);
    if (!slugResult.allowed) {
      throw new HttpException('This link has exceeded its rate limit', HttpStatus.TOO_MANY_REQUESTS);
    }

    const link = await this.prisma.link.findUnique({
      where: { slug },
      include: {
        user: { include: { plan: true, overrides: true } },
      },
    });

    if (!link) throw new NotFoundException('Link not found');

    if (!link.isActive || link.disabledAt) {
      throw new GoneException('This link has been disabled');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new GoneException('This link has expired');
    }

    const user = link.user;
    const maxTotalClicks = user.overrides?.customMaxTotalClicks ?? user.plan.maxTotalClicks;
    const maxClicksPerLink = user.overrides?.customMaxClicksPerLink ?? user.plan.maxClicksPerLink;

    const totalClicks = await this.prisma.clickEvent.count({ where: { link: { userId: user.id } } });
    if (BigInt(totalClicks) >= maxTotalClicks) {
      throw new HttpException('User total click quota exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (link.clickCount >= maxClicksPerLink) {
      await this.prisma.link.update({
        where: { id: link.id },
        data: { isActive: false, disabledAt: new Date() },
      });
      throw new HttpException('Link click quota exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    this.analyticsService
      .emitClickEvent({
        linkId: link.id,
        userId: user.id,
        ip: clientIp,
        referer,
        userAgentString: userAgent,
      })
      .catch((err) => this.logger.error(`Failed to queue analytics event: ${err.message}`));

    return link.originalUrl;
  }
}
