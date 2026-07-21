import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateServiceProofDto } from './dto/create-service-proof.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';
import { RequestServiceCorrectionDto } from './dto/request-service-correction.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceExecutionService } from './service-execution.service';
import { ServicesService } from './services.service';

const SERVICE_RESPONSE_EXAMPLE = {
  id: '665f23d88bc7b9564f4a92ef',
  title: 'Aide pour monter un meuble',
  description: 'Recherche un voisin disponible samedi.',
  type: 'request',
  category: 'Bricolage',
  availability: 'Samedi après-midi',
  neighborhoodId: 'quartier-centre',
  ownerId: '665f22bd8bc7b9564f4a9201',
  isPaid: true,
  pricePoints: 25,
  status: 'in_progress',
  executionStatus: 'in_progress',
  owner: {
    id: '665f22bd8bc7b9564f4a9201',
    displayName: 'Alice Martin',
    avatarUrl: null,
    neighborhoodId: 'quartier-centre',
    reputationScore: null,
    completedServicesCount: 2,
  },
  neighborhood: {
    id: '665f21ae8bc7b9564f4a9101',
    name: 'Quartier Centre',
    city: 'Paris',
  },
  applicationsCount: 1,
  proofsCount: 1,
  viewer: { isOwner: false, hasApplied: true, canApply: false },
  permissions: {
    canStart: false,
    canAddProof: true,
    canMarkDone: true,
    canValidate: false,
    canRequestCorrection: false,
    canViewProofs: true,
  },
};

@ApiTags('services')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT absent, expiré ou invalide.' })
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly executionService: ServiceExecutionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer une annonce de service' })
  create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.servicesService.create(createServiceDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les annonces de service' })
  @ApiOkResponse({
    description: 'Services visibles enrichis et sans données privées.',
    schema: { example: [SERVICE_RESPONSE_EXAMPLE] },
  })
  findAll(
    @Query() query: ListServicesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.findAll(query, user);
  }

  @Get('me/created')
  @ApiOperation({ summary: "Lister les services créés par l'utilisateur" })
  @ApiOkResponse({ schema: { example: [SERVICE_RESPONSE_EXAMPLE] } })
  findMineCreated(@CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findCreatedByUser(user);
  }

  @Get('me/involved')
  @ApiOperation({ summary: "Lister les services impliquant l'utilisateur" })
  findMineInvolved(@CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findInvolvedByUser(user);
  }

  @Post(':id/start')
  @ApiOperation({
    summary: 'Démarrer un service planifié',
    description:
      'Réservé au prestataire sélectionné lorsque le contrat est actif.',
  })
  @ApiCreatedResponse({ description: 'Service passé en cours.' })
  @ApiForbiddenResponse({
    description: "L'utilisateur n'est pas le prestataire.",
  })
  @ApiConflictResponse({ description: 'Contrat ou statut incompatible.' })
  start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.executionService.start(id, user);
  }

  @Post(':id/proofs')
  @ApiOperation({ summary: 'Ajouter une preuve de réalisation' })
  @ApiBadRequestResponse({ description: 'Type ou contenu de preuve invalide.' })
  @ApiForbiddenResponse({ description: "L'utilisateur n'est pas participant." })
  @ApiConflictResponse({ description: "Le service n'est pas en exécution." })
  addProof(
    @Param('id') id: string,
    @Body() input: CreateServiceProofDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.executionService.addProof(id, input, user);
  }

  @Get(':id/proofs')
  @ApiOperation({ summary: 'Lister les preuves de réalisation' })
  @ApiOkResponse({
    schema: {
      example: [
        {
          id: '665f24aa8bc7b9564f4a9310',
          serviceId: '665f23d88bc7b9564f4a92ef',
          authorId: '665f22bd8bc7b9564f4a9202',
          type: 'note',
          message: 'Le meuble est monté et fixé.',
          fileReference: null,
          createdAt: '2026-07-21T12:00:00.000Z',
          author: { id: '665f22bd8bc7b9564f4a9202', displayName: 'Bob Dupont' },
        },
      ],
    },
  })
  @ApiForbiddenResponse({ description: "L'utilisateur n'est pas participant." })
  findProofs(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.executionService.findProofs(id, user);
  }

  @Post(':id/mark-done')
  @ApiOperation({
    summary: 'Déclarer le service réalisé',
    description:
      'Réservé au prestataire. Au moins une preuve est exigée, et une nouvelle preuve après une demande de correction.',
  })
  @ApiForbiddenResponse({
    description: "L'utilisateur n'est pas le prestataire.",
  })
  @ApiConflictResponse({
    description: 'Preuve absente ou statut incompatible.',
  })
  markDone(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.executionService.markDone(id, user);
  }

  @Post(':id/validate')
  @ApiOperation({
    summary: 'Valider la réalisation et transférer les points',
    description:
      'Réservé au demandeur. Le transfert final est unique et clôture le service et le contrat.',
  })
  @ApiForbiddenResponse({
    description: "L'utilisateur n'est pas le demandeur.",
  })
  @ApiConflictResponse({
    description: 'Le service ne peut pas être validé ou a déjà été transféré.',
  })
  validate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.executionService.validate(id, user);
  }

  @Post(':id/request-correction')
  @ApiOperation({
    summary: 'Demander une correction avant validation',
    description:
      'Réservé au demandeur lorsque le service attend sa validation.',
  })
  @ApiBadRequestResponse({ description: 'Une raison valide est requise.' })
  @ApiForbiddenResponse({
    description: "L'utilisateur n'est pas le demandeur.",
  })
  @ApiConflictResponse({
    description: "Le service n'attend pas de validation.",
  })
  requestCorrection(
    @Param('id') id: string,
    @Body() input: RequestServiceCorrectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.executionService.requestCorrection(id, input, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter une annonce de service' })
  @ApiNotFoundResponse({ description: 'Service introuvable ou non visible.' })
  @ApiOkResponse({ schema: { example: SERVICE_RESPONSE_EXAMPLE } })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une annonce de service' })
  @ApiForbiddenResponse({
    description: "L'utilisateur n'est pas propriétaire.",
  })
  @ApiConflictResponse({ description: "Le statut actuel interdit l'action." })
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.update(id, updateServiceDto, user);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publier une annonce de service' })
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.publish(id, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler une annonce de service' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.cancel(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une annonce de service' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.remove(id, user);
  }
}
