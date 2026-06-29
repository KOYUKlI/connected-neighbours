import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContractsService } from './contracts.service';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('services/:serviceId/accept')
  @ApiOperation({
    summary:
      'Route legacy: accepter directement un service et creer un contrat si payant',
  })
  acceptService(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.contractsService.acceptService(serviceId, user.sub);
  }

  @Post('from-application/:applicationId')
  @ApiOperation({
    summary: 'Generer un contrat depuis une candidature acceptee',
  })
  @ApiBadRequestResponse({
    description:
      'Candidature non acceptee, contrat deja existant ou points insuffisants',
  })
  @ApiForbiddenResponse({
    description: 'Seul le proprietaire du service peut generer le contrat',
  })
  @ApiNotFoundResponse({
    description: 'Candidature ou service introuvable',
  })
  createFromApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contractsService.createFromApplication(applicationId, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister mes contrats' })
  findAll(@CurrentUser() user: { sub: string }) {
    return this.contractsService.findAllForUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un contrat' })
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.contractsService.findOne(id, user.sub);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Signer un contrat' })
  sign(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.contractsService.sign(id, user.sub);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Clôturer un contrat et transférer les points réservés',
  })
  complete(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.contractsService.complete(id, user.sub);
  }
}
