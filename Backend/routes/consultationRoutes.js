import express from 'express';
import {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultationStatus,
} from '../controllers/consultationController.js';
import { authenticateUser, authorizeRoles, restrictSuperAdminViewer } from '../middleware/authMiddleware.js';
import { validateBody, validateIndianPhone } from '../middleware/validateMiddleware.js';

const router = express.Router();

// Public booking
router.post('/', validateBody(['fullName', 'phone']), validateIndianPhone('phone'), createConsultation);

// Advisor & Admin routes (Superadmin can view, but admin/ca/prosync can update status)
router.get('/', authenticateUser, authorizeRoles('admin', 'superadmin', 'ca', 'prosync'), getConsultations);
router.get('/:id', authenticateUser, authorizeRoles('admin', 'superadmin', 'ca', 'prosync'), getConsultationById);
router.put('/:id/status', authenticateUser, restrictSuperAdminViewer, authorizeRoles('admin', 'ca', 'prosync'), updateConsultationStatus);

export default router;
