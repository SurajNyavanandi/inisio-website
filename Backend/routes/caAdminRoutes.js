import express from 'express';
import {
  authenticateCaAdmin,
  getCaAdminMetrics,
  getCaAdminLeads,
  getNearestConsultants,
  scanCardOcr,
  checkDuplicate,
  createProfile,
  getProfiles,
  sendClaimInvitation,
  verifyClaim,
  activateProfile,
  getReports,
  getEmailTemplates,
  updateEmailTemplate,
} from '../controllers/caAdminController.js';
import { authenticateUser, authorizeRoles, restrictSuperAdminViewer, optionalAuth } from '../middleware/authMiddleware.js';
import {
  validateSchema,
  adminLoginSchema,
  caProfileCreateSchema,
  activateCaSchema,
} from '../middleware/validateMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// CA Admin Authentication Endpoint (Single email check for CA_ADMIN)
router.post('/auth', authLimiter, validateSchema(adminLoginSchema), authenticateCaAdmin);

// Public Activation Endpoints (Step 5 - accessed via email claim link)
router.get('/verify-claim', verifyClaim);
router.post('/activate-profile', authLimiter, validateSchema(activateCaSchema), activateProfile);

// CA Admin Operational Endpoints (Authenticated)
const requireCaAdmin = [authenticateUser, authorizeRoles('ca_admin', 'admin', 'superadmin')];

router.get('/metrics', ...requireCaAdmin, getCaAdminMetrics);
router.get('/leads', ...requireCaAdmin, getCaAdminLeads);
router.get('/consultants/nearest', optionalAuth, getNearestConsultants);

// Business Card Registration Endpoints (Steps 1 to 4)
router.post('/cards/scan', ...requireCaAdmin, restrictSuperAdminViewer, scanCardOcr);
router.post('/cards/check-duplicate', ...requireCaAdmin, checkDuplicate);
router.post('/profiles', ...requireCaAdmin, restrictSuperAdminViewer, validateSchema(caProfileCreateSchema), createProfile);
router.get('/profiles', ...requireCaAdmin, getProfiles);
router.post('/profiles/:id/claim-invitation', ...requireCaAdmin, restrictSuperAdminViewer, sendClaimInvitation);

// Reporting (Source Tag Aggregation)
router.get('/reports', ...requireCaAdmin, getReports);

// Editable Email Templates
router.get('/templates', ...requireCaAdmin, getEmailTemplates);
router.put('/templates/:type', ...requireCaAdmin, restrictSuperAdminViewer, updateEmailTemplate);

export default router;
