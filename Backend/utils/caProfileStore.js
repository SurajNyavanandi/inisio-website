import crypto from 'crypto';
import CaProfile from '../models/CaProfile.js';
import User from '../models/User.js';
import { isDBConnected } from '../config/db.js';
import { renderClaimInvitationEmail } from '../templates/claimInvitationEmail.js';
import { renderActivationConfirmationEmail } from '../templates/activationConfirmationEmail.js';
import { sendEmail } from './emailService.js';
import { memoryUsers, addMemoryUser, findMemoryUserByEmail } from './memoryUserStore.js';
import bcrypt from 'bcryptjs';

// In-memory CA Profile Store (starts empty, populated strictly via Card Registration workflow)
export let memoryCaProfiles = [];

/**
 * Step 1 & 2: Mock OCR Extraction Service
 * In production: Replace with Google Cloud Vision / AWS Textract / Tesseract.js
 */
export const mockOcrExtractFromCard = async (cardPayload) => {
  // TODO: Replace mock OCR extraction with production provider (e.g., Google Cloud Vision, AWS Textract, or Tesseract.js)
  // Example production call:
  // const [result] = await visionClient.textDetection(imageBuffer);
  // const ocrText = result.fullTextAnnotation.text;
  
  // Extract mock values or simulate OCR parser based on filename or dummy scan
  const sampleNames = ['Kiran K. Kulkarni, FCA', 'Manish Agrawal, ACA', 'Sunita Sundaram, FCA', 'Praveen Mehta, FCA'];
  const sampleFirms = ['Kulkarni & Associates', 'Agrawal Financial Advisors', 'Sundaram & Co.', 'Mehta Chartered Accountants'];
  const sampleCities = ['Ahmedabad', 'Bengaluru', 'Hyderabad', 'Indore'];
  const sampleStates = ['Gujarat', 'Karnataka', 'Telangana', 'Madhya Pradesh'];

  const randIdx = Math.floor(Math.random() * sampleNames.length);
  const randomDigits = Math.floor(1000 + Math.random() * 9000);

  const cleanName = cardPayload?.extractedName || sampleNames[randIdx];
  const cleanFirm = cardPayload?.extractedFirm || sampleFirms[randIdx];
  const cleanEmail = cardPayload?.extractedEmail || `ca.${cleanName.split(' ')[0].toLowerCase()}.${randomDigits}@auditfirm.in`;
  const cleanPhone = cardPayload?.extractedPhone || `+91 98${randomDigits} 1234`;
  const cleanCity = cardPayload?.extractedCity || sampleCities[randIdx];
  const cleanState = cardPayload?.extractedState || sampleStates[randIdx];
  const cleanMbr = `FCA-0${randomDigits}`;

  const rawText = `
${cleanFirm}
${cleanName}
Chartered Accountant | Reg No: ${cleanMbr}
Contact: ${cleanPhone}
Email: ${cleanEmail}
Office: ${cleanCity}, ${cleanState}
Specialization: Project Financing, CMA Preparation & Bank Audit
`.trim();

  return {
    name: cleanName,
    firmName: cleanFirm,
    email: cleanEmail,
    phone: cleanPhone,
    membershipNumber: cleanMbr,
    city: cleanCity,
    state: cleanState,
    ocrRawText: rawText,
    confidenceScore: 94.8,
  };
};

/**
 * Duplicate check for email, phone, or registration number (membershipNumber)
 */
export const checkDuplicateCa = async ({ email, phone, membershipNumber, excludeId = null }) => {
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanPhone = (phone || '').replace(/[\s-]/g, '').trim();
  const cleanReg = (membershipNumber || '').trim().toLowerCase();

  // 1. Check in MongoDB if connected
  if (isDBConnected()) {
    try {
      const orConditions = [];
      if (cleanEmail) orConditions.push({ email: cleanEmail });
      if (cleanPhone.length >= 8) orConditions.push({ phone: { $regex: cleanPhone.slice(-10), $options: 'i' } });
      if (cleanReg) orConditions.push({ membershipNumber: { $regex: `^${cleanReg}$`, $options: 'i' } });

      if (orConditions.length > 0) {
        const query = { $or: orConditions };
        if (excludeId) query._id = { $ne: excludeId };

        const existingInDb = await CaProfile.findOne(query);
        if (existingInDb) {
          let field = 'email';
          if (cleanReg && existingInDb.membershipNumber && existingInDb.membershipNumber.toLowerCase() === cleanReg) {
            field = 'registration number';
          } else if (cleanPhone && existingInDb.phone && existingInDb.phone.replace(/[\s-]/g, '').endsWith(cleanPhone.slice(-8))) {
            field = 'phone';
          }
          return {
            duplicate: true,
            field,
            existingProfile: existingInDb,
          };
        }
      }

      // Check User accounts by email
      if (cleanEmail) {
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
          return {
            duplicate: true,
            field: 'email (Active Inisio User Account)',
            existingProfile: { name: existingUser.name, email: existingUser.email, role: existingUser.role },
          };
        }
      }
    } catch (e) {
      console.warn('MongoDB duplicate check error:', e.message);
    }
  }

  // 2. Check in memory
  const existingInMem = memoryCaProfiles.find((p) => {
    if (excludeId && String(p._id) === String(excludeId)) return false;
    const pEmail = (p.email || '').toLowerCase().trim();
    const pPhone = (p.phone || '').replace(/[\s-]/g, '').trim();
    const pReg = (p.membershipNumber || '').trim().toLowerCase();

    if (cleanEmail && pEmail === cleanEmail) return true;
    if (cleanPhone.length >= 8 && pPhone.endsWith(cleanPhone.slice(-8))) return true;
    if (cleanReg && pReg === cleanReg) return true;
    return false;
  });

  if (existingInMem) {
    let field = 'email';
    const pReg = (existingInMem.membershipNumber || '').trim().toLowerCase();
    if (cleanReg && pReg === cleanReg) {
      field = 'registration number';
    } else if (cleanPhone && (existingInMem.phone || '').replace(/[\s-]/g, '').endsWith(cleanPhone.slice(-8))) {
      field = 'phone';
    }
    return {
      duplicate: true,
      field,
      existingProfile: existingInMem,
    };
  }

  return { duplicate: false };
};

/**
 * Step 3: Create Pending Profile
 */
export const createPendingCaProfile = async (profileData) => {
  const cleanEmail = (profileData.email || '').toLowerCase().trim();
  const cleanPhone = (profileData.phone || '').trim();
  const sourceTag = (profileData.sourceTag || 'WOFA-2026').trim().toUpperCase();

  // Duplicate verification
  const dupCheck = await checkDuplicateCa({ email: cleanEmail, phone: cleanPhone });
  if (dupCheck.duplicate) {
    const error = new Error(`A profile with this ${dupCheck.field} is already registered in the system.`);
    error.statusCode = 409;
    error.duplicateDetails = dupCheck.existingProfile;
    throw error;
  }

  const claimToken = `clm_${crypto.randomBytes(16).toString('hex')}`;
  const claimExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry

  const newRecord = {
    name: profileData.name || 'Chartered Accountant',
    email: cleanEmail,
    phone: cleanPhone,
    firmName: profileData.firmName || 'Independent CA Practice',
    membershipNumber: profileData.membershipNumber || '',
    city: profileData.city || '',
    state: profileData.state || '',
    cardImageUrl: profileData.cardImageUrl || '',
    ocrRawText: profileData.ocrRawText || '',
    sourceTag: sourceTag,
    status: 'pending',
    claimToken,
    claimExpiresAt,
    notes: profileData.notes || '',
    createdAt: new Date(),
  };

  if (isDBConnected()) {
    try {
      const created = await CaProfile.create(newRecord);
      return created;
    } catch (e) {
      console.warn('MongoDB error creating CaProfile:', e.message);
    }
  }

  const memoryRecord = {
    ...newRecord,
    _id: `caprof_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  };
  memoryCaProfiles.unshift(memoryRecord);
  return memoryRecord;
};

/**
 * Fetch Profiles with source tag and status filtering
 */
export const getCaProfiles = async ({ sourceTag, status, search }) => {
  if (isDBConnected()) {
    try {
      const filter = {};
      if (sourceTag && sourceTag !== 'ALL') {
        filter.sourceTag = new RegExp(`^${sourceTag.trim()}$`, 'i');
      }
      if (status && status !== 'ALL') {
        filter.status = status.trim().toLowerCase();
      }
      if (search) {
        const s = search.trim();
        filter.$or = [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { firmName: { $regex: s, $options: 'i' } },
          { city: { $regex: s, $options: 'i' } },
          { sourceTag: { $regex: s, $options: 'i' } },
        ];
      }
      return await CaProfile.find(filter).sort({ createdAt: -1 });
    } catch (e) {
      console.warn('MongoDB error in getCaProfiles:', e.message);
    }
  }

  // Fallback to memory
  return memoryCaProfiles.filter((p) => {
    if (sourceTag && sourceTag !== 'ALL' && (p.sourceTag || '').toUpperCase() !== sourceTag.toUpperCase()) {
      return false;
    }
    if (status && status !== 'ALL' && (p.status || '').toLowerCase() !== status.toLowerCase()) {
      return false;
    }
    if (search) {
      const s = search.toLowerCase();
      const match =
        (p.name || '').toLowerCase().includes(s) ||
        (p.email || '').toLowerCase().includes(s) ||
        (p.firmName || '').toLowerCase().includes(s) ||
        (p.city || '').toLowerCase().includes(s) ||
        (p.sourceTag || '').toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });
};

/**
 * Step 4: Send Claim Invitation
 */
export const dispatchClaimInvitation = async (profileId, clientOrigin = '') => {
  let profile = null;

  if (isDBConnected()) {
    try {
      profile = await CaProfile.findById(profileId);
    } catch (e) {
      console.warn('DB error fetching profile for claim:', e.message);
    }
  }

  if (!profile) {
    profile = memoryCaProfiles.find((p) => String(p._id) === String(profileId));
  }

  if (!profile) {
    const error = new Error('CA Profile not found');
    error.statusCode = 404;
    throw error;
  }

  // Generate a fresh unique token valid for 7 days
  const token = `clm_${crypto.randomBytes(16).toString('hex')}`;
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  profile.claimToken = token;
  profile.claimExpiresAt = expiry;
  profile.status = profile.status === 'activated' ? 'activated' : 'invited';

  if (profile.save) {
    await profile.save();
  }

  const baseUrl = (clientOrigin || process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const claimUrl = `${baseUrl}/?action=activate-ca&token=${token}`;

  const emailPayload = renderClaimInvitationEmail({
    name: profile.name,
    firmName: profile.firmName,
    email: profile.email,
    claimUrl,
    expiryDays: 7,
    sourceTag: profile.sourceTag,
  });

  sendEmail(
    {
      to: profile.email,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    },
    { type: 'ca_claim_invitation' }
  ).catch((e) => console.warn('[Claim Email] Dispatch log notice:', e.message));

  return {
    success: true,
    message: `Claim invitation dispatched to ${profile.email}`,
    claimUrl,
    claimToken: token,
    expiresAt: expiry,
  };
};

/**
 * Step 5: Verify Claim Token
 */
export const verifyClaimToken = async (token) => {
  if (!token) {
    const error = new Error('Claim token is required');
    error.statusCode = 400;
    throw error;
  }

  let profile = null;
  if (isDBConnected()) {
    try {
      profile = await CaProfile.findOne({ claimToken: token });
    } catch (e) {
      console.warn('DB error in verifyClaimToken:', e.message);
    }
  }

  if (!profile) {
    profile = memoryCaProfiles.find((p) => p.claimToken === token);
  }

  if (!profile) {
    const error = new Error('Invalid claim link. The invitation token was not found.');
    error.statusCode = 404;
    throw error;
  }

  if (profile.claimExpiresAt && new Date() > new Date(profile.claimExpiresAt)) {
    const error = new Error('This claim invitation has expired. Please contact the administrator for a fresh invitation.');
    error.statusCode = 410;
    throw error;
  }

  return {
    valid: true,
    profile: {
      id: profile._id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      firmName: profile.firmName,
      membershipNumber: profile.membershipNumber,
      city: profile.city,
      state: profile.state,
      sourceTag: profile.sourceTag,
      status: profile.status,
    },
  };
};

/**
 * Step 5: Activate CA Profile & Provision User
 */
export const activateCaProfile = async ({ token, password, name, phone, firmName, city, state }) => {
  if (!token) {
    const error = new Error('Claim token is required');
    error.statusCode = 400;
    throw error;
  }
  if (!password || password.length < 6) {
    const error = new Error('Password must be at least 6 characters');
    error.statusCode = 400;
    throw error;
  }

  const { profile: verifiedInfo } = await verifyClaimToken(token);

  let profile = null;
  if (isDBConnected()) {
    try {
      profile = await CaProfile.findById(verifiedInfo.id);
    } catch (e) {}
  }
  if (!profile) {
    profile = memoryCaProfiles.find((p) => String(p._id) === String(verifiedInfo.id));
  }

  if (!profile) {
    const error = new Error('Profile not found for activation');
    error.statusCode = 404;
    throw error;
  }

  // Update profile details
  if (name) profile.name = name;
  if (phone) profile.phone = phone;
  if (firmName) profile.firmName = firmName;
  if (city) profile.city = city;
  if (state) profile.state = state;
  profile.status = 'activated';
  profile.activatedAt = new Date();
  profile.claimedAt = profile.claimedAt || new Date();

  // Create or activate User in database / memory
  const cleanEmail = profile.email.toLowerCase().trim();
  let createdUser = null;

  if (isDBConnected()) {
    try {
      let dbUser = await User.findOne({ email: cleanEmail });
      if (!dbUser) {
        dbUser = await User.create({
          name: profile.name,
          email: cleanEmail,
          password: password, // Mongoose hashes via pre-save hook
          role: 'ca',
          company: profile.firmName,
          phone: profile.phone,
          isVerified: true,
        });
      } else {
        dbUser.role = 'ca';
        dbUser.isVerified = true;
        dbUser.password = password;
        if (profile.name) dbUser.name = profile.name;
        if (profile.firmName) dbUser.company = profile.firmName;
        await dbUser.save();
      }
      profile.userId = dbUser._id;
      await profile.save();
      createdUser = dbUser;
    } catch (e) {
      console.warn('DB error activating User in activateCaProfile:', e.message);
    }
  }

  // Also maintain in memory store
  let memUser = findMemoryUserByEmail(cleanEmail);
  const hashedPassword = await bcrypt.hash(password, 10);
  if (!memUser) {
    memUser = {
      _id: `user_${Date.now()}`,
      name: profile.name,
      email: cleanEmail,
      password: hashedPassword,
      role: 'ca',
      company: profile.firmName,
      phone: profile.phone,
      isVerified: true,
      createdAt: new Date(),
    };
    addMemoryUser(memUser);
  } else {
    memUser.role = 'ca';
    memUser.isVerified = true;
    memUser.password = hashedPassword;
    if (profile.name) memUser.name = profile.name;
  }

  // Dispatch activation confirmation email via Resend
  const confirmation = renderActivationConfirmationEmail({
    name: profile.name,
    firmName: profile.firmName,
    email: profile.email,
    loginUrl: `${(process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')}/#ca-login`,
    sourceTag: profile.sourceTag,
  });

  sendEmail(
    {
      to: profile.email,
      subject: confirmation.subject,
      text: confirmation.text,
      html: confirmation.html,
    },
    { type: 'ca_activation_confirmation' }
  ).catch(() => {});

  return {
    success: true,
    message: 'Profile activated successfully! Your CA Audit Desk is now fully enabled.',
    profile: {
      id: profile._id,
      name: profile.name,
      email: profile.email,
      role: 'ca',
      status: 'activated',
    },
  };
};

/**
 * Reporting: Grouped counts of pending, claimed, and activated profiles grouped by source tag
 */
export const getProfileReportsBySourceTag = async () => {
  let allProfiles = [];

  if (isDBConnected()) {
    try {
      allProfiles = await CaProfile.find({}).lean();
    } catch (e) {
      console.warn('DB error in getProfileReportsBySourceTag:', e.message);
    }
  }

  if (allProfiles.length === 0) {
    allProfiles = memoryCaProfiles;
  }

  const grouped = {};

  for (const p of allProfiles) {
    const tag = (p.sourceTag || 'UNTAGGED').toUpperCase();
    if (!grouped[tag]) {
      grouped[tag] = {
        sourceTag: tag,
        total: 0,
        pending: 0,
        invited: 0,
        claimed: 0,
        activated: 0,
        conversionRate: 0,
      };
    }
    grouped[tag].total += 1;
    const st = (p.status || '').toLowerCase();
    if (st === 'pending') grouped[tag].pending += 1;
    else if (st === 'invited' || st === 'claimed') {
      grouped[tag].invited += 1;
      grouped[tag].claimed += 1;
    } else if (st === 'activated') grouped[tag].activated += 1;
  }

  // Calculate conversion rates
  const reportList = Object.values(grouped).map((item) => ({
    ...item,
    conversionRate: item.total > 0 ? Number(((item.activated / item.total) * 100).toFixed(1)) : 0,
  }));

  const totals = {
    totalProfiles: allProfiles.length,
    pending: allProfiles.filter((p) => (p.status || '').toLowerCase() === 'pending').length,
    invited: allProfiles.filter((p) => {
      const st = (p.status || '').toLowerCase();
      return st === 'invited' || st === 'claimed';
    }).length,
    claimed: allProfiles.filter((p) => {
      const st = (p.status || '').toLowerCase();
      return st === 'invited' || st === 'claimed';
    }).length,
    activated: allProfiles.filter((p) => (p.status || '').toLowerCase() === 'activated').length,
  };

  return {
    totals,
    bySourceTag: reportList,
  };
};

export default {
  mockOcrExtractFromCard,
  checkDuplicateCa,
  createPendingCaProfile,
  getCaProfiles,
  dispatchClaimInvitation,
  verifyClaimToken,
  activateCaProfile,
  getProfileReportsBySourceTag,
};
