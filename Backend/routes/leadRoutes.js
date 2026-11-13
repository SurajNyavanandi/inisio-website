import express from 'express';
import {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
  clearAllLeads,
  assignLead,
  updateLeadProgress,
} from '../controllers/leadController.js';
import { authenticateUser, authorizeRoles, restrictSuperAdminViewer, optionalAuth } from '../middleware/authMiddleware.js';
import { validateBody, validateIndianPhone } from '../middleware/validateMiddleware.js';

const router = express.Router();

// Public submission
router.post('/', optionalAuth, validateBody(['fullName', 'mobile', 'email']), validateIndianPhone('mobile'), createLead);

<<<<<<< HEAD
// Lead retrieval & management (Authenticated - scoped by role: Admins, CAs, DPR, Prosync, or own leads for user)
=======
// Lead retrieval & management (Admins & CAs & Super Admin viewer & Authenticated users)
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
router.get('/', authenticateUser, getLeads);
router.get('/:id', authenticateUser, getLeadById);
router.put('/:id/assignment', authenticateUser, restrictSuperAdminViewer, authorizeRoles('admin'), assignLead);
router.put('/:id/progress', authenticateUser, restrictSuperAdminViewer, updateLeadProgress);
router.put('/:id', authenticateUser, restrictSuperAdminViewer, validateIndianPhone('mobile'), updateLead);
router.delete('/clear-all', authenticateUser, restrictSuperAdminViewer, authorizeRoles('admin'), clearAllLeads);
router.delete('/:id', authenticateUser, restrictSuperAdminViewer, authorizeRoles('admin'), deleteLead);

export default router;
