import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ example: 'contrat-babysitting.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'documents/contract-123.pdf' })
  @IsString()
  @IsNotEmpty()
  objectKey: string;

  @ApiPropertyOptional({ example: 'contract' })
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiPropertyOptional({ example: 'contract_123' })
  @IsOptional()
  @IsString()
  contextId?: string;
}
