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
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@ApiBearerAuth()
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
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter une annonce de service' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une annonce de service' })
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
