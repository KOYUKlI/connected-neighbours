import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthorizeSsoDto {
  @ApiProperty({ example: 'http://127.0.0.1:53682/callback' })
  @IsString()
  @IsNotEmpty()
  callbackUrl: string;

  @ApiProperty({ example: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM' })
  @IsString()
  @IsNotEmpty()
  codeChallenge: string;
}
