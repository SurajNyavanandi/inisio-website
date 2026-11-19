/**
 * Inisio Advisory - Minimalist CA Claim Invitation Email Template
 */

export let claimInvitationTemplate = {
  subject: 'Claim your Inisio CA account',
  html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Claim your Inisio CA account</title>
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
              <h1 style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#0f172a;">You are invited to join Inisio</h1>
              <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">Hi {{name}},</p>
              <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">
                Your Chartered Accountant profile for <strong>{{firmName}}</strong> is ready on Inisio. Activate your account to review client projects, CMA models, and DPR pipelines.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:9px 12px;font-size:13px;color:#64748b;background-color:#f8fafc;width:36%;border-bottom:1px solid #e2e8f0;">Firm</td>
                  <td style="padding:9px 12px;font-size:13px;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;">{{firmName}}</td>
                </tr>
                <tr>
                  <td style="padding:9px 12px;font-size:13px;color:#64748b;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">Reference</td>
                  <td style="padding:9px 12px;font-size:13px;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;">{{sourceTag}}</td>
                </tr>
                <tr>
                  <td style="padding:9px 12px;font-size:13px;color:#64748b;background-color:#f8fafc;">Link Valid For</td>
                  <td style="padding:9px 12px;font-size:13px;font-weight:600;color:#0f172a;">{{expiryDays}} days</td>
                </tr>
              </table>
              <div style="margin:22px 0;">
                <a href="{{claimUrl}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px;">Activate CA Account</a>
              </div>
              <p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:#64748b;">
                If the button does not work, copy this link into your browser: <a href="{{claimUrl}}" style="color:#2563eb;word-break:break-all;">{{claimUrl}}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px;background-color:#f8fafc;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">Inisio Advisory · Intended for {{email}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
};

export const renderClaimInvitationEmail = ({
  name = 'Chartered Accountant',
  firmName = 'Independent CA Practice',
  email = '',
  claimUrl = '#',
  expiryDays = 7,
  sourceTag = 'WOFA-2026',
}) => {
  let content = claimInvitationTemplate.html;
  content = content.replace(/{{name}}/g, name);
  content = content.replace(/{{firmName}}/g, firmName);
  content = content.replace(/{{email}}/g, email);
  content = content.replace(/{{claimUrl}}/g, claimUrl);
  content = content.replace(/{{expiryDays}}/g, String(expiryDays));
  content = content.replace(/{{sourceTag}}/g, sourceTag);

  return {
    subject: claimInvitationTemplate.subject,
    html: content,
    text: `Hi ${name},\n\nYour CA profile for ${firmName} is ready on Inisio. Activate your account here (valid for ${expiryDays} days): ${claimUrl}\n\nInisio Advisory`,
  };
};

export const updateClaimInvitationTemplate = (updates) => {
  if (updates.subject) claimInvitationTemplate.subject = updates.subject;
  if (updates.html) claimInvitationTemplate.html = updates.html;
  return claimInvitationTemplate;
};
