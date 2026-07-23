import {
  Body,
  Controller,
  Get,
  Param,
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
import { AdminListReviewsQueryDto } from './dto/admin-list-reviews-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Admin Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  list(
    @Query() query: AdminListReviewsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviewsService.adminList(query, actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviewsService.findOne(id, actor);
  }

  @Post(':id/hide')
  @ApiOperation({ summary: 'Masquer un avis sans le supprimer' })
  hide(
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviewsService.hide(id, dto.reason, actor);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restaurer un avis masqué' })
  restore(
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviewsService.restore(id, dto.reason, actor);
  }
}
