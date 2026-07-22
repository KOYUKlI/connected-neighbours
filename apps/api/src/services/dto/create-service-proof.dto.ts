import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ServiceProofType } from '../schemas/service-proof.schema';

export class CreateServiceProofDto {
  @ApiPropertyOptional({
    enum: ServiceProofType,
    example: ServiceProofType.NOTE,
    description:
      'Champ historique facultatif. Le type de fichier est déterminé par le stockage vérifié.',
    deprecated: true,
  })
  @IsOptional()
  @IsEnum(ServiceProofType)
  type?: ServiceProofType;

  @ApiPropertyOptional({
    example: 'Le meuble est monté et fixé au mur.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({ example: '665f24aa8bc7b9564f4a9310' })
  @IsOptional()
  @IsMongoId()
  fileId?: string;
}
