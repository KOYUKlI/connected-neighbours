import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ServiceProofType } from '../schemas/service-proof.schema';

export class CreateServiceProofDto {
  @ApiProperty({
    enum: ServiceProofType,
    example: ServiceProofType.NOTE,
    description:
      'Les notes sont utilisables directement. Les autres types exigent une référence de fichier déjà disponible.',
  })
  @IsEnum(ServiceProofType)
  type: ServiceProofType;

  @ApiPropertyOptional({
    example: 'Le meuble est monté et fixé au mur.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({
    example: 'proofs/service-123/photo-1.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileReference?: string;
}
