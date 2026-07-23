import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CancelEventDto } from './dto/cancel-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { EventsService } from './events.service';

@ApiTags('admin-events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
@Controller('admin/events')
export class AdminEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les événements pour la modération' })
  findAll(
    @Query() query: ListEventsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.findAll(query, user, true);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.findOne(id, user, true);
  }

  @Get(':id/participants')
  participants(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.participants(id, user, true);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.cancel(id, dto, user, true);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.archive(id, user, true);
  }
}
