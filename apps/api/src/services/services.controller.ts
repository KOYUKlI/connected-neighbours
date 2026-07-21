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
  ApiBearerAuth,
  ApiConflictResponse,
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
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

const SERVICE_RESPONSE_EXAMPLE = {
  id: '665f23d88bc7b9564f4a92ef',
  title: 'Aide pour monter un meuble',
  description: 'Recherche un voisin disponible samedi.',
  type: 'request',
  category: 'Bricolage',
  availability: 'Samedi apres-midi',
  neighborhoodId: 'quartier-centre',
  ownerId: '665f22bd8bc7b9564f4a9201',
  isPaid: true,
  pricePoints: 25,
  status: 'published',
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
  viewer: { isOwner: false, hasApplied: false, canApply: true },
  permissions: { canApply: true, canEdit: false, canViewContract: false },
};

@ApiTags('services')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT absent, expire ou invalide.' })
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

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
    description: 'Services visibles enrichis et sans donnees privees.',
    schema: { example: [SERVICE_RESPONSE_EXAMPLE] },
  })
  findAll(
    @Query() query: ListServicesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.findAll(query, user);
  }

  @Get('me/created')
  @ApiOperation({ summary: "Lister les services crees par l'utilisateur" })
  @ApiOkResponse({ schema: { example: [SERVICE_RESPONSE_EXAMPLE] } })
  findMineCreated(@CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findCreatedByUser(user);
  }

  @Get('me/involved')
  @ApiOperation({ summary: "Lister les services impliquant l'utilisateur" })
  @ApiOkResponse({
    schema: {
      example: [
        {
          ...SERVICE_RESPONSE_EXAMPLE,
          involvement: {
            role: 'provider',
            applicationStatus: 'accepted',
            contractStatus: 'sent',
            nextAction: 'sign_contract',
          },
        },
      ],
    },
  })
  findMineInvolved(@CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findInvolvedByUser(user);
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
    description: "L'utilisateur n'est pas proprietaire.",
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
  @ApiForbiddenResponse({
    description: "L'utilisateur n'est pas proprietaire.",
  })
  @ApiConflictResponse({ description: "Le statut actuel interdit l'action." })
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.publish(id, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler une annonce de service' })
  @ApiForbiddenResponse({
    description: "L'utilisateur n'est pas proprietaire.",
  })
  @ApiConflictResponse({ description: "Le statut actuel interdit l'action." })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.cancel(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une annonce de service' })
  @ApiForbiddenResponse({
    description: "L'utilisateur n'est pas proprietaire.",
  })
  @ApiConflictResponse({
    description: 'Seul un brouillon non engage peut etre supprime.',
  })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.remove(id, user);
  }
}
