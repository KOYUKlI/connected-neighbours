import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const PRESIGN_EXPIRY_SECONDS = 300;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.getOrThrow<string>('MINIO_ENDPOINT');
    const port = this.configService.getOrThrow<number>('MINIO_PORT');
    const useSsl = this.configService.getOrThrow<boolean>('MINIO_USE_SSL');

    this.bucket = this.configService.getOrThrow<string>('MINIO_BUCKET');

    this.client = new S3Client({
      endpoint: `${useSsl ? 'https' : 'http'}://${endpoint}:${port}`,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
        secretAccessKey:
          this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket MinIO "${this.bucket}" créé`);
      } catch (error) {
        this.logger.warn(
          `Impossible de vérifier/créer le bucket MinIO "${this.bucket}": ${(error as Error).message}`,
        );
      }
    }
  }

  buildObjectKey(prefix: string, fileName: string) {
    const extension = fileName.includes('.')
      ? `.${fileName.split('.').pop()}`
      : '';

    return `${prefix}/${randomUUID()}${extension}`;
  }

  async createUploadUrl(objectKey: string, mimeType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: mimeType,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });

    return { url, objectKey, expiresIn: PRESIGN_EXPIRY_SECONDS };
  }

  async createDownloadUrl(objectKey: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });
  }
}
