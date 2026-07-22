import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ListGraphSyncJobsDto } from './dto/list-graph-sync-jobs.dto';
import { ReconcileGraphDto } from './dto/reconcile-graph.dto';
import { GraphAdminService } from './graph-admin.service';
import { GraphSyncService } from './graph-sync.service';

@ApiTags('Admin Graph')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/graph')
export class AdminGraphController {
  constructor(
    private readonly graphAdminService: GraphAdminService,
    private readonly graphSyncService: GraphSyncService,
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'État du graphe dérivé et du fallback MongoDB',
    description:
      'MongoDB reste la source de vérité. Neo4j peut être désactivé ou indisponible sans bloquer les workflows métier.',
  })
  status() {
    return this.graphAdminService.status();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Compter les nœuds et relations de la projection disponible',
  })
  stats() {
    return this.graphAdminService.stats();
  }

  @Get('sync-jobs')
  @ApiOperation({
    summary: 'Lister les jobs idempotents sans exposer la configuration Neo4j',
  })
  jobs(@Query() query: ListGraphSyncJobsDto) {
    return this.graphSyncService.list(query.page, query.limit, query.status);
  }

  @Post('check')
  @ApiOperation({
    summary: 'Tester la connectivité Neo4j sans exposer sa configuration',
  })
  check() {
    return this.graphAdminService.check();
  }

  @Post('sync')
  @ApiOperation({ summary: 'Traiter un lot borné de projections en attente' })
  synchronize() {
    return this.graphAdminService.synchronize();
  }

  @Post('retry-failed')
  @ApiOperation({
    summary: 'Reprogrammer un lot borné de jobs arrivés en échec terminal',
  })
  retryFailed() {
    return this.graphAdminService.retryFailed();
  }

  @Post('reconcile')
  @ApiOperation({
    summary: 'Reconstruire les projections depuis MongoDB par lots',
    description:
      'L’opération est idempotente, accepte un dry-run et exige confirm=true pour une exécution réelle.',
  })
  @ApiResponse({ status: 400, description: 'Confirmation manquante.' })
  reconcile(@Body() dto: ReconcileGraphDto) {
    return this.graphAdminService.reconcile(dto);
  }
}
