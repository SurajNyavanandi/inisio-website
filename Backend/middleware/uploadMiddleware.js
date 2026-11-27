import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import { fileTypeFromFile } from 'file-type';
import config from '../config/env.js';
import { sendError } from '../utils/responseHandler.js';

const defaultStorageDir = path.join(process.cwd(), 'Backend', 'storage', 'private');
export const storageRoot = path.resolve(
  config.storage.documentDir || process.env.DOCUMENT_STORAGE_DIR || defaultStorageDir
);
fs.mkdirSync(storageRoot, { recursive: true });

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-cfb',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storageRoot),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const err = new Error('Invalid file type. Only PDF, Office documents, and standard images are permitted.');
      err.statusCode = 400;
      return cb(err, false);
    }
    cb(null, true);
  },
});

/**
 * Validates actual binary content (MIME magic signature) of uploaded file using `file-type`.
 */
export const verifyFileContent = async (req, res, next) => {
  if (!req.file) return next();

  const filePath = req.file.path;
  try {
    const detected = await fileTypeFromFile(filePath);
    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
      await fs.promises.unlink(filePath).catch(() => {});
      return sendError(res, 'Uploaded file binary signature does not match an allowed format.', 400);
    }
    next();
  } catch {
    await fs.promises.unlink(filePath).catch(() => {});
    return sendError(res, 'Failed to inspect uploaded file content.', 400);
  }
};

export default {
  upload,
  verifyFileContent,
  storageRoot,
};
