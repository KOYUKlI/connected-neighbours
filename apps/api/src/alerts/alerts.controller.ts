import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post('incidents/:incidentId/alerts')
  @ApiOperation({ summary: 'Creer une alerte rattachee a un incident' })
  create(
    @Param('incidentId') incidentId: string,
    @Body() dto: CreateAlertDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.alertsService.create(incidentId, dto, user);
  }

  @Get('incidents/:incidentId/alerts')
  @ApiOperation({ summary: 'Lister les alertes d un incident' })
  findForIncident(@Param('incidentId') incidentId: string) {
    return this.alertsService.findForIncident(incidentId);
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: 'Consulter une alerte' })
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch('alerts/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Modifier une alerte' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.alertsService.update(id, dto, user);
  }

  @Post('alerts/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Resoudre une alerte' })
  resolve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.alertsService.resolve(id, user);
  }
}
