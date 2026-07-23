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
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('contracts/:contractId/reviews')
  @ApiOperation({ summary: 'Publier un avis après un contrat terminé' })
  create(
    @Param('contractId') contractId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviewsService.create(contractId, dto, actor);
  }

  @Get('users/:userId/reviews')
  @ApiOperation({ summary: 'Lister les avis publiés reçus par un habitant' })
  listForUser(
    @Param('userId') userId: string,
    @Query() query: ListReviewsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviewsService.listForUser(userId, query, actor);
  }

  @Get('users/:userId/reputation')
  @ApiOperation({
    summary: 'Calculer la réputation depuis les avis publiés',
    description:
      'Moyenne bayésienne avec moyenne antérieure 4/5 et poids 5. Le score est nul sans avis.',
  })
  reputation(
    @Param('userId') userId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviewsService.reputation(userId, actor);
  }

  @Get('reviews/me/given')
  listGiven(
    @Query() query: ListReviewsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviewsService.listMine('given', query, actor);
  }

  @Get('reviews/me/received')
  listReceived(
    @Query() query: ListReviewsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviewsService.listMine('received', query, actor);
  }

  @Get('reviews/:id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.reviewsService.findOne(id, actor);
  }

  @Post('reviews/:id/reply')
  @ApiOperation({ summary: 'Répondre une seule fois à un avis reçu' })
  reply(
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviewsService.reply(id, dto.message, actor);
  }
}
