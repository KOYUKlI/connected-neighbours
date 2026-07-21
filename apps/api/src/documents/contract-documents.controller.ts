import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImportContractDocumentDto } from './dto/import-contract-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('contract-documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts/:contractId/document')
export class ContractDocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Générer et stocker le PDF contractuel dans MinIO' })
  @ApiConflictResponse({
    description: 'Contrat incompatible ou document déjà engagé.',
  })
  generate(
    @Param('contractId') contractId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.generateContractDocument(contractId, user);
  }

  @Post()
  @ApiOperation({ summary: 'Associer un PDF importé et vérifié au contrat' })
  import(
    @Param('contractId') contractId: string,
    @Body() dto: ImportContractDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.importContractDocument(contractId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Consulter le document actif du contrat' })
  find(
    @Param('contractId') contractId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.findForContract(contractId, user);
  }
}
