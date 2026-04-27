import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { RespondEventDto } from './dto/respond-event.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un événement de quartier' })
  create(@Body() dto: CreateEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les événements planifiés' })
  @ApiQuery({ name: 'neighborhoodId', required: false })
  findAll(@Query('neighborhoodId') neighborhoodId?: string) {
    return this.eventsService.findAll(neighborhoodId);
  }

  @Get('recommended')
  @ApiOperation({
    summary: 'Recommander des événements à l’utilisateur connecté',
  })
  recommend(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.recommend(user);
  }

  @Get('me/responses')
  @ApiOperation({ summary: 'Lister mes réponses aux événements' })
  findMyResponses(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.findMyResponses(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un événement' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Indiquer son intérêt pour un événement' })
  respond(
    @Param('id') id: string,
    @Body() dto: RespondEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.respond(id, user.sub, dto);
  }
}
