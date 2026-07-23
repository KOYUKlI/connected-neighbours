import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

import { EventCategory, EventStatus } from '../schemas/event.schema';

export class CreateEventDto {
  @ApiProperty({ example: 'Atelier réparation vélo' })
  @IsString()
  @Length(3, 140)
  title: string;

  @ApiProperty({
    example: 'Atelier collectif pour apprendre à réparer son vélo.',
  })
  @IsString()
  @Length(10, 4000)
  description: string;

  @ApiProperty({ enum: EventCategory, example: EventCategory.WORKSHOP })
  @IsEnum(EventCategory)
  category: EventCategory;

  @ApiProperty({ example: 'quartier-centre' })
  @IsString()
  @Length(2, 120)
  neighborhoodId: string;

  @ApiProperty({ example: '2026-08-12T18:30:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startsAt: Date;

  @ApiPropertyOptional({
    description:
      'Obligatoire pour les nouveaux clients. Par compatibilité, deux heures sont ajoutées à startsAt si absent.',
    example: '2026-08-12T20:30:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endsAt?: Date;

  @ApiPropertyOptional({ example: '2026-08-12T17:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  registrationDeadline?: Date;

  @ApiProperty({ example: 'Maison de quartier' })
  @IsString()
  @Length(2, 240)
  locationLabel: string;

  @ApiPropertyOptional({ minimum: 1, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  minimumAge?: number;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  accessibilityInformation?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  equipmentInformation?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  contactInstructions?: string;

  @ApiPropertyOptional({
    enum: [EventStatus.DRAFT],
    default: EventStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
