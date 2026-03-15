import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as UAParser from 'ua-parser-js';
import { createHash } from 'crypto';
import { ANALYTICS_QUEUE, ANALYTICS_JOBS, ClickEventPayload } from '../../queues/analytics.queue';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectQueue(ANALYTICS_QUEUE) private readonly analyticsQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async emitClickEvent(params: {
    linkId: string;
    userId: string;
    ip?: string;
    referer?: string;
    userAgentString?: string;
  }): Promise<void> {
    const { linkId, userId, ip, referer, userAgentString } = params;
    const ipHash = ip ? createHash('sha256').update(ip).digest('hex') : undefined;

    let browser: string | undefined;
    let os: string | undefined;
    let deviceType: string | undefined;

    if (userAgentString) {
      const parser = new UAParser(userAgentString);
      const result = parser.getResult();
      browser = result.browser.name;
      os = result.os.name;
      deviceType = result.device.type || 'desktop';
    }

    const payload: ClickEventPayload = {
      linkId,
      userId,
      clickedAt: new Date().toISOString(),
      referer,
      userAgent: userAgentString,
      ipHash,
      browser,
      os,
      deviceType,
    };

    await this.analyticsQueue.add(ANALYTICS_JOBS.RECORD_CLICK, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 500,
    });
  }

  async getClickStats(linkId: string, userId: string) {
    const link = await this.prisma.link.findFirst({ where: { id: linkId, userId } });
    if (!link) return null;

    const [total, last7days, byBrowser, byOs, byDevice] = await Promise.all([
      this.prisma.clickEvent.count({ where: { linkId } }),
      this.prisma.clickEvent.count({
        where: {
          linkId,
          clickedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.clickEvent.groupBy({
        by: ['browser'],
        where: { linkId },
        _count: { _all: true },
      }),
      this.prisma.clickEvent.groupBy({
        by: ['os'],
        where: { linkId },
        _count: { _all: true },
      }),
      this.prisma.clickEvent.groupBy({
        by: ['deviceType'],
        where: { linkId },
        _count: { _all: true },
      }),
    ]);

    return { total, last7days, byBrowser, byOs, byDevice };
  }
}
