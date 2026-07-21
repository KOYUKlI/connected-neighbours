import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { DisputeResolutionType } from '../schemas/dispute.schema';

export class ResolveDisputeDto {
  @ApiProperty({
    enum: DisputeResolutionType,
    example: DisputeResolutionType.SPLIT,
  })
  @IsEnum(DisputeResolutionType)
  type: DisputeResolutionType;

  @ApiProperty({
    example:
      'Les preuves montrent une réalisation partielle justifiant un partage.',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  justification: string;

  @ApiPropertyOptional({ example: 15, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  providerPoints?: number;

  @ApiPropertyOptional({ example: 10, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  requesterPoints?: number;
}
