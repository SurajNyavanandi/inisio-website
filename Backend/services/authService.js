import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
} from '../utils/generateToken.js';
import { isDBConnected } from '../config/db.js';
import config from '../config/env.js';
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
} from '../utils/emailService.js';
import { captureLoginMetadata } from '../utils/geoIpService.js';
import {
  memoryUsers,
  getMemoryUsers,
  findMemoryUserByEmail,
  findMemoryUserById,
  addMemoryUser,
  getAdminEmail1,
  getAdminEmail2,
  getCaAdminEmail,
  getAuthorizedAdminEmails,
  isAuthorizedAdminEmail,
  isValidGmail,
  isAuthorizedAdminGmail,
  isAuthorizedCaAdminGmail,
} from '../utils/memoryUserStore.js';
import { generateOtp, hashOtpCode, verifyOtpCode } from '../utils/otpService.js';
import { maskEmail } from '../utils/privacyMask.js';
import bcrypt from 'bcryptjs';

const generateUnusableRandomPassword = () => crypto.randomBytes(24).toString('hex');

const hashPasswordDirect = async (plainPassword) =>
  bcrypt.hash(String(plainPassword), config.BCRYPT_ROUNDS || 12);

const issueSessionPair = async (userObj) => {
  const tokenVersion = Number(userObj?.tokenVersion || 0);
  const accessPayload = {
    id: userObj._id,
    email: userObj.email,
    role: userObj.role || 'user',
    name: userObj.name || String(userObj.email || '').split('@')[0],
    company: userObj.company || '',
    phone: userObj.phone || '',
    tokenVersion,
    isVerified: Boolean(userObj.isVerified ?? true),
  };
  const token = generateToken(accessPayload);
  const refreshToken = generateRefreshToken({
    id: userObj._id,
    email: userObj.email,
    tokenVersion,
  });
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const existingList = Array.isArray(userObj.refreshTokens) ? userObj.refreshTokens : [];
  const pruned = existingList.filter((entry) => entry?.expiresAt && new Date(entry.expiresAt) > now).slice(-4);
  pruned.push({ tokenHash, expiresAt, createdAt: now });
  userObj.refreshTokens = pruned;

  if (typeof userObj.save === 'function') {
    await userObj.save().catch(() => {});
  }

  return { token, refreshToken };
};

const assertCriticalEmailDelivered = (mailResult, fallbackMessage) => {
  if (mailResult?.configured && !mailResult.success) {
    const rawErr = String(mailResult.error || '');
    const detailedError = rawErr.toLowerCase().includes('not verified')
      ? `Email sending is waiting for Resend DNS verification on your domain (${rawErr}). Please verify the DNS records at resend.com/domains and try again.`
      : rawErr.includes('EMAIL_FROM')
      ? rawErr
      : fallbackMessage || 'We could not send the email right now. Please try again shortly.';
    const error = new Error(detailedError);
    error.statusCode = 502;
    throw error;
  }
};

/**
 * Record login metadata (date, time, location, IP, device, browser) linked to user
 */
const recordSuccessfulLogin = async (userObj, req) => {
  try {
    const meta = await captureLoginMetadata(req);
    if (userObj) {
      if (typeof userObj.save === 'function') {
        // Mongoose document
        userObj.lastLogin = meta;
        userObj.loginCount = (userObj.loginCount || 0) + 1;
        await userObj.save();
      } else {
        // In-memory user object
        userObj.lastLogin = meta;
        userObj.loginCount = (userObj.loginCount || 0) + 1;
        userObj.lastLoginAt = meta.timestamp;
      }
    }
    return meta;
  } catch (err) {
    console.warn('[recordSuccessfulLogin] Error recording login audit metadata:', err.message);
    return null;
  }
};

const shouldAllowMemoryFallback = () => {
  return !isDBConnected() && Boolean(config.ALLOW_MEMORY_FALLBACK);
};

/**
 * Sync memory users to MongoDB to ensure preloaded demo & registered users exist in DB
 * Skipped in production unless SEED_DEMO_USERS=true is explicitly set
 */
export const syncMemoryUsersToDB = async () => {
  if (!isDBConnected() || (config.isProduction && process.env.SEED_DEMO_USERS !== 'true')) return;
  try {
    const authorizedList = getAuthorizedAdminEmails();
    const admin1 = getAdminEmail1();
    const admin2 = getAdminEmail2();
    const caAdmin = getCaAdminEmail();

    // 1. Sanitize any legacy accounts so only the authorized emails have admin privileges
    await User.updateMany(
      { email: { $nin: [...authorizedList, caAdmin] }, role: { $in: ['admin', 'superadmin', 'ca_admin', 'admin1', 'admin2', 'admin3'] } },
      { $set: { role: 'user' } }
    );

    const usersToSync = getMemoryUsers();
    for (const memUser of usersToSync) {
      const cleanEmail = memUser.email.toLowerCase().trim();
      const existing = await User.findOne({ email: cleanEmail });
      if (!existing) {
        await User.create({
          name: memUser.name,
          email: cleanEmail,
          password: generateUnusableRandomPassword(),
          passwordInitialized: false,
          role: memUser.role || 'user',
          company: memUser.company || '',
          phone: memUser.phone || '',
          isVerified: true,
        });
        console.log(`[AuthService] Seeded user ${cleanEmail} (${memUser.role}) into MongoDB.`);
      } else {
        // Ensure proper role is strictly set for the authorized emails
        let needsSave = false;
        if (cleanEmail === admin2 && existing.role !== 'superadmin') {
          existing.role = 'superadmin';
          needsSave = true;
        } else if (cleanEmail === admin1 && existing.role !== 'admin') {
          existing.role = 'admin';
          needsSave = true;
        } else if (cleanEmail === caAdmin && existing.role !== 'ca_admin') {
          existing.role = 'ca_admin';
          needsSave = true;
        }
        if (needsSave) {
          await existing.save();
        }
      }
    }
  } catch (err) {
    console.warn('[AuthService] Auto-sync to DB warning:', err.message);
  }
};

// Startup auto-sync removed for production readiness. Run seed scripts explicitly if needed.

/**
 * Register a new user and dispatch email verification OTP via Nodemailer
 */
export const registerUser = async ({ name, email, password, role = 'user', company = '', phone = '' }) => {
  if (!email || !email.includes('@')) {
    const error = new Error('Please provide a valid email address');
    error.statusCode = 400;
    throw error;
  }
  if (!password || password.length < 8) {
    const error = new Error('Password must be at least 8 characters');
    error.statusCode = 400;
    throw error;
  }
  const cleanEmail = email.toLowerCase().trim();

  // Strict role isolation: reserved admin emails cannot self-register as standard portal users
  if (isAuthorizedAdminGmail(cleanEmail) || isAuthorizedCaAdminGmail(cleanEmail)) {
    const error = new Error('This Gmail address is reserved for administrative access. Please sign in via the Admin Portal.');
    error.statusCode = 400;
    throw error;
  }

  // Public self-registration only permits standard non-admin portal roles (default 'user')
  const allowedSelfRegisterRoles = ['user', 'ca', 'dpr_consultant', 'prosync'];
  const requestedRole = String(role || 'user').toLowerCase().trim();
  const assignedRole = allowedSelfRegisterRoles.includes(requestedRole) ? requestedRole : 'user';

  const defaultCompany = company || (
    assignedRole === 'ca'
      ? 'Chartered Accountancy Firm'
      : assignedRole === 'ca_admin'
      ? 'Inisio CA Network Administration'
      : assignedRole === 'superadmin'
      ? 'Inisio Executive Board'
      : assignedRole === 'admin'
      ? 'Inisio HQ Operations'
      : assignedRole === 'prosync' || assignedRole === 'prosync_admin'
      ? 'Prosync Advisory'
      : assignedRole === 'dpr_consultant'
      ? 'DPR Consultancy'
      : 'Enterprise Ltd'
  );

  const otp = generateOtp();
  const otpHash = hashOtpCode(otp);
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

  if (isDBConnected()) {
    try {
      const userExists = await User.findOne({ email: cleanEmail });
      if (userExists) {
        if (!userExists.isVerified) {
          userExists.verificationOtp = otpHash;
          userExists.verificationExpires = otpExpiry;
          userExists.otpAttempts = 0;
          if (password && password.length >= 8) {
            userExists.password = password; // Mongoose will hash via pre-save (>= 12 rounds)
          }
          if (name) userExists.name = name;
          if (phone) userExists.phone = phone;
          if (company) userExists.company = company;
          await userExists.save();

          const mailResult = await sendVerificationEmail({
            to: cleanEmail,
            name: userExists.name,
            otp,
          });
          assertCriticalEmailDelivered(
            mailResult,
            'We could not send your verification code right now. Please try again in a moment.'
          );

          return {
            _id: userExists._id,
            name: userExists.name,
            email: userExists.email,
            role: userExists.role,
            company: userExists.company,
            phone: userExists.phone,
            isVerified: false,
            requiresVerification: true,
            maskedEmail: maskEmail(cleanEmail),
            message: `A 6-digit verification code has been sent to ${maskEmail(cleanEmail)}. Please enter it to activate your account.`,
          };
        }

        const error = new Error(`An account with ${cleanEmail} is already registered. Please click 'Sign In' or 'Forgot Password?' to access your account.`);
        error.statusCode = 400;
        throw error;
      }

      const user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
        role: assignedRole,
        company: defaultCompany,
        phone: phone || '',
        isVerified: false,
        verificationOtp: otpHash,
        verificationExpires: otpExpiry,
        otpAttempts: 0,
      });

      // Dispatch 6-digit verification OTP email via Resend
      const mailResult = await sendVerificationEmail({
        to: cleanEmail,
        name: user.name,
        otp,
      });
      assertCriticalEmailDelivered(
        mailResult,
        'Your account was created, but we could not send the verification email right now. Please click Resend Code or try again shortly.'
      );

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isVerified: false,
        requiresVerification: true,
        maskedEmail: maskEmail(cleanEmail),
        message: `A 6-digit verification code has been sent to ${maskEmail(cleanEmail)}. Please enter it to activate your account.`,
      };
    } catch (err) {
      if (err.statusCode || err.message.includes('already') || err.message.includes('valid') || err.message.includes('Password')) {
        throw err;
      }
      console.warn('MongoDB error in registerUser, fallback to memory store:', err.message);
    }
  }

  if (!shouldAllowMemoryFallback()) {
    const error = new Error('Database connection is unavailable. Please try again in a few moments or contact support.');
    error.statusCode = 503;
    throw error;
  }

  // Memory fallback when DB is offline or for memory users
  const userExists = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (userExists) {
    if (!userExists.isVerified) {
      userExists.verificationOtp = otpHash;
      userExists.verificationExpires = otpExpiry;
      userExists.otpAttempts = 0;
      userExists.password = await hashPasswordDirect(password);
      if (name) userExists.name = name;
      if (phone) userExists.phone = phone;

      const mailResult = await sendVerificationEmail({
        to: cleanEmail,
        name: userExists.name,
        otp,
      });
      assertCriticalEmailDelivered(
        mailResult,
        'We could not send your verification code right now. Please try again in a moment.'
      );

      return {
        _id: userExists._id,
        name: userExists.name,
        email: userExists.email,
        role: userExists.role,
        company: userExists.company,
        phone: userExists.phone,
        avatarUrl: userExists.avatarUrl,
        isVerified: false,
        requiresVerification: true,
        maskedEmail: maskEmail(cleanEmail),
        message: `Account is pending verification. A fresh 6-digit code has been sent to ${maskEmail(cleanEmail)}.`,
      };
    }

    const error = new Error(`An account with ${cleanEmail} is already registered. Please click 'Sign In' or 'Forgot Password?' to access your account.`);
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await hashPasswordDirect(password);
  const newUser = {
    _id: `user_${Date.now()}`,
    name: name || cleanEmail.split('@')[0],
    email: cleanEmail,
    password: hashedPassword,
    role: assignedRole,
    company: defaultCompany,
    phone: phone || '',
    isVerified: false,
    verificationOtp: otpHash,
    verificationExpires: otpExpiry,
    otpAttempts: 0,
    tokenVersion: 0,
    refreshTokens: [],
    createdAt: new Date(),
  };
  memoryUsers.push(newUser);

  const mailResult = await sendVerificationEmail({
    to: cleanEmail,
    name: newUser.name,
    otp,
  });
  assertCriticalEmailDelivered(
    mailResult,
    'We could not send your verification code right now. Please try again shortly.'
  );

  const maskedEmail = maskEmail(cleanEmail);
  const feedbackMessage = `Account created! A 6-digit verification code has been sent to ${maskedEmail}. Please enter it to activate your account.`;

  return {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    maskedEmail,
    role: newUser.role,
    company: newUser.company,
    phone: newUser.phone,
    avatarUrl: newUser.avatarUrl,
    isVerified: false,
    requiresVerification: true,
    message: feedbackMessage,
  };
};

/**
 * Verify Email with 6-Digit OTP Code
 */
export const verifyEmailOtp = async ({ email, otp, req }) => {
  if (!email || !otp) {
    const error = new Error('Email and 6-digit OTP verification code are required');
    error.statusCode = 400;
    throw error;
  }
  const cleanEmail = email.toLowerCase().trim();
  const cleanOtp = String(otp).trim();

  if (isDBConnected()) {
    try {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        const error = new Error('User not found with this email address. Please register a new account.');
        error.statusCode = 404;
        throw error;
      }

      if (user.isVerified) {
        await recordSuccessfulLogin(user, req);
        const { token, refreshToken } = await issueSessionPair(user);
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          isVerified: true,
          token,
          refreshToken,
          message: 'Account is already verified. Logged in successfully.',
        };
      }

      if (!verifyOtpCode(user.verificationOtp, cleanOtp)) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        if (user.otpAttempts >= 5) {
          user.verificationOtp = null;
          user.verificationExpires = null;
          user.otpAttempts = 0;
          await user.save().catch(() => {});
          const error = new Error('Too many incorrect verification attempts. Code has been invalidated. Please click Resend Code.');
          error.statusCode = 429;
          throw error;
        }
        await user.save().catch(() => {});
        const error = new Error(`Invalid verification code. ${5 - user.otpAttempts} attempts remaining.`);
        error.statusCode = 400;
        throw error;
      }

      if (user.verificationExpires && new Date() > new Date(user.verificationExpires)) {
        const error = new Error('Verification code has expired. Please click Resend Code for a fresh code.');
        error.statusCode = 400;
        throw error;
      }

      user.isVerified = true;
      user.verificationOtp = null;
      user.verificationExpires = null;
      user.otpAttempts = 0;
      await recordSuccessfulLogin(user, req);

      // Non-blocking welcome email confirming account activation
      sendWelcomeEmail({ to: user.email, name: user.name }).catch(() => {});

      const { token, refreshToken } = await issueSessionPair(user);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isVerified: true,
        token,
        refreshToken,
        message: 'Email successfully verified! Welcome to Inisio.',
      };
    } catch (err) {
      if (err.statusCode || err.message.includes('Invalid') || err.message.includes('expired') || err.message.includes('not found') || err.message.includes('register')) {
        throw err;
      }
      console.warn('MongoDB error in verifyEmailOtp, checking memory store:', err.message);
    }
  }

  if (!shouldAllowMemoryFallback()) {
    const error = new Error('Database connection is unavailable.');
    error.statusCode = 503;
    throw error;
  }

  // In-memory verification fallback
  const user = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    const error = new Error('User not found with this email address. Please register a new account.');
    error.statusCode = 404;
    throw error;
  }

  if (user.isVerified) {
    await recordSuccessfulLogin(user, req);
    const { token, refreshToken } = await issueSessionPair(user);
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: true,
      token,
      refreshToken,
      message: 'Account is already verified. Logged in successfully.',
    };
  }

  if (!verifyOtpCode(user.verificationOtp, cleanOtp)) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    if (user.otpAttempts >= 5) {
      user.verificationOtp = null;
      user.verificationExpires = null;
      user.otpAttempts = 0;
      const error = new Error('Too many incorrect verification attempts. Code has been invalidated. Please click Resend Code.');
      error.statusCode = 429;
      throw error;
    }
    const error = new Error(`Invalid verification code. ${5 - user.otpAttempts} attempts remaining.`);
    error.statusCode = 400;
    throw error;
  }

  if (user.verificationExpires && new Date() > new Date(user.verificationExpires)) {
    const error = new Error('Verification code has expired. Please click Resend Code for a fresh code.');
    error.statusCode = 400;
    throw error;
  }

  user.isVerified = true;
  user.verificationOtp = null;
  user.verificationExpires = null;
  user.otpAttempts = 0;
  await recordSuccessfulLogin(user, req);

  // Non-blocking welcome email confirming account activation
  sendWelcomeEmail({ to: user.email, name: user.name }).catch(() => {});

  const { token, refreshToken } = await issueSessionPair(user);

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isVerified: true,
    token,
    refreshToken,
    message: 'Email successfully verified! Welcome to Inisio.',
  };
};

/**
 * Resend Email Verification Code via Nodemailer
 */
export const sendVerificationOtp = async (email) => {
  if (!email) {
    const error = new Error('Please provide an email address');
    error.statusCode = 400;
    throw error;
  }
  const cleanEmail = email.toLowerCase().trim();
  const otp = generateOtp();
  const otpHash = hashOtpCode(otp);
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

  let userName = cleanEmail.split('@')[0];
  let foundUser = false;

  if (isDBConnected()) {
    try {
      const user = await User.findOne({ email: cleanEmail });
      if (user) {
        foundUser = true;
        userName = user.name || userName;
        user.verificationOtp = otpHash;
        user.verificationExpires = otpExpiry;
        user.otpAttempts = 0;
        await user.save();
      }
    } catch (err) {
      console.warn('DB error in sendVerificationOtp:', err.message);
    }
  }

  if (!foundUser && shouldAllowMemoryFallback()) {
    const memUser = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (memUser) {
      foundUser = true;
      memUser.verificationOtp = otpHash;
      memUser.verificationExpires = otpExpiry;
      memUser.otpAttempts = 0;
      userName = memUser.name || userName;
    }
  }

  if (!foundUser) {
    const error = new Error('No registered account found with this email address. Please create an account.');
    error.statusCode = 404;
    throw error;
  }

  const mailResult = await sendVerificationEmail({
    to: cleanEmail,
    name: userName,
    otp,
  });
  assertCriticalEmailDelivered(
    mailResult,
    'We could not send a verification email right now. Please try again in a moment.'
  );

  const maskedEmail = maskEmail(cleanEmail);
  return {
    email: cleanEmail,
    maskedEmail,
    message: `A new 6-digit verification code has been sent to ${maskedEmail}.`,
    expiresIn: '15 minutes',
  };
};

/**
 * Login user strictly from database and ensure email is verified
 */
export const loginUser = async ({ email, password, req }) => {
  if (!email) {
    const error = new Error('Please provide an email address');
    error.statusCode = 400;
    throw error;
  }
  if (!password) {
    const error = new Error('Please provide your password');
    error.statusCode = 400;
    throw error;
  }
  const cleanEmail = email.toLowerCase().trim();
  const admin1 = getAdminEmail1();
  const admin2 = getAdminEmail2();
  const caAdmin = getCaAdminEmail();
  const isCaAdmin = cleanEmail === caAdmin || cleanEmail === 'ca.admin@example.com' || cleanEmail === 'caadmin@example.com';
  const isAdminEmail = isAuthorizedAdminEmail(cleanEmail) || isCaAdmin;
  const adminRole = isCaAdmin ? 'ca_admin' : cleanEmail === admin2 ? 'superadmin' : 'admin';

  // 1. Database-backed authentication
  if (isDBConnected()) {
    try {
      const user = await User.findOne({ email: cleanEmail }).select('+password +refreshTokens');

      if (user) {
        if (user.passwordInitialized === false) {
          const error = new Error(`No password has been set for ${cleanEmail} yet. Please click 'Forgot Password?' to receive a 6-digit code via email and set your password.`);
          error.statusCode = 401;
          throw error;
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
          const error = new Error(`Incorrect password for ${cleanEmail}. If you forgot your password, please click 'Forgot Password?' to reset it.`);
          error.statusCode = 401;
          throw error;
        }

        if (isAdminEmail && user.role !== adminRole) {
          user.role = adminRole;
        } else if (!isAdminEmail && ['admin', 'superadmin', 'ca_admin'].includes(user.role)) {
          user.role = 'user';
        }

        if (user.isVerified === false && !isAdminEmail) {
          const freshOtp = generateOtp();
          user.verificationOtp = hashOtpCode(freshOtp);
          user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
          user.otpAttempts = 0;
          await user.save();

          const mailResult = await sendVerificationEmail({
            to: cleanEmail,
            name: user.name,
            otp: freshOtp,
          });
          assertCriticalEmailDelivered(
            mailResult,
            'Your email is not verified yet and we could not send a fresh verification code right now. Please try again shortly.'
          );

          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            company: user.company,
            phone: user.phone,
            isVerified: false,
            requiresVerification: true,
            maskedEmail: maskEmail(cleanEmail),
            message: `Please verify your email first. We sent a fresh 6-digit code to ${maskEmail(cleanEmail)}.`,
          };
        }

        if (!user.isVerified) {
          user.isVerified = true;
          user.verificationOtp = null;
          user.verificationExpires = null;
        }

        await recordSuccessfulLogin(user, req);
        const { token, refreshToken } = await issueSessionPair(user);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          isVerified: true,
          token,
          refreshToken,
          message: 'Login successful',
        };
      }
    } catch (err) {
      if (err.statusCode || err.message.includes('password') || err.message.includes('Password')) {
        throw err;
      }
      console.warn('MongoDB error in loginUser, checking memory fallback:', err.message);
    }
  }

  // 2. Memory store fallback (only when explicitly allowed for local development)
  if (!shouldAllowMemoryFallback()) {
    const error = new Error(`No account found with ${cleanEmail}. Please click 'Create Account' to sign up.`);
    error.statusCode = 404;
    throw error;
  }

  let user = findMemoryUserByEmail(cleanEmail);
  if (!user && (isAdminEmail || isCaAdmin)) {
    const error = new Error(`No password has been set for ${cleanEmail} yet. Please click 'Forgot Password?' to receive a 6-digit code via email and set your password.`);
    error.statusCode = 401;
    throw error;
  }

  if (!user) {
    const error = new Error(`No account found with ${cleanEmail}. Please click 'Create Account' to sign up.`);
    error.statusCode = 404;
    throw error;
  }

  if (user.passwordInitialized === false) {
    const error = new Error(`No password has been set for ${cleanEmail} yet. Please click 'Forgot Password?' to receive a 6-digit code via email and set your password.`);
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error(`Incorrect password for ${cleanEmail}. If you forgot your password, please click 'Forgot Password?' to reset it.`);
    error.statusCode = 401;
    throw error;
  }

  if (isAdminEmail) {
    user.role = adminRole;
  } else if (['admin', 'superadmin', 'ca_admin'].includes(user.role)) {
    user.role = 'user';
  }

  if (user.isVerified === false) {
    const freshOtp = generateOtp();
    user.verificationOtp = hashOtpCode(freshOtp);
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.otpAttempts = 0;

    const mailResult = await sendVerificationEmail({
      to: cleanEmail,
      name: user.name,
      otp: freshOtp,
    });
    assertCriticalEmailDelivered(
      mailResult,
      'Your email is not verified yet and we could not send a fresh verification code right now. Please try again shortly.'
    );

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      phone: user.phone,
      isVerified: false,
      requiresVerification: true,
      maskedEmail: maskEmail(cleanEmail),
      message: `Please verify your email first. We sent a fresh 6-digit code to ${maskEmail(cleanEmail)}.`,
    };
  }

  await recordSuccessfulLogin(user, req);
  const { token, refreshToken } = await issueSessionPair(user);

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isVerified: true,
    token,
    refreshToken,
    message: 'Login successful',
  };
};

/**
 * Get User Profile strictly by user ID
 */
export const getUserProfile = async (userId, fallbackUser = null) => {
  if (isDBConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        const user = await User.findById(userId).select('-password');
        if (user) return user;
      } else if (fallbackUser?.email) {
        const user = await User.findOne({ email: String(fallbackUser.email).toLowerCase().trim() }).select('-password');
        if (user) return user;
      }
    } catch (err) {
      console.warn('DB error in getUserProfile:', err.message);
    }
  }
  const found = findMemoryUserById(userId);
  if (found) {
    const { password, verificationOtp, resetPasswordOtp, ...safeUser } = found;
    return safeUser;
  }
  if (fallbackUser && String(fallbackUser._id || '') === String(userId)) {
    const { password, verificationOtp, resetPasswordOtp, ...safeFallback } = fallbackUser;
    return safeFallback;
  }
  const error = new Error('User not found');
  error.statusCode = 404;
  throw error;
};

/**
 * Update User Profile
 */
export const updateUserProfile = async (userId, updates) => {
  if (isDBConnected() && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      const user = await User.findById(userId);
      if (user) {
        if (updates.name) user.name = updates.name;
        if (updates.company) user.company = updates.company;
        if (updates.phone) user.phone = updates.phone;
        if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl;
        if (updates.password && updates.password.length >= 6) {
          user.password = updates.password; // Mongoose pre-save hook will hash it
        }

        const updated = await user.save();
        return {
          _id: updated._id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          company: updated.company,
          phone: updated.phone,
          avatarUrl: updated.avatarUrl,
          isVerified: updated.isVerified,
        };
      }
    } catch (err) {
      console.warn('DB error in updateUserProfile:', err.message);
    }
  }

  const idx = memoryUsers.findIndex((u) => String(u._id) === String(userId));
  if (idx === -1) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (updates.name) memoryUsers[idx].name = updates.name;
  if (updates.company) memoryUsers[idx].company = updates.company;
  if (updates.phone) memoryUsers[idx].phone = updates.phone;
  if (updates.avatarUrl) memoryUsers[idx].avatarUrl = updates.avatarUrl;
  if (updates.password && updates.password.length >= 6) {
    memoryUsers[idx].password = await bcrypt.hash(updates.password, 10);
  }

  const { password, verificationOtp, resetPasswordOtp, ...safeUser } = memoryUsers[idx];
  return safeUser;
};

/**
 * Forgot password - dispatches password reset link and OTP via Nodemailer
 */
export const forgotPassword = async (email, clientOrigin = '') => {
  if (!email) {
    const error = new Error('Please provide an email address');
    error.statusCode = 400;
    throw error;
  }
  const cleanEmail = email.toLowerCase().trim();
  const otp = generateOtp();
  const otpHash = hashOtpCode(otp);
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
  let userName = cleanEmail.split('@')[0];
  let foundUser = false;

  if (isDBConnected()) {
    try {
      const user = await User.findOne({
        email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (user) {
        foundUser = true;
        user.resetPasswordOtp = otpHash;
        user.resetPasswordExpires = otpExpiry;
        user.otpAttempts = 0;
        await user.save();
        userName = user.name || userName;
      }
    } catch (err) {
      console.warn('DB error in forgotPassword:', err.message);
    }
  }

  if (!foundUser && shouldAllowMemoryFallback()) {
    const memUser = memoryUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (memUser) {
      foundUser = true;
      memUser.resetPasswordOtp = otpHash;
      memUser.resetPasswordExpires = otpExpiry;
      memUser.otpAttempts = 0;
      userName = memUser.name || userName;

      if (isDBConnected()) {
        try {
          await User.create({
            name: memUser.name,
            email: cleanEmail,
            password: generateUnusableRandomPassword(),
            passwordInitialized: false,
            role: memUser.role || 'user',
            company: memUser.company || '',
            phone: memUser.phone || '',
            isVerified: true,
            resetPasswordOtp: otpHash,
            resetPasswordExpires: otpExpiry,
            otpAttempts: 0,
          });
        } catch (syncErr) {
          console.warn('Could not sync memory user to DB on forgotPassword:', syncErr.message);
        }
      }
    }
  }

  if (!foundUser && (isAuthorizedAdminGmail(cleanEmail) || isAuthorizedCaAdminGmail(cleanEmail))) {
    const isCaAdmin = isAuthorizedCaAdminGmail(cleanEmail);
    const isSuperAdmin = !isCaAdmin && cleanEmail === getAdminEmail2();
    const adminRole = isCaAdmin ? 'ca_admin' : isSuperAdmin ? 'superadmin' : 'admin';
    userName = isCaAdmin
      ? 'CA Operations Admin'
      : isSuperAdmin
        ? 'Executive Super Admin'
        : 'Inisio Operations Admin';

    if (isDBConnected()) {
      try {
        await User.create({
          name: userName,
          email: cleanEmail,
          password: generateUnusableRandomPassword(),
          passwordInitialized: false,
          role: adminRole,
          company: isCaAdmin
            ? 'Inisio CA Network Administration'
            : isSuperAdmin
              ? 'Inisio Executive Board'
              : 'Inisio HQ Operations',
          phone: isCaAdmin ? '+91 98765 43210' : '+91 63020 26462',
          isVerified: true,
          resetPasswordOtp: otpHash,
          resetPasswordExpires: otpExpiry,
          otpAttempts: 0,
        });
        foundUser = true;
      } catch (adminSyncErr) {
        console.warn('Could not create allowlisted admin record during forgotPassword:', adminSyncErr.message);
      }
    }

    if (!foundUser && shouldAllowMemoryFallback()) {
      addMemoryUser({
        _id: `user_${Date.now()}`,
        name: userName,
        email: cleanEmail,
        password: await hashPasswordDirect(generateUnusableRandomPassword()),
        passwordInitialized: false,
        role: adminRole,
        company: isCaAdmin
          ? 'Inisio CA Network Administration'
          : isSuperAdmin
            ? 'Inisio Executive Board'
            : 'Inisio HQ Operations',
        phone: isCaAdmin ? '+91 98765 43210' : '+91 63020 26462',
        isVerified: true,
        resetPasswordOtp: otpHash,
        resetPasswordExpires: otpExpiry,
        otpAttempts: 0,
        tokenVersion: 0,
        refreshTokens: [],
        createdAt: new Date(),
      });
      foundUser = true;
    }
  }

  if (!foundUser) {
    const error = new Error('No registered account found with this email address. Please click Create Account to sign up.');
    error.statusCode = 404;
    throw error;
  }

  const baseUrl = (clientOrigin || config.APP_URL || 'http://localhost:5000').replace(/\/$/, '');
  const resetLink = `${baseUrl}/?mode=reset-password&token=${encodeURIComponent(otp)}&email=${encodeURIComponent(cleanEmail)}`;

  const mailResult = await sendPasswordResetEmail({
    to: cleanEmail,
    name: userName,
    otp,
    resetLink,
  });
  assertCriticalEmailDelivered(
    mailResult,
    'We could not send the password reset email right now. Please try again in a moment.'
  );

  const maskedEmail = maskEmail(cleanEmail);
  return {
    message: `Password reset link and 6-digit code sent to ${maskedEmail}.`,
    email: cleanEmail,
    maskedEmail,
    expiresIn: '15 minutes',
  };
};

/**
 * Verify Password Reset OTP
 */
export const verifyResetOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    const error = new Error('Email and OTP verification code are required');
    error.statusCode = 400;
    throw error;
  }
  const cleanEmail = email.toLowerCase().trim();
  const cleanOtp = String(otp).trim();

  let valid = false;

  if (isDBConnected()) {
    try {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        const error = new Error('No registered account found with this email address.');
        error.statusCode = 404;
        throw error;
      }

      if (!verifyOtpCode(user.resetPasswordOtp, cleanOtp)) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        if (user.otpAttempts >= 5) {
          user.resetPasswordOtp = null;
          user.resetPasswordExpires = null;
          user.otpAttempts = 0;
          await user.save().catch(() => {});
          const error = new Error('Too many incorrect OTP attempts. Code has been invalidated. Please request a new password reset.');
          error.statusCode = 429;
          throw error;
        }
        await user.save().catch(() => {});
        const error = new Error(`Invalid OTP code. ${5 - user.otpAttempts} attempts remaining.`);
        error.statusCode = 400;
        throw error;
      }

      if (user.resetPasswordExpires && new Date() > new Date(user.resetPasswordExpires)) {
        const error = new Error('OTP code has expired. Please request a new password reset.');
        error.statusCode = 400;
        throw error;
      }

      valid = true;
    } catch (err) {
      if (err.statusCode || err.message.includes('Invalid') || err.message.includes('expired') || err.message.includes('No registered') || err.message.includes('Too many')) {
        throw err;
      }
    }
  }

  if (!valid) {
    if (!shouldAllowMemoryFallback()) {
      const error = new Error('Database connection is unavailable.');
      error.statusCode = 503;
      throw error;
    }
    const memUser = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!memUser) {
      const error = new Error('No registered account found with this email address.');
      error.statusCode = 404;
      throw error;
    }

    if (!verifyOtpCode(memUser.resetPasswordOtp, cleanOtp)) {
      memUser.otpAttempts = (memUser.otpAttempts || 0) + 1;
      if (memUser.otpAttempts >= 5) {
        memUser.resetPasswordOtp = null;
        memUser.resetPasswordExpires = null;
        memUser.otpAttempts = 0;
        const error = new Error('Too many incorrect OTP attempts. Code has been invalidated. Please request a new password reset.');
        error.statusCode = 429;
        throw error;
      }
      const error = new Error(`Invalid OTP code. ${5 - memUser.otpAttempts} attempts remaining.`);
      error.statusCode = 400;
      throw error;
    }

    if (memUser.resetPasswordExpires && new Date() > new Date(memUser.resetPasswordExpires)) {
      const error = new Error('OTP code has expired. Please request a new password reset.');
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    verified: true,
    email: cleanEmail,
    message: 'OTP code successfully verified. Please set your new password.',
  };
};

/**
 * Reset password with OTP
 */
export const resetPassword = async ({ email, otp, newPassword }) => {
  const cleanEmail = email.toLowerCase().trim();
  const cleanOtp = String(otp).trim();

  if (!newPassword || newPassword.length < 8) {
    const error = new Error('New password must be at least 8 characters');
    error.statusCode = 400;
    throw error;
  }

  if (isDBConnected()) {
    try {
      const user = await User.findOne({ email: cleanEmail }).select('+password +refreshTokens');
      if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
      }

      if (!verifyOtpCode(user.resetPasswordOtp, cleanOtp)) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        if (user.otpAttempts >= 5) {
          user.resetPasswordOtp = null;
          user.resetPasswordExpires = null;
          user.otpAttempts = 0;
          await user.save().catch(() => {});
          const error = new Error('Too many incorrect OTP attempts. Code has been invalidated. Please request a new password reset.');
          error.statusCode = 429;
          throw error;
        }
        await user.save().catch(() => {});
        const error = new Error(`Invalid or expired OTP code. ${5 - user.otpAttempts} attempts remaining.`);
        error.statusCode = 400;
        throw error;
      }

      if (user.resetPasswordExpires && new Date() > new Date(user.resetPasswordExpires)) {
        const error = new Error('OTP code has expired. Please request a new one.');
        error.statusCode = 400;
        throw error;
      }

      user.password = newPassword;
      user.passwordInitialized = true;
      user.resetPasswordOtp = null;
      user.resetPasswordExpires = null;
      user.otpAttempts = 0;
      user.isVerified = true;
      user.tokenVersion = Number(user.tokenVersion || 0) + 1;
      user.refreshTokens = [];
      await user.save();

      // Dispatch security notification via Resend
      sendPasswordResetSuccessEmail({ to: user.email, name: user.name }).catch(() => {});

      const { token, refreshToken } = await issueSessionPair(user);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        phone: user.phone,
        isVerified: true,
        token,
        refreshToken,
        message: 'Password successfully updated! You are now logged in.',
      };
    } catch (err) {
      if (err.statusCode || err.message.includes('Invalid') || err.message.includes('expired') || err.message.includes('not found') || err.message.includes('Too many')) {
        throw err;
      }
    }
  }

  if (!shouldAllowMemoryFallback()) {
    const error = new Error('Database connection unavailable.');
    error.statusCode = 503;
    throw error;
  }

  const memUser = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!memUser) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!verifyOtpCode(memUser.resetPasswordOtp, cleanOtp)) {
    memUser.otpAttempts = (memUser.otpAttempts || 0) + 1;
    if (memUser.otpAttempts >= 5) {
      memUser.resetPasswordOtp = null;
      memUser.resetPasswordExpires = null;
      memUser.otpAttempts = 0;
      const error = new Error('Too many incorrect OTP attempts. Code has been invalidated. Please request a new password reset.');
      error.statusCode = 429;
      throw error;
    }
    const error = new Error(`Invalid or expired OTP code. ${5 - memUser.otpAttempts} attempts remaining.`);
    error.statusCode = 400;
    throw error;
  }

  if (memUser.resetPasswordExpires && new Date() > new Date(memUser.resetPasswordExpires)) {
    const error = new Error('OTP code has expired.');
    error.statusCode = 400;
    throw error;
  }

  memUser.password = await hashPasswordDirect(newPassword);
  memUser.passwordInitialized = true;
  memUser.resetPasswordOtp = null;
  memUser.resetPasswordExpires = null;
  memUser.otpAttempts = 0;
  memUser.isVerified = true;
  memUser.tokenVersion = Number(memUser.tokenVersion || 0) + 1;
  memUser.refreshTokens = [];

  // Dispatch security notification via Resend
  sendPasswordResetSuccessEmail({ to: cleanEmail, name: memUser.name }).catch(() => {});

  const { token, refreshToken } = await issueSessionPair(memUser);

  return {
    _id: memUser._id,
    name: memUser.name || cleanEmail.split('@')[0],
    email: cleanEmail,
    role: memUser.role || 'user',
    company: memUser.company || 'Enterprise Promoter',
    phone: memUser.phone || '',
    isVerified: true,
    token,
    refreshToken,
    message: 'Password successfully updated! You are now logged in.',
  };
};

/**
 * Dedicated Admin & Super Admin Login
 * Restricted dynamically to authorized admin Gmail allowlist + database-verified bcrypt password.
 * No admin passwords are stored in .env — admins set or reset their password via email OTP.
 */
export const adminLogin = async ({ email, password, req }) => {
  if (!email) {
    const error = new Error('Please enter an administrative Gmail address');
    error.statusCode = 400;
    throw error;
  }
  if (!password || !String(password).trim()) {
    const error = new Error('Please enter your admin password');
    error.statusCode = 400;
    throw error;
  }

  const cleanEmail = email.toLowerCase().trim();
  if (!isValidGmail(cleanEmail)) {
    const error = new Error('Only valid @gmail.com addresses are permitted for admin access.');
    error.statusCode = 400;
    throw error;
  }

  const isAllowedAdmin = isAuthorizedAdminGmail(cleanEmail);
  const isAllowedCaAdmin = isAuthorizedCaAdminGmail(cleanEmail);

  if (!isAllowedAdmin && !isAllowedCaAdmin) {
    const error = new Error('Access Denied: This Gmail address is not an authorized administrator account.');
    error.statusCode = 403;
    throw error;
  }

  const admin2 = getAdminEmail2();
  const isCaAdmin = isAllowedCaAdmin;
  const isSuperAdmin = !isCaAdmin && cleanEmail === admin2;
  const role = isCaAdmin ? 'ca_admin' : isSuperAdmin ? 'superadmin' : 'admin';

  const NON_ADMIN_PORTAL_ROLES = ['user', 'ca', 'dpr_consultant', 'dpr', 'prosync', 'prosync_admin'];
  const setupPasswordMsg =
    'No password has been set for this admin account yet. Click "Forgot / Set Password?" to receive a 6-digit code via email and create your password.';

  // 1. Try DB first
  if (isDBConnected()) {
    try {
      const user = await User.findOne({ email: cleanEmail }).select('+password +refreshTokens');
      if (user && NON_ADMIN_PORTAL_ROLES.includes(user.role)) {
        const error = new Error(
          'Access Denied: This email is registered as a standard user/portal account and cannot be used for Admin Panel access.'
        );
        error.statusCode = 403;
        throw error;
      }

      if (!user || user.passwordInitialized === false) {
        const error = new Error(setupPasswordMsg);
        error.statusCode = 401;
        throw error;
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        const error = new Error(
          'Incorrect password. Please try again or click "Forgot / Set Password?" to reset it via email.'
        );
        error.statusCode = 401;
        throw error;
      }

      if (user.role !== role) {
        user.role = role;
      }
      if (!user.isVerified) {
        user.isVerified = true;
      }
      await user.save();

      await recordSuccessfulLogin(user, req);
      const { token, refreshToken } = await issueSessionPair(user);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isVerified: true,
        token,
        refreshToken,
        message: `${user.role === 'ca_admin' ? 'CA Admin' : user.role === 'superadmin' ? 'Super Admin' : 'Admin'} authentication successful`,
      };
    } catch (err) {
      if (err.statusCode || err.message.includes('Access Denied') || err.message.includes('password') || err.message.includes('Password')) {
        throw err;
      }
      console.warn('MongoDB error during adminLogin:', err.message);
    }
  }

  // 2. Memory fallback (only when explicitly permitted outside production)
  if (!shouldAllowMemoryFallback()) {
    const error = new Error('Database connection unavailable.');
    error.statusCode = 503;
    throw error;
  }

  const memUser = findMemoryUserByEmail(cleanEmail);
  if (memUser && NON_ADMIN_PORTAL_ROLES.includes(memUser.role)) {
    const error = new Error(
      'Access Denied: This email is registered as a standard user/portal account and cannot be used for Admin Panel access.'
    );
    error.statusCode = 403;
    throw error;
  }

  if (!memUser || memUser.passwordInitialized === false) {
    const error = new Error(setupPasswordMsg);
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, memUser.password);
  if (!isMatch) {
    const error = new Error(
      'Incorrect password. Please try again or click "Forgot / Set Password?" to reset it via email.'
    );
    error.statusCode = 401;
    throw error;
  }

  memUser.role = role;
  await recordSuccessfulLogin(memUser, req);
  const { token, refreshToken } = await issueSessionPair(memUser);

  return {
    _id: memUser._id,
    name: memUser.name,
    email: memUser.email,
    role: memUser.role,
    company: memUser.company,
    phone: memUser.phone,
    avatarUrl: memUser.avatarUrl,
    isVerified: true,
    token,
    refreshToken,
    message: `${memUser.role === 'ca_admin' ? 'CA Admin' : memUser.role === 'superadmin' ? 'Super Admin' : 'Admin'} authentication successful`,
  };
};

/**
 * Rotate a valid HttpOnly refresh token into a fresh access token + new refresh token
 */
export const refreshSessionTokens = async ({ refreshToken, req }) => {
  if (!refreshToken) {
    const err = new Error('Refresh token missing. Please sign in again.');
    err.statusCode = 401;
    throw err;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    const err = new Error('Invalid or expired refresh token. Please sign in again.');
    err.statusCode = 401;
    throw err;
  }

  const incomingHash = hashRefreshToken(refreshToken);
  const cleanEmail = String(decoded.email || '').toLowerCase().trim();
  const now = new Date();

  let userObj = null;
  if (isDBConnected()) {
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      userObj = await User.findById(decoded.id).select('+refreshTokens');
    } else if (cleanEmail) {
      userObj = await User.findOne({ email: cleanEmail }).select('+refreshTokens');
    }
  } else if (shouldAllowMemoryFallback()) {
    userObj = findMemoryUserById(decoded.id) || findMemoryUserByEmail(cleanEmail);
  }

  if (!userObj) {
    const err = new Error('Account not found for refresh token.');
    err.statusCode = 401;
    throw err;
  }

  if (Number(userObj.tokenVersion || 0) !== Number(decoded.tokenVersion ?? 0)) {
    const err = new Error('Session has been revoked. Please sign in again.');
    err.statusCode = 401;
    throw err;
  }

  const storedTokens = Array.isArray(userObj.refreshTokens) ? userObj.refreshTokens : [];
  const matchIdx = storedTokens.findIndex(
    (entry) => entry?.tokenHash === incomingHash && entry?.expiresAt && new Date(entry.expiresAt) > now
  );

  if (matchIdx === -1) {
    // Possible refresh token reuse: revoke all active sessions for safety
    userObj.refreshTokens = [];
    userObj.tokenVersion = Number(userObj.tokenVersion || 0) + 1;
    if (typeof userObj.save === 'function') {
      await userObj.save().catch(() => {});
    }
    const err = new Error('Refresh token is invalid or has already been rotated. Please sign in again.');
    err.statusCode = 401;
    throw err;
  }

  // Rotate: remove used refresh hash before issuing next pair
  userObj.refreshTokens = storedTokens.filter((_, idx) => idx !== matchIdx);
  const pair = await issueSessionPair(userObj);

  return {
    _id: userObj._id,
    name: userObj.name,
    email: userObj.email,
    role: userObj.role,
    company: userObj.company,
    phone: userObj.phone,
    isVerified: Boolean(userObj.isVerified ?? true),
    token: pair.token,
    refreshToken: pair.refreshToken,
  };
};

/**
 * Revoke current refresh token and invalidate existing access tokens by incrementing tokenVersion
 */
export const logoutUserSession = async ({ userId, refreshToken }) => {
  const tokenHash = refreshToken ? hashRefreshToken(refreshToken) : null;
  let userObj = null;

  if (isDBConnected()) {
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userObj = await User.findById(userId).select('+refreshTokens');
    } else if (tokenHash) {
      userObj = await User.findOne({ 'refreshTokens.tokenHash': tokenHash }).select('+refreshTokens');
    }
  } else if (shouldAllowMemoryFallback() && userId) {
    userObj = findMemoryUserById(userId);
  }

  if (userObj) {
    userObj.tokenVersion = Number(userObj.tokenVersion || 0) + 1;
    userObj.refreshTokens = [];
    if (typeof userObj.save === 'function') {
      await userObj.save().catch(() => {});
    }
  }
  return { loggedOut: true };
};

export default {
  registerUser,
  verifyEmailOtp,
  sendVerificationOtp,
  loginUser,
  adminLogin,
  refreshSessionTokens,
  logoutUserSession,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  syncMemoryUsersToDB,
};

