import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DownloadDisposition } from '../storage/dto/download-file-query.dto';
import {
  DocumentDownloadQueryDto,
  DocumentFileVariant,
} from './dto/document-download-query.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { SignDocumentDto } from './dto/sign-document.dto';
import { UpdateDocumentFieldsDto } from './dto/update-document-fields.dto';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les documents accessibles avec progression et permissions',
  })
  list(
    @Query() query: ListDocumentsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.list(user, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter un document, ses champs, signatures et audit',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.findOne(id, user);
  }

  @Put(':id/fields')
  @ApiOperation({ summary: 'Préparer les zones normalisées du document' })
  @ApiBadRequestResponse({
    description: 'Page, coordonnées, dimensions ou signataire invalides.',
  })
  @ApiConflictResponse({ description: 'La préparation est déjà verrouillée.' })
  updateFields(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentFieldsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.updateFields(id, dto, user);
  }

  @Post(':id/send-for-signature')
  @ApiOperation({
    summary: 'Verrouiller et envoyer le document aux parties pour signature',
  })
  send(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.sendForSignature(id, user);
  }

  @Post(':id/sign')
  @ApiOperation({
    summary:
      'Appliquer une signature applicative horodatée et produire une nouvelle révision PDF',
    description:
      'Identité issue du JWT, consentement explicite et scellement SHA-256. Ce mécanisme n’est pas une signature électronique qualifiée.',
  })
  @ApiForbiddenResponse({
    description: 'Le compte ne peut signer que ses propres champs.',
  })
  @ApiConflictResponse({
    description: 'Document déjà signé, annulé, archivé ou lié à un litige.',
  })
  sign(
    @Param('id') id: string,
    @Body() dto: SignDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.sign(id, dto, user);
  }

  @Post(':id/archive')
  @ApiOperation({
    summary: 'Archiver un document finalisé (administrateur uniquement)',
  })
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.archive(id, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler un document non signé' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.cancel(id, user);
  }

  @Get(':id/download-url')
  @ApiOperation({
    summary:
      'Créer une URL privée de consultation ou téléchargement, valable cinq minutes',
  })
  download(
    @Param('id') id: string,
    @Query() query: DocumentDownloadQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.createDownloadUrl(
      id,
      query.variant ?? DocumentFileVariant.CURRENT,
      query.disposition ?? DownloadDisposition.INLINE,
      user,
    );
  }
}
