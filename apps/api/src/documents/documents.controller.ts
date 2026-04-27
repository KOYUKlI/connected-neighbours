import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddSignatureFieldDto } from './dto/add-signature-field.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { SignFieldDto } from './dto/sign-field.dto';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Référencer un PDF importé' })
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lister mes documents' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.findMine(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un document' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.findOne(id, user.sub);
  }

  @Post(':id/fields')
  @ApiOperation({ summary: 'Ajouter une zone de signature ou initiales' })
  addField(
    @Param('id') id: string,
    @Body() dto: AddSignatureFieldDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.addField(id, user.sub, dto);
  }

  @Post(':id/fields/:fieldId/sign')
  @ApiOperation({ summary: 'Signer une zone du document' })
  signField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: SignFieldDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.signField(id, fieldId, user.sub, dto);
  }
}
