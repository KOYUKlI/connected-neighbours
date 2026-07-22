import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CancelEventDto {
  @ApiProperty({
    example: 'La salle municipale est exceptionnellement indisponible.',
  })
  @IsString()
  @Length(10, 1000)
  reason: string;
}
