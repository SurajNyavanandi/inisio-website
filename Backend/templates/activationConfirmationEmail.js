/**
 * Inisio Advisory - CA Activation Confirmation Email Template
 * Editable template styled with Inisio brand colors (#2563eb, #0f172a, #f8fafc)
 */

export let activationConfirmationTemplate = {
  subject: 'Welcome to Inisio Advisory - Your CA Audit Desk is Active!',
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your CA Account is Active</title>
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
                    <span style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px;">
                      ✓ Verified Member
                    </span>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; line-height: 1.2;">Inisio Capital Advisory</h1>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">CA / CMA Network Accreditation Confirmed</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #0f172a;">Congratulations, {{name}}!</p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                Your Chartered Accountant profile for <strong>{{firmName}}</strong> has been successfully activated on the Inisio Capital Advisory platform.
              </p>

              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px 22px; border-radius: 12px; margin: 24px 0;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #166534;">Your Account Credentials & Details</h3>
                <p style="margin: 0 0 4px 0; font-size: 13px; color: #15803d;">Registered Email: <strong>{{email}}</strong></p>
                <p style="margin: 0 0 4px 0; font-size: 13px; color: #15803d;">Firm: <strong>{{firmName}}</strong></p>
                <p style="margin: 0; font-size: 13px; color: #15803d;">Accreditation Source: <strong>{{sourceTag}}</strong></p>
              </div>

              <!-- Call to Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #2563eb; border-radius: 12px;">
                    <a href="{{loginUrl}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.2px;">
                      Launch CA Audit Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 13px; color: #475569; line-height: 1.6;">
                Need help or have questions regarding syndicated banking pipelines? Reply directly to this email or reach our advisory desk at <a href="mailto:support@inisio.com" style="color: #2563eb; text-decoration: none;">support@inisio.com</a>.
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
                You are receiving this confirmation because your CA account was activated on Inisio.
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

export const renderActivationConfirmationEmail = ({
  name = 'Chartered Accountant',
  firmName = 'Independent CA Practice',
  email = '',
  loginUrl = '#',
  sourceTag = 'WOFA-2026',
}) => {
  let content = activationConfirmationTemplate.html;
  content = content.replace(/{{name}}/g, name);
  content = content.replace(/{{firmName}}/g, firmName);
  content = content.replace(/{{email}}/g, email);
  content = content.replace(/{{loginUrl}}/g, loginUrl);
  content = content.replace(/{{sourceTag}}/g, sourceTag);

  return {
    subject: activationConfirmationTemplate.subject,
    html: content,
  };
};

export const updateActivationConfirmationTemplate = (updates) => {
  if (updates.subject) activationConfirmationTemplate.subject = updates.subject;
  if (updates.html) activationConfirmationTemplate.html = updates.html;
  return activationConfirmationTemplate;
};
