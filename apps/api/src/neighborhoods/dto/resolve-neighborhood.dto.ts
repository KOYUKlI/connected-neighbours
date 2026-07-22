import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
} from 'class-validator';

import type { GeoJsonPosition } from '../schemas/neighborhood.schema';

export class ResolveNeighborhoodDto {
  @ApiProperty({ example: 'Point', enum: ['Point'] })
  @IsIn(['Point'])
  type: 'Point';

  @ApiProperty({
    description: 'Coordonnées dans l’ordre [longitude, latitude].',
    example: [2.3509, 48.8569],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: GeoJsonPosition;
}
