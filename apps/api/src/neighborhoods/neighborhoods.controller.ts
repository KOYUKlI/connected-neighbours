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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';
import { NeighborhoodsService } from './neighborhoods.service';

@ApiTags('neighborhoods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('neighborhoods')
export class NeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer un quartier géographique' })
  create(
    @Body() dto: CreateNeighborhoodDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.neighborhoodsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les quartiers actifs' })
  findAll() {
    return this.neighborhoodsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un quartier' })
  findOne(@Param('id') id: string) {
    return this.neighborhoodsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Modifier un quartier' })
  update(@Param('id') id: string, @Body() dto: UpdateNeighborhoodDto) {
    return this.neighborhoodsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Archiver un quartier' })
  archive(@Param('id') id: string) {
    return this.neighborhoodsService.archive(id);
  }
}
