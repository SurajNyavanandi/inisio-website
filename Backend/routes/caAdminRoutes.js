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
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// CA Admin Authentication Endpoint (Single email check for CA_ADMIN)
router.post('/auth', authenticateCaAdmin);

// Public Activation Endpoints (Step 5 - accessed via email claim link)
router.get('/verify-claim', verifyClaim);
router.post('/activate-profile', activateProfile);

// CA Admin Operational Endpoints
router.get('/metrics', optionalAuth, getCaAdminMetrics);
router.get('/leads', optionalAuth, getCaAdminLeads);
router.get('/consultants/nearest', optionalAuth, getNearestConsultants);

// Business Card Registration Endpoints (Steps 1 to 4)
router.post('/cards/scan', optionalAuth, scanCardOcr);
router.post('/cards/check-duplicate', optionalAuth, checkDuplicate);
router.post('/profiles', optionalAuth, createProfile);
router.get('/profiles', optionalAuth, getProfiles);
router.post('/profiles/:id/claim-invitation', optionalAuth, sendClaimInvitation);

// Reporting (Source Tag Aggregation)
router.get('/reports', optionalAuth, getReports);

// Editable Email Templates
router.get('/templates', optionalAuth, getEmailTemplates);
router.put('/templates/:type', optionalAuth, updateEmailTemplate);

export default router;
