import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import config from '../config/env.js';
import { storageRoot } from '../middleware/uploadMiddleware.js';

let s3ClientInstance = null;

export const isS3Configured = () =>
  Boolean(
    config.storage?.s3Bucket &&
      config.storage?.s3AccessKeyId &&
      config.storage?.s3SecretAccessKey
  );

const getS3Client = () => {
  if (!isS3Configured()) return null;
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: config.storage.s3Region || 'ap-south-1',
      ...(config.storage.s3Endpoint ? { endpoint: config.storage.s3Endpoint, forcePathStyle: true } : {}),
      credentials: {
        accessKeyId: config.storage.s3AccessKeyId,
        secretAccessKey: config.storage.s3SecretAccessKey,
      },
    });
  }
  return s3ClientInstance;
};

/**
 * Persist an uploaded file to S3-compatible object storage if configured, otherwise keep on strict private disk.
 */
export const persistUploadedFile = async ({ localPath, storageName, mimeType }) => {
  const client = getS3Client();
  if (!client) {
    return { provider: 'local', key: path.basename(storageName) };
  }

  const key = `documents/${path.basename(storageName)}`;
  const bodyBuffer = await fs.readFile(localPath);

  await client.send(
    new PutObjectCommand({
      Bucket: config.storage.s3Bucket,
      Key: key,
      Body: bodyBuffer,
      ContentType: mimeType || 'application/octet-stream',
      ServerSideEncryption: 'AES256',
    })
  );

  // Remove local temp file after successful S3 upload
  await fs.unlink(localPath).catch(() => {});
  return { provider: 's3', key };
};

/**
 * Retrieve a stored file as either a private disk path or an S3 stream/buffer.
 */
export const retrieveStoredFile = async ({ storageProvider = 'local', storageName }) => {
  const safeName = path.basename(storageName || '');
  if (!safeName) return null;

  if (storageProvider === 's3' && isS3Configured()) {
    const client = getS3Client();
    const key = storageName.startsWith('documents/') ? storageName : `documents/${safeName}`;
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.storage.s3Bucket,
        Key: key,
      })
    );
    const bytes = await response.Body.transformToByteArray();
    return { provider: 's3', buffer: Buffer.from(bytes) };
  }

  const filePath = path.join(storageRoot, safeName);
  await fs.access(filePath);
  return { provider: 'local', filePath };
};

export default {
  isS3Configured,
  persistUploadedFile,
  retrieveStoredFile,
};
