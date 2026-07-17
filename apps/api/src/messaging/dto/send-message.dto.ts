import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { MessageType } from '../schemas/message.schema';

export class MessageAttachmentDto {
  @ApiProperty({ example: 'messaging/f0b6.../vocal.webm' })
  @IsString()
  @IsNotEmpty()
  objectKey: string;

  @ApiProperty({ example: 'audio/webm' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ example: 'vocal.webm' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  durationSeconds?: number;
}

export class SendMessageDto {
  @ApiPropertyOptional({ enum: MessageType, default: MessageType.WRITE })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({
    example: 'Bonjour, le service est-il toujours disponible ?',
  })
  @ValidateIf(
    (dto: SendMessageDto) =>
      (dto.type ?? MessageType.WRITE) === MessageType.WRITE,
  )
  @IsString()
  @IsNotEmpty()
  body?: string;

  @ApiPropertyOptional({ type: MessageAttachmentDto })
  @ValidateIf((dto: SendMessageDto) => dto.type === MessageType.VOCAL)
  @ValidateNested()
  @Type(() => MessageAttachmentDto)
  attachment?: MessageAttachmentDto;
}
