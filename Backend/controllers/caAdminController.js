import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Project from '../models/Project.js';
import Consultation from '../models/Consultation.js';
import { isDBConnected } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { generateToken } from '../utils/generateToken.js';
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
import { getMemoryUsers } from '../utils/memoryUserStore.js';

/**
 * Authenticate CA Admin via email-only Gmail check.
 * Any valid @gmail.com address is granted CA Admin access for now.
 */
export const authenticateCaAdmin = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const gmailRegex = /^[^\s@]+@gmail\.com$/i;

    if (!cleanEmail || !gmailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Only valid @gmail.com addresses are permitted for CA Admin access.',
      });
    }

    const token = generateToken({
      id: 'user_ca_admin_dynamic',
      email: cleanEmail,
      role: 'ca_admin',
      name: 'CA Operations Admin',
    });

    return sendSuccess(res, {
      _id: 'user_ca_admin_dynamic',
      email: cleanEmail,
      role: 'ca_admin',
      name: 'CA Operations Admin',
      token,
    }, 'CA Admin authenticated successfully');
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
 * Controller for "Contact Nearest Consultant":
 * Match project location to the closest DPR & financial consultants based on available model fields.
 * NOTE: User model only contains user.company and user.lastLogin.city / state.
 */
export const getNearestConsultants = async (req, res, next) => {
  try {
    const { projectLocation = '', projectCategory = '' } = req.query;

    const queryCityState = (projectLocation || '').toLowerCase();

    // Available consultants list
    const consultants = [
      {
        id: 'cons_01',
        name: 'Er. Sandeep Mukherjee, M.E. (Civil)',
        email: 'consultant.dpr@inisio.com',
        phone: '+91 98200 44556',
        firm: 'Inisio Technical Advisory Desk',
        specialization: 'Manufacturing, Heavy Infrastructure & Chemicals',
        city: 'Mumbai',
        state: 'Maharashtra',
        region: 'West',
        rating: 4.9,
        completedDprs: 48,
      },
      {
        id: 'cons_02',
        name: 'Dr. K. Ramanathan, Ph.D. (Food Tech)',
        email: 'dpr.south@inisio.com',
        phone: '+91 98400 77889',
        firm: 'Southern Industrial Infrastructure Consultants',
        specialization: 'Agro & Food Processing, Cold Storage, Ports',
        city: 'Chennai',
        state: 'Tamil Nadu',
        region: 'South',
        rating: 4.8,
        completedDprs: 36,
      },
      {
        id: 'cons_03',
        name: 'Er. Gurpreet Singh Bawa',
        email: 'gurpreet.bawa@delhidpr.org',
        phone: '+91 98110 33221',
        firm: 'North India Techno-Economic Advisory',
        specialization: 'Steel, Renewable Energy & Auto Components',
        city: 'New Delhi',
        state: 'Delhi',
        region: 'North',
        rating: 4.7,
        completedDprs: 29,
      },
      {
        id: 'cons_04',
        name: 'Er. Rajeshwar Rao, B.Tech (Mech)',
        email: 'rao.dpr@hydconsult.com',
        phone: '+91 98480 66554',
        firm: 'Deccan Project Engineering Consultancy',
        specialization: 'Pharma API, Warehousing & Electronics',
        city: 'Hyderabad',
        state: 'Telangana',
        region: 'South / Central',
        rating: 4.9,
        completedDprs: 42,
      },
      {
        id: 'cons_05',
        name: 'Er. Bhaskar Sengupta, M.Tech',
        email: 'b.sengupta@kolkataconsult.in',
        phone: '+91 98300 11998',
        firm: 'Eastern Mineral & Infrastructure Partners',
        specialization: 'Mining, Logistics Hubs, Paper & Pulp',
        city: 'Kolkata',
        state: 'West Bengal',
        region: 'East',
        rating: 4.6,
        completedDprs: 24,
      },
    ];

    // Score and rank consultants by location match
    const ranked = consultants.map((c) => {
      let matchScore = 50; // base score
      const cCity = c.city.toLowerCase();
      const cState = c.state.toLowerCase();
      const cSpec = c.specialization.toLowerCase();

      if (queryCityState) {
        if (queryCityState.includes(cCity)) matchScore += 45;
        else if (queryCityState.includes(cState)) matchScore += 30;
      }
      if (projectCategory && cSpec.includes(projectCategory.toLowerCase())) {
        matchScore += 25;
      }

      return {
        ...c,
        matchScore: Math.min(matchScore, 100),
        isClosest: false,
      };
    });

    ranked.sort((a, b) => b.matchScore - a.matchScore);
    if (ranked.length > 0) ranked[0].isClosest = true;

    return sendSuccess(res, {
      projectLocation,
      consultants: ranked,
      message: `Found ${ranked.length} verified technical consultants matching project criteria.`,
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
    const { email, phone, excludeId } = req.body;
    const result = await checkDuplicateCa({ email, phone, excludeId });
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
