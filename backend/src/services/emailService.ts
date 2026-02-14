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

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.getClient().emails.send({
      from: RESEND_CONFIG.FROM_EMAIL,
      to: email,
      subject: 'Your AstroMind verification code',
      html: this.buildTemplate(code),
    });
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private buildTemplate(code: string): string {
    const safeCode = this.escapeHtml(code);
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;border:1px solid rgba(212,175,55,0.2);">
        <tr><td style="padding:40px 32px;text-align:center;">
          <h1 style="color:#d4af37;font-size:24px;margin:0 0 8px;">AstroMind</h1>
          <p style="color:#a0a0b8;font-size:14px;margin:0 0 32px;">Verify your email to create your account</p>
          <div style="background:#0f0f1a;border-radius:12px;padding:24px;margin:0 0 24px;">
            <p style="color:#a0a0b8;font-size:13px;margin:0 0 12px;letter-spacing:0.5px;">YOUR VERIFICATION CODE</p>
            <p style="color:#d4af37;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;">${safeCode}</p>
          </div>
          <p style="color:#a0a0b8;font-size:13px;margin:0;">This code expires in <strong style="color:#e0e0f0;">10 minutes</strong>.</p>
          <p style="color:#666680;font-size:12px;margin:24px 0 0;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}

export const emailService = new EmailService();
