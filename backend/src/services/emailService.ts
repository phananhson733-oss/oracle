// INPUT: resend SDK + RESEND_CONFIG（API key / FROM）+ logger。
// OUTPUT: emailService 单例 + WeeklyIssueEmail 类型 —— 验证码 / newsletter 双 opt-in 确认 / 周报 / 支付收据 / 失败 / 取消通知，统一暗黑金品牌模板，动态字段经 escapeHtml，周报与确认信带 RFC 8058 List-Unsubscribe 头。
// POS: 邮件发送服务；若更新此文件，务必更新本头注释与所属 services/FOLDER.md。

import { Resend } from 'resend';
import { RESEND_CONFIG } from '../config/auth.js';
import { logger } from "../utils/logger.js";

// Shape the weekly send needs from a newsletter_issues row. AI-generated text
// fields (subject/transit/lens/reflection) are escaped before they enter the
// HTML — they are model output and must never be trusted as markup.
// heroImageUrl is optional: when absent the email renders text-only.
export interface WeeklyIssueEmail {
  subject: string;
  heroImageUrl?: string | null;
  overviewTitle: string;
  overview: string;
  skyEvents: Array<{ dateLabel: string; title: string; guidance: string }>;
  moonMoments: Array<{ dateLabel: string; phase: string; note: string }>;
  lens: string;
  practice: string;
  reflection: string;
  featured: { title: string; blurb: string };
}

class EmailService {
  private resend: Resend | null = null;

  private getClient(): Resend {
    if (!this.resend) {
      this.resend = new Resend(RESEND_CONFIG.API_KEY);
    }
    return this.resend;
  }

  private async send(params: { to: string; subject: string; html: string; headers?: Record<string, string> }): Promise<void> {
    const { to, subject, html, headers } = params;
    const { data, error } = await this.getClient().emails.send({
      from: RESEND_CONFIG.FROM_EMAIL,
      to,
      subject,
      html,
      ...(headers ? { headers } : {}),
    });
    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
    logger.info(`Email sent to ${this.maskEmail(params.to)}: ${data?.id}`);
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

  // Double opt-in confirmation (backlog #23). The confirm/unsubscribe URLs are
  // backend routes carrying a high-entropy per-subscriber token. List-Unsubscribe
  // headers enable one-click unsubscribe in Gmail/Apple Mail.
  async sendNewsletterConfirmation(
    email: string,
    confirmUrl: string,
    unsubscribeUrl: string,
  ): Promise<void> {
    const safeConfirm = this.escapeHtml(confirmUrl);
    const safeUnsub = this.escapeHtml(unsubscribeUrl);
    await this.send({
      to: email,
      subject: 'Confirm your AstrologyWiki newsletter subscription',
      html: this.buildBaseTemplate(
        'Confirm your subscription',
        'One quick step to start receiving AstrologyWiki updates',
        `
      <p style="color:#a0a0b8;font-size:14px;margin:0 0 24px;">Tap the button below to confirm you want astrology, psychology, and product updates from AstrologyWiki.</p>
      <a href="${safeConfirm}" style="display:inline-block;background:#d4af37;color:#0f0f1a;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">Confirm subscription</a>
      <p style="color:#666680;font-size:12px;margin:24px 0 0;">If you didn't request this, ignore this email — you won't be subscribed.</p>
      <p style="color:#666680;font-size:12px;margin:12px 0 0;"><a href="${safeUnsub}" style="color:#666680;">Unsubscribe</a></p>
      `,
      ),
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  }

  // Build the rich newsletter email HTML (pure; reused by the send path and the
  // preview script). All AI-generated fields are escaped before entering the HTML.
  // Renders overview -> dated sky-events timeline -> optional moon moments -> the
  // psychology lens -> a practice + reflection pair -> a featured-read card.
  buildNewsletterHtml(
    issue: WeeklyIssueEmail,
    unsubscribeUrl: string,
    subtitle = "Your week ahead",
  ): string {
    const esc = (s: string): string => this.escapeHtml(s ?? "");
    const safeUnsub = esc(unsubscribeUrl);

    const heroOk =
      typeof issue.heroImageUrl === "string" &&
      /^https:\/\//.test(issue.heroImageUrl);
    const heroBlock = heroOk
      ? `<img src="${esc(issue.heroImageUrl as string)}" alt="" width="100%" style="display:block;border-radius:12px;margin:0 0 24px;max-width:100%;height:auto;">`
      : "";

    const eyebrow = (label: string): string =>
      `<p style="color:#d4af37;font-size:11px;letter-spacing:0.6px;text-transform:uppercase;margin:0 0 8px;">${label}</p>`;

    const skyRows = (issue.skyEvents ?? [])
      .map(
        (e) => `
        <div style="padding:14px 0;border-bottom:1px solid rgba(212,175,55,0.12);">
          <div style="margin:0 0 6px;">
            <span style="display:inline-block;background:#0f0f1a;color:#d4af37;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;margin-right:8px;">${esc(e.dateLabel)}</span>
            <span style="color:#e0e0f0;font-size:14px;font-weight:600;">${esc(e.title)}</span>
          </div>
          <p style="color:#a0a0b8;font-size:13px;line-height:1.6;margin:0;">${esc(e.guidance)}</p>
        </div>`,
      )
      .join("");
    const skyBlock = skyRows
      ? `${eyebrow("The sky ahead")}<div style="margin:0 0 24px;">${skyRows}</div>`
      : "";

    const moonRows = (issue.moonMoments ?? [])
      .map(
        (m) => `
          <p style="color:#d4af37;font-size:13px;font-weight:700;margin:0 0 4px;">${esc(m.dateLabel)} &middot; ${esc(m.phase)}</p>
          <p style="color:#e0e0f0;font-size:13px;line-height:1.6;font-style:italic;margin:0 0 14px;">${esc(m.note)}</p>`,
      )
      .join("");
    const moonBlock = moonRows
      ? `<div style="background:#0f0f1a;border-left:3px solid #d4af37;border-radius:12px;padding:16px 18px;margin:0 0 24px;">${moonRows}</div>`
      : "";

    const featuredBlock = issue.featured
      ? `<div style="background:#0f0f1a;border-radius:12px;padding:18px;margin:0 0 24px;">
          ${eyebrow("Explore on AstrologyWiki")}
          <p style="color:#e0e0f0;font-size:15px;font-weight:600;margin:0 0 4px;">${esc(issue.featured.title)}</p>
          <p style="color:#a0a0b8;font-size:13px;line-height:1.6;margin:0;">${esc(issue.featured.blurb)}</p>
        </div>`
      : "";

    return this.buildBaseTemplate(
      esc(issue.overviewTitle),
      esc(subtitle),
      `
        ${heroBlock}
        <div style="text-align:left;">
          <p style="color:#e0e0f0;font-size:15px;line-height:1.7;margin:0 0 24px;">${esc(issue.overview)}</p>
          ${skyBlock}
          ${moonBlock}
          <div style="background:#0f0f1a;border-radius:12px;padding:20px;margin:0 0 24px;">
            ${eyebrow("The psychology lens")}
            <p style="color:#e0e0f0;font-size:14px;line-height:1.7;margin:0;">${esc(issue.lens)}</p>
          </div>
          ${eyebrow("Try this")}
          <p style="color:#a0a0b8;font-size:14px;line-height:1.7;margin:0 0 18px;">${esc(issue.practice)}</p>
          ${eyebrow("Sit with this")}
          <p style="color:#a0a0b8;font-size:14px;line-height:1.7;font-style:italic;margin:0 0 24px;">${esc(issue.reflection)}</p>
          ${featuredBlock}
        </div>
        <a href="https://www.astrologywiki.com" style="display:inline-block;background:#d4af37;color:#0f0f1a;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">Open AstrologyWiki</a>
        <p style="color:#666680;font-size:12px;margin:28px 0 0;">You're receiving this because you subscribed to AstrologyWiki. <a href="${safeUnsub}" style="color:#666680;">Unsubscribe</a></p>
        `,
      600,
    );
  }

  // Weekly/monthly newsletter send (general issue, reused for every subscriber).
  // The per-subscriber unsubscribe URL carries a high-entropy token;
  // List-Unsubscribe headers (RFC 8058) enable one-click unsubscribe.
  async sendWeeklyNewsletter(
    email: string,
    issue: WeeklyIssueEmail,
    unsubscribeUrl: string,
    subtitle = "Your week ahead",
  ): Promise<void> {
    await this.send({
      to: email,
      subject: issue.subject,
      html: this.buildNewsletterHtml(issue, unsubscribeUrl, subtitle),
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
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
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

  private buildBaseTemplate(
    title: string,
    subtitle: string,
    content: string,
    maxWidth = 480,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="${maxWidth}" cellpadding="0" cellspacing="0" style="max-width:${maxWidth}px;width:100%;background:#1a1a2e;border-radius:16px;border:1px solid rgba(212,175,55,0.2);">
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
