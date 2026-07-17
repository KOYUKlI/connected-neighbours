import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ example: ['user_2'] })
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];

  @ApiPropertyOptional({ example: 'Voisins du 12 rue des Lilas' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'service' })
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiPropertyOptional({ example: 'service_123' })
  @IsOptional()
  @IsString()
  contextId?: string;
}
