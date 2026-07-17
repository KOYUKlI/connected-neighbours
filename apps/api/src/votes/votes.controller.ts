import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnswerVoteDto } from './dto/answer-vote.dto';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VotesService } from './votes.service';

@ApiTags('votes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un vote de quartier' })
  create(@Body() dto: CreateVoteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les votes' })
  @ApiQuery({ name: 'neighborhoodId', required: false })
  findAll(@Query('neighborhoodId') neighborhoodId?: string) {
    return this.votesService.findAll(neighborhoodId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un vote' })
  findOne(@Param('id') id: string) {
    return this.votesService.findOne(id);
  }

  @Post(':id/answers')
  @ApiOperation({ summary: 'Répondre à un vote' })
  answer(
    @Param('id') id: string,
    @Body() dto: AnswerVoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.votesService.answer(id, user.sub, dto);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Consulter les résultats d’un vote' })
  results(@Param('id') id: string) {
    return this.votesService.results(id);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Clôturer un vote' })
  close(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.close(id, user);
  }
}
