// INPUT: users/pro_trial_claims/subscriptions tables + user email hashing helpers.
// OUTPUT: Pro trial eligibility and Airwallex-backed trial claim persistence helpers.
// POS: Manual Pro trial activation service. If updated, update services/FOLDER.md.

import { supabase, isSupabaseConfigured, type DbProTrialClaim } from '../db/supabase.js';
import { SUBSCRIPTION_BENEFITS } from '../config/auth.js';
import {
  hashEmailForTrialClaim,
  normalizeEmailForIdentity,
} from './userService.js';

export type ProTrialIneligibilityReason =
  | 'database_unavailable'
  | 'user_not_found'
  | 'active_subscription'
  | 'legacy_trial_active'
  | 'trial_already_used'
  | 'first_discount_used';

export interface ProTrialEligibility {
  eligible: boolean;
  days: number;
  reason?: ProTrialIneligibilityReason;
}

export interface ProTrialClaimInput {
  userId: string;
  email: string;
  airwallexSubscriptionId: string;
  airwallexCustomerId?: string | null;
  plan: 'monthly' | 'yearly';
  trialStartedAt: string;
  trialEndsAt: string;
}

class ProTrialService {
  trialDays(): number {
    return SUBSCRIPTION_BENEFITS.TRIAL_DAYS;
  }

  emailHash(email: string): string {
    return hashEmailForTrialClaim(normalizeEmailForIdentity(email));
  }

  async getUserIdentity(userId: string): Promise<{
    id: string;
    email: string;
    emailHash: string;
    usedFirstDiscount: boolean;
    trialEndsAt: string | null;
  } | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('users')
      .select('id, email, used_first_discount, trial_ends_at')
      .eq('id', userId)
      .single();

    if (error || !data?.email) return null;
    const email = normalizeEmailForIdentity(data.email);
    return {
      id: data.id,
      email,
      emailHash: this.emailHash(email),
      usedFirstDiscount: Boolean(data.used_first_discount),
      trialEndsAt: data.trial_ends_at || null,
    };
  }

  async getClaimByEmail(email: string): Promise<DbProTrialClaim | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('pro_trial_claims')
      .select('*')
      .eq('email_hash', this.emailHash(email))
      .single();

    if (error || !data) return null;
    return data as DbProTrialClaim;
  }

  async getClaimBySubscription(
    subscriptionId: string,
  ): Promise<DbProTrialClaim | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('pro_trial_claims')
      .select('*')
      .eq('airwallex_subscription_id', subscriptionId)
      .single();

    if (error || !data) return null;
    return data as DbProTrialClaim;
  }

  async getEligibility(userId: string): Promise<ProTrialEligibility> {
    if (!isSupabaseConfigured()) {
      return {
        eligible: false,
        days: this.trialDays(),
        reason: 'database_unavailable',
      };
    }

    const identity = await this.getUserIdentity(userId);
    if (!identity) {
      return { eligible: false, days: this.trialDays(), reason: 'user_not_found' };
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .limit(1)
      .single();

    if (subscription) {
      return {
        eligible: false,
        days: this.trialDays(),
        reason: 'active_subscription',
      };
    }

    if (identity.trialEndsAt && new Date(identity.trialEndsAt) > new Date()) {
      return {
        eligible: false,
        days: this.trialDays(),
        reason: 'legacy_trial_active',
      };
    }

    const claim = await this.getClaimByEmail(identity.email);
    if (claim) {
      return {
        eligible: false,
        days: this.trialDays(),
        reason: 'trial_already_used',
      };
    }

    if (identity.usedFirstDiscount) {
      return {
        eligible: false,
        days: this.trialDays(),
        reason: 'first_discount_used',
      };
    }

    return { eligible: true, days: this.trialDays() };
  }

  async assertEligible(userId: string): Promise<{
    email: string;
    emailHash: string;
    days: number;
  }> {
    const eligibility = await this.getEligibility(userId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'trial_not_eligible');
    }

    const identity = await this.getUserIdentity(userId);
    if (!identity) {
      throw new Error('user_not_found');
    }

    return {
      email: identity.email,
      emailHash: identity.emailHash,
      days: eligibility.days,
    };
  }

  async recordClaim(input: ProTrialClaimInput): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const email = normalizeEmailForIdentity(input.email);
    const emailHash = this.emailHash(email);
    const existingForSubscription = await this.getClaimBySubscription(
      input.airwallexSubscriptionId,
    );

    if (existingForSubscription) {
      return;
    }

    const { error } = await supabase.from('pro_trial_claims').insert({
      email_hash: emailHash,
      user_id: input.userId,
      airwallex_subscription_id: input.airwallexSubscriptionId,
      airwallex_customer_id: input.airwallexCustomerId || null,
      plan: input.plan,
      trial_started_at: input.trialStartedAt,
      trial_ends_at: input.trialEndsAt,
    });

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new Error('trial_already_used');
      }
      throw new Error(`Failed to record Pro trial claim: ${error.message}`);
    }

    // Trial and first-subscription discount are mutually exclusive.
    await supabase
      .from('users')
      .update({ used_first_discount: true })
      .eq('id', input.userId);
  }
}

export const proTrialService = new ProTrialService();
export default proTrialService;
