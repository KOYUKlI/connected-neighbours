import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('services/:serviceId/applications')
  @ApiOperation({ summary: 'Candidater a un service publie' })
  create(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applicationsService.create(serviceId, user.sub, dto);
  }

  @Get('services/:serviceId/applications')
  @ApiOperation({ summary: 'Lister les candidatures recues pour un service' })
  @ApiOkResponse({
    description: 'Candidatures enrichies avec le profil public du candidat.',
  })
  findForService(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applicationsService.findForService(serviceId, user.sub);
  }

  @Get('applications/me')
  @ApiOperation({ summary: 'Lister mes candidatures' })
  @ApiOkResponse({
    description: 'Candidatures avec service et proprietaire lisibles.',
  })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.findMine(user.sub);
  }

  @Post('applications/:id/accept')
  @ApiOperation({ summary: 'Accepter une candidature' })
  accept(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.accept(id, user.sub);
  }

  @Post('applications/:id/reject')
  @ApiOperation({ summary: 'Rejeter une candidature' })
  reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.reject(id, user.sub);
  }

  @Post('applications/:id/withdraw')
  @ApiOperation({ summary: 'Retirer sa candidature' })
  withdraw(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.withdraw(id, user.sub);
  }
}
