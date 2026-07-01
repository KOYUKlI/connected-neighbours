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
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
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
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';
import { NeighborhoodsService } from './neighborhoods.service';

@ApiTags('Neighborhoods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('neighborhoods')
export class NeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Créer un quartier géographique' })
  @ApiBadRequestResponse({ description: 'GeoJSON Polygon invalide' })
  @ApiForbiddenResponse({ description: 'Role admin ou moderator requis' })
  create(
    @Body() dto: CreateNeighborhoodDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.neighborhoodsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les quartiers' })
  @ApiQuery({
    name: 'includeArchived',
    required: false,
    description: 'Inclut les quartiers archives lorsque vaut true.',
  })
  findAll(@Query('includeArchived') includeArchived?: string) {
    return this.neighborhoodsService.findAll(includeArchived === 'true');
  }

  @Post(':id/contains-point')
  @ApiOperation({
    summary: 'Verifier si un point [longitude, latitude] est dans le quartier',
  })
  @ApiOkResponse({
    description: 'Retourne contains=true si le point est dans le polygone.',
  })
  @ApiBadRequestResponse({ description: 'Point ou polygone invalide' })
  containsPoint(@Param('id') id: string, @Body() dto: ContainsPointDto) {
    return this.neighborhoodsService.containsPoint(id, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Lister les membres rattaches au quartier' })
  @ApiOkResponse({
    description: 'Retourne les utilisateurs sans passwordHash.',
  })
  members(@Param('id') id: string) {
    return this.neighborhoodsService.findMembers(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obtenir les statistiques du quartier' })
  stats(@Param('id') id: string) {
    return this.neighborhoodsService.getStats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un quartier' })
  findOne(@Param('id') id: string) {
    return this.neighborhoodsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Modifier un quartier' })
  @ApiBadRequestResponse({ description: 'GeoJSON Polygon invalide' })
  @ApiForbiddenResponse({ description: 'Role admin ou moderator requis' })
  update(@Param('id') id: string, @Body() dto: UpdateNeighborhoodDto) {
    return this.neighborhoodsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Archiver un quartier' })
  @ApiForbiddenResponse({ description: 'Role admin ou moderator requis' })
  archive(@Param('id') id: string) {
    return this.neighborhoodsService.archive(id);
  }
}
