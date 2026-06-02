import { Resend } from 'resend';
import { RESEND_CONFIG } from '../config/auth.js';

class EmailService {
  private resend: Resend | null = null;

  private getClient(): Resend {
    if (!this.resend) {
      this.resend = new Resend(RESEND_CONFIG.API_KEY);
    }
    return this.resend;
  }

  private async send(params: { to: string; subject: string; html: string }): Promise<void> {
    const { data, error } = await this.getClient().emails.send({
      from: RESEND_CONFIG.FROM_EMAIL,
      ...params,
    });
    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
    console.log(`Email sent to ${this.maskEmail(params.to)}: ${data?.id}`);
  }

  private maskEmail(email: string): string {
    const at = email.indexOf('@');
    if (at <= 0) return '***';
    return `${email[0]}***@${email.slice(at + 1)}`;
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Your AstrologyWiki verification code',
      html: this.buildTemplate(code),
    });
  }

  async sendPaymentReceipt(email: string, details: {
    amount: string;
    currency: string;
    description: string;
    transactionId: string;
    date: string;
  }): Promise<void> {
    const safe = {
      amount: this.escapeHtml(details.amount),
      currency: this.escapeHtml(details.currency.toUpperCase()),
      description: this.escapeHtml(details.description),
      transactionId: this.escapeHtml(details.transactionId),
      date: this.escapeHtml(details.date),
    };
    await this.send({
      to: email,
      subject: `AstrologyWiki Payment Receipt — ${safe.amount} ${safe.currency}`,
      html: this.buildBaseTemplate(
        'Payment Confirmed',
        'Thank you for your purchase!',
        `
        <div style="background:#0f0f1a;border-radius:12px;padding:24px;margin:0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:8px 0;">Description</td>
              <td style="color:#e0e0f0;font-size:13px;padding:8px 0;text-align:right;">${safe.description}</td>
            </tr>
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:8px 0;">Amount</td>
              <td style="color:#d4af37;font-size:16px;font-weight:700;padding:8px 0;text-align:right;">${safe.amount} ${safe.currency}</td>
            </tr>
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:8px 0;">Date</td>
              <td style="color:#e0e0f0;font-size:13px;padding:8px 0;text-align:right;">${safe.date}</td>
            </tr>
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:8px 0;">Transaction ID</td>
              <td style="color:#e0e0f0;font-size:11px;padding:8px 0;text-align:right;word-break:break-all;">${safe.transactionId}</td>
            </tr>
          </table>
        </div>
        <a href="https://www.astrologywiki.com/settings" style="display:inline-block;background:#d4af37;color:#0f0f1a;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Manage Subscription</a>
        `,
      ),
    });
  }

  async sendPaymentFailedNotice(email: string, details: {
    subscriptionId: string;
    date: string;
  }): Promise<void> {
    const safe = {
      subscriptionId: this.escapeHtml(details.subscriptionId),
      date: this.escapeHtml(details.date),
    };
    await this.send({
      to: email,
      subject: 'AstrologyWiki — Action Required: Payment Failed',
      html: this.buildBaseTemplate(
        'Payment Failed',
        'We were unable to process your subscription payment.',
        `
        <div style="background:#0f0f1a;border-radius:12px;padding:24px;margin:0 0 24px;">
          <p style="color:#a0a0b8;font-size:13px;margin:0 0 8px;">Your subscription payment on <strong style="color:#e0e0f0;">${safe.date}</strong> could not be processed.</p>
          <p style="color:#a0a0b8;font-size:13px;margin:0;">Please update your payment method to continue enjoying AstrologyWiki Pro features.</p>
        </div>
        <a href="https://www.astrologywiki.com/settings" style="display:inline-block;background:#d4af37;color:#0f0f1a;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Update Payment Method</a>
        <p style="color:#666680;font-size:12px;margin:24px 0 0;">If you believe this is an error, please contact us at support@astrologywiki.com.</p>
        `,
      ),
    });
  }

  async sendCancellationConfirmation(email: string, details: {
    endDate: string;
  }): Promise<void> {
    const safe = { endDate: this.escapeHtml(details.endDate) };
    await this.send({
      to: email,
      subject: 'AstrologyWiki — Subscription Cancelled',
      html: this.buildBaseTemplate(
        'Subscription Cancelled',
        'Your subscription has been cancelled.',
        `
        <div style="background:#0f0f1a;border-radius:12px;padding:24px;margin:0 0 24px;">
          <p style="color:#a0a0b8;font-size:13px;margin:0 0 8px;">Your AstrologyWiki Pro subscription has been cancelled.</p>
          <p style="color:#a0a0b8;font-size:13px;margin:0;">You'll continue to have access to Pro features until <strong style="color:#d4af37;">${safe.endDate}</strong>.</p>
        </div>
        <p style="color:#a0a0b8;font-size:13px;margin:0 0 16px;">Changed your mind? You can resubscribe anytime.</p>
        <a href="https://www.astrologywiki.com/settings" style="display:inline-block;background:#d4af37;color:#0f0f1a;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Resubscribe</a>
        <p style="color:#666680;font-size:12px;margin:24px 0 0;">We'd love to have you back. If you have any feedback, email us at support@astrologywiki.com.</p>
        `,
      ),
    });
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private buildTemplate(code: string): string {
    const safeCode = this.escapeHtml(code);
    return this.buildBaseTemplate(
      'Verify Your Email',
      'Verify your email to create your account',
      `
      <div style="background:#0f0f1a;border-radius:12px;padding:24px;margin:0 0 24px;">
        <p style="color:#a0a0b8;font-size:13px;margin:0 0 12px;letter-spacing:0.5px;">YOUR VERIFICATION CODE</p>
        <p style="color:#d4af37;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;">${safeCode}</p>
      </div>
      <p style="color:#a0a0b8;font-size:13px;margin:0;">This code expires in <strong style="color:#e0e0f0;">10 minutes</strong>.</p>
      <p style="color:#666680;font-size:12px;margin:24px 0 0;">If you didn't request this, you can safely ignore this email.</p>
      `,
    );
  }

  private buildBaseTemplate(title: string, subtitle: string, content: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#1a1a2e;border-radius:16px;border:1px solid rgba(212,175,55,0.2);">
        <tr><td style="padding:40px 32px;text-align:center;">
          <h1 style="color:#d4af37;font-size:24px;margin:0 0 4px;">AstrologyWiki</h1>
          <p style="color:#e0e0f0;font-size:16px;font-weight:600;margin:0 0 4px;">${title}</p>
          <p style="color:#a0a0b8;font-size:14px;margin:0 0 32px;">${subtitle}</p>
          ${content}
        </td></tr>
      </table>
      <p style="color:#666680;font-size:11px;margin:16px 0 0;text-align:center;">&copy; ${new Date().getFullYear()} AstrologyWiki. All rights reserved.</p>
    </td></tr>
  </table>
</body>
</html>`;
  }
}

export const emailService = new EmailService();
