import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ModerateReviewDto {
  @ApiProperty({ maxLength: 500, example: 'Contenu contraire aux règles.' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
