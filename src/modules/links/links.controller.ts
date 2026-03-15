import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a short link' })
  @ApiResponse({ status: 201, description: 'Link created' })
  @ApiResponse({ status: 422, description: 'Link quota exceeded' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateLinkDto) {
    return this.linksService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all links for the current user' })
  findAll(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.linksService.findAllByUser(userId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific link' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.linksService.findOne(id, userId);
  }

  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable a link' })
  disable(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.linksService.disable(id, userId);
  }

  @Patch(':id/enable')
  @ApiOperation({ summary: 'Re-enable a disabled link' })
  enable(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.linksService.enable(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a link' })
  @ApiResponse({ status: 204 })
  delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.linksService.delete(id, userId);
  }
}
