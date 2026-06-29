import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DslQueryDto } from './dto/dsl-query.dto';
import { DslService } from './dsl.service';

@ApiTags('DSL')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dsl')
export class DslController {
  constructor(private readonly dslService: DslService) {}

  @Post('parse')
  @ApiOperation({
    summary: 'Parser une requete DSL MongoDB lecture seule',
    description:
      'Valide la syntaxe, les collections, les champs autorises et la limite sans executer MongoDB.',
  })
  @ApiBody({
    type: DslQueryDto,
    examples: {
      incidents: {
        summary: 'Incidents critiques ouverts',
        value: {
          query: 'FIND incidents WHERE severity = "high" AND status != "closed"',
          limit: 20,
        },
      },
    },
  })
  parse(@Body() dto: DslQueryDto) {
    return this.dslService.parse(dto);
  }

  @Post('execute')
  @ApiOperation({
    summary: 'Executer une requete DSL MongoDB lecture seule',
    description:
      'Execute uniquement un find limite sur les modeles Mongoose autorises.',
  })
  @ApiBody({
    type: DslQueryDto,
    examples: {
      services: {
        summary: 'Services de bricolage',
        value: {
          query: 'FIND services WHERE category = "bricolage"',
          limit: 20,
        },
      },
    },
  })
  execute(@Body() dto: DslQueryDto) {
    return this.dslService.execute(dto);
  }

  @Get('examples')
  @ApiOperation({ summary: 'Lister des exemples de requetes DSL supportees' })
  getExamples() {
    return this.dslService.getExamples();
  }
}
