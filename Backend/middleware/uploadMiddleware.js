import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import config from '../config/env.js';
import { sendError } from '../utils/responseHandler.js';

const defaultStorageDir = path.join(process.cwd(), 'Backend', 'storage', 'private');
export const storageRoot = path.resolve(
  config.storage.documentDir || process.env.DOCUMENT_STORAGE_DIR || defaultStorageDir
);
fs.mkdirSync(storageRoot, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set([
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
 * Validates actual binary content (magic numbers) of uploaded file
 */
export const verifyFileContent = async (req, res, next) => {
  if (!req.file) return next();

  const filePath = req.file.path;
  try {
    const fd = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(8);
    await fd.read(buffer, 0, 8, 0);
    await fd.close();

    const hex = buffer.toString('hex');
    const isPdf = buffer.toString('utf8', 0, 4) === '%PDF';
    const isJpeg = hex.startsWith('ffd8ff');
    const isPng = hex.startsWith('89504e470d0a1a0a');
    const isZipOrOffice = hex.startsWith('504b0304'); // docx, xlsx, pptx
    const isLegacyOffice = hex.startsWith('d0cf11e0a1b11ae1'); // doc, xls, ppt

    if (!isPdf && !isJpeg && !isPng && !isZipOrOffice && !isLegacyOffice) {
      // Remove malicious/tampered file immediately
      await fs.promises.unlink(filePath).catch(() => {});
      return sendError(res, 'Uploaded file content does not match allowed binary format.', 400);
    }

    next();
  } catch (err) {
    await fs.promises.unlink(filePath).catch(() => {});
    return sendError(res, 'Failed to inspect uploaded file content.', 400);
  }
};

export default {
  upload,
  verifyFileContent,
  storageRoot,
};
