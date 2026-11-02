/**
 * HTML Email Templates and System Constants
 */

export const FORGET_PASSWORD_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Spectrum Password</title>
  <style>
    body, table, td, p, a, div {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #031612 !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 48px 16px; background-color: #031612; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #031612;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; width: 100%; background-color: #07211b; border: 1px solid #134538; border-radius: 22px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);">
          
          <!-- Card Content Body -->
          <tr>
            <td style="padding: 44px 34px 34px 34px; background: radial-gradient(circle at 50% 20%, #0d382d 0%, #07211b 75%);">
              
              <!-- Plug Icon (Pure HTML/CSS - Never stripped by email clients) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; width: 58px; height: 58px; background-color: #00df82; border-radius: 16px; box-shadow: 0 8px 24px rgba(0, 223, 130, 0.35);">
                <tr>
                  <td align="center" valign="middle" style="padding: 11px 0 9px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td style="padding-right: 4px; vertical-align: top;">
                          <div style="width: 4.5px; height: 16px; background-color: #ffffff; border-radius: 2.5px; font-size: 0; line-height: 0;">&nbsp;</div>
                        </td>
                        <td style="padding-left: 4px; vertical-align: top;">
                          <div style="width: 4.5px; height: 16px; background-color: #ffffff; border-radius: 2.5px; font-size: 0; line-height: 0;">&nbsp;</div>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" align="center" style="padding-top: 4px;">
                          <div style="width: 6.5px; height: 6.5px; background-color: #ffffff; border-radius: 50%; font-size: 0; line-height: 0; margin: 0 auto;">&nbsp;</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Brand Name -->
              <div align="center" style="font-size: 20px; font-weight: 700; color: #00df82; letter-spacing: -0.3px; margin-top: 12px;">
                spectrum
              </div>

              <!-- Main Title -->
              <div align="center" style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; margin-top: 28px; margin-bottom: 12px;">
                Hello {{NAME}}!
              </div>

              <!-- Subtitle -->
              <div align="center" style="font-size: 14.5px; line-height: 1.6; color: #8fa89b; max-width: 360px; margin: 0 auto 12px auto;">
                We received a request to reset the password for your Spectrum account.
              </div>
              <div align="center" style="font-size: 14.5px; line-height: 1.6; color: #8fa89b; margin-bottom: 26px;">
                Use the verification code below to continue:
              </div>

              <!-- Verification Code Digits -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 28px auto;">
                <tr>
                  {{CODE_BOXES}}
                </tr>
              </table>

              <!-- Security Notice Card (Shield Box) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #092c23; border: 1px solid #114c3d; border-radius: 14px; margin-bottom: 26px;">
                <tr>
                  <td width="36" valign="middle" style="padding: 16px 0 16px 18px;">
                    <!-- Pure CSS Shield with Lock - Bulletproof in all email clients -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 30px; height: 34px; border: 2px solid #00df82; border-radius: 6px 6px 16px 16px; margin: 0 auto;">
                      <tr>
                        <td align="center" valign="middle" style="padding-top: 5px; padding-bottom: 4px;">
                          <!-- Shackle -->
                          <div style="width: 8px; height: 6px; border: 2px solid #00df82; border-bottom: none; border-radius: 4px 4px 0 0; font-size: 0; line-height: 0; margin: 0 auto;">&nbsp;</div>
                          <!-- Lock Body -->
                          <div style="width: 12px; height: 9px; background-color: #00df82; border-radius: 2px; font-size: 0; line-height: 0; margin: 0 auto;">
                            <!-- Keyhole -->
                            <div style="width: 2px; height: 4px; background-color: #092c23; margin: 2px auto 0; font-size: 0; line-height: 0;">&nbsp;</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding: 16px 18px 16px 14px;">
                    <div style="color: #ffffff; font-size: 14px; font-weight: 600; line-height: 1.4;">
                      This code will expire in {{EXPIRATION_MINUTES}} minutes.
                    </div>
                    <div style="color: #8fa89b; font-size: 13px; line-height: 1.4; margin-top: 4px;">
                      For your security, do not share this code with anyone.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top: 1px solid #113e33; margin: 0 0 24px 0; font-size: 0; line-height: 0;">&nbsp;</div>

              <!-- Didn't Request Info -->
              <div style="margin-bottom: 24px;">
                <div style="color: #ffffff; font-size: 14px; font-weight: 600; line-height: 1.4; margin-bottom: 4px;">
                  Didn’t request a password reset?
                </div>
                <div style="color: #8fa89b; font-size: 13px; line-height: 1.5;">
                  You can safely ignore this email. Your account will remain secure.
                </div>
              </div>

              <!-- Divider -->
              <div style="border-top: 1px solid #113e33; margin: 0 0 22px 0; font-size: 0; line-height: 0;">&nbsp;</div>

              <!-- Footer (No Social Icons) -->
              <div>
                <div style="color: #8fa89b; font-size: 13.5px; line-height: 1.6;">
                  Thanks,<br />
                  <span style="color: #ffffff; font-weight: 600;">The Spectrum Team</span>
                </div>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * Generates HTML for the 6-digit OTP code boxes matching the design
 */
export function generateOtpCodeBoxesHtml(code: string): string {
  const digits = (code || "000000").slice(0, 6).split("");
  return digits
    .map(
      (digit) => `
        <td align="center" valign="middle" style="padding: 0 4px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 48px; height: 60px; background-color: #041713; border: 1.5px solid #005a3e; border-radius: 12px; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);">
            <tr>
              <td align="center" valign="middle" style="width: 48px; height: 60px; font-size: 28px; font-weight: 700; color: #00df82; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
                ${digit}
              </td>
            </tr>
          </table>
        </td>`,
    )
    .join("");
}

/**
 * Replaces variables in FORGET_PASSWORD_EMAIL_TEMPLATE with provided data
 */
export function renderForgetPasswordEmailHtml(data: {
  code: string;
  name?: string;
  expirationMinutes?: number;
}): string {
  const name = data.name ? data.name : "there";
  const codeBoxes = generateOtpCodeBoxesHtml(data.code);
  const expirationMinutes = (data.expirationMinutes ?? 10).toString();

  return FORGET_PASSWORD_EMAIL_TEMPLATE
    .replace("{{NAME}}", name)
    .replace("{{CODE_BOXES}}", codeBoxes)
    .replace("{{EXPIRATION_MINUTES}}", expirationMinutes);
}

export const ACTIVATION_EMAIL_TEMPLATE_AR = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>تفعيل حسابك في سبيكتروم</title>
  <style>
    body, table, td, p, a, div {
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #031612 !important;
      direction: rtl;
    }
  </style>
</head>
<body style="margin: 0; padding: 48px 16px; background-color: #031612; direction: rtl; font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #031612; direction: rtl;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; width: 100%; background-color: #07211b; border: 1px solid #134538; border-radius: 22px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6); direction: rtl;">
          
          <!-- Card Content Body -->
          <tr>
            <td style="padding: 44px 34px 34px 34px; background: radial-gradient(circle at 50% 20%, #0d382d 0%, #07211b 75%);">
              
              <!-- Plug Icon (Pure HTML/CSS - Never stripped by email clients) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; width: 58px; height: 58px; background-color: #00df82; border-radius: 16px; box-shadow: 0 8px 24px rgba(0, 223, 130, 0.35);">
                <tr>
                  <td align="center" valign="middle" style="padding: 11px 0 9px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td style="padding-right: 4px; vertical-align: top;">
                          <div style="width: 4.5px; height: 16px; background-color: #ffffff; border-radius: 2.5px; font-size: 0; line-height: 0;">&nbsp;</div>
                        </td>
                        <td style="padding-left: 4px; vertical-align: top;">
                          <div style="width: 4.5px; height: 16px; background-color: #ffffff; border-radius: 2.5px; font-size: 0; line-height: 0;">&nbsp;</div>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" align="center" style="padding-top: 4px;">
                          <div style="width: 6.5px; height: 6.5px; background-color: #ffffff; border-radius: 50%; font-size: 0; line-height: 0; margin: 0 auto;">&nbsp;</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Brand Name -->
              <div align="center" style="font-size: 20px; font-weight: 700; color: #00df82; letter-spacing: -0.3px; margin-top: 12px;">
                spectrum
              </div>

              <!-- Main Title -->
              <div align="center" style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; margin-top: 28px; margin-bottom: 12px;">
                مرحباً {{NAME}}!
              </div>

              <!-- Subtitle -->
              <div align="center" style="font-size: 14.5px; line-height: 1.6; color: #8fa89b; max-width: 360px; margin: 0 auto 12px auto;">
                شكراً لانضمامك إلى منصة سبيكتروم لإدارة الأجهزة الذكية والأمان الكهربائي.
              </div>
              <div align="center" style="font-size: 14.5px; line-height: 1.6; color: #8fa89b; margin-bottom: 26px;">
                استخدم رمز التحقق أدناه لتفعيل حسابك في التطبيق:
              </div>

              <!-- Verification Code Digits (LTR for numbers) -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" dir="ltr" style="margin: 0 auto 28px auto; direction: ltr;">
                <tr>
                  {{CODE_BOXES}}
                </tr>
              </table>

              <!-- Security Notice Card (Shield Box) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #092c23; border: 1px solid #114c3d; border-radius: 14px; margin-bottom: 26px; direction: rtl;">
                <tr>
                  <td width="36" valign="middle" style="padding: 16px 18px 16px 0;">
                    <!-- Pure CSS Shield with Lock - Bulletproof in all email clients -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 30px; height: 34px; border: 2px solid #00df82; border-radius: 6px 6px 16px 16px; margin: 0 auto;">
                      <tr>
                        <td align="center" valign="middle" style="padding-top: 5px; padding-bottom: 4px;">
                          <!-- Shackle -->
                          <div style="width: 8px; height: 6px; border: 2px solid #00df82; border-bottom: none; border-radius: 4px 4px 0 0; font-size: 0; line-height: 0; margin: 0 auto;">&nbsp;</div>
                          <!-- Lock Body -->
                          <div style="width: 12px; height: 9px; background-color: #00df82; border-radius: 2px; font-size: 0; line-height: 0; margin: 0 auto;">
                            <!-- Keyhole -->
                            <div style="width: 2px; height: 4px; background-color: #092c23; margin: 2px auto 0; font-size: 0; line-height: 0;">&nbsp;</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding: 16px 14px 16px 18px; text-align: right;">
                    <div style="color: #ffffff; font-size: 14px; font-weight: 600; line-height: 1.4;">
                      صلاحية هذا الرمز تنتهي خلال {{EXPIRATION_MINUTES}} دقيقة.
                    </div>
                    <div style="color: #8fa89b; font-size: 13px; line-height: 1.4; margin-top: 4px;">
                      لأمان حسابك، لا تشارك هذا الرمز مع أي شخص آخر.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top: 1px solid #113e33; margin: 0 0 24px 0; font-size: 0; line-height: 0;">&nbsp;</div>

              <!-- Didn't Request Info -->
              <div style="margin-bottom: 24px; text-align: right;">
                <div style="color: #ffffff; font-size: 14px; font-weight: 600; line-height: 1.4; margin-bottom: 4px;">
                  لم تقم بإنشاء حساب في سبيكتروم؟
                </div>
                <div style="color: #8fa89b; font-size: 13px; line-height: 1.5;">
                  يمكنك تجاهل هذا البريد الإلكتروني بأمان. لن يتم تفعيل أي حساب دون إدخال الرمز.
                </div>
              </div>

              <!-- Divider -->
              <div style="border-top: 1px solid #113e33; margin: 0 0 22px 0; font-size: 0; line-height: 0;">&nbsp;</div>

              <!-- Footer (No Social Icons) -->
              <div style="text-align: right;">
                <div style="color: #8fa89b; font-size: 13.5px; line-height: 1.6;">
                  شكراً لك،<br />
                  <span style="color: #ffffff; font-weight: 600;">فريق عمل سبيكتروم</span>
                </div>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const ACTIVATION_EMAIL_TEMPLATE_EN = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Activate Your Spectrum Account</title>
  <style>
    body, table, td, p, a, div {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #031612 !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 48px 16px; background-color: #031612; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #031612;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; width: 100%; background-color: #07211b; border: 1px solid #134538; border-radius: 22px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);">
          
          <!-- Card Content Body -->
          <tr>
            <td style="padding: 44px 34px 34px 34px; background: radial-gradient(circle at 50% 20%, #0d382d 0%, #07211b 75%);">
              
              <!-- Plug Icon (Pure HTML/CSS - Never stripped by email clients) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; width: 58px; height: 58px; background-color: #00df82; border-radius: 16px; box-shadow: 0 8px 24px rgba(0, 223, 130, 0.35);">
                <tr>
                  <td align="center" valign="middle" style="padding: 11px 0 9px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td style="padding-right: 4px; vertical-align: top;">
                          <div style="width: 4.5px; height: 16px; background-color: #ffffff; border-radius: 2.5px; font-size: 0; line-height: 0;">&nbsp;</div>
                        </td>
                        <td style="padding-left: 4px; vertical-align: top;">
                          <div style="width: 4.5px; height: 16px; background-color: #ffffff; border-radius: 2.5px; font-size: 0; line-height: 0;">&nbsp;</div>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" align="center" style="padding-top: 4px;">
                          <div style="width: 6.5px; height: 6.5px; background-color: #ffffff; border-radius: 50%; font-size: 0; line-height: 0; margin: 0 auto;">&nbsp;</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Brand Name -->
              <div align="center" style="font-size: 20px; font-weight: 700; color: #00df82; letter-spacing: -0.3px; margin-top: 12px;">
                spectrum
              </div>

              <!-- Main Title -->
              <div align="center" style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; margin-top: 28px; margin-bottom: 12px;">
                Hello {{NAME}}!
              </div>

              <!-- Subtitle -->
              <div align="center" style="font-size: 14.5px; line-height: 1.6; color: #8fa89b; max-width: 360px; margin: 0 auto 12px auto;">
                We received a request to activate your Spectrum account.
              </div>
              <div align="center" style="font-size: 14.5px; line-height: 1.6; color: #8fa89b; margin-bottom: 26px;">
                Use the verification code below to continue:
              </div>

              <!-- Verification Code Digits -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 28px auto;">
                <tr>
                  {{CODE_BOXES}}
                </tr>
              </table>

              <!-- Security Notice Card (Shield Box) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #092c23; border: 1px solid #114c3d; border-radius: 14px; margin-bottom: 26px;">
                <tr>
                  <td width="36" valign="middle" style="padding: 16px 0 16px 18px;">
                    <!-- Pure CSS Shield with Lock - Bulletproof in all email clients -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 30px; height: 34px; border: 2px solid #00df82; border-radius: 6px 6px 16px 16px; margin: 0 auto;">
                      <tr>
                        <td align="center" valign="middle" style="padding-top: 5px; padding-bottom: 4px;">
                          <!-- Shackle -->
                          <div style="width: 8px; height: 6px; border: 2px solid #00df82; border-bottom: none; border-radius: 4px 4px 0 0; font-size: 0; line-height: 0; margin: 0 auto;">&nbsp;</div>
                          <!-- Lock Body -->
                          <div style="width: 12px; height: 9px; background-color: #00df82; border-radius: 2px; font-size: 0; line-height: 0; margin: 0 auto;">
                            <!-- Keyhole -->
                            <div style="width: 2px; height: 4px; background-color: #092c23; margin: 2px auto 0; font-size: 0; line-height: 0;">&nbsp;</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding: 16px 18px 16px 14px;">
                    <div style="color: #ffffff; font-size: 14px; font-weight: 600; line-height: 1.4;">
                      This code will expire in {{EXPIRATION_MINUTES}} minutes.
                    </div>
                    <div style="color: #8fa89b; font-size: 13px; line-height: 1.4; margin-top: 4px;">
                      For your security, do not share this code with anyone.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top: 1px solid #113e33; margin: 0 0 24px 0; font-size: 0; line-height: 0;">&nbsp;</div>

              <!-- Didn't Request Info -->
              <div style="margin-bottom: 24px;">
                <div style="color: #ffffff; font-size: 14px; font-weight: 600; line-height: 1.4; margin-bottom: 4px;">
                  Didn’t request an account?
                </div>
                <div style="color: #8fa89b; font-size: 13px; line-height: 1.5;">
                  You can safely ignore this email. Your account will remain secure.
                </div>
              </div>

              <!-- Divider -->
              <div style="border-top: 1px solid #113e33; margin: 0 0 22px 0; font-size: 0; line-height: 0;">&nbsp;</div>

              <!-- Footer (No Social Icons) -->
              <div>
                <div style="color: #8fa89b; font-size: 13.5px; line-height: 1.6;">
                  Thanks,<br />
                  <span style="color: #ffffff; font-weight: 600;">The Spectrum Team</span>
                </div>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export interface RenderActivationEmailOptions {
  name: string;
  code?: string;
  expirationMinutes?: number;
  language?: "ar" | "en";
  token?: string;
  activationUrl?: string;
  mobileDeepLink?: string;
}

/**
 * Renders localized HTML email template for account activation matching brand design
 */
export function renderActivationEmailHtml(
  options: RenderActivationEmailOptions,
): string {
  const {
    name,
    code = "000000",
    expirationMinutes = 60,
    language = "ar",
  } = options;

  const isAr = language === "ar";
  const template = isAr
    ? ACTIVATION_EMAIL_TEMPLATE_AR
    : ACTIVATION_EMAIL_TEMPLATE_EN;

  const codeBoxes = generateOtpCodeBoxesHtml(code);
  const fallbackName = isAr ? "مستخدم سبيكتروم" : "there";

  return template
    .replace("{{NAME}}", name?.trim() || fallbackName)
    .replace("{{CODE_BOXES}}", codeBoxes)
    .replace("{{EXPIRATION_MINUTES}}", expirationMinutes.toString());
}

