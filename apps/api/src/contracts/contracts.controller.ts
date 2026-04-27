import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContractsService } from './contracts.service';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('services/:serviceId/accept')
  @ApiOperation({
    summary: 'Accepter un service et créer un contrat si le service est payant',
  })
  acceptService(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.contractsService.acceptService(serviceId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lister mes contrats' })
  findAll(@CurrentUser() user: { sub: string }) {
    return this.contractsService.findAllForUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un contrat' })
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.contractsService.findOne(id, user.sub);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Signer un contrat' })
  sign(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.contractsService.sign(id, user.sub);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Clôturer un contrat et transférer les points réservés',
  })
  complete(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.contractsService.complete(id, user.sub);
  }
}
