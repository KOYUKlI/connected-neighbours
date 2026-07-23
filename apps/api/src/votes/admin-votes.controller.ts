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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CancelVoteDto } from './dto/cancel-vote.dto';
import { CreateVoteDto } from './dto/create-vote.dto';
import { ListVotesQueryDto } from './dto/list-votes-query.dto';
import { UpdateVoteDto } from './dto/update-vote.dto';
import { VotesService } from './votes.service';

@ApiTags('admin-votes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
@Controller('admin/votes')
export class AdminVotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get()
  findAll(
    @Query() query: ListVotesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.votesService.findAll(query, user, true);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un vote administré' })
  create(@Body() dto: CreateVoteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.create(dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.findOne(id, user, true);
  }

  @Get(':id/results')
  results(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.results(id, user, true);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.votesService.update(id, dto, user);
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
