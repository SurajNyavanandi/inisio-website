import express from 'express';
import { authenticateUser, restrictSuperAdminViewer } from '../middleware/authMiddleware.js';
import { upload, verifyFileContent } from '../middleware/uploadMiddleware.js';
import { uploadDocument, listDocuments, downloadDocument } from '../controllers/documentController.js';

const router = express.Router();
<<<<<<< HEAD
const defaultStorageDir = path.join(process.cwd(), 'Backend', 'storage', 'private');
const storageRoot = path.resolve(
  process.env.DOCUMENT_STORAGE_DIR || defaultStorageDir
);
fs.mkdirSync(storageRoot, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.pptx',
  '.ppt',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storageRoot),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum file size
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const err = new Error(
        'Invalid file type. Only PDF, Word (DOCX), Excel (XLSX), PowerPoint (PPTX), and image (PNG/JPEG) files are permitted.'
      );
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});
=======
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92

router.use(authenticateUser);

router.post('/upload', restrictSuperAdminViewer, upload.single('file'), verifyFileContent, uploadDocument);
router.get('/project/:leadId', listDocuments);
router.get('/:id/download', downloadDocument);

export default router;
