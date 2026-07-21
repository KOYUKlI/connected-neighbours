import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDisputeEvidenceDto } from './dto/create-dispute-evidence.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { DisputesService } from './disputes.service';

@ApiTags('disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services/:serviceId/disputes')
export class ServiceDisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({
    summary: 'Ouvrir un litige sur un service engagé',
    description:
      'Réservé aux parties d’un contrat actif avant le transfert final. Les points déjà réservés restent gelés.',
  })
  @ApiBadRequestResponse({ description: 'Description ou raison invalide.' })
  @ApiForbiddenResponse({
    description: "L'utilisateur n'est pas partie au contrat.",
  })
  @ApiConflictResponse({
    description:
      'Contrat, statut, points réservés ou litige actif incompatibles.',
  })
  open(
    @Param('serviceId') serviceId: string,
    @Body() input: CreateDisputeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disputesService.openForService(serviceId, input, user);
  }
}

@ApiTags('disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lister les litiges auxquels je participe' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.disputesService.findMine(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un litige autorisé' })
  @ApiForbiddenResponse({
    description: "L'utilisateur ne participe pas au litige.",
  })
  @ApiNotFoundResponse({ description: 'Litige introuvable.' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.disputesService.findOne(id, user);
  }

  @Get(':id/evidence')
  @ApiOperation({ summary: 'Lister les preuves du litige' })
  findEvidence(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disputesService.findEvidence(id, user);
  }

  @Post(':id/evidence')
  @ApiOperation({
    summary: 'Ajouter une preuve au litige',
    description:
      'Les notes sont utilisables directement. Les autres types exigent une référence de fichier existante.',
  })
  @ApiBadRequestResponse({ description: 'Type ou contenu de preuve invalide.' })
  @ApiConflictResponse({ description: 'Litige déjà clôturé.' })
  addEvidence(
    @Param('id') id: string,
    @Body() input: CreateDisputeEvidenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disputesService.addEvidence(id, input, user);
  }
}
