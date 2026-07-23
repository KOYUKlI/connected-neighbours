import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash, randomUUID } from 'crypto';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import {
  Contract,
  ContractDocument,
} from '../contracts/schemas/contract.schema';
import { DownloadDisposition } from './dto/download-file-query.dto';
import {
  AVATAR_MIME_TYPES,
  AvatarMimeType,
  MAX_AVATAR_SIZE_BYTES,
  PresignAvatarUploadDto,
} from './dto/presign-avatar-upload.dto';
import { MAX_PDF_SIZE_BYTES, PresignUploadDto } from './dto/presign-upload.dto';
import {
  getProofFileKind,
  getProofMaxSize,
  PresignProofUploadDto,
  ProofMimeType,
} from './dto/presign-proof-upload.dto';
import {
  StorageContextType,
  StorageFile,
  StorageFileDocument,
  StorageFileStatus,
  StorageLinkedEntityType,
} from './schemas/storage-file.schema';

const PRESIGN_EXPIRY_SECONDS = 300;
const PDF_MIME_TYPE = 'application/pdf';
const AVATAR_EXTENSION: Record<AvatarMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const PROOF_EXTENSION: Record<ProofMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/webm': 'webm',
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly publicClient: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(StorageService.name);
  private readonly memoryObjects = new Map<string, Buffer>();
  private readonly useMemory: boolean;
  private ready = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(StorageFile.name)
    private readonly fileModel: Model<StorageFileDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
  ) {
    const endpoint = this.configService.getOrThrow<string>('MINIO_ENDPOINT');
    const port = this.configService.getOrThrow<number>('MINIO_PORT');
    const useSsl = this.configService.getOrThrow<boolean>('MINIO_USE_SSL');
    const publicEndpoint =
      this.configService.get<string>('MINIO_PUBLIC_ENDPOINT') ?? endpoint;
    const publicPort =
      this.configService.get<number>('MINIO_PUBLIC_PORT') ?? port;
    const publicUseSsl =
      this.configService.get<boolean>('MINIO_PUBLIC_USE_SSL') ?? useSsl;
    this.bucket = this.configService.getOrThrow<string>('MINIO_BUCKET');
    this.useMemory = this.configService.get<string>('NODE_ENV') === 'test';

    const credentials = {
      accessKeyId: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretAccessKey:
        this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
    };
    this.client = new S3Client({
      endpoint: `${useSsl ? 'https' : 'http'}://${endpoint}:${port}`,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials,
    });
    this.publicClient = new S3Client({
      endpoint: `${publicUseSsl ? 'https' : 'http'}://${publicEndpoint}:${publicPort}`,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials,
    });
  }

  async onModuleInit() {
    if (this.useMemory) {
      this.ready = true;
      return;
    }
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.ready = true;
    } catch {
      try {
        await this.client.send(
          new CreateBucketCommand({ Bucket: this.bucket }),
        );
        this.ready = true;
        this.logger.log(`Bucket MinIO "${this.bucket}" créé en accès privé`);
      } catch (error) {
        this.ready = false;
        this.logger.error(
          `Stockage MinIO indisponible: ${(error as Error).message}`,
        );
      }
    }
  }

  health() {
    return {
      status: this.ready ? 'ok' : 'unavailable',
      provider: this.useMemory ? 'memory-test-adapter' : 's3-private',
      bucket: this.bucket,
    };
  }

  buildObjectKey(prefix: string, fileName: string) {
    const extension = fileName.includes('.')
      ? `.${fileName.split('.').pop()}`
      : '';
    return `${prefix}/${randomUUID()}${extension}`;
  }

  async createUploadUrl(objectKey: string, mimeType: string) {
    this.assertReady();
    if (this.useMemory) {
      return {
        url: `memory://upload/${objectKey}`,
        objectKey,
        expiresIn: PRESIGN_EXPIRY_SECONDS,
      };
    }
    const url = await getSignedUrl(
      this.publicClient,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ContentType: mimeType,
      }),
      { expiresIn: PRESIGN_EXPIRY_SECONDS },
    );
    return { url, objectKey, expiresIn: PRESIGN_EXPIRY_SECONDS };
  }

  async createDownloadUrl(objectKey: string) {
    this.assertReady();
    if (this.useMemory) return `memory://download/${objectKey}`;
    return getSignedUrl(
      this.publicClient,
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn: PRESIGN_EXPIRY_SECONDS },
    );
  }

  async presignUpload(dto: PresignUploadDto, user: AuthenticatedUser) {
    this.assertReady();
    if (dto.contextType !== StorageContextType.CONTRACT_DOCUMENT) {
      throw new BadRequestException(
        'Ce contexte de dépôt n’est pas encore disponible.',
      );
    }
    await this.assertContractAccess(dto.contextId, user);
    const safeFilename = this.sanitizeFilename(dto.filename);
    const objectKey = this.buildManagedObjectKey(dto.contextType, 'pdf');
    const file = await this.fileModel.create({
      bucket: this.bucket,
      objectKey,
      originalFilename: dto.filename,
      safeFilename,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      sha256: null,
      ownerId: user.sub,
      contextType: dto.contextType,
      contextId: dto.contextId,
      status: StorageFileStatus.PENDING,
      completedAt: null,
      deletedAt: null,
    });
    const uploadUrl = this.useMemory
      ? `memory://upload/${file.id}`
      : await getSignedUrl(
          this.publicClient,
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            ContentType: dto.mimeType,
          }),
          { expiresIn: PRESIGN_EXPIRY_SECONDS },
        );
    return {
      fileId: file.id,
      uploadUrl,
      method: 'PUT' as const,
      headers: { 'Content-Type': dto.mimeType },
      expiresAt: new Date(
        Date.now() + PRESIGN_EXPIRY_SECONDS * 1000,
      ).toISOString(),
    };
  }

  async presignAvatarUpload(
    dto: PresignAvatarUploadDto,
    user: AuthenticatedUser,
  ) {
    this.assertReady();
    const objectKey = this.buildManagedObjectKey(
      StorageContextType.USER_AVATAR,
      AVATAR_EXTENSION[dto.mimeType],
    );
    const file = await this.fileModel.create({
      bucket: this.bucket,
      objectKey,
      originalFilename: dto.filename,
      safeFilename: this.sanitizeImageFilename(
        dto.filename,
        AVATAR_EXTENSION[dto.mimeType],
      ),
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      sha256: null,
      ownerId: user.sub,
      contextType: StorageContextType.USER_AVATAR,
      contextId: user.sub,
      status: StorageFileStatus.PENDING,
      completedAt: null,
      deletedAt: null,
    });
    const uploadUrl = this.useMemory
      ? `memory://upload/${file.id}`
      : await getSignedUrl(
          this.publicClient,
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            ContentType: dto.mimeType,
          }),
          { expiresIn: PRESIGN_EXPIRY_SECONDS },
        );
    return {
      fileId: file.id,
      uploadUrl,
      method: 'PUT' as const,
      headers: { 'Content-Type': dto.mimeType },
      expiresAt: new Date(
        Date.now() + PRESIGN_EXPIRY_SECONDS * 1000,
      ).toISOString(),
    };
  }

  async presignProofUpload(
    dto: PresignProofUploadDto,
    user: AuthenticatedUser,
    contextType:
      | StorageContextType.SERVICE_PROOF
      | StorageContextType.DISPUTE_EVIDENCE,
    contextId: string,
  ) {
    this.assertReady();
    const maxSize = getProofMaxSize(dto.mimeType);
    if (dto.sizeBytes > maxSize) {
      throw new BadRequestException(
        `Ce type de fichier est limité à ${Math.floor(maxSize / 1024 / 1024)} Mo.`,
      );
    }
    const extension = PROOF_EXTENSION[dto.mimeType];
    const objectKey = this.buildManagedObjectKey(contextType, extension);
    const file = await this.fileModel.create({
      bucket: this.bucket,
      objectKey,
      originalFilename: dto.filename,
      safeFilename: this.sanitizeManagedFilename(dto.filename, extension),
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      sha256: null,
      ownerId: user.sub,
      contextType,
      contextId,
      status: StorageFileStatus.PENDING,
      completedAt: null,
      deletedAt: null,
      linkedEntityType: null,
      linkedEntityId: null,
      linkedAt: null,
    });
    const uploadUrl = this.useMemory
      ? `memory://upload/${file.id}`
      : await getSignedUrl(
          this.publicClient,
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            ContentType: dto.mimeType,
          }),
          { expiresIn: PRESIGN_EXPIRY_SECONDS },
        );
    return {
      fileId: file.id,
      uploadUrl,
      method: 'PUT' as const,
      headers: { 'Content-Type': dto.mimeType },
      expiresAt: new Date(
        Date.now() + PRESIGN_EXPIRY_SECONDS * 1000,
      ).toISOString(),
    };
  }

  async completeUpload(fileId: string, user: AuthenticatedUser) {
    this.assertReady();
    const file = await this.findFile(fileId);
    if (file.ownerId !== user.sub && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Vous ne pouvez pas finaliser ce fichier.');
    }
    if (file.status === StorageFileStatus.VERIFIED) return this.present(file);
    if (
      file.status !== StorageFileStatus.PENDING &&
      file.status !== StorageFileStatus.UPLOADED
    ) {
      throw new ConflictException('Ce fichier ne peut plus être finalisé.');
    }

    let buffer: Buffer;
    let actualSize: number;
    let actualMime: string | undefined;
    try {
      if (this.useMemory) {
        buffer = this.memoryObjects.get(file.objectKey) ?? Buffer.alloc(0);
        actualSize = buffer.length;
        actualMime = file.mimeType;
      } else {
        const head = await this.client.send(
          new HeadObjectCommand({ Bucket: this.bucket, Key: file.objectKey }),
        );
        actualSize = head.ContentLength ?? 0;
        actualMime = head.ContentType;
        buffer = await this.readObject(file.objectKey);
      }
    } catch {
      throw new BadRequestException(
        'Le fichier chargé est introuvable dans le stockage.',
      );
    }

    try {
      if (file.contextType === StorageContextType.USER_AVATAR) {
        this.validateAvatar(
          buffer,
          actualSize,
          actualMime,
          file.mimeType,
          file.sizeBytes,
        );
      } else if (
        file.contextType === StorageContextType.SERVICE_PROOF ||
        file.contextType === StorageContextType.DISPUTE_EVIDENCE
      ) {
        this.validateProofFile(
          buffer,
          actualSize,
          actualMime,
          file.mimeType as ProofMimeType,
          file.sizeBytes,
        );
      } else {
        this.validatePdf(buffer, actualSize, actualMime, file.sizeBytes);
      }
    } catch (error) {
      file.status = StorageFileStatus.REJECTED;
      await file.save();
      throw error;
    }
    file.status = StorageFileStatus.VERIFIED;
    file.sizeBytes = actualSize;
    file.sha256 = this.sha256(buffer);
    file.completedAt = new Date();
    await file.save();
    return this.present(file);
  }

  async putVerifiedBuffer(input: {
    buffer: Uint8Array;
    filename: string;
    ownerId: string;
    contextType: StorageContextType;
    contextId: string;
  }) {
    this.assertReady();
    const buffer = Buffer.from(input.buffer);
    this.validatePdf(buffer, buffer.length, PDF_MIME_TYPE, buffer.length);
    const objectKey = this.buildManagedObjectKey(input.contextType, 'pdf');
    if (this.useMemory) {
      this.memoryObjects.set(objectKey, buffer);
    } else {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
          Body: buffer,
          ContentType: PDF_MIME_TYPE,
        }),
      );
    }
    return this.fileModel.create({
      bucket: this.bucket,
      objectKey,
      originalFilename: input.filename,
      safeFilename: this.sanitizeFilename(input.filename),
      mimeType: PDF_MIME_TYPE,
      sizeBytes: buffer.length,
      sha256: this.sha256(buffer),
      ownerId: input.ownerId,
      contextType: input.contextType,
      contextId: input.contextId,
      status: StorageFileStatus.VERIFIED,
      completedAt: new Date(),
      deletedAt: null,
    });
  }

  async putVerifiedSeedBuffer(input: {
    seedKey: string;
    buffer: Uint8Array;
    filename: string;
    mimeType: AvatarMimeType | ProofMimeType;
    ownerId: string;
    contextType:
      | StorageContextType.USER_AVATAR
      | StorageContextType.SERVICE_PROOF
      | StorageContextType.DISPUTE_EVIDENCE;
    contextId: string;
    linkedEntityType?: StorageLinkedEntityType;
    linkedEntityId?: string;
  }) {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ConflictException(
        'Les fichiers de démonstration sont interdits en production.',
      );
    }
    this.assertReady();
    const buffer = Buffer.from(input.buffer);
    const isAvatar = input.contextType === StorageContextType.USER_AVATAR;
    if (isAvatar) {
      this.validateAvatar(
        buffer,
        buffer.length,
        input.mimeType,
        input.mimeType,
        buffer.length,
      );
    } else {
      this.validateProofFile(
        buffer,
        buffer.length,
        input.mimeType,
        input.mimeType,
        buffer.length,
      );
    }

    const extension = isAvatar
      ? AVATAR_EXTENSION[input.mimeType as AvatarMimeType]
      : PROOF_EXTENSION[input.mimeType];
    const safeSeedKey = input.seedKey.replace(/[^a-zA-Z0-9._-]+/g, '-');
    const objectKey = `demo/${input.contextType}/${safeSeedKey}.${extension}`;
    if (this.useMemory) {
      this.memoryObjects.set(objectKey, buffer);
    } else {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
          Body: buffer,
          ContentType: input.mimeType,
        }),
      );
    }

    const linkedAt = input.linkedEntityId ? new Date() : null;
    return this.fileModel
      .findOneAndUpdate(
        { objectKey },
        {
          $set: {
            bucket: this.bucket,
            originalFilename: input.filename,
            safeFilename: isAvatar
              ? this.sanitizeImageFilename(input.filename, extension)
              : this.sanitizeManagedFilename(input.filename, extension),
            mimeType: input.mimeType,
            sizeBytes: buffer.length,
            sha256: this.sha256(buffer),
            ownerId: input.ownerId,
            contextType: input.contextType,
            contextId: input.contextId,
            status: StorageFileStatus.VERIFIED,
            completedAt: new Date(),
            deletedAt: null,
            linkedEntityType: input.linkedEntityType ?? null,
            linkedEntityId: input.linkedEntityId ?? null,
            linkedAt,
          },
          $setOnInsert: { objectKey },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  async removeSeedFile(fileId: string, requireObjectDeletion = false) {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ConflictException(
        'La suppression des fichiers de démonstration est interdite en production.',
      );
    }
    const file = await this.fileModel.findById(fileId).exec();
    if (!file) return false;
    try {
      if (this.useMemory) {
        this.memoryObjects.delete(file.objectKey);
      } else {
        await this.client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: file.objectKey }),
        );
      }
    } catch (error) {
      if (requireObjectDeletion) {
        throw new ConflictException(
          `Suppression MinIO du seed interrompue pour ${file.id}; la reprise reste possible.`,
        );
      }
      this.logger.warn(
        `Suppression MinIO du seed différée pour ${file.id}: ${(error as Error).message}`,
      );
    }
    await this.fileModel.deleteOne({ _id: file.id }).exec();
    return true;
  }

  async getVerifiedBuffer(fileId: string) {
    const file = await this.findFile(fileId);
    if (file.status !== StorageFileStatus.VERIFIED || !file.sha256) {
      throw new ConflictException('Le fichier n’a pas été vérifié.');
    }
    const buffer = this.useMemory
      ? this.memoryObjects.get(file.objectKey)
      : await this.readObject(file.objectKey);
    if (!buffer) throw new NotFoundException('Contenu du fichier introuvable.');
    if (this.sha256(buffer) !== file.sha256) {
      throw new ConflictException(
        'L’empreinte du fichier ne correspond plus aux métadonnées.',
      );
    }
    return { file, buffer };
  }

  async getVerifiedFile(fileId: string) {
    const file = await this.findFile(fileId);
    if (file.status !== StorageFileStatus.VERIFIED) {
      throw new ConflictException('Le fichier n’a pas été vérifié.');
    }
    return file;
  }

  async linkVerifiedFile(input: {
    fileId: string;
    ownerId: string;
    contextType:
      | StorageContextType.SERVICE_PROOF
      | StorageContextType.DISPUTE_EVIDENCE;
    contextId: string;
    linkedEntityType: StorageLinkedEntityType;
    linkedEntityId: string;
  }) {
    if (!Types.ObjectId.isValid(input.fileId)) {
      throw new NotFoundException('Fichier introuvable.');
    }
    const linkedAt = new Date();
    const linked = await this.fileModel
      .findOneAndUpdate(
        {
          _id: input.fileId,
          ownerId: input.ownerId,
          contextType: input.contextType,
          contextId: input.contextId,
          status: StorageFileStatus.VERIFIED,
          $or: [
            { linkedEntityId: null },
            { linkedEntityId: { $exists: false } },
          ],
        },
        {
          $set: {
            linkedEntityType: input.linkedEntityType,
            linkedEntityId: input.linkedEntityId,
            linkedAt,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (linked) return this.presentAttachment(linked);

    const current = await this.findFile(input.fileId);
    if (
      current.linkedEntityType === input.linkedEntityType &&
      current.linkedEntityId === input.linkedEntityId
    ) {
      return this.presentAttachment(current);
    }
    if (current.ownerId !== input.ownerId) {
      throw new ForbiddenException('Ce fichier ne vous appartient pas.');
    }
    if (current.status !== StorageFileStatus.VERIFIED) {
      throw new ConflictException('Le fichier doit être finalisé avant usage.');
    }
    throw new ConflictException('Ce fichier est déjà associé à une preuve.');
  }

  async releaseFileLink(
    fileId: string,
    linkedEntityType: StorageLinkedEntityType,
    linkedEntityId: string,
  ) {
    if (!Types.ObjectId.isValid(fileId)) return;
    await this.fileModel
      .updateOne(
        { _id: fileId, linkedEntityType, linkedEntityId },
        {
          $set: {
            linkedEntityType: null,
            linkedEntityId: null,
            linkedAt: null,
          },
        },
      )
      .exec();
  }

  async findAttachmentsByFileIds(fileIds: Array<string | null | undefined>) {
    const ids = [
      ...new Set(
        fileIds.filter((id): id is string =>
          Boolean(id && Types.ObjectId.isValid(id)),
        ),
      ),
    ];
    if (ids.length === 0)
      return new Map<string, ReturnType<StorageService['presentAttachment']>>();
    const files = await this.fileModel.find({ _id: { $in: ids } }).exec();
    return new Map(
      files.map((file) => [file.id, this.presentAttachment(file)] as const),
    );
  }

  async createLinkedDownloadUrl(
    fileId: string,
    linkedEntityType: StorageLinkedEntityType,
    linkedEntityId: string,
    disposition: DownloadDisposition,
  ) {
    this.assertReady();
    const file = await this.getVerifiedFile(fileId);
    if (
      file.linkedEntityType !== linkedEntityType ||
      file.linkedEntityId !== linkedEntityId ||
      file.deletedAt
    ) {
      throw new NotFoundException('Pièce jointe introuvable.');
    }
    return this.buildDownloadResponse(file, disposition);
  }

  async deleteLinkedFile(
    fileId: string,
    linkedEntityType: StorageLinkedEntityType,
    linkedEntityId: string,
  ) {
    if (!Types.ObjectId.isValid(fileId)) {
      throw new NotFoundException('Pièce jointe introuvable.');
    }
    const deletedAt = new Date();
    const file = await this.fileModel
      .findOneAndUpdate(
        {
          _id: fileId,
          linkedEntityType,
          linkedEntityId,
          status: StorageFileStatus.VERIFIED,
        },
        { $set: { status: StorageFileStatus.DELETED, deletedAt } },
        { returnDocument: 'after' },
      )
      .exec();
    if (!file) {
      const current = await this.findFile(fileId);
      if (
        current.linkedEntityType === linkedEntityType &&
        current.linkedEntityId === linkedEntityId &&
        current.status === StorageFileStatus.DELETED
      ) {
        return { deletedAt: current.deletedAt };
      }
      throw new NotFoundException('Pièce jointe introuvable.');
    }
    try {
      if (this.useMemory) this.memoryObjects.delete(file.objectKey);
      else {
        await this.client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: file.objectKey }),
        );
      }
    } catch (error) {
      this.logger.warn(
        `Suppression physique différée pour le fichier ${file.id}: ${(error as Error).message}`,
      );
    }
    return { deletedAt };
  }

  async getAvatarUrlsByFileIds(fileIds: string[]) {
    const ids = [
      ...new Set(fileIds.filter((id) => Types.ObjectId.isValid(id))),
    ];
    if (ids.length === 0) return new Map<string, string>();
    const files = await this.fileModel
      .find({
        _id: { $in: ids },
        contextType: StorageContextType.USER_AVATAR,
        status: StorageFileStatus.VERIFIED,
      })
      .select('_id objectKey')
      .lean<Array<{ _id: unknown; objectKey: string }>>()
      .exec();
    const entries = await Promise.all(
      files.map(
        async (file) =>
          [
            String(file._id),
            this.useMemory
              ? `memory://download/${String(file._id)}`
              : await getSignedUrl(
                  this.publicClient,
                  new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: file.objectKey,
                  }),
                  { expiresIn: PRESIGN_EXPIRY_SECONDS },
                ),
          ] as const,
      ),
    );
    return new Map(entries);
  }

  async createAuthorizedDownloadUrl(
    fileId: string,
    user: AuthenticatedUser,
    disposition: DownloadDisposition,
  ) {
    this.assertReady();
    const file = await this.getVerifiedFile(fileId);
    await this.assertFileAccess(file, user);
    return this.buildDownloadResponse(file, disposition);
  }

  private async buildDownloadResponse(
    file: StorageFileDocument,
    disposition: DownloadDisposition,
  ) {
    const url = this.useMemory
      ? `memory://download/${file.id}`
      : await getSignedUrl(
          this.publicClient,
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: file.objectKey,
            ResponseContentType: file.mimeType,
            ResponseContentDisposition: `${disposition}; filename="${file.safeFilename}"`,
          }),
          { expiresIn: PRESIGN_EXPIRY_SECONDS },
        );
    return {
      url,
      expiresAt: new Date(
        Date.now() + PRESIGN_EXPIRY_SECONDS * 1000,
      ).toISOString(),
      filename: file.safeFilename,
      disposition,
    };
  }

  async removeOrphan(fileId: string) {
    const file = await this.findFile(fileId);
    if (file.status === StorageFileStatus.DELETED) return;
    if (file.linkedEntityId) {
      throw new ConflictException(
        'Un fichier associé à une preuve ne peut pas être supprimé comme orphelin.',
      );
    }
    try {
      if (this.useMemory) this.memoryObjects.delete(file.objectKey);
      else
        await this.client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: file.objectKey }),
        );
      file.status = StorageFileStatus.DELETED;
      file.deletedAt = new Date();
      await file.save();
    } catch (error) {
      this.logger.warn(
        `Objet orphelin ${file.id} conservé pour reprise: ${(error as Error).message}`,
      );
    }
  }

  async findFile(fileId: string) {
    if (!Types.ObjectId.isValid(fileId))
      throw new NotFoundException('Fichier introuvable.');
    const file = await this.fileModel.findById(fileId).exec();
    if (!file) throw new NotFoundException('Fichier introuvable.');
    return file;
  }

  async putMemoryUploadForTest(fileId: string, buffer: Buffer) {
    if (!this.useMemory)
      throw new BadRequestException('Disponible uniquement en test.');
    const file = await this.findFile(fileId);
    this.memoryObjects.set(file.objectKey, buffer);
  }

  private async assertFileAccess(
    file: StorageFileDocument,
    user: AuthenticatedUser,
  ) {
    if (
      file.contextType === StorageContextType.SERVICE_PROOF ||
      file.contextType === StorageContextType.DISPUTE_EVIDENCE
    ) {
      throw new ForbiddenException(
        'Utilisez la route de la preuve pour accéder à cette pièce jointe.',
      );
    }
    if (file.ownerId === user.sub || user.role === Role.ADMIN) return;
    if (
      file.contextType === StorageContextType.CONTRACT_DOCUMENT ||
      file.contextType === StorageContextType.DOCUMENT_REVISION ||
      file.contextType === StorageContextType.DOCUMENT_FINAL
    ) {
      await this.assertContractAccess(file.contextId, user);
      return;
    }
    throw new ForbiddenException('Contexte de fichier inaccessible.');
  }

  private async assertContractAccess(
    contractId: string,
    user: AuthenticatedUser,
  ) {
    if (user.role === Role.ADMIN) return;
    if (!Types.ObjectId.isValid(contractId))
      throw new ForbiddenException('Contexte de fichier inaccessible.');
    const contract = await this.contractModel
      .findById(contractId)
      .select('requesterId providerId')
      .lean<{ requesterId: string; providerId: string }>()
      .exec();
    if (
      !contract ||
      (contract.requesterId !== user.sub && contract.providerId !== user.sub)
    ) {
      throw new ForbiddenException('Contexte de fichier inaccessible.');
    }
  }

  private async readObject(objectKey: string) {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
    if (!response.Body)
      throw new NotFoundException('Contenu du fichier introuvable.');
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  private validatePdf(
    buffer: Buffer,
    actualSize: number,
    mimeType: string | undefined,
    expectedSize: number,
  ) {
    if (
      actualSize < 5 ||
      actualSize > MAX_PDF_SIZE_BYTES ||
      actualSize !== expectedSize
    ) {
      throw new BadRequestException(
        'La taille réelle du PDF ne correspond pas au dépôt annoncé.',
      );
    }
    if (mimeType && mimeType !== PDF_MIME_TYPE) {
      throw new BadRequestException(
        'Le type MIME du fichier doit être application/pdf.',
      );
    }
    if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new BadRequestException(
        'Le fichier chargé n’est pas un PDF valide.',
      );
    }
  }

  private validateAvatar(
    buffer: Buffer,
    actualSize: number,
    actualMime: string | undefined,
    expectedMime: string,
    expectedSize: number,
  ) {
    if (
      actualSize < 12 ||
      actualSize > MAX_AVATAR_SIZE_BYTES ||
      actualSize !== expectedSize
    ) {
      throw new BadRequestException(
        'La taille réelle de l’image ne correspond pas au dépôt annoncé.',
      );
    }
    if (
      !AVATAR_MIME_TYPES.includes(expectedMime as AvatarMimeType) ||
      (actualMime && actualMime !== expectedMime)
    ) {
      throw new BadRequestException('Le type MIME de l’avatar est invalide.');
    }
    const isJpeg =
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp =
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    const signatureMatches =
      (expectedMime === 'image/jpeg' && isJpeg) ||
      (expectedMime === 'image/png' && isPng) ||
      (expectedMime === 'image/webp' && isWebp);
    if (!signatureMatches) {
      throw new BadRequestException(
        'La signature binaire de l’avatar est invalide.',
      );
    }
  }

  async cleanupUnlinkedProofFiles(olderThan: Date) {
    const files = await this.fileModel
      .find({
        contextType: {
          $in: [
            StorageContextType.SERVICE_PROOF,
            StorageContextType.DISPUTE_EVIDENCE,
          ],
        },
        status: StorageFileStatus.VERIFIED,
        completedAt: { $lt: olderThan },
        $or: [{ linkedEntityId: null }, { linkedEntityId: { $exists: false } }],
      })
      .select('_id')
      .lean<Array<{ _id: unknown }>>()
      .exec();
    await Promise.all(files.map((file) => this.removeOrphan(String(file._id))));
    return { inspected: files.length };
  }

  private validateProofFile(
    buffer: Buffer,
    actualSize: number,
    actualMime: string | undefined,
    expectedMime: ProofMimeType,
    expectedSize: number,
  ) {
    const maxSize = getProofMaxSize(expectedMime);
    if (actualSize < 4 || actualSize > maxSize || actualSize !== expectedSize) {
      throw new BadRequestException(
        'La taille réelle du fichier ne correspond pas au dépôt annoncé.',
      );
    }
    if (actualMime && actualMime !== expectedMime) {
      throw new BadRequestException(
        'Le type MIME réel du fichier ne correspond pas au dépôt annoncé.',
      );
    }

    const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const png = buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const riff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
    const webp = riff && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    const pdf = buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    const mp3 =
      buffer.subarray(0, 3).toString('ascii') === 'ID3' ||
      (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    const ogg = buffer.subarray(0, 4).toString('ascii') === 'OggS';
    const wav = riff && buffer.subarray(8, 12).toString('ascii') === 'WAVE';
    const webm = buffer
      .subarray(0, 4)
      .equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    const valid =
      (expectedMime === 'image/jpeg' && jpeg) ||
      (expectedMime === 'image/png' && png) ||
      (expectedMime === 'image/webp' && webp) ||
      (expectedMime === 'application/pdf' && pdf) ||
      (expectedMime === 'audio/mpeg' && mp3) ||
      (expectedMime === 'audio/ogg' && ogg) ||
      ((expectedMime === 'audio/wav' || expectedMime === 'audio/x-wav') &&
        wav) ||
      (expectedMime === 'audio/webm' && webm);
    if (!valid) {
      throw new BadRequestException(
        'La signature binaire du fichier ne correspond pas à son type.',
      );
    }
  }

  private buildManagedObjectKey(
    contextType: StorageContextType,
    extension: string,
  ) {
    const month = new Date().toISOString().slice(0, 7);
    return `${contextType}/${month}/${randomUUID()}.${extension}`;
  }

  private sanitizeFilename(filename: string) {
    const normalized = filename
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
    const safe = normalized
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return (
      (safe || 'document.pdf').slice(0, 180).replace(/\.pdf$/i, '') + '.pdf'
    );
  }

  private sanitizeImageFilename(filename: string, extension: string) {
    const normalized = filename
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
    const stem = normalized
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 180);
    return `${stem || 'avatar'}.${extension}`;
  }

  private sanitizeManagedFilename(filename: string, extension: string) {
    const normalized = filename
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
    const stem = normalized
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 180);
    return `${stem || 'preuve'}.${extension}`;
  }

  private sha256(buffer: Buffer) {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private assertReady() {
    if (!this.ready) {
      throw new ServiceUnavailableException(
        'Le stockage de documents est momentanément indisponible.',
      );
    }
  }

  private present(file: StorageFileDocument) {
    return {
      id: file.id,
      originalFilename: file.originalFilename,
      safeFilename: file.safeFilename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      sha256: file.sha256,
      contextType: file.contextType,
      contextId: file.contextId,
      status: file.status,
      completedAt: file.completedAt,
      createdAt: (file as StorageFileDocument & { createdAt?: Date }).createdAt,
    };
  }

  private presentAttachment(file: StorageFileDocument) {
    const deleted =
      file.status === StorageFileStatus.DELETED || Boolean(file.deletedAt);
    return {
      fileId: file.id,
      fileKind: getProofFileKind(file.mimeType as ProofMimeType),
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      sha256: file.sha256,
      deleted,
      deletedAt: file.deletedAt,
    };
  }
}
