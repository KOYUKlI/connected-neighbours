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
import { MAX_PDF_SIZE_BYTES, PresignUploadDto } from './dto/presign-upload.dto';
import {
  StorageContextType,
  StorageFile,
  StorageFileDocument,
  StorageFileStatus,
} from './schemas/storage-file.schema';

const PRESIGN_EXPIRY_SECONDS = 300;
const PDF_MIME_TYPE = 'application/pdf';

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
      this.validatePdf(buffer, actualSize, actualMime, file.sizeBytes);
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

  async createAuthorizedDownloadUrl(
    fileId: string,
    user: AuthenticatedUser,
    disposition: DownloadDisposition,
  ) {
    this.assertReady();
    const file = await this.getVerifiedFile(fileId);
    await this.assertFileAccess(file, user);
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
    if (file.ownerId === user.sub || user.role === Role.ADMIN) return;
    await this.assertContractAccess(file.contextId, user);
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
}
