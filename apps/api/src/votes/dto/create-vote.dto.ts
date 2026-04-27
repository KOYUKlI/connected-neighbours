import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVoteDto {
  @ApiProperty({ example: 'Quel jour organiser le nettoyage du parc ?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'quartier-centre' })
  @IsString()
  @IsNotEmpty()
  neighborhoodId: string;

  @ApiProperty({ example: ['Samedi matin', 'Dimanche après-midi'] })
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ example: '2026-06-20T18:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  closesAt: Date;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  allowMultipleChoices?: boolean;
}
