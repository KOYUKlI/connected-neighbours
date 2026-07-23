import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import {
  DownloadDisposition,
  DownloadFileQueryDto,
} from '../storage/dto/download-file-query.dto';
import { PresignProofUploadDto } from '../storage/dto/presign-proof-upload.dto';
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

  @Post(':id/evidence/presign-upload')
  @ApiOperation({
    summary: 'Préparer le dépôt privé d’une preuve de litige',
    description:
      'Réservé aux parties tant que le litige est ouvert ou en revue. Le fichier doit être finalisé avant association.',
  })
  @ApiBadRequestResponse({ description: 'Type ou taille de fichier invalide.' })
  @ApiForbiddenResponse({ description: "L'utilisateur n'est pas une partie." })
  @ApiConflictResponse({ description: 'Le litige ne reçoit plus de preuve.' })
  presignEvidenceUpload(
    @Param('id') id: string,
    @Body() input: PresignProofUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disputesService.presignEvidenceUpload(id, input, user);
  }

  @Get(':id/evidence/:evidenceId/download-url')
  @ApiOperation({ summary: 'Créer une URL privée temporaire pour une preuve' })
  createEvidenceDownloadUrl(
    @Param('id') id: string,
    @Param('evidenceId') evidenceId: string,
    @Query() query: DownloadFileQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disputesService.createEvidenceDownloadUrl(
      id,
      evidenceId,
      user,
      query.disposition ?? DownloadDisposition.INLINE,
    );
  }

  @Delete(':id/evidence/:evidenceId/attachment')
  @ApiOperation({
    summary: 'Supprimer logiquement sa pièce jointe avant la revue',
    description:
      'Le texte et la trace d’audit restent conservés. Le fichier ne peut pas être réutilisé.',
  })
  deleteEvidenceAttachment(
    @Param('id') id: string,
    @Param('evidenceId') evidenceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disputesService.deleteEvidenceAttachment(id, evidenceId, user);
  }
}
