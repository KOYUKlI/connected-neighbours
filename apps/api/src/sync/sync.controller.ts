import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PullSyncQueryDto } from './dto/pull-sync-query.dto';
import { PushSyncDto } from './dto/push-sync.dto';
import {
  SyncEntityType,
  SyncOperationType,
} from './schemas/sync-operation.schema';
import { SyncService } from './sync.service';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @ApiOperation({
    summary: 'Recevoir un batch d operations JavaFX offline',
    description:
      'Applique les operations valides, garde l idempotence par operationId et retourne les operations acceptees/rejetees.',
  })
  @ApiBody({
    type: PushSyncDto,
    examples: {
      incidentCreate: {
        summary: 'Creation incident depuis JavaFX',
        value: {
          clientId: 'javafx-client-poste-01',
          operations: [
            {
              operationId: 'javafx-op-0001',
              entityType: SyncEntityType.INCIDENT,
              operationType: SyncOperationType.CREATE,
              payload: {
                title: 'Eclairage en panne',
                description: 'Lampadaire eteint devant le batiment B.',
                type: 'maintenance',
                severity: 'medium',
                neighborhoodId: 'quartier-centre',
                externalId: 'javafx-incident-42',
              },
            },
          ],
        },
      },
    },
  })
  push(@Body() dto: PushSyncDto) {
    return this.syncService.push(dto);
  }

  @Get('pull')
  @ApiOperation({
    summary: 'Recuperer les incidents et alertes modifies depuis une date',
  })
  @ApiQuery({ name: 'clientId', example: 'javafx-client-poste-01' })
  @ApiQuery({
    name: 'since',
    required: false,
    example: '2026-06-30T10:00:00.000Z',
  })
  pull(@Query() query: PullSyncQueryDto) {
    return this.syncService.pull(query);
  }

  @Get('status')
  @ApiOperation({ summary: 'Consulter le statut de synchronisation client' })
  @ApiQuery({ name: 'clientId', example: 'javafx-client-poste-01' })
  getStatus(@Query('clientId') clientId: string) {
    return this.syncService.getStatus(clientId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Lister l historique de synchronisation client' })
  @ApiQuery({ name: 'clientId', example: 'javafx-client-poste-01' })
  getHistory(@Query('clientId') clientId: string) {
    return this.syncService.getHistory(clientId);
  }
}
