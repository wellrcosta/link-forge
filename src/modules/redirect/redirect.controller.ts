import { Controller, Get, Param, Res, Req, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RedirectService } from './redirect.service';

@ApiTags('Redirect')
@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Redirect to original URL by slug' })
  @ApiParam({ name: 'slug', description: 'Short link slug' })
  @ApiResponse({ status: 302, description: 'Redirect to original URL' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @ApiResponse({ status: 410, description: 'Link disabled or expired' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async redirect(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      '0.0.0.0';

    const referer = req.headers['referer'] as string | undefined;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const originalUrl = await this.redirectService.resolveSlug(
      slug,
      clientIp,
      referer,
      userAgent,
    );

    res.redirect(HttpStatus.FOUND, originalUrl);
  }
}
