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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CancelEventDto } from './dto/cancel-event.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { RespondEventDto } from './dto/respond-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un brouillon d’événement dans son quartier' })
  create(@Body() dto: CreateEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister et filtrer les événements visibles' })
  findAll(
    @Query() query: ListEventsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const hasModernFilter = [
      query.search,
      query.category,
      query.status,
      query.from,
      query.to,
      query.response,
      query.organizer,
      query.sort,
      query.page,
      query.limit,
      query.organizerId,
      query.full,
    ].some((value) => value !== undefined);
    return !hasModernFilter && query.neighborhoodId
      ? this.eventsService.findLegacy(query.neighborhoodId, user)
      : this.eventsService.findAll(query, user);
  }

  @Get('discover')
  @ApiOperation({
    summary:
      'Découvrir les événements futurs de son quartier (classement MongoDB)',
  })
  discover(
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: string,
  ) {
    return this.eventsService.discover(user, category);
  }

  @Get('recommended')
  @ApiOperation({
    summary: 'Route historique de recommandation événementielle',
  })
  recommend(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.recommend(user);
  }

  @Get('me/responses')
  @ApiOperation({ summary: 'Lister mes réponses aux événements' })
  findMyResponses(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.findMyResponses(user);
  }

  @Get('me/created')
  @ApiOperation({ summary: 'Lister mes événements créés, brouillons inclus' })
  findMyCreated(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.findMyCreated(user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter un événement et les permissions du viewer',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un événement avant son démarrage' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un brouillon sans réponse' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.remove(id, user);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publier un brouillon valide' })
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.publish(id, user);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Répondre à un événement (route générale)' })
  respond(
    @Param('id') id: string,
    @Body() dto: RespondEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.respond(id, user, dto);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Participer ou rejoindre la liste d’attente' })
  join(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.join(id, user);
  }

  @Post(':id/leave')
  @ApiOperation({
    summary: 'Se désinscrire et promouvoir le premier en attente',
  })
  leave(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.leave(id, user);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Lister les profils publics des participants' })
  participants(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.participants(id, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler un événement avec une raison' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.cancel(id, dto, user);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.start(id, user);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.complete(id, user);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.archive(id, user);
  }
}
