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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssignDisputeDto } from './dto/assign-dispute.dto';
import { ListAdminDisputesQueryDto } from './dto/list-admin-disputes-query.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { DisputesService } from './disputes.service';

@ApiTags('admin-disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
@Controller('admin/disputes')
export class AdminDisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les litiges pour la modération',
    description:
      'Pagination et filtres par statut, raison, modérateur et quartier.',
  })
  findAll(
    @Query() query: ListAdminDisputesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disputesService.findAdmin(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter le dossier complet de modération' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.disputesService.findOne(id, user);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assigner le litige à un modérateur' })
  @ApiBadRequestResponse({ description: 'Modérateur cible invalide.' })
  @ApiForbiddenResponse({ description: 'Assignation non autorisée.' })
  assign(
    @Param('id') id: string,
    @Body() input: AssignDisputeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disputesService.assign(id, input, user);
  }

  @Post(':id/start-review')
  @ApiOperation({ summary: 'Démarrer la revue du litige assigné' })
  @ApiConflictResponse({
    description: 'Litige non assigné ou statut incompatible.',
  })
  startReview(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.disputesService.startReview(id, user);
  }

  @Post(':id/resolve')
  @ApiOperation({
    summary: 'Résoudre financièrement le litige',
    description:
      'Paiement prestataire, remboursement demandeur ou partage exact du montant réservé. La résolution est idempotente.',
  })
  @ApiBadRequestResponse({ description: 'Partage ou justification invalide.' })
  @ApiForbiddenResponse({ description: 'Modérateur non assigné.' })
  @ApiConflictResponse({
    description:
      'Litige déjà résolu, transition concurrente ou verrou financier incohérent.',
  })
  resolve(
    @Param('id') id: string,
    @Body() input: ResolveDisputeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disputesService.resolve(id, input, user);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Clôturer un litige résolu' })
  close(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.disputesService.close(id, user);
  }
}
