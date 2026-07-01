import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

import type { GeoJsonPolygon } from '../schemas/neighborhood.schema';

export class CreateNeighborhoodDto {
  @ApiProperty({ example: 'Quartier Centre' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'quartier-centre' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    example: 'Quartier de demonstration autour du centre-ville.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '75001' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({
    description: 'Zone geographique du quartier au format GeoJSON Polygon.',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [2.35, 48.86],
          [2.36, 48.86],
          [2.36, 48.87],
          [2.35, 48.87],
          [2.35, 48.86],
        ],
      ],
    },
  })
  @IsObject()
  boundary: GeoJsonPolygon;
}
