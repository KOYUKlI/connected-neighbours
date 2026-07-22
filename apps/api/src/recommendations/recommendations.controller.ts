import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecommendationsQueryDto } from './dto/recommendations-query.dto';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT absent, expiré ou invalide.' })
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get('services')
  @ApiOperation({
    summary: 'Recommander des services locaux avec fallback MongoDB',
    description:
      'Classement déterministe par quartier, centres d’intérêt et relations de confiance. Neo4j ne fournit que des identifiants et des raisons; chaque service est rechargé et autorisé depuis MongoDB.',
  })
  @ApiOkResponse({
    description:
      'Objets revalidés depuis MongoDB. Les scores techniques ne sont jamais exposés.',
  })
  services(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: RecommendationsQueryDto,
  ) {
    return this.recommendationsService.services(actor, query);
  }

  @Get('events')
  @ApiOperation({
    summary: 'Recommander des événements locaux avec fallback MongoDB',
    description:
      'Les événements sont revalidés depuis MongoDB et restent limités au quartier et aux statuts accessibles au résident.',
  })
  events(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: RecommendationsQueryDto,
  ) {
    return this.recommendationsService.events(actor, query);
  }

  @Get('neighbors')
  @ApiOperation({
    summary: 'Suggérer des profils publics du même quartier',
    description:
      'Seuls les profils actifs et visibles dans le quartier sont retournés. Aucun score technique n’est exposé.',
  })
  neighbors(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: RecommendationsQueryDto,
  ) {
    return this.recommendationsService.neighbors(actor, query);
  }
}
