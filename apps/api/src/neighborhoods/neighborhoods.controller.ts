import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContainsPointDto } from './dto/contains-point.dto';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { ResolveNeighborhoodDto } from './dto/resolve-neighborhood.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';
import { NeighborhoodsService } from './neighborhoods.service';

@ApiTags('Neighborhoods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('neighborhoods')
export class NeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les quartiers actifs visibles' })
  findAll() {
    return this.neighborhoodsService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Consulter le quartier de l’utilisateur connecté' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.neighborhoodsService.findMine(user.sub);
  }

  @Post('resolve')
  @ApiOperation({
    summary:
      'Résoudre un quartier depuis un point GeoJSON sans stocker la position',
  })
  @ApiOkResponse({
    description: 'Quartier candidat à confirmer, ou aucun résultat.',
  })
  @ApiBadRequestResponse({ description: 'Point GeoJSON invalide.' })
  @ApiConflictResponse({
    description: 'Plusieurs quartiers actifs se chevauchent.',
  })
  resolve(
    @Body() dto: ResolveNeighborhoodDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.neighborhoodsService.resolve(dto, user.sub);
  }

  @Post('me/confirm')
  @ApiOperation({
    summary:
      'Confirmer le quartier précédemment résolu pour l’utilisateur connecté',
  })
  @ApiConflictResponse({
    description: 'Résolution absente, expirée ou obsolète.',
  })
  confirmMine(@CurrentUser() user: AuthenticatedUser) {
    return this.neighborhoodsService.confirmResolvedNeighborhood(user.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter un quartier actif par identifiant ou slug',
  })
  @ApiNotFoundResponse({ description: 'Quartier actif introuvable.' })
  findOne(@Param('id') id: string) {
    return this.neighborhoodsService.findPublicOne(id);
  }

  // Aliases hérités : les nouvelles interfaces d’administration utilisent
  // exclusivement /admin/neighborhoods.
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: '[Hérité] Créer un quartier géographique' })
  create(
    @Body() dto: CreateNeighborhoodDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.neighborhoodsService.create(dto, user.sub);
  }

  @Post(':id/contains-point')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: '[Hérité] Tester un point dans un quartier' })
  containsPoint(@Param('id') id: string, @Body() dto: ContainsPointDto) {
    return this.neighborhoodsService.containsPoint(id, dto);
  }

  @Get(':id/members')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: '[Hérité] Lister les membres du quartier' })
  members(@Param('id') id: string) {
    return this.neighborhoodsService.findMembers(id);
  }

  @Get(':id/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: '[Hérité] Consulter les statistiques du quartier' })
  stats(@Param('id') id: string) {
    return this.neighborhoodsService.getStats(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: '[Hérité] Modifier un quartier' })
  @ApiForbiddenResponse({ description: 'Rôle admin ou modérateur requis.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNeighborhoodDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.neighborhoodsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: '[Hérité] Archiver un quartier' })
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.neighborhoodsService.archive(id, user.sub);
  }
}
