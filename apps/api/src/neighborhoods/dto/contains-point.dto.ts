import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber } from 'class-validator';

export class ContainsPointDto {
  @ApiProperty({
    description: 'Point a tester au format [longitude, latitude].',
    example: [2.3509, 48.8569],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  point: [number, number];
}
