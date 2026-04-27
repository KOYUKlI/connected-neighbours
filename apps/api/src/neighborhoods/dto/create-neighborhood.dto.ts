import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

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
  boundary: Record<string, unknown>;
}
