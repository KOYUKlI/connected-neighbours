import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthorizeSsoDto } from './dto/authorize-sso.dto';
import { ExchangeSsoCodeDto } from './dto/exchange-sso-code.dto';
import { SsoService } from './sso.service';

@ApiTags('sso')
@Controller('auth/sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Post('authorize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Autoriser une connexion SSO pour une application desktop',
  })
  authorize(
    @Body() dto: AuthorizeSsoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ssoService.authorize(user.sub, dto.callbackUrl, dto.codeChallenge);
  }

  @Post('token')
  @ApiOperation({ summary: 'Échanger un code SSO contre un token' })
  exchange(@Body() dto: ExchangeSsoCodeDto) {
    return this.ssoService.exchange(dto.code, dto.codeVerifier);
  }
}
