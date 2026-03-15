import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { ANALYTICS_QUEUE, ANALYTICS_JOBS, ClickEventPayload } from '../../queues/analytics.queue';

@Processor(ANALYTICS_QUEUE)
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === ANALYTICS_JOBS.RECORD_CLICK) {
      await this.handleRecordClick(job.data as ClickEventPayload);
    }
  }

  private async handleRecordClick(payload: ClickEventPayload): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.clickEvent.create({
          data: {
            linkId: payload.linkId,
            clickedAt: new Date(payload.clickedAt),
            referer: payload.referer,
            userAgent: payload.userAgent,
            ipHash: payload.ipHash,
            country: payload.country,
            city: payload.city,
            browser: payload.browser,
            os: payload.os,
            deviceType: payload.deviceType,
          },
        }),
        this.prisma.link.update({
          where: { id: payload.linkId },
          data: { clickCount: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      this.logger.error(`Failed to record click for link ${payload.linkId}: ${error.message}`);
      throw error;
    }
  }
}
