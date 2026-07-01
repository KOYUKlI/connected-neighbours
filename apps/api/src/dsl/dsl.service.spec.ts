import { DslExecutorService } from './dsl-executor.service';
import { DslParserService } from './dsl-parser.service';
import { DslService } from './dsl.service';

describe('DslService', () => {
  let service: DslService;

  const serviceModelMock = {
    create: jest.fn(),
    deleteMany: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  };

  const eventModelMock = { find: jest.fn() };
  const voteModelMock = { find: jest.fn() };
  const incidentModelMock = { find: jest.fn() };
  const alertModelMock = { find: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new DslService(
      new DslParserService(),
      new DslExecutorService(
        serviceModelMock as never,
        eventModelMock as never,
        voteModelMock as never,
        incidentModelMock as never,
        alertModelMock as never,
      ),
    );
  });

  it('should parse through the parser service', () => {
    expect(
      service.parse({
        query: 'FIND alerts WHERE source = "javafx"',
        limit: 5,
      }),
    ).toEqual({
      type: 'find',
      collection: 'alerts',
      conditions: [
        {
          type: 'condition',
          field: 'source',
          operator: '=',
          value: 'javafx',
        },
      ],
      limit: 5,
    });
  });

  it('should execute a read-only query with an authorized model', async () => {
    const modelQuery = readOnlyQuery([{ id: 'service_1' }]);

    serviceModelMock.find.mockReturnValue(modelQuery.findResult);

    const result = await service.execute({
      query: 'FIND services WHERE category = "bricolage"',
      limit: 5,
    });

    expect(serviceModelMock.find).toHaveBeenCalledWith({
      category: 'bricolage',
    });
    expect(modelQuery.limit).toHaveBeenCalledWith(5);
    expect(modelQuery.lean).toHaveBeenCalled();
    expect(modelQuery.exec).toHaveBeenCalled();
    expect(serviceModelMock.create).not.toHaveBeenCalled();
    expect(serviceModelMock.updateOne).not.toHaveBeenCalled();
    expect(serviceModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(serviceModelMock.deleteMany).not.toHaveBeenCalled();
    expect(result).toEqual({
      collection: 'services',
      filter: {
        category: 'bricolage',
      },
      limit: 5,
      count: 1,
      results: [{ id: 'service_1' }],
    });
  });

  it('should build a safe contains filter server-side', async () => {
    const modelQuery = readOnlyQuery([{ id: 'incident_1' }]);

    incidentModelMock.find.mockReturnValue(modelQuery.findResult);

    const result = await service.execute({
      query: 'FIND incidents WHERE title CONTAINS "porte.forcee"',
    });

    expect(incidentModelMock.find).toHaveBeenCalledWith({
      title: {
        $regex: 'porte\\.forcee',
        $options: 'i',
      },
    });
    expect(result.count).toBe(1);
  });
});

function readOnlyQuery<T>(value: T[]) {
  const exec = jest.fn().mockResolvedValue(value);
  const lean = jest.fn().mockReturnValue({ exec });
  const limit = jest.fn().mockReturnValue({ lean });

  return {
    exec,
    findResult: { limit },
    lean,
    limit,
  };
}
