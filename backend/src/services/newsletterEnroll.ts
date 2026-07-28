// INPUT: supabase（newsletter_subscribers 表）+ logger。
// OUTPUT: enrollAccountSubscriber —— 把注册账号以 confirmed 身份加入 newsletter 名单（opt-out 模型）。
// POS: 注册→newsletter 自动入库的唯一入口，被 userService.createUser 在建号成功后 best-effort 调用。若更新此文件，务必更新本头注释与所属 services/FOLDER.md。

import { randomBytes } from "node:crypto";
import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { logger } from "../utils/logger.js";

export type EnrollResult = "enrolled" | "exists" | "skipped";

const normalize = (email: string): string => email.trim().toLowerCase();

// Enroll an account holder as a CONFIRMED newsletter subscriber. Product model
// is opt-out: every registered user receives the newsletter by default, with a
// one-click unsubscribe in each email (see RFC 8058 headers in emailService).
//
// Idempotent + unsubscribe-respecting: a duplicate email trips the unique
// lower(email) index (Postgres 23505); we leave the existing row UNTOUCHED, so a
// prior form-subscriber keeps its source, and — critically — an UNSUBSCRIBED
// account is never silently re-enrolled.
//
// Best-effort: this never throws. Registration must not fail because the
// newsletter insert hiccuped. Tagged source='account' so this no-explicit-consent
// cohort stays identifiable if the consent model later tightens (GDPR opt-in).
export async function enrollAccountSubscriber(
  email: string,
): Promise<EnrollResult> {
  if (!isSupabaseConfigured()) return "skipped";

  let normalizedEmail: string;
  try {
    normalizedEmail = normalize(email);
  } catch {
    return "skipped";
  }
  if (!normalizedEmail) return "skipped";

  try {
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: normalizedEmail,
      source: "account",
      status: "confirmed",
      confirm_token: randomBytes(32).toString("hex"),
      confirmed_at: new Date().toISOString(),
    });
    if (!error) return "enrolled";

    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    // 23505 = duplicate email: already on the list (subscribed OR unsubscribed).
    // Do nothing — never re-enroll an unsubscribed account or clobber a form row.
    if (code === "23505") return "exists";
    logger.error(`[newsletter enroll] insert failed code=${code}`);
    return "skipped";
  } catch (err) {
    logger.error(
      `[newsletter enroll] unexpected: ${err instanceof Error ? err.name : "unknown"}`,
    );
    return "skipped";
  }
}
