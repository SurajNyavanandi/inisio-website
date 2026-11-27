/**
 * Claim Invitation Email Template for Pre-Created CA Profiles
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

export let claimInvitationTemplate = {
  subject: 'Claim Your Chartered Accountant Profile on Inisio ({{sourceTag}})',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Claim Your CA Profile on Inisio</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;border-bottom:3px solid #2563eb;">
              <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">INISIO CAPITAL</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:4px;font-weight:500;">Institutional Project Advisory &amp; CA Network</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="display:inline-block;padding:4px 12px;background-color:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:9999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">
                {{sourceTag}} &bull; Partner Invitation
              </div>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
                Dear {{name}},
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#475569;">
                It was a pleasure connecting with you. We have created your pre-verified Chartered Accountant partner profile on <strong>Inisio Capital</strong> for <strong>{{firmName}}</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#475569;">
                By activating your profile, you get direct access to our <strong>CA Audit &amp; CMA Underwriting Desk</strong> to review institutional project funding proposals, inspect financials, and collaborate with verified promoters across India.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:10px;">
                    <a href="{{claimUrl}}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                      Claim &amp; Activate CA Profile &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="padding:16px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#334155;">Invitation Summary</p>
                <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                  <strong>Registered Email:</strong> {{email}}<br />
                  <strong>Practice / Firm:</strong> {{firmName}}<br />
                  <strong>Reference Tag:</strong> {{sourceTag}}<br />
                  <strong>Link Validity:</strong> {{expiryDays}} days
                </p>
              </div>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                If the button above does not open, copy and paste this direct activation link into your browser:<br />
                <a href="{{claimUrl}}" style="color:#2563eb;word-break:break-all;">{{claimUrl}}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} Inisio Capital &bull; Institutional Greenfield Project Finance Platform
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
  text: `Dear {{name}},

We have created your pre-verified Chartered Accountant partner profile on Inisio Capital for {{firmName}}.

Activate your CA Audit & CMA Underwriting Desk using the link below:
{{claimUrl}}

Registered Email: {{email}}
Practice / Firm: {{firmName}}
Reference Tag: {{sourceTag}}
Link Validity: {{expiryDays}} days

Regards,
Inisio Capital Team`,
};

export const updateClaimInvitationTemplate = ({ subject, html, text } = {}) => {
  if (typeof subject === 'string' && subject.trim()) {
    claimInvitationTemplate.subject = subject.trim();
  }
  if (typeof html === 'string' && html.trim()) {
    claimInvitationTemplate.html = html;
  }
  if (typeof text === 'string' && text.trim()) {
    claimInvitationTemplate.text = text;
  }
  return claimInvitationTemplate;
};

export const renderClaimInvitationEmail = (vars = {}, templateOverride = null) => {
  const tpl = templateOverride || claimInvitationTemplate;
  const cleanName = String(vars?.name || 'Partner').trim() || 'Partner';
  const cleanFirm =
    String(vars?.firmName || 'Chartered Accountancy Practice').trim() ||
    'Chartered Accountancy Practice';
  const cleanEmail = String(vars?.email || '').trim();
  const cleanTag = String(vars?.sourceTag || 'WOFA-2026').trim() || 'WOFA-2026';
  const cleanExpiry = String(vars?.expiryDays || 7).trim() || '7';
  const safeUrl = sanitizeUrl(vars?.claimUrl);

  const replaceVars = (str, { html = false } = {}) => {
    const val = (v) => (html ? escapeHtml(v) : String(v ?? ''));
    return String(str || '')
      .replace(/\{\{\s*name\s*\}\}|\{\s*name\s*\}/gi, val(cleanName))
      .replace(/\{\{\s*firmName\s*\}\}|\{\s*firmName\s*\}/gi, val(cleanFirm))
      .replace(/\{\{\s*email\s*\}\}|\{\s*email\s*\}/gi, val(cleanEmail))
      .replace(/\{\{\s*claimUrl\s*\}\}|\{\s*claimUrl\s*\}/gi, val(safeUrl))
      .replace(/\{\{\s*sourceTag\s*\}\}|\{\s*sourceTag\s*\}/gi, val(cleanTag))
      .replace(/\{\{\s*expiryDays\s*\}\}|\{\s*expiryDays\s*\}/gi, val(cleanExpiry));
  };

  return {
    subject: replaceVars(tpl.subject || claimInvitationTemplate.subject, { html: false }),
    html: replaceVars(tpl.html || tpl.htmlBody || claimInvitationTemplate.html, { html: true }),
    text: replaceVars(tpl.text || tpl.textBody || claimInvitationTemplate.text, { html: false }),
  };
};
