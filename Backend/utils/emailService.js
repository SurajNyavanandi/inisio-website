import { Resend } from 'resend';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendEnvPath = fs.existsSync(path.resolve(__dirname, '../.env'))
  ? path.resolve(__dirname, '../.env')
  : fs.existsSync(path.resolve(process.cwd(), 'Backend/.env'))
  ? path.resolve(process.cwd(), 'Backend/.env')
  : path.resolve(process.cwd(), '.env');

dotenv.config({ path: backendEnvPath });

const DEFAULT_VERIFIED_SENDER = 'Inisio Advisory <no-reply@inisio.in>';

let cachedKey = '';
let cachedClient = null;
let cachedVerifiedDomain = '';
let cachedDomainList = [];
let cachedDomainLookupError = '';
let cachedDomainFetchedAt = 0;
let verifyTriggeredIds = new Set();
const DOMAIN_CACHE_TTL_MS = 5 * 60 * 1000;

const UNVERIFIABLE_FREE_DOMAINS = new Set([
  'resend.dev',
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'example.com',
  'yourdomain.com',
]);

const getResendApiKey = () => (process.env.RESEND_API_KEY || config.email.resendApiKey || '').trim();

const extractEmailDomain = (rawFrom = '') => {
  const match = String(rawFrom).match(/<([^>]+)>/);
  const addr = (match ? match[1] : String(rawFrom)).trim().toLowerCase();
  const atIndex = addr.lastIndexOf('@');
  return atIndex > -1 ? addr.slice(atIndex + 1).trim() : '';
};

const getExplicitSenderFrom = () => {
  const direct = (
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.FROM_EMAIL ||
    process.env.MAIL_FROM ||
    ''
  ).trim();
  if (direct) return direct;

  const domain = (process.env.RESEND_DOMAIN || config.email.resendDomain || '').trim().toLowerCase();
  if (domain && !UNVERIFIABLE_FREE_DOMAINS.has(domain)) {
    return `Inisio Advisory <no-reply@${domain}>`;
  }

  return (config.email.from || DEFAULT_VERIFIED_SENDER).trim();
};

const isCustomDomainSender = (sender = '') => {
  const domain = extractEmailDomain(sender);
  return Boolean(domain && !UNVERIFIABLE_FREE_DOMAINS.has(domain));
};

const getVerifiedResendDomain = async (client, forceRefresh = false) => {
  if (!client || typeof client.domains?.list !== 'function') return '';

  const now = Date.now();
  if (!forceRefresh && cachedDomainFetchedAt > 0 && now - cachedDomainFetchedAt < DOMAIN_CACHE_TTL_MS) {
    return cachedVerifiedDomain;
  }

  try {
    const res = await client.domains.list();
    if (res?.error) {
      cachedDomainLookupError = res.error.message || 'Unable to list Resend domains';
      cachedDomainFetchedAt = now;
      logger.warn(
        `[Resend] Unable to query domains (${cachedDomainLookupError}). Using configured EMAIL_FROM sender.`
      );
      return '';
    }

    const rawList = Array.isArray(res?.data?.data)
      ? res.data.data
      : Array.isArray(res?.data)
      ? res.data
      : [];

    cachedDomainList = rawList.map((d) => ({
      id: d?.id || '',
      name: String(d?.name || '').trim().toLowerCase(),
      status: String(d?.status || 'unknown').trim().toLowerCase(),
    }));
    cachedDomainLookupError = '';

    // If a domain exists in Resend with status 'not_started', trigger DNS verification once automatically
    for (const domainItem of cachedDomainList) {
      if (
        domainItem.id &&
        domainItem.status === 'not_started' &&
        !verifyTriggeredIds.has(domainItem.id) &&
        typeof client.domains?.verify === 'function'
      ) {
        verifyTriggeredIds.add(domainItem.id);
        try {
          await client.domains.verify(domainItem.id);
          logger.info(`[Resend] Triggered DNS verification check for domain '${domainItem.name}'.`);
        } catch (verifyErr) {
          logger.warn(`[Resend] Could not trigger verification for '${domainItem.name}': ${verifyErr.message}`);
        }
      }
    }

    const verified =
      cachedDomainList.find((d) => d.status === 'verified' && d.name) ||
      cachedDomainList.find((d) => d.status.includes('verified') && d.name);

    cachedDomainFetchedAt = now;

    if (verified?.name) {
      cachedVerifiedDomain = verified.name;
      logger.info(`[Resend] Verified sender domain active: ${cachedVerifiedDomain}`);
      return cachedVerifiedDomain;
    }

    cachedVerifiedDomain = '';
    if (cachedDomainList.length > 0) {
      logger.warn(
        `[Resend] Domains found in Resend account but not verified yet: ${cachedDomainList
          .map((d) => `${d.name} (${d.status})`)
          .join(', ')}`
      );
    }
    return '';
  } catch (err) {
    cachedDomainLookupError = err.message || 'Domain lookup failed';
    cachedDomainFetchedAt = now;
    logger.warn(`[Resend] Domain lookup failed: ${cachedDomainLookupError}`);
    return '';
  }
};

const resolveActiveSender = async (client, overrideFrom = '') => {
  const candidate = (overrideFrom || getExplicitSenderFrom()).trim();

  // 1. Always use explicitly configured EMAIL_FROM (or default Inisio Advisory <no-reply@inisio.in>) first
  if (candidate && isCustomDomainSender(candidate)) {
    return { sender: candidate, source: 'env_or_default' };
  }

  // 2. If env EMAIL_FROM was mistakenly set to an unverifiable address (e.g. gmail.com / resend.dev),
  //    prefer an auto-discovered verified Resend domain or our primary Hostinger domain sender
  const verifiedDomain = await getVerifiedResendDomain(client);
  if (verifiedDomain) {
    return { sender: `Inisio Advisory <no-reply@${verifiedDomain}>`, source: 'resend_verified_domain' };
  }

  return { sender: DEFAULT_VERIFIED_SENDER, source: 'default_domain' };
};

export const getEmailSenderStatus = async () => {
  const configured = isResendConfigured();
  const activeSender = getSenderFrom();
  const activeDomain = extractEmailDomain(activeSender);
  if (!configured) {
    return { configured: false, activeSender, activeDomain, verifiedDomain: null, domains: [] };
  }
  const client = getResendClient();
  const verifiedDomain = await getVerifiedResendDomain(client, true);
  return {
    configured: true,
    activeSender,
    activeDomain,
    verifiedDomain: verifiedDomain || null,
    domains: cachedDomainList.map(({ name, status }) => ({ name, status })),
  };
};

const getSenderFrom = () => {
  const explicit = getExplicitSenderFrom();
  if (explicit && isCustomDomainSender(explicit)) return explicit;
  if (cachedVerifiedDomain) return `Inisio Advisory <no-reply@${cachedVerifiedDomain}>`;
  return DEFAULT_VERIFIED_SENDER;
};

const getAppUrl = () =>
  (process.env.APP_URL || process.env.FRONTEND_URL || config.APP_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/$/, '');

const getAdminNotifyEmail = () => {
  const candidates = [
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_EMAIL_1,
    config.admin?.email1,
  ]
    .map((e) => (e || '').trim().toLowerCase())
    .filter((e) => e && e.includes('@') && !e.endsWith('@example.com'));

  if (candidates.length > 0) return candidates[0];

  // Fallback to EMAIL_FROM address if ADMIN_EMAIL is still an example placeholder
  const fromRaw = getSenderFrom();
  const match = fromRaw.match(/<([^>]+)>/);
  const fromEmail = (match ? match[1] : fromRaw).trim().toLowerCase();
  if (fromEmail && fromEmail.includes('@') && !fromEmail.endsWith('@resend.dev')) {
    return fromEmail;
  }
  return '';
};

const getResendClient = () => {
  const apiKey = getResendApiKey();
  if (!apiKey) return null;
  if (cachedClient && cachedKey === apiKey) return cachedClient;
  cachedKey = apiKey;
  cachedVerifiedDomain = '';
  cachedDomainFetchedAt = 0;
  cachedClient = new Resend(apiKey);
  return cachedClient;
};

export const isResendConfigured = () => Boolean(getResendApiKey());

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Shared minimalist HTML email wrapper (white card, subtle border, simple English, mobile-friendly)
 */
const buildMinimalEmailHtml = ({
  heading,
  greeting = 'Hi there,',
  paragraphs = [],
  otp = '',
  otpNote = 'This code expires in 15 minutes.',
  ctaLabel = '',
  ctaUrl = '',
  details = [],
  note = '',
  footerText = 'Inisio Advisory · Greenfield Project Finance',
}) => {
  const paragraphHtml = paragraphs
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(p)}</p>`
    )
    .join('');

  const otpHtml = otp
    ? `<div style="margin:22px 0;padding:18px 16px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;text-align:center;">
        <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:#0f172a;">${escapeHtml(otp)}</div>
        <p style="margin:8px 0 0 0;font-size:12px;color:#64748b;">${escapeHtml(otpNote)}</p>
      </div>`
    : '';

  const ctaHtml =
    ctaLabel && ctaUrl
      ? `<div style="margin:22px 0;">
          <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px;">${escapeHtml(ctaLabel)}</a>
        </div>`
      : '';

  const validDetails = details.filter((d) => d && d.label && d.value !== undefined && d.value !== '');
  const detailsHtml =
    validDetails.length > 0
      ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          ${validDetails
            .map(
              (row, i) => `<tr>
                <td style="padding:9px 12px;font-size:13px;color:#64748b;background-color:#f8fafc;width:36%;${i < validDetails.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : ''}">${escapeHtml(row.label)}</td>
                <td style="padding:9px 12px;font-size:13px;font-weight:600;color:#0f172a;background-color:#ffffff;${i < validDetails.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : ''}">${escapeHtml(row.value)}</td>
              </tr>`
            )
            .join('')}
        </table>`
      : '';

  const noteHtml = note
    ? `<p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:#64748b;">${escapeHtml(note)}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 16px 28px;border-bottom:1px solid #f1f5f9;">
              <span style="font-size:16px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">Inisio</span>
              <span style="display:inline-block;width:6px;height:6px;border-radius:9999px;background-color:#2563eb;margin-left:4px;vertical-align:middle;"></span>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 28px;">
              <h1 style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#0f172a;line-height:1.3;">${escapeHtml(heading)}</h1>
              <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(greeting)}</p>
              ${paragraphHtml}
              ${otpHtml}
              ${detailsHtml}
              ${ctaHtml}
              ${noteHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px;background-color:#f8fafc;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">${escapeHtml(footerText)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Core email dispatch utility powered by Resend SDK.
 * Reads RESEND_API_KEY and EMAIL_FROM dynamically from environment variables.
 */
export const sendEmail = async (mailOptions, metadata = {}) => {
  const recipient = mailOptions.to;
  const recipients = (Array.isArray(recipient) ? recipient : [recipient])
    .map((r) => String(r || '').trim())
    .filter((r) => r && r.includes('@'));

  if (recipients.length === 0) {
    logger.warn(`[Resend] Skipped email (${metadata.type || 'general'}): no valid recipient.`);
    return { success: false, configured: isResendConfigured(), error: 'No valid recipient address.' };
  }

  const client = getResendClient();

  if (client) {
    try {
      const resolved = await resolveActiveSender(client, mailOptions.from);
      let activeSender = resolved.sender;

      if (!activeSender) {
        const domainSummary =
          cachedDomainList.length > 0
            ? `Found Resend domain(s): ${cachedDomainList.map((d) => `${d.name} (${d.status})`).join(', ')}.`
            : cachedDomainLookupError
            ? `Resend domain lookup returned: ${cachedDomainLookupError}.`
            : 'No verified domain found in the connected Resend account.';

        const reason = `EMAIL_FROM is not configured with a verified custom domain (refusing to use onboarding@resend.dev). ${domainSummary} Please verify your domain at resend.com/domains and set EMAIL_FROM=Inisio Advisory <no-reply@your-verified-domain.com>.`;
        logger.error(`[Resend] Blocked ${metadata.type || 'email'} to ${recipients.join(', ')}: ${reason}`);
        return {
          success: false,
          configured: true,
          error: reason,
        };
      }

      logger.info(`[Resend] Dispatching ${metadata.type || 'email'} from '${activeSender}' to ${recipients.join(', ')}`);
      let res = await client.emails.send({
        from: activeSender,
        to: recipients,
        subject: mailOptions.subject || 'Inisio Notification',
        html: mailOptions.html,
        text: mailOptions.text,
      });

      // If explicit sender domain failed verification, retry once with auto-discovered verified Resend domain (never onboarding@resend.dev)
      const errMsgLower = String(res?.error?.message || '').toLowerCase();
      if (
        res.error &&
        (errMsgLower.includes('not verified') ||
          errMsgLower.includes('only send testing emails') ||
          errMsgLower.includes('domain'))
      ) {
        const verifiedDomain = await getVerifiedResendDomain(client, true);
        const verifiedSender = verifiedDomain ? `Inisio Advisory <no-reply@${verifiedDomain}>` : '';
        if (verifiedSender && verifiedSender.toLowerCase() !== activeSender.toLowerCase()) {
          logger.warn(
            `[Resend] Sender '${activeSender}' failed (${res.error.message}). Retrying with verified domain sender '${verifiedSender}'.`
          );
          activeSender = verifiedSender;
          res = await client.emails.send({
            from: activeSender,
            to: recipients,
            subject: mailOptions.subject || 'Inisio Notification',
            html: mailOptions.html,
            text: mailOptions.text,
          });
        }
      }

      if (res.error) {
        const rawErr = res.error.message || 'Unknown Resend error';
        logger.error(
          `[Resend] Failed to send ${metadata.type || 'email'} from '${activeSender}' to ${recipients.join(', ')}: ${rawErr}`
        );
        return {
          success: false,
          configured: true,
          error: rawErr,
        };
      }

      logger.info(
        `[Resend] Sent ${metadata.type || 'email'} from '${activeSender}' to ${recipients.join(', ')} (id: ${res.data?.id || 'ok'})`
      );
      return { success: true, configured: true, messageId: res.data?.id };
    } catch (err) {
      logger.error(`[Resend] Unexpected error sending ${metadata.type || 'email'}: ${err.message}`);
      return { success: false, configured: true, error: err.message || 'Email service error.' };
    }
  }

  // Graceful development fallback when RESEND_API_KEY is unset
  logger.warn(
    `[Resend] RESEND_API_KEY is not configured. Simulated ${metadata.type || 'email'} to ${recipients.join(', ')} | Subject: "${mailOptions.subject}"`
  );
  return { success: true, isDev: true, configured: false };
};

// Backwards compatibility alias
export const sendMailWithResilience = sendEmail;

/**
 * 1. Signup / Account Email Verification OTP
 */
export const sendVerificationEmail = async ({ to, name, otp }) => {
  const recipientName = (name || 'there').trim();
  const text = [
    `Hi ${recipientName},`,
    '',
    `Your Inisio verification code is: ${otp}`,
    '',
    'Enter this 6-digit code to verify your email address. It expires in 15 minutes.',
    '',
    'If you did not create an Inisio account, you can safely ignore this email.',
    '',
    'Inisio Advisory',
  ].join('\n');

  const html = buildMinimalEmailHtml({
    heading: 'Verify your email',
    greeting: `Hi ${recipientName},`,
    paragraphs: ['Enter the 6-digit code below to verify your email address and activate your Inisio account.'],
    otp,
    otpNote: 'This code expires in 15 minutes. Do not share it with anyone.',
    note: 'If you did not sign up for Inisio, you can safely ignore this email.',
  });

  const result = await sendEmail(
    {
      to,
      subject: `${otp} is your Inisio verification code`,
      text,
      html,
    },
    { type: 'verification_otp' }
  );

  return { ...result, otp };
};

/**
 * 2. Welcome Email (Sent after successful email verification)
 */
export const sendWelcomeEmail = async ({ to, name, dashboardUrl }) => {
  const recipientName = (name || 'there').trim();
  const targetUrl = dashboardUrl || `${getAppUrl()}/dashboard`;

  const text = [
    `Hi ${recipientName},`,
    '',
    'Your Inisio account is now verified and active.',
    'You can sign in anytime to manage your project assessments, track DPR progress, and connect with our advisory team.',
    '',
    `Open your dashboard: ${targetUrl}`,
    '',
    'Inisio Advisory',
  ].join('\n');

  const html = buildMinimalEmailHtml({
    heading: 'Welcome to Inisio',
    greeting: `Hi ${recipientName},`,
    paragraphs: [
      'Your email is verified and your Inisio account is ready to use.',
      'You can now save project assessments, download executive teasers, and track your funding milestones from your dashboard.',
    ],
    ctaLabel: 'Go to Dashboard',
    ctaUrl: targetUrl,
  });

  return sendEmail(
    {
      to,
      subject: 'Welcome to Inisio — Your account is active',
      text,
      html,
    },
    { type: 'welcome' }
  );
};

/**
 * 3. Forgot Password / Password Reset Link & 6-Digit Code
 */
export const sendPasswordResetEmail = async ({ to, name, otp, resetLink }) => {
  const recipientName = (name || 'there').trim();
  const safeResetLink =
    resetLink ||
    `${getAppUrl()}/?mode=reset-password&token=${encodeURIComponent(otp)}&email=${encodeURIComponent(to)}`;

  const text = [
    `Hi ${recipientName},`,
    '',
    'We received a request to reset your Inisio account password.',
    '',
    `Reset code: ${otp}`,
    `Reset link: ${safeResetLink}`,
    '',
    'This link and code expire in 15 minutes. If you did not request a password reset, you can ignore this email.',
    '',
    'Inisio Advisory',
  ].join('\n');

  const html = buildMinimalEmailHtml({
    heading: 'Reset your password',
    greeting: `Hi ${recipientName},`,
    paragraphs: [
      'We received a request to reset your Inisio password. Click the button below or enter the 6-digit code on the reset screen.',
    ],
    ctaLabel: 'Reset Password',
    ctaUrl: safeResetLink,
    otp,
    otpNote: 'Valid for 15 minutes.',
    note: `If the button does not work, copy and paste this link: ${safeResetLink}. If you did not request this, you can safely ignore this email.`,
  });

  const result = await sendEmail(
    {
      to,
      subject: 'Reset your Inisio password',
      text,
      html,
    },
    { type: 'password_reset' }
  );

  return { ...result, otp, resetLink: safeResetLink };
};

/**
 * 4. Password Changed Confirmation
 */
export const sendPasswordResetSuccessEmail = async ({ to, name }) => {
  const recipientName = (name || 'there').trim();
  const text = [
    `Hi ${recipientName},`,
    '',
    'Your Inisio password was changed successfully.',
    'If you did not make this change, please reset your password immediately or contact our team.',
    '',
    'Inisio Advisory',
  ].join('\n');

  const html = buildMinimalEmailHtml({
    heading: 'Your Inisio password was changed',
    greeting: `Hi ${recipientName},`,
    paragraphs: [
      'Your password has been updated. You can now sign in with your new password.',
      'If you did not make this change, please contact our support team right away.',
    ],
  });

  return sendEmail(
    {
      to,
      subject: 'Your Inisio password was changed',
      text,
      html,
    },
    { type: 'password_reset_success' }
  );
};

/**
 * 5. DPR Request, Assignment & Key Status Update Email
 */
export const sendDprStatusEmail = async ({
  to,
  name,
  projectName = 'Greenfield Project',
  status = 'Updated',
  assignedTo = '',
  note = '',
  dashboardUrl = '',
  recipientType = 'promoter',
}) => {
  const recipientName = (name || 'there').trim();
  const targetUrl = dashboardUrl || `${getAppUrl()}/dashboard`;

  const isConsultant = recipientType === 'consultant';
  const isAdmin = recipientType === 'admin';

  const heading = isConsultant
    ? `New DPR assigned: ${projectName}`
    : isAdmin
    ? `DPR update: ${projectName}`
    : `DPR update for ${projectName}`;

  const intro = isConsultant
    ? `You have been assigned to work on the DPR for ${projectName}.`
    : isAdmin
    ? `A DPR request or milestone update was recorded for ${projectName}.`
    : `There is a new update on the Detailed Project Report (DPR) for ${projectName}.`;

  const details = [
    { label: 'Project', value: projectName },
    { label: 'Current Status', value: status },
    ...(assignedTo ? [{ label: 'Assigned To', value: assignedTo }] : []),
    ...(note ? [{ label: 'Note', value: note }] : []),
  ];

  const text = [
    `Hi ${recipientName},`,
    '',
    intro,
    '',
    `Project: ${projectName}`,
    `Status: ${status}`,
    ...(assignedTo ? [`Assigned To: ${assignedTo}`] : []),
    ...(note ? [`Note: ${note}`] : []),
    '',
    `View details: ${targetUrl}`,
    '',
    'Inisio Advisory',
  ].join('\n');

  const html = buildMinimalEmailHtml({
    heading,
    greeting: `Hi ${recipientName},`,
    paragraphs: [intro],
    details,
    ctaLabel: 'Open Dashboard',
    ctaUrl: targetUrl,
  });

  return sendEmail(
    {
      to,
      subject: isConsultant
        ? `DPR Assigned: ${projectName}`
        : `DPR Status Update: ${projectName} (${status})`,
      text,
      html,
    },
    { type: 'dpr_status' }
  );
};

/**
 * 6. Contact Enquiry: User Confirmation & Admin Alert
 */
export const sendContactEnquiryAlertEmail = async (enquiry) => {
  const adminEmail = getAdminNotifyEmail();
  const senderName = enquiry.name || 'there';
  const subjectText = enquiry.subject || 'Project Enquiry';

  const userText = [
    `Hi ${senderName},`,
    '',
    `We received your message about "${subjectText}".`,
    'Our team will review it and get back to you shortly.',
    '',
    'Inisio Advisory',
  ].join('\n');

  const userHtml = buildMinimalEmailHtml({
    heading: 'We received your message',
    greeting: `Hi ${senderName},`,
    paragraphs: [
      `Thank you for contacting Inisio regarding "${subjectText}".`,
      'Our advisory team has received your enquiry and will respond shortly.',
    ],
    details: [
      { label: 'Subject', value: subjectText },
      { label: 'Phone', value: enquiry.phone || '' },
      { label: 'Message', value: enquiry.message || '' },
    ],
  });

  const tasks = [];

  if (enquiry.email) {
    tasks.push(
      sendEmail(
        {
          to: enquiry.email,
          subject: 'We received your enquiry — Inisio',
          text: userText,
          html: userHtml,
        },
        { type: 'contact_user' }
      ).catch(() => null)
    );
  }

  if (adminEmail) {
    const adminText = [
      'New contact enquiry on Inisio:',
      `Name: ${senderName}`,
      `Email: ${enquiry.email || 'N/A'}`,
      `Phone: ${enquiry.phone || 'N/A'}`,
      `Company: ${enquiry.company || 'N/A'}`,
      `Subject: ${subjectText}`,
      `Message: ${enquiry.message || ''}`,
    ].join('\n');

    const adminHtml = buildMinimalEmailHtml({
      heading: 'New contact enquiry',
      greeting: 'Hi Admin,',
      paragraphs: ['A new message was submitted through the website contact form.'],
      details: [
        { label: 'Name', value: senderName },
        { label: 'Email', value: enquiry.email || 'N/A' },
        { label: 'Phone', value: enquiry.phone || 'N/A' },
        { label: 'Company', value: enquiry.company || 'Not specified' },
        { label: 'Subject', value: subjectText },
        { label: 'Message', value: enquiry.message || '' },
      ],
    });

    tasks.push(
      sendEmail(
        {
          to: adminEmail,
          subject: `New Enquiry: ${senderName} — ${subjectText}`,
          text: adminText,
          html: adminHtml,
        },
        { type: 'contact_admin' }
      ).catch(() => null)
    );
  }

  const results = await Promise.all(tasks);
  return results[results.length - 1] || { success: true };
};

/**
 * 7. Greenfield Project Assessment / Lead Submission Notification
 */
export const sendLeadAssessmentConfirmationEmail = async (lead) => {
  const adminEmail = getAdminNotifyEmail();
  const promoterName = lead.fullName || lead.name || 'Promoter';
  const projectName = lead.projectName || 'Greenfield Project';
  const capex = lead.totalCostCr || lead.projectCost || lead.capexCr || 'N/A';
  const loan = lead.loanRequiredCr || lead.termLoanRequired || lead.loanCr || 'N/A';
  const dashboardUrl = `${getAppUrl()}/dashboard`;

  const tasks = [];

  if (lead.email) {
    const userText = [
      `Hi ${promoterName},`,
      '',
      `Your project assessment for "${projectName}" has been saved on Inisio.`,
      `Estimated Project Cost: INR ${capex} Cr`,
      `Loan Required: INR ${loan} Cr`,
      '',
      'Our advisory team will review your project details and follow up with next steps.',
      `View your dashboard: ${dashboardUrl}`,
      '',
      'Inisio Advisory',
    ].join('\n');

    const userHtml = buildMinimalEmailHtml({
      heading: 'Project assessment received',
      greeting: `Hi ${promoterName},`,
      paragraphs: [
        `We have saved your project assessment for ${projectName}. Our team will review your numbers and follow up with next steps.`,
      ],
      details: [
        { label: 'Project', value: projectName },
        { label: 'Industry', value: lead.industry || 'General' },
        { label: 'Project Cost', value: `INR ${capex} Cr` },
        { label: 'Loan Required', value: `INR ${loan} Cr` },
      ],
      ctaLabel: 'View Dashboard',
      ctaUrl: dashboardUrl,
    });

    tasks.push(
      sendEmail(
        {
          to: lead.email,
          subject: `Assessment received: ${projectName}`,
          text: userText,
          html: userHtml,
        },
        { type: 'lead_confirmation' }
      ).catch(() => null)
    );
  }

  if (adminEmail) {
    const adminText = [
      'New project assessment submitted:',
      `Promoter: ${promoterName}`,
      `Email: ${lead.email || 'N/A'}`,
      `Mobile: ${lead.mobile || lead.phone || 'N/A'}`,
      `Project: ${projectName}`,
      `Cost: INR ${capex} Cr | Loan: INR ${loan} Cr`,
      `Location: ${lead.location || 'India'}`,
    ].join('\n');

    const adminHtml = buildMinimalEmailHtml({
      heading: 'New project assessment',
      greeting: 'Hi Admin,',
      paragraphs: ['A new project assessment was submitted on Inisio.'],
      details: [
        { label: 'Promoter', value: promoterName },
        { label: 'Email', value: lead.email || 'N/A' },
        { label: 'Mobile', value: lead.mobile || lead.phone || 'N/A' },
        { label: 'Project', value: projectName },
        { label: 'Project Cost', value: `INR ${capex} Cr` },
        { label: 'Loan Required', value: `INR ${loan} Cr` },
        { label: 'Location', value: lead.location || 'India' },
      ],
      ctaLabel: 'Open Admin Panel',
      ctaUrl: `${getAppUrl()}/admin`,
    });

    tasks.push(
      sendEmail(
        {
          to: adminEmail,
          subject: `New Project Assessment: ${projectName} (INR ${capex} Cr)`,
          text: adminText,
          html: adminHtml,
        },
        { type: 'lead_admin' }
      ).catch(() => null)
    );
  }

  const results = await Promise.all(tasks);
  return results[results.length - 1] || { success: true };
};

/**
 * 8. Consultation Booking Confirmation (User + Admin Notification)
 */
export const sendConsultationConfirmationEmail = async ({
  to,
  name,
  fullName,
  phone,
  companyName,
  company,
  projectCostCr,
  capexAmount,
  totalCostCr,
  preferredDate,
  preferredTime,
  topic,
}) => {
  const adminEmail = getAdminNotifyEmail();
  const promoterName = (name || fullName || 'there').trim();
  const rawCompany = (companyName || company || '').trim();
  const rawCapex = projectCostCr || capexAmount || totalCostCr || '';
  const cleanCapex = String(rawCapex).replace(/[₹\s,a-zA-Z]/g, '').trim();
  const capexText = cleanCapex ? `INR ${cleanCapex} Cr` : '';

  const details = [
    ...(rawCompany ? [{ label: 'Company', value: rawCompany }] : []),
    ...(capexText ? [{ label: 'Project Size', value: capexText }] : []),
    ...(topic ? [{ label: 'Topic', value: topic }] : []),
    ...(preferredDate ? [{ label: 'Preferred Date', value: preferredDate }] : []),
    ...(preferredTime ? [{ label: 'Preferred Time', value: preferredTime }] : []),
  ];

  const userText = [
    `Hi ${promoterName},`,
    '',
    'We received your consultation request on Inisio.',
    'An advisor will review your details and reach out within 24 hours.',
    ...(rawCompany ? [`Company: ${rawCompany}`] : []),
    ...(capexText ? [`Project Size: ${capexText}`] : []),
    ...(preferredDate ? [`Preferred Date: ${preferredDate}`] : []),
    '',
    'Inisio Advisory',
  ].join('\n');

  const userHtml = buildMinimalEmailHtml({
    heading: 'Consultation request confirmed',
    greeting: `Hi ${promoterName},`,
    paragraphs: [
      'Thank you for booking a consultation with Inisio. An advisor will review your request and contact you within 24 hours.',
    ],
    details,
  });

  const tasks = [];

  if (to) {
    tasks.push(
      sendEmail(
        {
          to,
          subject: 'Your Inisio consultation is confirmed',
          text: userText,
          html: userHtml,
        },
        { type: 'consultation_user' }
      ).catch(() => null)
    );
  }

  if (adminEmail) {
    const adminText = [
      'New consultation booking:',
      `Name: ${promoterName}`,
      `Email: ${to || 'N/A'}`,
      ...(phone ? [`Phone: ${phone}`] : []),
      ...(rawCompany ? [`Company: ${rawCompany}`] : []),
      ...(capexText ? [`Project Size: ${capexText}`] : []),
      ...(topic ? [`Topic: ${topic}`] : []),
    ].join('\n');

    const adminHtml = buildMinimalEmailHtml({
      heading: 'New consultation booking',
      greeting: 'Hi Admin,',
      paragraphs: ['A new consultation request was booked on Inisio.'],
      details: [
        { label: 'Name', value: promoterName },
        { label: 'Email', value: to || 'N/A' },
        ...(phone ? [{ label: 'Phone', value: phone }] : []),
        ...details,
      ],
      ctaLabel: 'Open Admin Panel',
      ctaUrl: `${getAppUrl()}/admin`,
    });

    tasks.push(
      sendEmail(
        {
          to: adminEmail,
          subject: `New Consultation: ${promoterName}${capexText ? ` (${capexText})` : ''}`,
          text: adminText,
          html: adminHtml,
        },
        { type: 'consultation_admin' }
      ).catch(() => null)
    );
  }

  const results = await Promise.all(tasks);
  return results[0] || { success: true };
};

export default {
  isResendConfigured,
  sendEmail,
  sendMailWithResilience,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendDprStatusEmail,
  sendContactEnquiryAlertEmail,
  sendLeadAssessmentConfirmationEmail,
  sendConsultationConfirmationEmail,
};
