import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { EventResponseStatus } from '../schemas/event-response.schema';
import { EventCategory, EventStatus } from '../schemas/event.schema';

export class ListEventsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: EventCategory })
  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({ enum: EventResponseStatus })
  @IsOptional()
  @IsEnum(EventResponseStatus)
  response?: EventResponseStatus;

  @ApiPropertyOptional({ enum: ['me'] })
  @IsOptional()
  @IsIn(['me'])
  organizer?: 'me';

  @ApiPropertyOptional({
    enum: ['soonest', 'latest', 'popular'],
    default: 'soonest',
  })
  @IsOptional()
  @IsIn(['soonest', 'latest', 'popular'])
  sort?: 'soonest' | 'latest' | 'popular';

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Réservé aux routes administratives.' })
  @IsOptional()
  @IsString()
  neighborhoodId?: string;

  @ApiPropertyOptional({ description: 'Réservé aux routes administratives.' })
  @IsOptional()
  @IsString()
  organizerId?: string;

  @ApiPropertyOptional({ description: 'Réservé aux routes administratives.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => optionalBoolean(value))
  @IsIn([true, false])
  full?: boolean;
}

function optionalBoolean(value: unknown) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return typeof value === 'string' || typeof value === 'boolean' ? value : '';
}
