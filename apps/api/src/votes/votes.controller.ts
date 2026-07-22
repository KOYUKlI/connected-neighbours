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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnswerVoteDto } from './dto/answer-vote.dto';
import { CancelVoteDto } from './dto/cancel-vote.dto';
import { CreateVoteDto } from './dto/create-vote.dto';
import { ListVotesQueryDto } from './dto/list-votes-query.dto';
import { UpdateVoteDto } from './dto/update-vote.dto';
import { VotesService } from './votes.service';

@ApiTags('votes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un vote (administrateur ou modérateur)' })
  create(@Body() dto: CreateVoteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les votes visibles de son quartier' })
  findAll(
    @Query() query: ListVotesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const hasModernFilter = [
      query.search,
      query.status,
      query.ballotType,
      query.privacy,
      query.createdBy,
      query.answered,
      query.sort,
      query.page,
      query.limit,
      query.createdById,
    ].some((value) => value !== undefined);
    return !hasModernFilter && query.neighborhoodId
      ? this.votesService.findLegacy(query.neighborhoodId, user)
      : this.votesService.findAll(query, user);
  }

  @Get(':id/results')
  @ApiOperation({
    summary:
      'Consulter les résultats agrégés selon leur politique de visibilité',
  })
  results(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.results(id, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter un vote, sa propre réponse et ses permissions',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.findOne(id, user);
  }

  @Post(':id/answers')
  @ApiOperation({ summary: 'Enregistrer ou modifier sa propre réponse' })
  answer(
    @Param('id') id: string,
    @Body() dto: AnswerVoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.votesService.answer(id, user, dto);
  }

  @Patch(':id/close')
  @ApiOperation({
    summary: 'Route historique de clôture, réservée à la modération',
  })
  closeLegacy(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.close(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.votesService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.remove(id, user);
  }

  @Post(':id/open')
  open(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.open(id, user);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.close(id, user);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelVoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.votesService.cancel(id, dto, user);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.archive(id, user);
  }
}
