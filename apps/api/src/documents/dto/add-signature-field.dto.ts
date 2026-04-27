import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { SignatureFieldType } from '../schemas/managed-document.schema';

export class AddSignatureFieldDto {
  @ApiProperty({
    enum: SignatureFieldType,
    example: SignatureFieldType.SIGNATURE,
  })
  @IsEnum(SignatureFieldType)
  type: SignatureFieldType;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({ example: 120 })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 640 })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 180 })
  @IsNumber()
  width: number;

  @ApiProperty({ example: 70 })
  @IsNumber()
  height: number;

  @ApiProperty({ example: 'user_123' })
  @IsString()
  @IsNotEmpty()
  assignedToUserId: string;
}
