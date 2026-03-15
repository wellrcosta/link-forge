import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('links/:id')
  @ApiOperation({ summary: 'Get click stats for a link' })
  getStats(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) linkId: string,
  ) {
    return this.analyticsService.getClickStats(linkId, userId);
  }
}
