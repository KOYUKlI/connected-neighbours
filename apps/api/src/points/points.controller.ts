import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PointsService } from './points.service';

@ApiTags('points')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Consulter mon solde de points' })
  getBalance(@CurrentUser() user: { sub: string }) {
    return this.pointsService.getBalance(user.sub);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Lister mes mouvements de points' })
  findMyTransactions(@CurrentUser() user: { sub: string }) {
    return this.pointsService.findTransactionsForUser(user.sub);
  }
}
