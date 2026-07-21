import { ApiProperty } from '@nestjs/swagger';

export class PublicUserDto {
  @ApiProperty({ example: '665f23d88bc7b9564f4a92ef' })
  id: string;

  @ApiProperty({ example: 'Alice Martin' })
  displayName: string;

  @ApiProperty({ nullable: true, example: null })
  avatarUrl: string | null;

  @ApiProperty({ example: 'quartier-centre' })
  neighborhoodId: string;

  @ApiProperty({ nullable: true, example: null })
  reputationScore: number | null;

  @ApiProperty({ example: 3 })
  completedServicesCount: number;
}
