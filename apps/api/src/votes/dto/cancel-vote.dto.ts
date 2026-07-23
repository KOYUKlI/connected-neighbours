import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CancelVoteDto {
  @ApiProperty({
    example: 'Le sujet doit être reformulé avant une nouvelle consultation.',
  })
  @IsString()
  @Length(10, 1000)
  reason: string;
}
