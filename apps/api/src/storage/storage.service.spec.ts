import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash } from 'crypto';

import { Role } from '../auth/role.enum';
import { DownloadDisposition } from './dto/download-file-query.dto';
import {
  StorageContextType,
  StorageFileStatus,
  StorageLinkedEntityType,
} from './schemas/storage-file.schema';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const files = new Map<string, ReturnType<typeof storageFile>>();
  const fileModel = {
    create: jest.fn((input: Record<string, unknown>) => {
      const file = storageFile({
        id: (files.size + 1).toString(16).padStart(24, '0'),
        ...input,
      });
      files.set(file.id, file);
      return Promise.resolve(file);
    }),
    findById: jest.fn((id: string) => ({
      exec: () => Promise.resolve(files.get(id) ?? null),
    })),
    findOneAndUpdate: jest.fn(
      (filter: { _id: string }, update: { $set: Record<string, unknown> }) => ({
        exec: () => {
          const file = files.get(filter._id);
          if (!file || file.linkedEntityId) return Promise.resolve(null);
          Object.assign(file, update.$set);
          return Promise.resolve(file);
        },
      }),
    ),
    updateOne: jest.fn(() => ({
      exec: () => Promise.resolve({ acknowledged: true }),
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

  it.each([
    [
      'image/jpeg',
      Buffer.from([0xff, 0xd8, 0xff, ...new Array<number>(16).fill(0)]),
    ],
    [
      'image/png',
      Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...new Array<number>(12).fill(0),
      ]),
    ],
    ['image/webp', Buffer.from('RIFF0000WEBPavatar-data', 'ascii')],
  ])('accepts a verified %s avatar', async (mimeType, bytes) => {
    const presigned = await service.presignAvatarUpload(
      {
        filename: 'avatar',
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        sizeBytes: bytes.length,
      },
      actor('alice'),
    );
    await service.putMemoryUploadForTest(presigned.fileId, bytes);
    const result = await service.completeUpload(
      presigned.fileId,
      actor('alice'),
    );
    expect(result.status).toBe(StorageFileStatus.VERIFIED);
    expect(result.mimeType).toBe(mimeType);
  });

  it('rejects a fake image and marks it rejected', async () => {
    const bytes = Buffer.from('this-is-not-a-real-png');
    const presigned = await service.presignAvatarUpload(
      {
        filename: 'avatar.png',
        mimeType: 'image/png',
        sizeBytes: bytes.length,
      },
      actor('alice'),
    );
    await service.putMemoryUploadForTest(presigned.fileId, bytes);
    await expect(
      service.completeUpload(presigned.fileId, actor('alice')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    ['image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0x00])],
    [
      'image/png',
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ],
    ['image/webp', Buffer.from('RIFF0000WEBP', 'ascii')],
    ['application/pdf', Buffer.from('%PDF-1.7', 'ascii')],
    ['audio/mpeg', Buffer.from('ID3proof', 'ascii')],
    ['audio/ogg', Buffer.from('OggSproof', 'ascii')],
    ['audio/wav', Buffer.from('RIFF0000WAVE', 'ascii')],
    ['audio/webm', Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00])],
  ])(
    'verifies the binary signature of %s proof files',
    async (mimeType, bytes) => {
      const presigned = await service.presignProofUpload(
        {
          filename: 'preuve.bin',
          mimeType: mimeType as never,
          sizeBytes: bytes.length,
        },
        actor('alice'),
        StorageContextType.SERVICE_PROOF,
        '507f1f77bcf86cd799439011',
      );
      await service.putMemoryUploadForTest(presigned.fileId, bytes);
      await expect(
        service.completeUpload(presigned.fileId, actor('alice')),
      ).resolves.toEqual(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matcher is typed as any.
        expect.objectContaining({ sha256: expect.any(String) }),
      );
    },
  );

  it('rejects a fake proof and prevents reusing a linked verified file', async () => {
    const fake = Buffer.from('not-a-png', 'ascii');
    const rejected = await service.presignProofUpload(
      { filename: 'preuve.png', mimeType: 'image/png', sizeBytes: fake.length },
      actor('alice'),
      StorageContextType.SERVICE_PROOF,
      '507f1f77bcf86cd799439011',
    );
    await service.putMemoryUploadForTest(rejected.fileId, fake);
    await expect(
      service.completeUpload(rejected.fileId, actor('alice')),
    ).rejects.toBeInstanceOf(BadRequestException);

    const bytes = Buffer.from('%PDF-proof', 'ascii');
    const accepted = await service.presignProofUpload(
      {
        filename: 'preuve.pdf',
        mimeType: 'application/pdf',
        sizeBytes: bytes.length,
      },
      actor('alice'),
      StorageContextType.SERVICE_PROOF,
      '507f1f77bcf86cd799439011',
    );
    await service.putMemoryUploadForTest(accepted.fileId, bytes);
    await service.completeUpload(accepted.fileId, actor('alice'));
    await service.linkVerifiedFile({
      fileId: accepted.fileId,
      ownerId: 'alice',
      contextType: StorageContextType.SERVICE_PROOF,
      contextId: '507f1f77bcf86cd799439011',
      linkedEntityType: StorageLinkedEntityType.SERVICE_PROOF,
      linkedEntityId: '507f1f77bcf86cd799439099',
    });
    await expect(
      service.linkVerifiedFile({
        fileId: accepted.fileId,
        ownerId: 'alice',
        contextType: StorageContextType.SERVICE_PROOF,
        contextId: '507f1f77bcf86cd799439011',
        linkedEntityType: StorageLinkedEntityType.SERVICE_PROOF,
        linkedEntityId: '507f1f77bcf86cd799439098',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an avatar whose announced size differs from the uploaded bytes', async () => {
    const bytes = Buffer.from([
      0xff,
      0xd8,
      0xff,
      ...new Array<number>(16).fill(0),
    ]);
    const presigned = await service.presignAvatarUpload(
      {
        filename: 'avatar.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: bytes.length + 1,
      },
      actor('alice'),
    );
    await service.putMemoryUploadForTest(presigned.fileId, bytes);
    await expect(
      service.completeUpload(presigned.fileId, actor('alice')),
    ).rejects.toBeInstanceOf(BadRequestException);
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
    linkedEntityType: null as string | null,
    linkedEntityId: null as string | null,
    linkedAt: null as Date | null,
    save: jest.fn(function save(this: unknown) {
      return Promise.resolve(this);
    }),
    ...overrides,
  };
  return value;
}
