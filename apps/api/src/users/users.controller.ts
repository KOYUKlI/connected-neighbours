import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PublicUserDto } from './dto/public-user.dto';
import { PublicUsersService } from './public-users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly publicUsersService: PublicUsersService) {}

  @Get(':id/public')
  @ApiOperation({ summary: "Consulter le profil public minimal d'un habitant" })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiNotFoundResponse({ description: 'Compte absent ou desactive.' })
  findPublicProfile(@Param('id') id: string) {
    return this.publicUsersService.findOne(id);
  }
}
