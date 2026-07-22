import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { GraphSyncJobStatus } from '../schemas/graph-sync-job.schema';

export class ListGraphSyncJobsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ enum: GraphSyncJobStatus })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;

  @IsOptional()
  @IsEnum(GraphSyncJobStatus)
  status?: GraphSyncJobStatus;
}
