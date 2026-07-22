import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class VoteRankingEntryDto {
  @ApiProperty()
  @IsString()
  optionId: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rank: number;
}

export class AnswerVoteDto {
  @ApiProperty({ example: ['option-id'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  selectedOptionIds: string[];

  @ApiPropertyOptional({ type: [VoteRankingEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoteRankingEntryDto)
  ranking?: VoteRankingEntryDto[];
}
