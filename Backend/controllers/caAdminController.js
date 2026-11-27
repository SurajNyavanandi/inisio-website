import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Project from '../models/Project.js';
import CaProfile from '../models/CaProfile.js';
import Consultation from '../models/Consultation.js';
import { isDBConnected } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { generateToken } from '../utils/generateToken.js';
import config from '../config/env.js';
import { getMemoryLeads } from '../services/leadService.js';
import { getMemoryProjects } from '../services/projectService.js';
import {
  mockOcrExtractFromCard,
  checkDuplicateCa,
  createPendingCaProfile,
  getCaProfiles,
  dispatchClaimInvitation,
  verifyClaimToken,
  activateCaProfile,
  getProfileReportsBySourceTag,
  memoryCaProfiles,
} from '../utils/caProfileStore.js';
import {
  claimInvitationTemplate,
  updateClaimInvitationTemplate,
} from '../templates/claimInvitationEmail.js';
import {
  activationConfirmationTemplate,
  updateActivationConfirmationTemplate,
} from '../templates/activationConfirmationEmail.js';
import {
  getMemoryUsers,
  findMemoryUserByEmail,
  addMemoryUser,
  isValidGmail,
  isAuthorizedCaAdminGmail,
  isAdminTestPasswordMatch,
} from '../utils/memoryUserStore.js';

/**
 * Authenticate CA Admin via authorized Gmail allowlist + database-stored hashed password.
 * In non-production environments, authorized CA Admin accounts also accept the configured
 * testing default password (process.env.ADMIN_TEST_PASSWORD || 'password26@gmail.com').
 */
export const authenticateCaAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !isValidGmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Only valid @gmail.com addresses are permitted for CA Admin access.',
      });
    }

    if (!password || !String(password).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your password to sign in.',
      });
    }

    if (!isAuthorizedCaAdminGmail(cleanEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This Gmail address is not an authorized CA_ADMIN account.',
      });
    }

    const setupMessage =
      'No password has been set for this CA Admin account yet. Click "Forgot / Set Password?" to receive a 6-digit code via email and create your password.';

    if (isDBConnected()) {
      let existingUser = await User.findOne({ email: cleanEmail }).select('+password');
      if (existingUser && existingUser.role !== 'ca_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: This email is registered as another portal account and cannot access CA Admin.',
        });
      }

      if (!existingUser || existingUser.passwordInitialized === false) {
        return res.status(401).json({
          success: false,
          requiresPasswordSetup: true,
          message: setupMessage,
        });
      } else {
        const isMatch = await existingUser.matchPassword(password);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Incorrect password. Please try again or click "Forgot / Set Password?" to reset it via email.',
          });
        }
      }

      const token = generateToken({
        id: existingUser._id,
        email: existingUser.email,
        role: 'ca_admin',
        name: existingUser.name || 'CA Operations Admin',
        isVerified: true,
      });

      return sendSuccess(
        res,
        {
          _id: existingUser._id,
          email: existingUser.email,
          role: 'ca_admin',
          name: existingUser.name || 'CA Operations Admin',
          token,
        },
        'CA Admin authenticated successfully'
      );
    }

    if (!config.ALLOW_MEMORY_FALLBACK) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable.',
      });
    }

    let memUser = findMemoryUserByEmail(cleanEmail);
    if (memUser && memUser.role !== 'ca_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This email is registered as another portal account and cannot access CA Admin.',
      });
    }

    if (!memUser || memUser.passwordInitialized === false) {
      return res.status(401).json({
        success: false,
        requiresPasswordSetup: true,
        message: setupMessage,
      });
    } else {
      const isMatch = await bcrypt.compare(password, memUser.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please try again or click "Forgot / Set Password?" to reset it via email.',
        });
      }
    }

    const token = generateToken({
      id: memUser._id,
      email: memUser.email,
      role: 'ca_admin',
      name: memUser.name || 'CA Operations Admin',
      isVerified: true,
    });

    return sendSuccess(
      res,
      {
        _id: memUser._id,
        email: memUser.email,
        role: 'ca_admin',
        name: memUser.name || 'CA Operations Admin',
        token,
      },
      'CA Admin authenticated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch comprehensive metrics for each CA and Consultant:
 * - Number of projects assessed
 * - Lead counts split by source (Inisio vs own), status, and location
 * Using ONLY fields existing in the database models:
 *   Lead.source, Lead.status, Lead.location, Lead.assignedCA, Lead.dprAssignedTo, Lead.assessmentCompleted
 *   Project.status, Project.location, Project.assignedCA, Project.dprAssignedTo
 *   User.role, User.company, User.lastLogin.city, User.lastLogin.state
 */
export const getCaAdminMetrics = async (req, res, next) => {
  try {
    let allLeads = [];
    let allProjects = [];
    let allUsers = [];

    if (isDBConnected()) {
      try {
        allLeads = await Lead.find({}).lean();
        allProjects = await Project.find({}).lean();
        allUsers = await User.find({}).lean();
      } catch (e) {
        console.warn('[caAdminController] DB error fetching metrics data:', e.message);
      }
    } else {
      allLeads = [...getMemoryLeads()];
      allProjects = [...getMemoryProjects()];
    }

    if (allUsers.length === 0) {
      allUsers = getMemoryUsers();
    }

    // Identify all CAs
    const caUsers = allUsers.filter((u) => u.role === 'ca');

    // Identify all Consultants
    const consultantUsers = allUsers.filter((u) => ['dpr', 'dpr_consultant'].includes(u.role));
    if (consultantUsers.length === 0) {
      consultantUsers.push(
        {
          _id: 'user_consultant_01',
          name: 'Er. Sandeep Mukherjee',
          email: 'consultant.dpr@inisio.com',
          role: 'dpr_consultant',
          company: 'Inisio Technical Advisory Group',
          lastLogin: { city: 'Mumbai', state: 'Maharashtra' },
        },
        {
          _id: 'user_consultant_02',
          name: 'Dr. K. Ramanathan, M.Tech',
          email: 'dpr.south@inisio.com',
          role: 'dpr_consultant',
          company: 'Southern Industrial Infrastructure Consultants',
          lastLogin: { city: 'Chennai', state: 'Tamil Nadu' },
        }
      );
    }

    // Helper: calculate breakdown for an assigned actor
    const buildActorMetrics = (actorEmail, actorName, roleType) => {
      const cleanEmail = (actorEmail || '').toLowerCase().trim();

      const actorLeads = allLeads.filter((l) => {
        if (roleType === 'ca') {
          const lCa = (l.assignedCA || '').toLowerCase().trim();
          return lCa === cleanEmail || lCa.includes(cleanEmail) || (actorName && lCa.includes(actorName.toLowerCase()));
        } else {
          const lDpr = (l.dprAssignedTo || l.consultationAssignedTo || '').toLowerCase().trim();
          return lDpr === cleanEmail || lDpr.includes(cleanEmail) || (actorName && lDpr.includes(actorName.toLowerCase()));
        }
      });

      // Projects Assessed count (using existing Lead.assessmentCompleted and Project records)
      const assessedCount = actorLeads.filter((l) => l.assessmentCompleted === true).length;

      // Source split (Inisio vs own) using existing Lead.source field
      let inisioCount = 0;
      let ownCount = 0;
      let otherSourceCount = 0;

      actorLeads.forEach((l) => {
        const src = (l.source || '').toLowerCase();
        if (src.includes('own') || src.includes('referral') || src.includes('practice') || src.includes('client')) {
          ownCount += 1;
        } else if (src.includes('inisio') || src.includes('web') || src.includes('portal') || src.includes('inbound')) {
          inisioCount += 1;
        } else {
          otherSourceCount += 1;
        }
      });

      // Status breakdown using existing Lead.status field
      const statusBreakdown = {};
      actorLeads.forEach((l) => {
        const st = l.status || 'In Appraisal';
        statusBreakdown[st] = (statusBreakdown[st] || 0) + 1;
      });

      // Location breakdown using existing Lead.location field
      const locationBreakdown = {};
      actorLeads.forEach((l) => {
        const loc = l.location || 'Pan-India';
        locationBreakdown[loc] = (locationBreakdown[loc] || 0) + 1;
      });

      return {
        email: cleanEmail,
        name: actorName || cleanEmail.split('@')[0],
        role: roleType,
        totalLeads: actorLeads.length,
        projectsAssessed: assessedCount,
        sourceBreakdown: {
          inisio: inisioCount,
          own: ownCount,
          other: otherSourceCount,
        },
        statusBreakdown,
        locationBreakdown,
      };
    };

    const caMetricsList = caUsers.map((u) => buildActorMetrics(u.email, u.name, 'ca'));
    const consultantMetricsList = consultantUsers.map((u) => buildActorMetrics(u.email, u.name, 'consultant'));

    return sendSuccess(res, {
      caMetrics: caMetricsList,
      consultantMetrics: consultantMetricsList,
      totalLeadsCount: allLeads.length,
      totalCaCount: caUsers.length,
      totalConsultantCount: consultantUsers.length,
    }, 'CA and Consultant metrics computed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch segmented leads for the CA Admin Dashboard:
 * - Own Leads (source = own/practice/referral)
 * - Inisio Leads (source = web portal/inisio)
 * - New Leads (status = New / pending appraisal)
 */
export const getCaAdminLeads = async (req, res, next) => {
  try {
    const { category = 'all', search = '', status = '', location = '' } = req.query;

    let leads = [];
    if (isDBConnected()) {
      try {
        leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
      } catch (e) {
        console.warn('DB error in getCaAdminLeads:', e.message);
      }
    } else {
      leads = [
        ...getMemoryLeads(),
        ...getMemoryProjects().map((p) => ({
          _id: p._id,
          fullName: p.promoterName || 'Promoter',
          email: p.email || '',
          projectName: p.projectName || '',
          location: p.location || '',
          industry: p.industry || '',
          status: p.status || 'Pending Audit',
          assignedCA: p.assignedCA || '',
          source: 'Direct Project Registry',
          createdAt: p.createdAt,
        })),
      ];
    }

    // Filter by category
    let filtered = leads.filter((l) => {
      const src = (l.source || '').toLowerCase();
      const st = (l.status || '').toLowerCase();

      if (category === 'own') {
        return src.includes('own') || src.includes('referral') || src.includes('practice') || src.includes('client');
      }
      if (category === 'inisio') {
        return src.includes('inisio') || src.includes('web') || src.includes('portal') || src.includes('inbound');
      }
      if (category === 'new') {
        return st === 'new' || st.includes('draft') || !l.assignedCA;
      }
      return true;
    });

    if (status && status !== 'ALL') {
      filtered = filtered.filter((l) => (l.status || '').toLowerCase() === status.toLowerCase());
    }

    if (location && location !== 'ALL') {
      filtered = filtered.filter((l) => (l.location || '').toLowerCase().includes(location.toLowerCase()));
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((l) =>
        (l.fullName || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s) ||
        (l.projectName || '').toLowerCase().includes(s) ||
        (l.location || '').toLowerCase().includes(s) ||
        (l.industry || '').toLowerCase().includes(s)
      );
    }

    return sendSuccess(res, {
      category,
      totalCount: filtered.length,
      leads: filtered,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for "Find a CA / Consultant" & "Nearest Consultant" Discovery:
 * Only returns genuinely onboarded & available professionals (activated CaProfiles, verified CA / DPR users,
 * plus Featured Advisory Partner Prosync Consulting when requested).
 */
export const getNearestConsultants = async (req, res, next) => {
  try {
    const {
      projectLocation = '',
      projectCategory = '',
      service = '',
      city = '',
      state = '',
      sector = '',
      includeProsync = 'true',
    } = req.query;

    const queryLoc = [projectLocation, city, state].filter(Boolean).join(' ').toLowerCase();
    const queryService = String(service || '').trim().toLowerCase();
    const querySector = String(sector || projectCategory || '').trim().toLowerCase();

    const pool = [];
    const seenEmails = new Set();

    const SERVICE_CATEGORIES = [
      'CMA & Financial Analysis',
      'DPR Preparation',
      'TEV Studies',
      'Debt Syndication',
    ];

    const pushProfile = (raw) => {
      const email = String(raw.email || '').trim().toLowerCase();
      if (!email || seenEmails.has(email)) return;
      seenEmails.add(email);
      pool.push(raw);
    };

    // 1. Load onboarded & activated CaProfiles from MongoDB or memory store
    let caProfiles = [];
    if (isDBConnected()) {
      try {
        caProfiles = await CaProfile.find({ status: 'activated' }).lean();
      } catch (e) {
        console.warn('[caAdminController] DB error reading CaProfile directory:', e.message);
      }
    } else {
      caProfiles = (memoryCaProfiles || []).filter(
        (p) => String(p.status || '').toLowerCase() === 'activated'
      );
    }

    for (const p of caProfiles) {
      pushProfile({
        id: String(p._id),
        name: p.name || 'Chartered Accountant',
        email: p.email,
        phone: p.phone || '',
        firm: p.firmName || 'Independent CA Practice',
        role: 'ca',
        servicesOffered: p.servicesOffered || ['CMA & Financial Analysis', 'DPR Preparation'],
        specialization: p.notes || 'CMA Data, Financial Analysis & Project Advisory',
        experience: p.experience || 'Verified ICAI Member',
        city: p.city || 'Hyderabad',
        state: p.state || 'Telangana',
        isFeaturedPartner: false,
        onboarded: true,
        feeNote: 'Consultants independently communicate their professional fees and engagement terms.',
      });
    }

    // 2. Load verified CA & DPR Consultant User accounts from DB / memoryUserStore
    let userProfessionals = [];
    if (isDBConnected()) {
      try {
        userProfessionals = await User.find({
          role: { $in: ['ca', 'dpr', 'dpr_consultant'] },
          isVerified: true,
        })
          .select('name email phone company role lastLogin createdAt')
          .lean();
      } catch (e) {
        console.warn('[caAdminController] DB error reading User professionals:', e.message);
      }
    }
    if (userProfessionals.length === 0) {
      userProfessionals = (getMemoryUsers() || []).filter(
        (u) => ['ca', 'dpr', 'dpr_consultant'].includes(u.role) && u.isVerified !== false
      );
    }

    for (const u of userProfessionals) {
      const isDpr = u.role === 'dpr' || u.role === 'dpr_consultant';
      pushProfile({
        id: String(u._id || u.email),
        name: u.name || (isDpr ? 'Project Technical Consultant' : 'Chartered Accountant'),
        email: u.email,
        phone: u.phone || '',
        firm: u.company || (isDpr ? 'Independent Technical Consultancy' : 'Independent CA Advisory'),
        role: u.role,
        servicesOffered: isDpr
          ? ['DPR Preparation', 'TEV Studies']
          : ['CMA & Financial Analysis', 'Debt Syndication'],
        specialization: isDpr
          ? 'DPR Preparation, TEV Studies & Technical Feasibility'
          : 'CMA & Financial Analysis, Debt Structuring & Audit Review',
        experience: 'Onboarded Platform Professional',
        city: u.lastLogin?.city || 'Hyderabad',
        state: u.lastLogin?.state || 'Telangana',
        isFeaturedPartner: false,
        onboarded: true,
        feeNote: 'Consultants independently communicate their professional fees and engagement terms.',
      });
    }

    // 3. Featured Advisory Partner: Prosync Consulting (explicitly identified separately)
    const featuredPartner = {
      id: 'featured_prosync_consulting',
      name: 'Prosync Consulting',
      email: process.env.PROSYNC_DESK_EMAIL || 'advisory@inisio.in',
      phone: '+91 63020 26462',
      firm: 'Featured Advisory Partner',
      role: 'prosync',
      servicesOffered: ['Debt Syndication', 'CMA & Financial Analysis', 'DPR Preparation', 'TEV Studies'],
      specialization: 'Project Finance Structuring, Debt Syndication & Institutional Advisory',
      experience: 'Featured Advisory Partner · Pan-India Assignments',
      city: 'Hyderabad',
      state: 'Telangana',
      isFeaturedPartner: true,
      onboarded: true,
      feeNote: 'Any advisory engagement with Prosync Consulting is governed by a separate engagement agreement and fee terms.',
    };

    // Score, filter, and compute area counts cleanly
    const evaluateMatch = (item) => {
      const cCity = String(item.city || '').toLowerCase();
      const cState = String(item.state || '').toLowerCase();
      const cSpec = String(item.specialization || '').toLowerCase();
      const cServices = (item.servicesOffered || []).map((s) => String(s).toLowerCase());

      let matchesService = true;
      if (queryService && queryService !== 'all') {
        matchesService = cServices.some((s) => s.includes(queryService) || queryService.includes(s)) || cSpec.includes(queryService);
      }

      let matchesSector = true;
      if (querySector && querySector !== 'all') {
        matchesSector = cSpec.includes(querySector) || item.isFeaturedPartner;
      }

      let matchesLocation = true;
      if (city && city.toLowerCase() !== 'all') {
        matchesLocation = cCity.includes(city.toLowerCase()) || String(item.state || '').toLowerCase().includes(city.toLowerCase());
      } else if (state && state.toLowerCase() !== 'all') {
        matchesLocation = cState.includes(state.toLowerCase());
      }

      let matchScore = 50;
      let areaMatch = false;
      if (queryLoc) {
        if (cCity && queryLoc.includes(cCity)) {
          matchScore += 45;
          areaMatch = true;
        } else if (cState && queryLoc.includes(cState)) {
          matchScore += 30;
          areaMatch = true;
        }
      }
      if (queryService && matchesService) matchScore += 15;
      if (querySector && matchesSector) matchScore += 15;

      return {
        ...item,
        matchesFilter: matchesService && matchesSector && matchesLocation,
        areaMatch,
        matchScore: Math.min(matchScore, 100),
        isClosest: false,
      };
    };

    const evaluatedPool = pool.map(evaluateMatch).filter((c) => c.matchesFilter);
    evaluatedPool.sort((a, b) => b.matchScore - a.matchScore);
    if (evaluatedPool.length > 0 && (queryLoc || evaluatedPool[0].areaMatch)) {
      evaluatedPool[0].isClosest = true;
    }

    const areaCount = queryLoc
      ? evaluatedPool.filter((c) => c.areaMatch).length
      : evaluatedPool.length;

    return sendSuccess(res, {
      projectLocation,
      serviceCategories: SERVICE_CATEGORIES,
      featuredPartner: includeProsync !== 'false' ? featuredPartner : null,
      areaAvailableCount: areaCount,
      totalAvailableCount: evaluatedPool.length,
      consultants: evaluatedPool,
      message:
        evaluatedPool.length > 0
          ? `Found ${evaluatedPool.length} onboarded professional(s) available.`
          : 'No independent professionals currently match those exact filters. You may adjust filters or request an introduction to Prosync Consulting (Featured Advisory Partner).',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 1 & 2: Mock OCR Scan visiting card endpoint
 */
export const scanCardOcr = async (req, res, next) => {
  try {
    const cardData = await mockOcrExtractFromCard(req.body);
    return sendSuccess(res, cardData, 'Visiting card OCR parsed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2: Duplicate check endpoint
 */
export const checkDuplicate = async (req, res, next) => {
  try {
    const { email, phone, membershipNumber, excludeId } = req.body;
    const result = await checkDuplicateCa({ email, phone, membershipNumber, excludeId });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Step 3: Create pending profile
 */
export const createProfile = async (req, res, next) => {
  try {
    const profile = await createPendingCaProfile(req.body);
    return sendSuccess(res, profile, 'Pending CA profile created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch profiles with source filter
 */
export const getProfiles = async (req, res, next) => {
  try {
    const { sourceTag, status, search } = req.query;
    const profiles = await getCaProfiles({ sourceTag, status, search });
    return sendSuccess(res, profiles);
  } catch (error) {
    next(error);
  }
};

/**
 * Step 4: Dispatch claim invitation email
 */
export const sendClaimInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    let origin = req.headers.origin;
    if (!origin && req.headers.referer) {
      try {
        const urlObj = new URL(req.headers.referer);
        origin = `${urlObj.protocol}//${urlObj.host}`;
      } catch {
        origin = req.headers.referer;
      }
    }
    const result = await dispatchClaimInvitation(id, origin);
    return sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Step 5: Verify claim token
 */
export const verifyClaim = async (req, res, next) => {
  try {
    const { token } = req.query;
    const result = await verifyClaimToken(token);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Step 5: Activate profile
 */
export const activateProfile = async (req, res, next) => {
  try {
    const result = await activateCaProfile(req.body);
    return sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Reporting: Profile counts grouped by source tag
 */
export const getReports = async (req, res, next) => {
  try {
    const reports = await getProfileReportsBySourceTag();
    return sendSuccess(res, reports, 'Source tag reports fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Email Templates: Get and Update
 */
export const getEmailTemplates = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      claimInvitation: claimInvitationTemplate,
      activationConfirmation: activationConfirmationTemplate,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmailTemplate = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { subject, html } = req.body;

    if (type === 'claim-invitation') {
      const updated = updateClaimInvitationTemplate({ subject, html });
      return sendSuccess(res, updated, 'Claim invitation template updated successfully');
    }
    if (type === 'activation-confirmation') {
      const updated = updateActivationConfirmationTemplate({ subject, html });
      return sendSuccess(res, updated, 'Activation confirmation template updated successfully');
    }

    return sendError(res, 'Unknown template type', 400);
  } catch (error) {
    next(error);
  }
};

export default {
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
};
