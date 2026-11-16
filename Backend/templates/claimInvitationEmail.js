/**
 * Inisio Advisory - CA Claim Invitation Email Template
 * Editable template styled with Inisio brand colors (#2563eb, #0f172a, #f8fafc)
 */

export let claimInvitationTemplate = {
  subject: 'Claim Your Inisio Chartered Accountant (CA) Portal & Network Access',
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim Your Inisio CA Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 40px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px;">
                      Chartered Accountant Network
                    </span>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; line-height: 1.2;">Inisio Capital Advisory</h1>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Greenfield Infrastructure & Commercial Underwriting Network</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #0f172a;">Dear {{name}},</p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                We are pleased to invite you and <strong>{{firmName}}</strong> to claim your pre-verified professional profile on the <strong>Inisio Advisory Platform</strong>.
              </p>

              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">Invitation Reference</p>
                <p style="margin: 0; font-size: 13px; color: #1e3a8a;">Source Tag: <strong>{{sourceTag}}</strong> | Expiry: <strong>{{expiryDays}} Days</strong></p>
              </div>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                By claiming your dedicated CA Audit Desk, you gain immediate access to:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #334155;">
                    <span style="color: #2563eb; font-weight: bold; margin-right: 8px;">✓</span> <strong>CMA & Audit Reviews:</strong> Direct review pipelines for client debt syndication & project appraisals.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #334155;">
                    <span style="color: #2563eb; font-weight: bold; margin-right: 8px;">✓</span> <strong>Own & Inisio Leads:</strong> Track incoming client leads and assess enterprise viability.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #334155;">
                    <span style="color: #2563eb; font-weight: bold; margin-right: 8px;">✓</span> <strong>Consultant Network:</strong> One-click collaboration with regional DPR & technical consultants.
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #2563eb; border-radius: 12px;">
                    <a href="{{claimUrl}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.2px;">
                      Claim My CA Profile & Activate Portal →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Or copy and paste this link into your browser:<br>
                <a href="{{claimUrl}}" style="color: #2563eb; word-break: break-all; font-size: 11px;">{{claimUrl}}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 600;">
                Inisio Capital Advisory • Greenfield Project Financing & Syndication
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This invitation link is intended exclusively for {{email}}. If you received this in error, please disregard.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
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
  };
};

export const updateClaimInvitationTemplate = (updates) => {
  if (updates.subject) claimInvitationTemplate.subject = updates.subject;
  if (updates.html) claimInvitationTemplate.html = updates.html;
  return claimInvitationTemplate;
};
