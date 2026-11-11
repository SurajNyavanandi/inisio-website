import express from 'express';
import { authenticateUser, restrictSuperAdminViewer } from '../middleware/authMiddleware.js';
import { upload, verifyFileContent } from '../middleware/uploadMiddleware.js';
import { uploadDocument, listDocuments, downloadDocument } from '../controllers/documentController.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/upload', restrictSuperAdminViewer, upload.single('file'), verifyFileContent, uploadDocument);
router.get('/project/:leadId', listDocuments);
router.get('/:id/download', downloadDocument);

export default router;
