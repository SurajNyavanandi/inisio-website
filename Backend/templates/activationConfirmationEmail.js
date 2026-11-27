/**
 * Activation Confirmation Email Template sent after CA activates their profile.
 * Clean, responsive HTML email with safe variable escaping and live template editing support.
 */

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeUrl = (url) => {
  const trimmed = String(url || '').trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://inisio.in';
};

export let activationConfirmationTemplate = {
  subject: 'Welcome to Inisio Capital — Your CA Audit Desk is Active',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CA Profile Activated</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;border-bottom:3px solid #10b981;">
              <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">INISIO CAPITAL</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:4px;font-weight:500;">CA Audit &amp; CMA Underwriting Network</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="display:inline-block;padding:4px 12px;background-color:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:9999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">
                Profile Active &bull; Verified CA Partner
              </div>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
                Welcome aboard, {{name}}!
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#475569;">
                Your Chartered Accountant profile for <strong>{{firmName}}</strong> has been verified and activated on the Inisio Capital platform.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#475569;">
                You can now sign in anytime to your dedicated <strong>CA Audit Desk</strong> to review assigned promoter project files, examine CAPEX and DSCR schedules, and submit underwriting remarks.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#10b981" style="border-radius:10px;">
                    <a href="{{loginUrl}}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                      Open CA Audit Desk &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="padding:16px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#334155;">Account Details</p>
                <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                  <strong>Registered Email:</strong> {{email}}<br />
                  <strong>Firm:</strong> {{firmName}}<br />
                  <strong>Partner Role:</strong> Verified Chartered Accountant (CA)<br />
                  <strong>Reference Tag:</strong> {{sourceTag}}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} Inisio Capital &bull; Institutional Project Finance Desk
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim(),
  text: `Welcome aboard, {{name}}!

Your Chartered Accountant profile for {{firmName}} has been verified and activated on Inisio Capital.

Sign in to your CA Audit Desk:
{{loginUrl}}

Registered Email: {{email}}
Firm: {{firmName}}
Reference Tag: {{sourceTag}}

Regards,
Inisio Capital Team`,
};

export const updateActivationConfirmationTemplate = ({ subject, html, text } = {}) => {
  if (typeof subject === 'string' && subject.trim()) {
    activationConfirmationTemplate.subject = subject.trim();
  }
  if (typeof html === 'string' && html.trim()) {
    activationConfirmationTemplate.html = html;
  }
  if (typeof text === 'string' && text.trim()) {
    activationConfirmationTemplate.text = text;
  }
  return activationConfirmationTemplate;
};

export const renderActivationConfirmationEmail = (vars = {}, templateOverride = null) => {
  const tpl = templateOverride || activationConfirmationTemplate;
  const cleanName = String(vars?.name || 'Partner').trim() || 'Partner';
  const cleanFirm =
    String(vars?.firmName || 'Chartered Accountancy Practice').trim() ||
    'Chartered Accountancy Practice';
  const cleanEmail = String(vars?.email || '').trim();
  const cleanTag = String(vars?.sourceTag || 'WOFA-2026').trim() || 'WOFA-2026';
  const safeUrl = sanitizeUrl(vars?.loginUrl);

  const replaceVars = (str, { html = false } = {}) => {
    const val = (v) => (html ? escapeHtml(v) : String(v ?? ''));
    return String(str || '')
      .replace(/\{\{\s*name\s*\}\}|\{\s*name\s*\}/gi, val(cleanName))
      .replace(/\{\{\s*firmName\s*\}\}|\{\s*firmName\s*\}/gi, val(cleanFirm))
      .replace(/\{\{\s*email\s*\}\}|\{\s*email\s*\}/gi, val(cleanEmail))
      .replace(/\{\{\s*loginUrl\s*\}\}|\{\s*loginUrl\s*\}/gi, val(safeUrl))
      .replace(/\{\{\s*sourceTag\s*\}\}|\{\s*sourceTag\s*\}/gi, val(cleanTag));
  };

  return {
    subject: replaceVars(tpl.subject || activationConfirmationTemplate.subject, { html: false }),
    html: replaceVars(tpl.html || tpl.htmlBody || activationConfirmationTemplate.html, { html: true }),
    text: replaceVars(tpl.text || tpl.textBody || activationConfirmationTemplate.text, { html: false }),
  };
};
