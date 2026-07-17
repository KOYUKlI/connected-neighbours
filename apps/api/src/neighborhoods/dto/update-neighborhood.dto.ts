import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateNeighborhoodDto } from './create-neighborhood.dto';
import { NeighborhoodStatus } from '../schemas/neighborhood.schema';

export class UpdateNeighborhoodDto extends PartialType(CreateNeighborhoodDto) {
  @ApiPropertyOptional({
    enum: NeighborhoodStatus,
    example: NeighborhoodStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(NeighborhoodStatus)
  status?: NeighborhoodStatus;
}
