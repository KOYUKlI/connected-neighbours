import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RgpdService } from './rgpd.service';

@ApiTags('rgpd')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rgpd')
export class RgpdController {
  constructor(private readonly rgpdService: RgpdService) {}

  @Get('export')
  @ApiOperation({ summary: 'Exporter mes données personnelles' })
  exportPersonalData(@CurrentUser() user: AuthenticatedUser) {
    return this.rgpdService.exportPersonalData(user.sub);
  }
}
