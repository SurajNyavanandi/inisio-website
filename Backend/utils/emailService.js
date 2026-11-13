import { Resend } from 'resend';
import dotenv from 'dotenv';
import logger from './logger.js';
<<<<<<< HEAD
=======
import config from '../config/env.js';
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92

dotenv.config();

// Initialize official Resend SDK client
const resendApiKey = (config.email.resendApiKey || process.env.RESEND_API_KEY || '').trim();
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Core email dispatch utility powered exclusively by Resend SDK
 * Falls back gracefully to simulation in development if RESEND_API_KEY is not configured
 */
export const sendEmail = async (mailOptions, metadata = {}) => {
  const recipient = mailOptions.to;
  const senderFrom = mailOptions.from || config.email.from || 'Inisio Capital Advisory <onboarding@resend.dev>';
  const recipients = Array.isArray(recipient) ? recipient : [recipient];

  if (resendClient) {
    try {
      let activeSender = senderFrom;
      let res = await resendClient.emails.send({
        from: activeSender,
        to: recipients,
        subject: mailOptions.subject || 'Inisio Capital Advisory Notification',
        html: mailOptions.html,
        text: mailOptions.text,
      });

      // If domain is not verified yet in Resend, automatically fallback to onboarding@resend.dev
      if (res.error && res.error.message && res.error.message.includes('not verified') && !activeSender.includes('onboarding@resend.dev')) {
        logger.warn(`[Resend SDK] Custom domain in '${activeSender}' is not verified yet. Retrying via 'onboarding@resend.dev'...`);
        activeSender = 'Inisio Capital Advisory <onboarding@resend.dev>';
        res = await resendClient.emails.send({
          from: activeSender,
          to: recipients,
          subject: mailOptions.subject || 'Inisio Capital Advisory Notification',
          html: mailOptions.html,
          text: mailOptions.text,
<<<<<<< HEAD
        }),
      });

      const resData = await response.json().catch(() => ({}));

      if (response.ok) {
        logger.info(`[Resend API] Email sent to: ${recipient} (ID: ${resData?.id || 'sent'})`);
        return { success: true, messageId: resData?.id };
      } else {
        logger.warn(`[Resend API Error] ${resData?.message || response.statusText}`);
        return { success: false, error: resData?.message || response.statusText };
=======
        });
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
      }

      if (res.error) {
        if (res.error.message && res.error.message.includes('only send testing emails')) {
          logger.warn(`⚠️ [Resend Free Tier Restriction] Testing emails can only be sent to urbanicoapp@gmail.com until inisio.in domain is verified at https://resend.com/domains.`);
          if (metadata.otp) {
            logger.info(`💡 [DEV OTP CODE for ${recipients.join(', ')}]: ${metadata.otp}`);
          }
        } else {
          logger.warn(`[Resend SDK] Delivery error for ${recipients.join(', ')}: ${res.error.message || JSON.stringify(res.error)}`);
        }
        return { success: false, error: res.error.message };
      }

      logger.info(`[Resend SDK] Email delivered successfully to ${recipients.join(', ')} (ID: ${res.data?.id || 'dispatched'})`);
      return { success: true, messageId: res.data?.id };
    } catch (err) {
<<<<<<< HEAD
      logger.warn(`[Resend Network Error] ${err.message}`);
=======
      logger.error(`[Resend SDK] Unexpected dispatch error: ${err.message}`);
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
      return { success: false, error: err.message };
    }
  }

<<<<<<< HEAD
  // Development fallback when RESEND_API_KEY is not yet configured
  logger.info(`[Email Service - Dev Mode] RESEND_API_KEY not configured. Simulated dispatch to: ${recipient}`);
  logger.info(`   Subject: ${mailOptions.subject}`);
=======
  // Graceful development simulation when RESEND_API_KEY is not set
  logger.debug(`[Resend Simulated Mode] Email to: ${recipients.join(', ')} | Subject: ${mailOptions.subject}`);
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
  return { success: true, isDev: true, configured: false };
};

// Backwards compatibility alias
export const sendMailWithResilience = sendEmail;

/**
 * 1. Email Verification / Signup OTP
 */
export const sendVerificationEmail = async ({ to, name, otp }) => {
  logger.info(`📧 [OTP GENERATED] Recipient: ${to} | 6-Digit Code: ${otp}`);
  const recipientName = name || 'Valued Promoter';
  const textContent = `Hello ${recipientName},\n\nYour Inisio verification code is: ${otp}\n\nThis 6-digit code is valid for 15 minutes. Use it to activate your account on the Inisio Greenfield Project Finance Portal.\n\nBest regards,\nInisio Capital Advisory Team`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Inisio Account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
    
    <div style="background-color: #1e3a8a; padding: 28px 32px; text-align: center;">
      <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #ffffff; color: #1e3a8a; border-radius: 12px; font-weight: 900; font-size: 20px; margin-bottom: 12px;">
        IN
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
        INISIO CAPITAL
      </h1>
      <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">
        Greenfield Project Advisory & Bank Syndication Desk
      </p>
    </div>

    <div style="padding: 32px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
        Account Verification Code
      </h2>
      <p style="font-size: 14px; line-height: 22px; color: #475569; margin-bottom: 24px;">
        Hello <strong>${recipientName}</strong>,<br/>
        Thank you for registering on the Inisio Greenfield Project Finance Portal. Please use the 6-digit verification code below to activate your account and access your advisory desk:
      </p>

      <div style="background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;">
          ${otp}
        </span>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-weight: 600;">
          Valid for 15 minutes • Do not share this code
        </p>
      </div>

      <p style="font-size: 13px; line-height: 20px; color: #64748b; margin-bottom: 24px;">
        If you did not initiate this registration, you can safely ignore this email. Your email address will not be activated without this verification code.
      </p>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 18px;">
          Inisio Project Underwriting & Syndication Services<br/>
          Secured with Bank-Grade 256-bit Encryption
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const result = await sendEmail(
    {
      to,
      subject: `Your Inisio Verification Code: ${otp}`,
      text: textContent,
      html: htmlContent,
    },
    { otp, type: 'verification' }
  );

  return { ...result, otp };
};

/**
 * 2. Forgot Password / Password Reset OTP & Link
 */
export const sendPasswordResetEmail = async ({ to, name, otp, resetLink }) => {
  logger.info(`📧 [PASSWORD RESET OTP] Recipient: ${to} | 6-Digit Code: ${otp}`);
  const recipientName = name || 'Valued User';
  const safeResetLink = resetLink || `/?action=reset-password&email=${encodeURIComponent(to)}&otp=${otp}`;

  const textContent = `Hello ${recipientName},\n\nWe received a request to reset your Inisio account password.\n\nYour 6-digit Reset Code is: ${otp}\nOr use this reset link: ${safeResetLink}\n\nBoth are valid for 15 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nInisio Capital Advisory Team`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Inisio Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
    
    <div style="background-color: #1e3a8a; padding: 28px 32px; text-align: center;">
      <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #ffffff; color: #1e3a8a; border-radius: 12px; font-weight: 900; font-size: 20px; margin-bottom: 12px;">
        IN
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
        INISIO CAPITAL
      </h1>
      <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">
        Greenfield Project Advisory & Bank Syndication Desk
      </p>
    </div>

    <div style="padding: 32px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
        Password Reset Request
      </h2>
      <p style="font-size: 14px; line-height: 22px; color: #475569; margin-bottom: 24px;">
        Hello <strong>${recipientName}</strong>,<br/>
        We received a request to reset the password associated with your Inisio account (<strong>${to}</strong>). Click the secure link below to set a new password:
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${safeResetLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; text-decoration: none; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);">
          Reset Your Password &rarr;
        </a>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
          Or Enter This 6-Digit Reset Code Manually
        </p>
        <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a; font-family: monospace;">
          ${otp}
        </div>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
          Link & code remain valid for 15 minutes
        </p>
      </div>

      <p style="font-size: 12px; line-height: 18px; color: #64748b; margin-bottom: 8px;">
        If the button above does not work, copy and paste this link into your web browser:
      </p>
      <div style="background-color: #f1f5f9; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 11px; color: #334155; word-break: break-all; margin-bottom: 24px;">
        ${safeResetLink}
      </div>

      <p style="font-size: 12px; line-height: 18px; color: #94a3b8; margin-bottom: 24px;">
        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
        <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 18px;">
          Inisio Capital Project Underwriting & Syndication Services<br/>
          Secured with Bank-Grade 256-bit Encryption
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const result = await sendEmail(
    {
      to,
      subject: `Reset Your Inisio Password: ${otp}`,
      text: textContent,
      html: htmlContent,
    },
    { otp, resetLink: safeResetLink, type: 'password-reset' }
  );

  return { ...result, otp, resetLink: safeResetLink };
};

/**
 * 3. Password Reset Success Notification
 */
export const sendPasswordResetSuccessEmail = async ({ to, name }) => {
  const recipientName = name || 'Valued User';
  const textContent = `Hello ${recipientName},\n\nYour Inisio account password has been updated successfully.\n\nIf you did not make this change, please contact our security team immediately at advisory@inisio.in or via WhatsApp at +91 63020 26462.\n\nBest regards,\nInisio Capital Advisory Team`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
    <div style="background-color: #10b981; padding: 24px 32px; text-align: center;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Password Changed Successfully</h2>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 15px; color: #0f172a; margin-top: 0;">Hello <strong>${recipientName}</strong>,</p>
      <p style="font-size: 14px; line-height: 22px; color: #475569;">
        Your Inisio account password was updated successfully. You can now log in securely using your new credentials.
      </p>
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #991b1b;">
          <strong>Did not request this change?</strong> Please reach out to our security desk immediately at <a href="mailto:advisory@inisio.in" style="color: #991b1b; font-weight: bold;">advisory@inisio.in</a>.
        </p>
      </div>
      <p style="font-size: 13px; color: #94a3b8; margin: 24px 0 0;">Inisio Capital Advisory Team</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail(
    {
      to,
      subject: `Security Alert: Your Inisio Password Was Updated`,
      text: textContent,
      html: htmlContent,
    },
    { type: 'password-reset-success' }
  );
};

/**
 * 4. Contact Enquiry: User Confirmation & Admin Notification
 */
export const sendContactEnquiryAlertEmail = async (enquiry) => {
  const adminEmail = process.env.ADMIN_EMAIL || config.admin.email1 || 'advisory@inisio.in';

  // User Acknowledgment Email
  const userHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: #0f172a; padding: 24px 32px;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">INISIO ADVISORY</h2>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Greenfield Project Advisory & Bank Syndication</p>
    </div>
    <div style="padding: 32px;">
      <h3 style="color: #0f172a; margin: 0 0 12px; font-size: 18px;">Thank You, ${enquiry.name}!</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We have received your enquiry regarding <strong>"${enquiry.subject || 'Greenfield Project Consultancy'}"</strong>.
      </p>
      <div style="background: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: #1e293b;">Enquiry Summary:</p>
        <p style="margin: 0; font-size: 13px; color: #334155; font-style: italic;">"${enquiry.message}"</p>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Our Senior Project Advisory Desk has been notified and a lead consultant will contact you via phone (<strong>${enquiry.phone}</strong>) or email shortly.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  // Admin Alert Email
  const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: #1e3a8a; padding: 24px 32px;">
      <span style="display:inline-block; background: #fbbf24; color: #000; font-weight: bold; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">NEW WEBSITE ENQUIRY</span>
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">📩 New Contact Form Submission</h2>
    </div>
    <div style="padding: 32px;">
      <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 30%;">Full Name:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${enquiry.name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; font-weight: 600; color: #475569;">Phone:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${enquiry.phone}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; font-weight: 600; color: #475569;">Email:</td>
          <td style="padding: 8px 0; color: #0f172a;">${enquiry.email}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; font-weight: 600; color: #475569;">Company:</td>
          <td style="padding: 8px 0; color: #0f172a;">${enquiry.company || 'Not Specified'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; font-weight: 600; color: #475569;">Subject:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${enquiry.subject || 'General Enquiry'}</td>
        </tr>
      </table>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-weight: 600; font-size: 13px; color: #334155;">Message Content:</p>
        <p style="margin: 0; font-size: 14px; color: #1e293b; white-space: pre-line;">${enquiry.message}</p>
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        Received on: ${new Date(enquiry.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      </p>
    </div>
  </div>
</body>
</html>
  `;

  if (enquiry.email) {
    sendEmail(
      {
        to: enquiry.email,
        subject: `We have received your enquiry - Inisio Project Advisory`,
        text: `Thank you ${enquiry.name}. We have received your message regarding "${enquiry.subject}" and will contact you shortly.`,
        html: userHtml,
      },
      { type: 'contact_user' }
    ).catch(() => {});
  }

  return sendEmail(
    {
      to: adminEmail,
      subject: `[New Enquiry] ${enquiry.name} - ${enquiry.subject || 'Project Inquiry'}`,
      text: `New contact enquiry from ${enquiry.name} (${enquiry.phone}, ${enquiry.email}): ${enquiry.message}`,
      html: adminHtml,
    },
    { type: 'contact_admin' }
  ).catch(() => {});
};

/**
 * 5. Greenfield Project Assessment / Lead Submission Notification
 */
export const sendLeadAssessmentConfirmationEmail = async (lead) => {
  const adminEmail = process.env.ADMIN_EMAIL || config.admin.email1 || 'advisory@inisio.in';
  const promoterName = lead.fullName || lead.name || 'Promoter';
  const projectName = lead.projectName || 'Greenfield Project';
  const capex = lead.totalCostCr || lead.projectCost || lead.capexCr || 'N/A';
  const loan = lead.loanRequiredCr || lead.termLoanRequired || lead.loanCr || 'N/A';

  const userHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
    <div style="background: #1e3a8a; padding: 28px 32px; text-align: center;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Greenfield Assessment Received</h2>
      <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 13px;">Inisio Capital Advisory & Bank Syndication</p>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 15px; color: #0f172a; margin-top: 0;">Dear <strong>${promoterName}</strong>,</p>
      <p style="font-size: 14px; line-height: 22px; color: #334155;">
        Thank you for submitting your project parameters for <strong>${projectName}</strong> on our appraisal desk.
      </p>
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px; margin: 20px 0;">
        <table style="width: 100%; font-size: 13.5px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Project Name:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${projectName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Industry:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${lead.industry || 'Manufacturing'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Estimated Capex:</td>
            <td style="padding: 6px 0; color: #1e3a8a; font-weight: 700;">₹${capex} Cr</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Debt Required:</td>
            <td style="padding: 6px 0; color: #1e3a8a; font-weight: 700;">₹${loan} Cr</td>
          </tr>
        </table>
      </div>
      <p style="font-size: 14px; line-height: 22px; color: #334155;">
        Our team of Chartered Accountants and Underwriting Analysts is reviewing your capital structure and DSCR viability. We will reach out within 24 business hours to discuss your Detailed Project Report (DPR) and bank sanction roadmap.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin: 24px 0 0;">Inisio Capital Advisory Team</p>
    </div>
  </div>
</body>
</html>
  `;

  if (lead.email) {
    sendEmail(
      {
        to: lead.email,
        subject: `Assessment Received: ${projectName} - Inisio Project Advisory`,
        text: `Dear ${promoterName}, we have received your project assessment for ${projectName} (₹${capex} Cr Capex, ₹${loan} Cr Loan). Our advisory desk will contact you within 24 hours.`,
        html: userHtml,
      },
      { type: 'lead_confirmation' }
    ).catch(() => {});
  }

  // Admin Notification
  const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: #1e40af; padding: 24px 32px;">
      <span style="display:inline-block; background: #fbbf24; color: #000; font-weight: bold; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">NEW GREENFIELD LEAD</span>
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">📊 Project Assessment Submission</h2>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 14px; color: #334155;">A new project lead was generated from the platform assessment tool:</p>
      <ul style="font-size: 14px; color: #0f172a; line-height: 1.8;">
        <li><strong>Promoter:</strong> ${promoterName}</li>
        <li><strong>Mobile:</strong> ${lead.mobile || lead.phone || 'N/A'}</li>
        <li><strong>Email:</strong> ${lead.email || 'N/A'}</li>
        <li><strong>Company:</strong> ${lead.companyName || lead.company || 'N/A'}</li>
        <li><strong>Project:</strong> ${projectName}</li>
        <li><strong>Total Capex:</strong> ₹${capex} Cr</li>
        <li><strong>Loan Requirement:</strong> ₹${loan} Cr</li>
        <li><strong>Location:</strong> ${lead.location || 'India'}</li>
      </ul>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail(
    {
      to: adminEmail,
      subject: `[New Lead] ${promoterName} - ${projectName} (₹${capex} Cr)`,
      text: `New lead from ${promoterName}: ${projectName}, Capex ₹${capex} Cr, Loan ₹${loan} Cr, Mobile: ${lead.mobile || lead.phone}`,
      html: adminHtml,
    },
    { type: 'lead_admin' }
  ).catch(() => {});
};

/**
 * 6. Consultation Booking Confirmation Email
 */
export const sendConsultationConfirmationEmail = async ({
  to,
  name,
  fullName,
  companyName,
  company,
  projectCostCr,
  capexAmount,
  totalCostCr,
}) => {
  const promoterName = (name || fullName || 'Promoter').trim();
  const rawCompany = (companyName || company || '').trim();
  const companyDisplay = rawCompany ? rawCompany : 'your company';

  const rawCapex = projectCostCr || capexAmount || totalCostCr || '';
  const digitsCapex = String(rawCapex).replace(/[₹\s,a-zA-Z]/g, '').trim();
  const capexDisplay = digitsCapex ? `₹${digitsCapex} Cr ` : (rawCapex ? `₹${rawCapex} ` : '');

  const textContent = `Hi ${promoterName},\n\nThanks for reaching out. We have successfully received your consultation request for ${companyDisplay} regarding your ${capexDisplay}project.\n\nA Senior Advisory CA will review your submission and contact you within 24 hours to discuss your bankability and debt syndication strategy.\n\nIf you have immediate questions, you can reach our advisory desk directly on WhatsApp at +91 63020 26462.\n\nBest regards,\nThe Inisio Advisory Team`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Inisio Consultation is Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; line-height: 1.6;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
    
    <div style="background-color: #1e3a8a; padding: 28px 32px; text-align: center;">
      <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #ffffff; color: #1e3a8a; border-radius: 12px; font-weight: 900; font-size: 20px; margin-bottom: 12px;">
        IN
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
        INISIO CAPITAL
      </h1>
      <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">
        Greenfield Project Advisory & Bank Syndication Desk
      </p>
    </div>

    <div style="padding: 32px;">
      <p style="font-size: 15px; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
        Hi <strong>${promoterName}</strong>,
      </p>

      <p style="font-size: 14px; line-height: 22px; color: #334155; margin-bottom: 18px;">
        Thanks for reaching out. We have successfully received your consultation request for <strong>${companyDisplay}</strong> regarding your <strong>${capexDisplay}project</strong>.
      </p>

      <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13.5px; line-height: 20px; color: #1e3a8a; font-weight: 500;">
          A Senior Advisory CA will review your submission and contact you within 24 hours to discuss your bankability and debt syndication strategy.
        </p>
      </div>

      <p style="font-size: 14px; line-height: 22px; color: #334155; margin-bottom: 24px;">
        If you have immediate questions, you can reach our advisory desk directly on WhatsApp at <a href="https://wa.me/916302026462" style="color: #2563eb; font-weight: 700; text-decoration: none;">+91 63020 26462</a>.
      </p>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px;">
        <p style="font-size: 14px; color: #334155; margin: 0 0 4px 0; font-weight: 600;">
          Best regards,
        </p>
        <p style="font-size: 14px; color: #1e3a8a; margin: 0; font-weight: 700;">
          The Inisio Advisory Team
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail(
    {
      to,
      subject: `Your Inisio Consultation is Confirmed`,
      text: textContent,
      html: htmlContent,
    },
    { type: 'consultation' }
  );
};

export default {
  sendEmail,
  sendMailWithResilience,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendContactEnquiryAlertEmail,
  sendLeadAssessmentConfirmationEmail,
  sendConsultationConfirmationEmail,
};
