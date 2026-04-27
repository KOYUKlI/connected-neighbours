import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { ServiceStatus, ServiceType } from '../schemas/service.schema';

export class CreateServiceDto {
  @ApiProperty({ example: 'Babysitting samedi soir' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Je propose 3 heures de babysitting samedi de 19h à 22h.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ServiceType, example: ServiceType.OFFER })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiProperty({ example: 'Entraide' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Samedi 19h-22h' })
  @IsString()
  @IsNotEmpty()
  availability: string;

  @ApiProperty({ example: 'quartier-centre' })
  @IsString()
  @IsNotEmpty()
  neighborhoodId: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isPaid: boolean;

  @ApiPropertyOptional({ example: 50, nullable: true })
  @ValidateIf((o: CreateServiceDto) => o.isPaid === true)
  @IsInt()
  @Min(0)
  pricePoints?: number;

  @ApiPropertyOptional({
    enum: ServiceStatus,
    example: ServiceStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}
