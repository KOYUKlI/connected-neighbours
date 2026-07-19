import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Synthese globale du back-office' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('services')
  @ApiOperation({ summary: 'Lister les services recents pour le back-office' })
  getServices() {
    return this.adminService.getRecentServices();
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Lister les contrats recents pour le back-office' })
  getContracts() {
    return this.adminService.getRecentContracts();
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Lister les incidents recents pour le back-office' })
  getIncidents() {
    return this.adminService.getRecentIncidents();
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Recuperer un incident par son identifiant' })
  getIncident(@Param('id') id: string) {
    return this.adminService.getIncidentById(id);
  }

  @Get('incidents/:id/alerts')
  @ApiOperation({ summary: 'Lister les alertes rattachees a un incident' })
  getIncidentAlerts(@Param('id') id: string) {
    return this.adminService.getIncidentAlerts(id);
  }

  @Get('sync/status')
  @ApiOperation({
    summary: 'Lister les statuts de synchronisation connus',
  })
  getSyncStatus() {
    return this.adminService.getSyncStatus();
  }

  @Get('users')
  @ApiOperation({ summary: 'Lister les utilisateurs recents sans mot de passe' })
  getUsers() {
    return this.adminService.getRecentUsers();
  }
}
