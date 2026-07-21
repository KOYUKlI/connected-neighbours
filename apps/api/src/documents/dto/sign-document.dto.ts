import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  Equals,
  IsArray,
  IsDefined,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

export class SignDocumentValueDto {
  @ApiProperty()
  @IsUUID()
  fieldId: string;

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'boolean' }] })
  @IsDefined()
  value: string | boolean;
}

export class SignDocumentDto {
  @ApiProperty({ example: true })
  @Equals(true)
  consent: true;

  @ApiProperty({ minLength: 2, maxLength: 120, example: 'Alice Martin' })
  @IsString()
  @Length(2, 120)
  signatureText: string;

  @ApiProperty({ type: [SignDocumentValueDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SignDocumentValueDto)
  values: SignDocumentValueDto[];
}
