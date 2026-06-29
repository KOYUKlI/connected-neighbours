import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { DslQueryDto } from './dto/dsl-query.dto';

export type DslCollection =
  | 'services'
  | 'events'
  | 'votes'
  | 'incidents'
  | 'alerts';

export type DslOperator = '=' | '!=' | 'CONTAINS' | '>' | '<' | '>=' | '<=';

export type DslCondition = {
  type: 'condition';
  field: string;
  operator: DslOperator;
  value: string | number;
};

export type ParsedDslQuery = {
  type: 'find';
  collection: DslCollection;
  conditions: DslCondition[];
  limit: number;
};

type JisonParser = {
  parse(input: string): unknown;
};

type JisonModule = {
  Parser: new (grammar: string) => JisonParser;
};

type RawDslCondition = {
  type?: unknown;
  field?: unknown;
  operator?: unknown;
  value?: unknown;
};

type RawDslAst = {
  type?: unknown;
  collection?: unknown;
  conditions?: unknown;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ALLOWED_FIELDS: Record<DslCollection, readonly string[]> = {
  services: [
    'title',
    'category',
    'type',
    'status',
    'neighborhoodId',
    'pricePoints',
  ],
  events: ['title', 'category', 'status', 'neighborhoodId'],
  votes: ['title', 'status', 'neighborhoodId'],
  incidents: [
    'title',
    'type',
    'status',
    'severity',
    'neighborhoodId',
    'source',
  ],
  alerts: ['title', 'severity', 'status', 'source', 'incidentId'],
};

const NUMERIC_FIELDS: Partial<Record<DslCollection, readonly string[]>> = {
  services: ['pricePoints'],
};

const DANGEROUS_KEYWORDS = [
  'DELETE',
  'UPDATE',
  'INSERT',
  'DROP',
  'REMOVE',
  'SAVE',
];

@Injectable()
export class DslParserService {
  private readonly jisonParser: JisonParser;

  constructor() {
    this.jisonParser = this.createJisonParser();
  }

  parse(dto: DslQueryDto): ParsedDslQuery {
    const query = dto.query.trim();

    this.assertSafeQuery(query);

    const ast = this.parseWithJison(query);
    const collection = this.parseCollection(ast.collection);
    const conditions = this.parseAstConditions(collection, ast.conditions);

    return {
      type: 'find',
      collection,
      conditions,
      limit: this.parseLimit(dto.limit),
    };
  }

  getExamples() {
    return [
      'FIND services',
      'FIND services WHERE category = "bricolage"',
      'FIND incidents WHERE severity = "high" AND status != "closed"',
      'FIND alerts WHERE source = "javafx"',
      'FIND services WHERE pricePoints >= 10',
    ];
  }

  private assertSafeQuery(query: string) {
    if (!/^FIND\b/i.test(query)) {
      throw new BadRequestException('La requete DSL doit commencer par FIND');
    }

    for (const keyword of DANGEROUS_KEYWORDS) {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(query)) {
        throw new BadRequestException(`Mot-cle interdit: ${keyword}`);
      }
    }

    if (/\$where/i.test(query) || /\$function/i.test(query)) {
      throw new BadRequestException('Operateur MongoDB dangereux interdit');
    }

    if (/\bOR\b/i.test(query)) {
      throw new BadRequestException('OR n est pas supporte en P0');
    }

    if (/[()]/.test(query)) {
      throw new BadRequestException('Les parentheses ne sont pas supportees');
    }
  }

  private parseCollection(collectionInput: string): DslCollection {
    const collection = collectionInput.toLowerCase() as DslCollection;

    if (!Object.prototype.hasOwnProperty.call(ALLOWED_FIELDS, collection)) {
      throw new BadRequestException(`Collection interdite: ${collectionInput}`);
    }

    return collection;
  }

  private parseAstConditions(
    collection: DslCollection,
    rawConditions: RawDslCondition[],
  ): DslCondition[] {
    return rawConditions.map((rawCondition) => {
      const condition = this.parseAstCondition(rawCondition);
      this.assertAllowedField(collection, condition.field);
      this.assertCompatibleOperator(collection, condition);

      return condition;
    });
  }

  private parseAstCondition(rawCondition: RawDslCondition): DslCondition {
    if (
      rawCondition.type !== 'condition' ||
      typeof rawCondition.field !== 'string' ||
      !this.isDslOperator(rawCondition.operator) ||
      !this.isDslValue(rawCondition.value)
    ) {
      throw new BadRequestException('AST DSL invalide');
    }

    return {
      type: 'condition',
      field: rawCondition.field,
      operator: rawCondition.operator,
      value: rawCondition.value,
    };
  }

  private assertAllowedField(collection: DslCollection, field: string) {
    if (!ALLOWED_FIELDS[collection].includes(field)) {
      throw new BadRequestException(
        `Champ interdit pour ${collection}: ${field}`,
      );
    }
  }

  private assertCompatibleOperator(
    collection: DslCollection,
    condition: DslCondition,
  ) {
    const isNumericOperator = ['>', '<', '>=', '<='].includes(
      condition.operator,
    );
    const numericFields = NUMERIC_FIELDS[collection] ?? [];
    const isNumericField = numericFields.includes(condition.field);

    if (isNumericOperator && !isNumericField) {
      throw new BadRequestException(
        `Operateur numerique interdit pour ${condition.field}`,
      );
    }

    if (isNumericOperator && typeof condition.value !== 'number') {
      throw new BadRequestException(
        `Une valeur numerique est requise pour ${condition.operator}`,
      );
    }

    if (condition.operator === 'CONTAINS' && typeof condition.value !== 'string') {
      throw new BadRequestException('CONTAINS requiert une valeur texte');
    }
  }

  private parseLimit(limit?: number): number {
    if (limit === undefined || limit === null) {
      return DEFAULT_LIMIT;
    }

    if (!Number.isInteger(limit) || limit < 1) {
      throw new BadRequestException('La limite DSL doit etre un entier positif');
    }

    return Math.min(limit, MAX_LIMIT);
  }

  private createJisonParser() {
    const requireFromCurrentFile = createRequire(__filename);
    const { Parser } = requireFromCurrentFile('jison') as JisonModule;

    return new Parser(this.loadGrammar());
  }

  private loadGrammar() {
    const candidates = [
      join(process.cwd(), 'src', 'dsl', 'grammar', 'dsl.jison'),
      join(
        process.cwd(),
        'apps',
        'api',
        'src',
        'dsl',
        'grammar',
        'dsl.jison',
      ),
    ];

    const grammarPath = candidates.find((candidate) => existsSync(candidate));

    if (!grammarPath) {
      throw new Error('Grammaire Jison DSL introuvable');
    }

    return readFileSync(grammarPath, 'utf8');
  }

  private parseWithJison(query: string): {
    collection: string;
    conditions: RawDslCondition[];
  } {
    try {
      const ast = this.jisonParser.parse(query);

      return this.validateRawAst(ast);
    } catch (error) {
      const message =
        error instanceof BadRequestException
          ? error.message
          : 'Syntaxe DSL invalide';

      throw new BadRequestException(message);
    }
  }

  private validateRawAst(ast: unknown): {
    collection: string;
    conditions: RawDslCondition[];
  } {
    if (!ast || typeof ast !== 'object') {
      throw new BadRequestException('AST DSL invalide');
    }

    const rawAst = ast as RawDslAst;

    if (
      rawAst.type !== 'find' ||
      typeof rawAst.collection !== 'string' ||
      !Array.isArray(rawAst.conditions)
    ) {
      throw new BadRequestException('AST DSL invalide');
    }

    return {
      collection: rawAst.collection,
      conditions: rawAst.conditions as RawDslCondition[],
    };
  }

  private isDslOperator(operator: unknown): operator is DslOperator {
    return (
      operator === '=' ||
      operator === '!=' ||
      operator === 'CONTAINS' ||
      operator === '>' ||
      operator === '<' ||
      operator === '>=' ||
      operator === '<='
    );
  }

  private isDslValue(value: unknown): value is string | number {
    return typeof value === 'string' || typeof value === 'number';
  }
}
