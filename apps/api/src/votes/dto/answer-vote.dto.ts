import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsString } from 'class-validator';

export class AnswerVoteDto {
  @ApiProperty({ example: ['option-id'] })
  @ArrayMinSize(1)
  @IsString({ each: true })
  selectedOptionIds: string[];
}
