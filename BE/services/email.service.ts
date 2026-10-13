import nodemailer, { Transporter } from "nodemailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendActivationMailOptions {
  to: string;
  name: string;
  token: string;
  language?: "ar" | "en";
}

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private getTransporter(): Transporter | null {
    if (!this.transporter) {
      this.initTransporter();
    }
    return this.transporter;
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      console.log(`✅ SMTP Transporter initialized: ${host}:${port} (${user})`);
    } else {
      console.log(
        "ℹ️ SMTP credentials not fully provided in .env. EmailService will log emails to console.",
      );
    }
  }

  /**
   * Generic sendMail method
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    const from =
      process.env.SMTP_FROM ||
      '"Spectrum Smart System" <no-reply@spectrum.local>';

    const transporter = this.getTransporter();

    if (!transporter) {
      console.log("\n================== 📧 SIMULATED EMAIL ==================");
      console.log(`From:    ${from}`);
      console.log(`To:      ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log("--------------------------------------------------------");
      console.log(options.text || options.html);
      console.log("========================================================\n");
      return;
    }

    try {
      const info = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`📧 Email sent successfully to ${options.to}. MessageId: ${info.messageId}`);
    } catch (error) {
      console.error("❌ Failed to send email via SMTP:", error);
      throw error;
    }
  }

  /**
   * Sends a formatted, localized activation email based on user language ('ar' or 'en')
   */
  async sendActivationEmail({
    to,
    name,
    token,
    language = "ar",
  }: SendActivationMailOptions): Promise<void> {
    const isAr = language === "ar";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const activationUrl = `${frontendUrl}/${language}/auth/activate?token=${encodeURIComponent(token)}`;

    const subject = isAr
      ? "تفعيل حسابك في منصة سبيكتروم (Spectrum)"
      : "Activate your Spectrum Account";

    const html = isAr
      ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 30px; direction: rtl; }
          .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; margin-bottom: 28px; }
          .logo { font-size: 26px; font-weight: 800; color: #00a76f; letter-spacing: 1px; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 12px; margin-bottom: 8px; }
          .content { font-size: 15px; line-height: 1.8; color: #cbd5e1; margin-bottom: 24px; }
          .token-box { background: #0f172a; border: 1px dashed #00a76f; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; word-break: break-all; }
          .token-label { font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
          .token-code { font-family: monospace; font-size: 16px; font-weight: 700; color: #34d399; letter-spacing: 1px; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { background-color: #00a76f; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(0, 167, 111, 0.4); }
          .footer { font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 20px; margin-top: 28px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚡ SPECTRUM</div>
            <div class="title">مرحباً بك يا ${name}!</div>
          </div>
          <div class="content">
            شكراً لانضمامك إلى منصة <strong>سبيكتروم</strong> لإدارة الأجهزة الذكية والأمان الكهربائي.<br>
            لتفعيل حسابك والبدء في إدارة مقابس وأجهزة الحماية، يرجى النقر على زر التفعيل أدناه أو استخدام رمز التفعيل المرفق:
          </div>
          <div class="btn-container">
            <a href="${activationUrl}" class="btn" target="_blank">تفعيل الحساب الآن</a>
          </div>
          <div class="token-box">
            <div class="token-label">رمز التفعيل المباشر:</div>
            <div class="token-code">${token}</div>
          </div>
          <div class="content" style="font-size: 13px; color: #94a3b8;">
            ⚠️ تنبيه: صلاحية هذا الرمز تنتهي خلال <strong>ساعة واحدة</strong> من تاريخ إرسال هذه الرسالة.
          </div>
          <div class="footer">
            إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان.<br>
            &copy; ${new Date().getFullYear()} Spectrum Smart Systems. جميع الحقوق محفوظة.
          </div>
        </div>
      </body>
      </html>
    `
      : `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 30px; direction: ltr; }
          .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; margin-bottom: 28px; }
          .logo { font-size: 26px; font-weight: 800; color: #00a76f; letter-spacing: 1px; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 12px; margin-bottom: 8px; }
          .content { font-size: 15px; line-height: 1.8; color: #cbd5e1; margin-bottom: 24px; }
          .token-box { background: #0f172a; border: 1px dashed #00a76f; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; word-break: break-all; }
          .token-label { font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
          .token-code { font-family: monospace; font-size: 16px; font-weight: 700; color: #34d399; letter-spacing: 1px; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { background-color: #00a76f; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(0, 167, 111, 0.4); }
          .footer { font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 20px; margin-top: 28px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚡ SPECTRUM</div>
            <div class="title">Welcome, ${name}!</div>
          </div>
          <div class="content">
            Thank you for signing up for <strong>Spectrum</strong> Smart Device & Safety Management.<br>
            To activate your account and start managing your power strips and safeguards, please click the button below:
          </div>
          <div class="btn-container">
            <a href="${activationUrl}" class="btn" target="_blank">Activate Account</a>
          </div>
          <div class="token-box">
            <div class="token-label">Direct Activation Token:</div>
            <div class="token-code">${token}</div>
          </div>
          <div class="content" style="font-size: 13px; color: #94a3b8;">
            ⚠️ Notice: This activation link and token expire in <strong>1 hour</strong>.
          </div>
          <div class="footer">
            If you did not request this account, please ignore this email.<br>
            &copy; ${new Date().getFullYear()} Spectrum Smart Systems. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const text = isAr
      ? `مرحباً ${name}، لتفعيل حسابك في سبيكتروم، افتح الرابط: ${activationUrl} أو استخدم رمز التفعيل: ${token} (صالح لمدة ساعة واحدة).`
      : `Hello ${name}, to activate your Spectrum account, visit: ${activationUrl} or use token: ${token} (valid for 1 hour).`;

    await this.sendMail({
      to,
      subject,
      html,
      text,
    });
  }
}

export default new EmailService();
