import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { EventResponseStatus } from '../schemas/event-response.schema';

export class RespondEventDto {
  @ApiPropertyOptional({
    enum: EventResponseStatus,
    example: EventResponseStatus.INTERESTED,
  })
  @IsOptional()
  @IsEnum(EventResponseStatus)
  response?: EventResponseStatus;

  @ApiPropertyOptional({
    deprecated: true,
    enum: EventResponseStatus,
    description: 'Ancien nom accepté temporairement. Utiliser response.',
  })
  @IsOptional()
  @IsEnum(EventResponseStatus)
  interest?: EventResponseStatus;
}
