import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Atelier réparation vélo' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Atelier collectif pour apprendre à réparer son vélo.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'bricolage' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'quartier-centre' })
  @IsString()
  @IsNotEmpty()
  neighborhoodId: string;

  @ApiProperty({ example: '2026-06-12T18:30:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startsAt: Date;

  @ApiProperty({ example: 'Maison de quartier' })
  @IsString()
  @IsNotEmpty()
  locationLabel: string;
}
