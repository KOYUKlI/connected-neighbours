import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, Length } from 'class-validator';

export class ImportContractDocumentDto {
  @ApiProperty()
  @IsMongoId()
  fileId: string;

  @ApiProperty({ example: 'Contrat de service' })
  @IsString()
  @Length(3, 160)
  title: string;
}
