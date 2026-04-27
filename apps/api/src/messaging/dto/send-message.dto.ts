import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Bonjour, le service est-il toujours disponible ?' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
