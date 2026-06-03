// User Service - handles user CRUD and authentication
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  supabase,
  DbUser,
  BirthProfile,
  UserPreferences,
  isSupabaseConfigured,
} from "../db/supabase.js";
import { JWT_CONFIG, SUBSCRIPTION_BENEFITS } from "../config/auth.js";
import { airwallexService } from "./airwallexService.js";
import { cacheService } from "../cache/redis.js";
import { logger } from "../utils/logger.js";

// Canonicalize an email for identity comparison: trim whitespace, lowercase.
// Used for users.email storage AND trial_claims hashing — both MUST agree.
function normalizeEmailForIdentity(email: string): string {
  if (typeof email !== "string") {
    throw new Error("Invalid email: expected string");
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error("Invalid email: empty");
  }
  return normalized;
}

// SHA-256 hash of the normalized email — used as primary key in `trial_claims`.
// MUST stay in sync with migration 006_trial_claims.sql backfill, which uses
// `digest(lower(btrim(u.email)), 'sha256')`. No salt/pepper: if we ever
// introduce one we must rebuild the table or the hash domain diverges from
// the backfill and existing users lose protection on re-registration.
function hashEmailForTrialClaim(normalizedEmail: string): string {
  return crypto.createHash("sha256").update(normalizedEmail).digest("hex");
}

export interface CreateUserInput {
  email: string;
  name?: string;
  avatar?: string;
  provider: "google" | "apple" | "email";
  providerId?: string;
  password?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class UserService {
  // Create a new user with 7-day trial.
  // Trial is bound to the email (via SHA-256 hash) and persists across account
  // deletion: re-registering with the same email reuses the original
  // trial_ends_at instead of starting a fresh 7-day window.
  //
  // Implementation: delegates to the `create_user_with_trial` Postgres function
  // (migration 006) which performs the trial_claims upsert + read + users
  // insert in a single transaction. Atomicity matters: a failed users insert
  // must roll back the claim row, otherwise an attacker could "burn" a
  // victim's trial by submitting malformed registrations.
  async createUser(input: CreateUserInput): Promise<DbUser> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured");
    }

    const normalizedEmail = normalizeEmailForIdentity(input.email);

    const passwordHash = input.password
      ? await bcrypt.hash(input.password, 12)
      : null;

    const { data, error } = await supabase
      .rpc("create_user_with_trial", {
        p_email: normalizedEmail,
        p_name: input.name ?? null,
        p_avatar: input.avatar ?? null,
        p_provider: input.provider,
        p_provider_id: input.providerId ?? null,
        p_password_hash: passwordHash,
        p_email_verified: input.provider !== "email",
        p_trial_days: SUBSCRIPTION_BENEFITS.TRIAL_DAYS,
      })
      .single();

    if (error) {
      // 23505 = unique violation (duplicate email). Map to the same message
      // the legacy code path produced so callers stay compatible.
      if (error.code === "23505") {
        throw new Error("Email already registered");
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }

    if (!data) {
      throw new Error("Failed to create user: no row returned");
    }

    // The RPC returns a `users` row; cast through unknown to satisfy the
    // generated types (rpc return type defaults to `unknown` on untyped
    // function signatures).
    return data as unknown as DbUser;
  }

  // Used at startup if you ever need to verify the email-hash domain matches
  // the migration. Not called from the request path. Kept exported via the
  // class for future tooling/tests.
  hashEmailForTrialClaim(email: string): string {
    return hashEmailForTrialClaim(normalizeEmailForIdentity(email));
  }

  // Find user by email
  async findByEmail(email: string): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return null;

    let normalizedEmail: string;
    try {
      normalizedEmail = normalizeEmailForIdentity(email);
    } catch {
      return null;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (error || !data) return null;
    return data as DbUser;
  }

  // Find user by ID
  async findById(id: string): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as DbUser;
  }

  // Find user by OAuth provider
  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("provider", provider)
      .eq("provider_id", providerId)
      .single();

    if (error || !data) return null;
    return data as DbUser;
  }

  // Verify password
  async verifyPassword(user: DbUser, password: string): Promise<boolean> {
    if (!user.password_hash) return false;
    return bcrypt.compare(password, user.password_hash);
  }

  // Update user profile
  async updateProfile(
    userId: string,
    updates: Partial<{
      name: string;
      avatar: string;
      birth_profile: BirthProfile;
      preferences: UserPreferences;
    }>,
  ): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data as DbUser;
  }

  // Migrate localStorage data to user account
  async migrateLocalData(
    userId: string,
    birthProfile: BirthProfile,
    preferences: UserPreferences,
  ): Promise<DbUser | null> {
    return this.updateProfile(userId, {
      birth_profile: birthProfile,
      preferences,
    });
  }

  // Mark email as verified
  async verifyEmail(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    await supabase
      .from("users")
      .update({ email_verified: true })
      .eq("id", userId);
  }

  // Generate JWT tokens
  generateTokens(user: DbUser): AuthTokens {
    const accessPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      type: "access",
    };

    const refreshPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      type: "refresh",
    };

    const accessToken = jwt.sign(accessPayload, JWT_CONFIG.SECRET, {
      expiresIn: 900, // 15 minutes in seconds
      issuer: JWT_CONFIG.ISSUER,
    });

    const refreshToken = jwt.sign(refreshPayload, JWT_CONFIG.SECRET, {
      expiresIn: "7d",
      issuer: JWT_CONFIG.ISSUER,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  // Verify JWT token
  verifyToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, JWT_CONFIG.SECRET, {
        issuer: JWT_CONFIG.ISSUER,
      }) as TokenPayload;
      return payload;
    } catch {
      return null;
    }
  }

  // Store refresh token
  async storeRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;

    await supabase.from("refresh_tokens").insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    });
  }

  // Validate refresh token
  async validateRefreshToken(token: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from("refresh_tokens")
      .select("user_id")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data.user_id;
  }

  // Revoke refresh token
  async revokeRefreshToken(token: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    await supabase.from("refresh_tokens").delete().eq("token", token);
  }

  // Revoke all user tokens
  async revokeAllUserTokens(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    await supabase.from("refresh_tokens").delete().eq("user_id", userId);
  }

  // Create email verification token
  async createVerificationToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    if (isSupabaseConfigured()) {
      await supabase.from("email_verification_tokens").insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      });
    }

    return token;
  }

  // Verify email token
  async verifyEmailToken(token: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from("email_verification_tokens")
      .select("user_id")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) return null;

    // Delete the token after use
    await supabase
      .from("email_verification_tokens")
      .delete()
      .eq("token", token);

    // Mark user as verified
    await this.verifyEmail(data.user_id);

    return data.user_id;
  }

  // Delete user account (GDPR/CCPA right to erasure)
  async deleteUser(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured");
    }

    // 1. Find the user first
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // 2. Cancel billable subscriptions (payment provider API + database)
    // Cover all statuses that may produce future charges
    const BILLABLE_STATUSES = ["active", "trialing", "past_due"];
    try {
      const { data: billableSubs } = await supabase
        .from("subscriptions")
        .select("id, airwallex_subscription_id, payment_provider, status")
        .eq("user_id", userId)
        .in("status", BILLABLE_STATUSES);

      if (billableSubs && billableSubs.length > 0) {
        const failedCancellations: string[] = [];

        // Cancel at payment provider level (best-effort per subscription)
        for (const sub of billableSubs) {
          try {
            if (
              sub.payment_provider === "airwallex" &&
              sub.airwallex_subscription_id
            ) {
              await airwallexService.cancelSubscription(
                sub.airwallex_subscription_id,
              );
            }
            // PayPal/Stripe cancellation can be added here when needed
          } catch (providerErr) {
            failedCancellations.push(sub.airwallex_subscription_id || sub.id);
            logger.error("Failed to cancel subscription", {
              provider: sub.payment_provider,
              subscriptionId: sub.airwallex_subscription_id,
              error: providerErr,
            });
          }
        }

        if (failedCancellations.length > 0) {
          logger.warn(
            "Account deletion: some subscriptions failed provider-side cancellation, proceeding with local deletion",
            {
              userId,
              failedCount: failedCancellations.length,
              failedIds: failedCancellations.join(", "),
            },
          );
        }

        // Mark all as canceled in database
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", cancel_at_period_end: true })
          .eq("user_id", userId)
          .in("status", BILLABLE_STATUSES);
      }
    } catch (err) {
      // Don't fail the deletion if subscription cancel fails
      logger.error("Failed to cancel subscriptions during account deletion", {
        error: err,
      });
    }

    // 3. Clean up non-cascading tables
    await supabase.from("refresh_tokens").delete().eq("user_id", userId);
    await supabase.from("free_usage").delete().eq("user_id", userId);
    await supabase.from("registration_codes").delete().eq("email", user.email);
    await supabase
      .from("email_verification_tokens")
      .delete()
      .eq("user_id", userId);

    // 4. Clear Redis cache for user
    try {
      await cacheService.del(`user:${userId}`);
      await cacheService.del(`user:${userId}:subscription`);
      await cacheService.del(`user:${userId}:usage`);
      await cacheService.del(`user:${userId}:credits`);
    } catch (err) {
      // Don't fail the deletion if cache cleanup fails
      logger.error("Failed to clear cache during account deletion", { err });
    }

    // 5. Delete the user row (CASCADE handles subscriptions, purchase_records, reports, synastry_records, etc.)
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return true;
  }

  // Export user data (GDPR/CCPA right to data portability)
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured");
    }

    // Fetch user profile
    const { data: user } = await supabase
      .from("users")
      .select(
        "id, email, name, avatar, provider, birth_profile, preferences, email_verified, trial_ends_at, created_at, updated_at",
      )
      .eq("id", userId)
      .single();

    if (!user) {
      throw new Error("User not found");
    }

    // Fetch subscriptions
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select(
        "id, plan, status, current_period_start, current_period_end, cancel_at_period_end, usage, payment_provider, created_at, updated_at",
      )
      .eq("user_id", userId);

    // Fetch purchase records
    const { data: purchaseRecords } = await supabase
      .from("purchase_records")
      .select(
        "id, feature_type, feature_id, scope, price_cents, valid_until, quantity, consumed, created_at",
      )
      .eq("user_id", userId);

    // Fetch reports
    const { data: reports } = await supabase
      .from("reports")
      .select(
        "id, report_type, title, content, birth_profile, partner_profile, generated_at, created_at",
      )
      .eq("user_id", userId);

    // Fetch synastry records
    const { data: synastryRecords } = await supabase
      .from("synastry_records")
      .select(
        "id, synastry_hash, person_a_info, person_b_info, relationship_type, is_free, created_at",
      )
      .eq("user_id", userId);

    // Fetch free usage
    const { data: freeUsage } = await supabase
      .from("free_usage")
      .select(
        "ask_used, ask_reset_at, detail_used, synastry_used, synastry_total_used, synthetica_used, synthetica_reset_at, synastry_daily_used, synastry_daily_reset_at, ask_daily_used, ask_daily_reset_at, created_at, updated_at",
      )
      .eq("user_id", userId);

    return {
      exportedAt: new Date().toISOString(),
      user,
      subscriptions: subscriptions || [],
      purchaseRecords: purchaseRecords || [],
      reports: reports || [],
      synastryRecords: synastryRecords || [],
      freeUsage: freeUsage || [],
    };
  }
}

export const userService = new UserService();
export default userService;
