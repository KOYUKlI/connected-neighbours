import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  DownloadDisposition,
  DownloadFileQueryDto,
} from './dto/download-file-query.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign-upload')
  @ApiOperation({ summary: 'Créer une URL PUT temporaire pour un PDF privé' })
  presign(
    @Body() dto: PresignUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.storageService.presignUpload(dto, user);
  }

  @Post('files/:fileId/complete')
  @ApiOperation({
    summary: 'Vérifier la taille, le type réel et le SHA-256 du fichier chargé',
  })
  complete(
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.storageService.completeUpload(fileId, user);
  }

  @Get('files/:fileId/download-url')
  @ApiOperation({ summary: 'Créer une URL GET privée et temporaire' })
  download(
    @Param('fileId') fileId: string,
    @Query() query: DownloadFileQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.storageService.createAuthorizedDownloadUrl(
      fileId,
      user,
      query.disposition ?? DownloadDisposition.INLINE,
    );
  }

  @Get('health')
  @ApiOperation({ summary: 'Vérifier la disponibilité du stockage privé' })
  health() {
    return this.storageService.health();
  }
}
