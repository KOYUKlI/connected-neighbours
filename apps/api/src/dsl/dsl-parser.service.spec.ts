import { BadRequestException } from '@nestjs/common';

import { DslParserService } from './dsl-parser.service';

describe('DslParserService', () => {
  let service: DslParserService;

  beforeEach(() => {
    service = new DslParserService();
  });

  it('should parse a simple FIND query', () => {
    expect(service.parse({ query: 'FIND services' })).toEqual({
      type: 'find',
      collection: 'services',
      conditions: [],
      limit: 20,
    });
  });

  it('should load the Jison grammar independently from the current working directory', () => {
    const cwdSpy = jest
      .spyOn(process, 'cwd')
      .mockReturnValue('Z:\\missing-connected-neighbours-path');

    try {
      const runtimeService = new DslParserService();

      expect(runtimeService.parse({ query: 'FIND services' })).toEqual({
        type: 'find',
        collection: 'services',
        conditions: [],
        limit: 20,
      });
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it('should parse a query with WHERE', () => {
    expect(
      service.parse({
        query: 'FIND services WHERE category = "bricolage"',
      }),
    ).toEqual({
      type: 'find',
      collection: 'services',
      conditions: [
        {
          type: 'condition',
          field: 'category',
          operator: '=',
          value: 'bricolage',
        },
      ],
      limit: 20,
    });
  });

  it('should parse a query with AND conditions', () => {
    expect(
      service.parse({
        query:
          'FIND incidents WHERE severity = "high" AND status != "closed"',
      }),
    ).toEqual({
      type: 'find',
      collection: 'incidents',
      conditions: [
        {
          type: 'condition',
          field: 'severity',
          operator: '=',
          value: 'high',
        },
        {
          type: 'condition',
          field: 'status',
          operator: '!=',
          value: 'closed',
        },
      ],
      limit: 20,
    });
  });

  it('should reject a forbidden collection', () => {
    expect(() => service.parse({ query: 'FIND users' })).toThrow(
      BadRequestException,
    );
  });

  it('should reject a forbidden field', () => {
    expect(() =>
      service.parse({
        query: 'FIND services WHERE password = "secret"',
      }),
    ).toThrow(BadRequestException);
  });

  it('should reject dangerous keywords', () => {
    expect(() =>
      service.parse({
        query: 'FIND services WHERE title CONTAINS "DROP"',
      }),
    ).toThrow(BadRequestException);
  });

  it('should cap the limit to 100', () => {
    expect(service.parse({ query: 'FIND services', limit: 150 })).toEqual({
      type: 'find',
      collection: 'services',
      conditions: [],
      limit: 100,
    });
  });

  it('should parse numeric comparisons on authorized numeric fields', () => {
    expect(
      service.parse({
        query: 'FIND services WHERE pricePoints >= 10',
        limit: 10,
      }),
    ).toEqual({
      type: 'find',
      collection: 'services',
      conditions: [
        {
          type: 'condition',
          field: 'pricePoints',
          operator: '>=',
          value: 10,
        },
      ],
      limit: 10,
    });
  });
});
