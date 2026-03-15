import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserOverrideDto } from './dto/update-user-override.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get overall system statistics' })
  getStats() {
    return this.adminService.getSystemStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  listUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.listUsers(+page, +limit);
  }

  @Patch('users/:id/overrides')
  @ApiOperation({ summary: 'Set custom quota overrides for a user' })
  updateOverride(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserOverrideDto,
  ) {
    return this.adminService.updateUserOverride(userId, dto);
  }

  @Delete('users/:id/overrides')
  @ApiOperation({ summary: 'Remove quota overrides for a user' })
  removeOverride(@Param('id', ParseUUIDPipe) userId: string) {
    return this.adminService.removeUserOverride(userId);
  }

  @Patch('links/:id/disable')
  @ApiOperation({ summary: 'Admin: disable any link' })
  disableLink(@Param('id', ParseUUIDPipe) linkId: string) {
    return this.adminService.disableUserLink(linkId);
  }

  @Patch('links/:id/enable')
  @ApiOperation({ summary: 'Admin: enable any link' })
  enableLink(@Param('id', ParseUUIDPipe) linkId: string) {
    return this.adminService.enableUserLink(linkId);
  }
}
