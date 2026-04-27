import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EventInterest } from '../schemas/event-response.schema';

export class RespondEventDto {
  @ApiProperty({ enum: EventInterest, example: EventInterest.INTERESTED })
  @IsEnum(EventInterest)
  interest: EventInterest;
}
