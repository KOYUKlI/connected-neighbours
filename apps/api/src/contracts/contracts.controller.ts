import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
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
      'Route legacy: accepter directement un service et créer un contrat si payant',
  })
  acceptService(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.contractsService.acceptService(serviceId, user.sub);
  }

  @Post('from-application/:applicationId')
  @ApiOperation({
    summary: 'Générer un contrat depuis une candidature acceptée',
  })
  @ApiBadRequestResponse({
    description:
      'Candidature non acceptée, contrat déjà existant ou points insuffisants',
  })
  @ApiForbiddenResponse({
    description: 'Seul le propriétaire du service peut générer le contrat',
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
  @ApiOkResponse({
    description: 'Contrats avec service et profils publics des parties.',
  })
  findAll(@CurrentUser() user: { sub: string }) {
    return this.contractsService.findAllForUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un contrat' })
  @ApiForbiddenResponse({
    description: "Le compte n'est pas partie au contrat.",
  })
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
    summary: 'Route legacy : valider la réalisation du service',
    description:
      'Dépréciée : applique les mêmes préconditions que POST /services/:id/validate.',
    deprecated: true,
  })
  @ApiConflictResponse({
    description:
      "Le prestataire n'a pas encore déclaré le service réalisé ou les points ont déjà été transférés.",
  })
  complete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.contractsService.complete(id, user);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Annuler un contrat et libérer les points réservés',
  })
  cancel(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.contractsService.cancel(id, user.sub);
  }
}
