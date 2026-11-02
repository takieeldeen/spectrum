import nodemailer, { Transporter } from "nodemailer";
import { BrevoClient } from "@getbrevo/brevo";
import {
  renderForgetPasswordEmailHtml,
  renderActivationEmailHtml,
  FORGET_PASSWORD_EMAIL_TEMPLATE,
} from "../constants";

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
  code?: string;
  language?: "ar" | "en";
}

export interface SendForgotPasswordMailOptions {
  to: string;
  code: string;
  name?: string;
  expirationMinutes?: number;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private brevoClient: BrevoClient | null = null;

  constructor() {
    this.initBrevo();
    this.initTransporter();
  }

  private initBrevo() {
    const apiKey = process.env.BREVO_API_KEY;
    if (apiKey) {
      this.brevoClient = new BrevoClient({ apiKey });
      console.log("✅ Brevo Email Client initialized successfully");
    } else {
      console.log(
        "ℹ️ BREVO_API_KEY not found in .env. Falling back to SMTP or simulated email.",
      );
    }
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
        "ℹ️ SMTP credentials not fully provided in .env. EmailService will log emails to console if Brevo is unavailable.",
      );
    }
  }

  /**
   * Sends an email using Brevo (with fallback to SMTP / simulated logging).
   * Supports calling with an email address string (sends dummy mail "Hello World")
   * or with a full SendMailOptions object.
   *
   * @param emailOrOptions Recipient email string OR SendMailOptions object
   * @param subject Optional email subject (defaults to "Hello World")
   * @param content Optional email body (defaults to "Hello World")
   */
  async sendMail(
    emailOrOptions: string | SendMailOptions,
    subject = "Hello World",
    content = "Hello World",
  ): Promise<any> {
    let to: string;
    let mailSubject: string;
    let htmlContent: string;
    let textContent: string;

    if (typeof emailOrOptions === "string") {
      to = emailOrOptions;
      mailSubject = subject;
      textContent = content;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <h2 style="color: #00a76f; margin-bottom: 12px;">⚡ Spectrum Smart System</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #334155;">${content}</p>
          <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 24px 0 12px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated message from Spectrum Smart Systems.</p>
        </div>
      `;
    } else {
      to = emailOrOptions.to;
      mailSubject = emailOrOptions.subject;
      htmlContent = emailOrOptions.html;
      textContent = emailOrOptions.text || emailOrOptions.html;
    }

    const senderEmail =
      process.env.BREVO_SENDER_EMAIL ||
      process.env.SMTP_USER ||
      "no-reply@spectrum.local";
    const senderName =
      process.env.BREVO_SENDER_NAME || "Spectrum Smart System";

    // 1. Send via Brevo if API key is provided
    if (this.brevoClient) {
      try {
        const response =
          await this.brevoClient.transactionalEmails.sendTransacEmail({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: to }],
            subject: mailSubject,
            htmlContent,
            textContent,
          });
        console.log(`📧 [Brevo] Email sent successfully to ${to}.`);
        return response;
      } catch (error: any) {
        console.error("❌ Failed to send email via Brevo:", error);
        throw error;
      }
    }

    // 2. Fallback to SMTP transporter
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const from = `"${senderName}" <${senderEmail}>`;
        const info = await transporter.sendMail({
          from,
          to,
          subject: mailSubject,
          html: htmlContent,
          text: textContent,
        });
        console.log(
          `📧 [SMTP] Email sent successfully to ${to}. MessageId: ${info.messageId}`,
        );
        return info;
      } catch (error) {
        console.error("❌ Failed to send email via SMTP:", error);
        throw error;
      }
    }

    // 3. Fallback to simulated email in console
    console.log("\n================== 📧 SIMULATED EMAIL ==================");
    console.log(`From:    "${senderName}" <${senderEmail}>`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${mailSubject}`);
    console.log("--------------------------------------------------------");
    console.log(textContent);
    console.log("========================================================\n");
    return { simulated: true, to, subject: mailSubject };
  }

  /**
   * Sends a formatted, localized activation email based on user language ('ar' or 'en')
   * Supports both 6-digit code for in-app verification and deep link / web link
   */
  async sendActivationEmail({
    to,
    name,
    token,
    code,
    language = "ar",
  }: SendActivationMailOptions): Promise<void> {
    const isAr = language === "ar";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const activationUrl = `${frontendUrl}/${language}/auth/activate?token=${encodeURIComponent(token)}`;
    const mobileDeepLink = `mobile://activate?token=${encodeURIComponent(token)}`;

    const subject = isAr
      ? "تفعيل حسابك في منصة سبيكتروم (Spectrum)"
      : "Activate your Spectrum Account";

    const html = renderActivationEmailHtml({
      name,
      code,
      expirationMinutes: 60,
      language,
    });

    const text = isAr
      ? `مرحباً ${name}، رمز تفعيل حسابك في تطبيق سبيكتروم هو: ${code || token}`
      : `Hello ${name}, your Spectrum account activation code is: ${code || token}`;

    await this.sendMail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Sends formatted, branded forgot password verification code email based on template in constants.ts
   * @param options Recipient email, 6-digit verification code, recipient name, and expiration
   */
  async sendForgotPasswordMail({
    to,
    code,
    name,
    expirationMinutes = 10,
  }: SendForgotPasswordMailOptions): Promise<any> {
    const html = renderForgetPasswordEmailHtml({
      code,
      name,
      expirationMinutes,
    });

    const subject = "Reset Your Spectrum Password";
    const text = `Hello ${name || "there"}!\n\nWe received a request to reset the password for your Spectrum account.\nUse the verification code below to continue:\n\n${code}\n\nThis code will expire in ${expirationMinutes} minutes.\nFor your security, do not share this code with anyone.\n\nDidn't request a password reset?\nYou can safely ignore this email. Your account will remain secure.\n\nThanks,\nThe Spectrum Team`;

    return await this.sendMail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Alias matching the prompt's naming: sendForgetPasswodMail
   */
  async sendForgetPasswodMail(
    options: SendForgotPasswordMailOptions,
  ): Promise<any> {
    return this.sendForgotPasswordMail(options);
  }

  /**
   * Alias matching sendForgetPasswordMail
   */
  async sendForgetPasswordMail(
    options: SendForgotPasswordMailOptions,
  ): Promise<any> {
    return this.sendForgotPasswordMail(options);
  }
}

export default new EmailService();
