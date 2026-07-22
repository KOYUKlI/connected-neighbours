import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import type { GeoJsonPolygon } from '../schemas/neighborhood.schema';

export class CreateNeighborhoodDto {
  @ApiProperty({ example: 'Quartier Centre' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'quartier-centre' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug: string;

  @ApiProperty({
    example: 'Quartier de demonstration autour du centre-ville.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1200)
  description: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city: string;

  @ApiProperty({ example: '75001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({
    description: 'Codes postaux couverts par le quartier.',
    example: ['75001'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  postalCodes?: string[];

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
  geometry: GeoJsonPolygon;

  @ApiProperty({
    description: 'Ancien alias accepté temporairement pour geometry.',
    required: false,
  })
  @IsOptional()
  @IsObject()
  boundary?: GeoJsonPolygon;
}
