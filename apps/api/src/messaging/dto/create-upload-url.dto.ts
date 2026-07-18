import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUploadUrlDto {
  @ApiProperty({ example: 'vocal.webm' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'audio/webm' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;
}
