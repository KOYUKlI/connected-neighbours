import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminListNeighborhoodsQueryDto } from './dto/admin-list-neighborhoods-query.dto';
import { AssignUserNeighborhoodDto } from './dto/assign-user-neighborhood.dto';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';
import { NeighborhoodsService } from './neighborhoods.service';

@ApiTags('Admin - Neighborhoods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
@Controller('admin/neighborhoods')
export class AdminNeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister et filtrer les quartiers pour l’administration',
  })
  list(@Query() query: AdminListNeighborhoodsQueryDto) {
    return this.neighborhoodsService.adminList(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Créer un quartier avec un polygone GeoJSON validé',
  })
  @ApiConflictResponse({
    description: 'Slug déjà utilisé ou zone en chevauchement.',
  })
  create(
    @Body() dto: CreateNeighborhoodDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.neighborhoodsService.create(dto, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter le détail administratif d’un quartier' })
  @ApiNotFoundResponse({ description: 'Quartier introuvable.' })
  detail(@Param('id') id: string) {
    return this.neighborhoodsService.findAdminOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier les informations et la zone d’un quartier',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNeighborhoodDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.neighborhoodsService.update(id, dto, user.sub);
  }

  @Post(':id/archive')
  @ApiOperation({
    summary: 'Archiver un quartier sans supprimer ses historiques',
  })
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.neighborhoodsService.archive(id, user.sub);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Réactiver un quartier après contrôle des chevauchements',
  })
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.neighborhoodsService.restore(id, user.sub);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Consulter les compteurs métier d’un quartier' })
  stats(@Param('id') id: string) {
    return this.neighborhoodsService.getStats(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Lister les membres d’un quartier avec pagination' })
  members(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.neighborhoodsService.findMembers(
      id,
      Math.max(1, page),
      Math.min(100, Math.max(1, limit)),
    );
  }

  @Post(':id/assign-user')
  @ApiOperation({
    summary: 'Affecter manuellement un utilisateur avec justification',
  })
  @ApiForbiddenResponse({ description: 'Rôle admin ou modérateur requis.' })
  @ApiConflictResponse({
    description: 'Quartier archivé ou affectation concurrente.',
  })
  assignUser(
    @Param('id') id: string,
    @Body() dto: AssignUserNeighborhoodDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.neighborhoodsService.assignUser(id, dto, user.sub);
  }
}
