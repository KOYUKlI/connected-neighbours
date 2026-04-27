import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SignFieldDto {
  @ApiPropertyOptional({
    description: 'Trace technique ou hash de signature V1',
    example: 'signed-with-demo-mfa',
  })
  @IsOptional()
  @IsString()
  signatureProof?: string;
}
