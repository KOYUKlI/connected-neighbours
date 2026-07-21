import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';

import { Role } from '../auth/role.enum';
import { DownloadDisposition } from './dto/download-file-query.dto';
import {
  StorageContextType,
  StorageFileStatus,
} from './schemas/storage-file.schema';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const files = new Map<string, ReturnType<typeof storageFile>>();
  const fileModel = {
    create: jest.fn((input: Record<string, unknown>) => {
      const file = storageFile({ id: `file-${files.size + 1}`, ...input });
      files.set(file.id, file);
      return Promise.resolve(file);
    }),
    findById: jest.fn((id: string) => ({
      exec: () => Promise.resolve(files.get(id) ?? null),
    })),
  };
  const contractModel = {
    findById: jest.fn(() => ({
      select: () => ({
        lean: () => ({
          exec: () =>
            Promise.resolve({ requesterId: 'alice', providerId: 'bob' }),
        }),
      }),
    })),
  };
  const config = {
    getOrThrow: jest.fn(
      (key: string) =>
        ({
          MINIO_ENDPOINT: 'minio',
          MINIO_PORT: 9000,
          MINIO_USE_SSL: false,
          MINIO_BUCKET: 'documents',
          MINIO_ACCESS_KEY: 'test-access',
          MINIO_SECRET_KEY: 'test-secret',
        })[key],
    ),
    get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'test' : undefined)),
  };
  let service: StorageService;

  beforeEach(async () => {
    files.clear();
    jest.clearAllMocks();
    service = new StorageService(
      config as never,
      fileModel as never,
      contractModel as never,
    );
    await service.onModuleInit();
  });

  it('creates a server-side object key and a short-lived upload instruction', async () => {
    const result = await service.presignUpload(
      {
        filename: '../../contrat demo.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 24,
        contextType: StorageContextType.CONTRACT_DOCUMENT,
        contextId: '507f1f77bcf86cd799439011',
      },
      actor('alice'),
    );

    const created = fileModel.create.mock.calls[0][0];
    expect(created.objectKey).toMatch(
      /^contract_document\/\d{4}-\d{2}\/[0-9a-f-]+\.pdf$/,
    );
    expect(created.objectKey).not.toContain('contrat demo');
    expect(result.expiresAt).toBeDefined();
  });

  it('accepts a real PDF, verifies its hash and finalizes idempotently', async () => {
    const bytes = Buffer.from('%PDF-1.7\nminimal test payload');
    const file = storageFile({
      id: '507f1f77bcf86cd799439012',
      objectKey: 'contract_document/demo.pdf',
      sizeBytes: bytes.length,
      ownerId: 'alice',
      status: StorageFileStatus.PENDING,
    });
    files.set(file.id, file);
    await service.putMemoryUploadForTest(file.id, bytes);

    const first = await service.completeUpload(file.id, actor('alice'));
    const second = await service.completeUpload(file.id, actor('alice'));

    expect(first.status).toBe(StorageFileStatus.VERIFIED);
    expect(first.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
    expect(second.sha256).toBe(first.sha256);
    expect(file.save).toHaveBeenCalledTimes(1);
  });

  it('rejects content that only claims to be a PDF', async () => {
    const bytes = Buffer.from('not-a-pdf');
    const file = storageFile({
      id: '507f1f77bcf86cd799439013',
      objectKey: 'contract_document/fake.pdf',
      sizeBytes: bytes.length,
      ownerId: 'alice',
      status: StorageFileStatus.PENDING,
    });
    files.set(file.id, file);
    await service.putMemoryUploadForTest(file.id, bytes);

    await expect(
      service.completeUpload(file.id, actor('alice')),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(file.status).toBe(StorageFileStatus.REJECTED);
  });

  it('refuses a temporary download URL to a contract outsider', async () => {
    const file = storageFile({
      id: '507f1f77bcf86cd799439014',
      ownerId: 'alice',
      status: StorageFileStatus.VERIFIED,
      sha256: 'a'.repeat(64),
    });
    files.set(file.id, file);

    await expect(
      service.createAuthorizedDownloadUrl(
        file.id,
        actor('claire'),
        DownloadDisposition.INLINE,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

function actor(sub: string) {
  return {
    sub,
    email: `${sub}@example.test`,
    displayName: sub,
    neighborhoodId: 'neighborhood-demo-01',
    role: Role.RESIDENT,
  };
}

function storageFile(overrides: Record<string, unknown> = {}) {
  const value = {
    id: '507f1f77bcf86cd799439010',
    bucket: 'documents',
    objectKey: 'contract_document/test.pdf',
    originalFilename: 'test.pdf',
    safeFilename: 'test.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 24,
    sha256: null as string | null,
    ownerId: 'alice',
    contextType: StorageContextType.CONTRACT_DOCUMENT,
    contextId: '507f1f77bcf86cd799439011',
    status: StorageFileStatus.PENDING,
    completedAt: null as Date | null,
    deletedAt: null as Date | null,
    save: jest.fn(function save(this: unknown) {
      return Promise.resolve(this);
    }),
    ...overrides,
  };
  return value;
}
