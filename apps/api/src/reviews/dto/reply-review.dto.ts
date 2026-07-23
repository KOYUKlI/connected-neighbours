import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReplyReviewDto {
  @ApiProperty({ maxLength: 1000, example: 'Merci pour votre confiance.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;
}
