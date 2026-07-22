import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { NeighborhoodStatus } from '../schemas/neighborhood.schema';

export class AdminListNeighborhoodsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: NeighborhoodStatus })
  @IsOptional()
  @IsEnum(NeighborhoodStatus)
  status?: NeighborhoodStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    enum: [
      'name',
      'city',
      'status',
      'createdAt',
      'updatedAt',
      'residents',
      'services',
    ],
  })
  @IsOptional()
  @IsIn([
    'name',
    'city',
    'status',
    'createdAt',
    'updatedAt',
    'residents',
    'services',
  ])
  sortBy = 'name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'asc';
}
