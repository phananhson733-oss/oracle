// Entitlement Service - checks user permissions and manages free usage
import { supabase, DbFreeUsage, isSupabaseConfigured } from '../db/supabase.js';
import { FREE_TIER_LIMITS, SUBSCRIPTION_BENEFITS } from '../config/auth.js';
import subscriptionService from './subscriptionService.js';

export interface Entitlements {
  isLoggedIn: boolean;
  isSubscriber: boolean;
  subscription?: {
    plan: 'monthly' | 'yearly';
    status: string;
    expiresAt: string;
    synastryReadsLeft: number;
    monthlyReportClaimed: boolean;
  };
  freeAskLeft: number;
  freeDetailLeft: number;
  freeSynastryLeft: number;
  purchasedAsk: number;
  purchasedDetailPack: number;
  purchasedSynastry: number;
  purchasedCbtAnalysis: number;
  purchasedReports: string[];
}

export type Feature = 'ask' | 'detail' | 'synastry' | 'cbt_analysis' | 'daily_detail' | 'report';

class EntitlementService {
  // Get full entitlements for a user
  async getEntitlements(userId: string | null, deviceFingerprint?: string): Promise<Entitlements> {
    const entitlements: Entitlements = {
      isLoggedIn: !!userId,
      isSubscriber: false,
      freeAskLeft: FREE_TIER_LIMITS.ASK_QUESTIONS,
      freeDetailLeft: FREE_TIER_LIMITS.DETAIL_READINGS,
      freeSynastryLeft: FREE_TIER_LIMITS.SYNASTRY_OVERVIEWS,
      purchasedAsk: 0,
      purchasedDetailPack: 0,
      purchasedSynastry: 0,
      purchasedCbtAnalysis: 0,
      purchasedReports: [],
    };

    if (!isSupabaseConfigured()) {
      return entitlements;
    }

    // Check free usage for non-logged-in users
    if (!userId && deviceFingerprint) {
      const freeUsage = await this.getFreeUsage(deviceFingerprint);
      if (freeUsage) {
        entitlements.freeAskLeft = Math.max(0, FREE_TIER_LIMITS.ASK_QUESTIONS - freeUsage.ask_used);
        entitlements.freeDetailLeft = Math.max(0, FREE_TIER_LIMITS.DETAIL_READINGS - freeUsage.detail_used);
        entitlements.freeSynastryLeft = Math.max(0, FREE_TIER_LIMITS.SYNASTRY_OVERVIEWS - freeUsage.synastry_used);
      }
      return entitlements;
    }

    if (!userId) {
      return entitlements;
    }

    // Check subscription
    const subscription = await subscriptionService.getSubscription(userId);
    if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
      entitlements.isSubscriber = true;
      entitlements.subscription = {
        plan: subscription.plan,
        status: subscription.status,
        expiresAt: subscription.current_period_end || '',
        synastryReadsLeft: SUBSCRIPTION_BENEFITS.SYNASTRY_READS_PER_MONTH - subscription.usage.synastryReads,
        monthlyReportClaimed: subscription.usage.monthlyReportClaimed,
      };

      // Subscribers have unlimited basic features
      entitlements.freeAskLeft = Infinity;
      entitlements.freeDetailLeft = Infinity;
    }

    // Check purchased credits
    entitlements.purchasedAsk = await subscriptionService.getAvailableCredits(userId, 'ask');
    entitlements.purchasedDetailPack = await subscriptionService.getAvailableCredits(userId, 'detail_pack');
    entitlements.purchasedSynastry = await subscriptionService.getAvailableCredits(userId, 'synastry');
    entitlements.purchasedCbtAnalysis = await subscriptionService.getAvailableCredits(userId, 'cbt_analysis');

    // Check purchased reports
    const purchases = await subscriptionService.getPurchases(userId);
    entitlements.purchasedReports = purchases
      .filter(p => p.product_type === 'report' && p.status === 'completed' && p.product_id)
      .map(p => p.product_id as string);

    return entitlements;
  }

  // Check if user can use a feature
  async canUseFeature(
    userId: string | null,
    feature: Feature,
    deviceFingerprint?: string,
    reportType?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const entitlements = await this.getEntitlements(userId, deviceFingerprint);

    switch (feature) {
      case 'ask':
        if (entitlements.isSubscriber) {
          return { allowed: true };
        }
        if (entitlements.purchasedAsk > 0) {
          return { allowed: true };
        }
        if (entitlements.freeAskLeft > 0) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'No Ask credits remaining' };

      case 'detail':
        if (entitlements.isSubscriber) {
          return { allowed: true };
        }
        if (entitlements.purchasedDetailPack > 0) {
          return { allowed: true };
        }
        if (entitlements.freeDetailLeft > 0) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'No detail reading credits remaining' };

      case 'synastry':
        if (entitlements.isSubscriber) {
          if (entitlements.subscription!.synastryReadsLeft > 0) {
            return { allowed: true };
          }
          // Subscriber can still purchase more
          if (entitlements.purchasedSynastry > 0) {
            return { allowed: true };
          }
          return { allowed: false, reason: 'Monthly synastry limit reached' };
        }
        if (entitlements.purchasedSynastry > 0) {
          return { allowed: true };
        }
        if (entitlements.freeSynastryLeft > 0) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'No synastry credits remaining' };

      case 'cbt_analysis':
        if (entitlements.isSubscriber) {
          return { allowed: true };
        }
        if (entitlements.purchasedCbtAnalysis > 0) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'CBT analysis requires purchase' };

      case 'daily_detail':
        if (entitlements.isSubscriber) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'Full daily details require subscription' };

      case 'report':
        if (!reportType) {
          return { allowed: false, reason: 'Report type required' };
        }
        // Check if user has purchased this report
        if (entitlements.purchasedReports.includes(reportType)) {
          return { allowed: true };
        }
        // Check if subscriber can claim monthly report
        if (entitlements.isSubscriber && reportType === 'monthly' && !entitlements.subscription!.monthlyReportClaimed) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'Report not purchased' };

      default:
        return { allowed: false, reason: 'Unknown feature' };
    }
  }

  // Consume a feature usage
  async consumeFeature(
    userId: string | null,
    feature: Feature,
    deviceFingerprint?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    // For logged-in users
    if (userId) {
      const entitlements = await this.getEntitlements(userId);

      if (entitlements.isSubscriber) {
        // Subscribers: handle synastry monthly limit
        if (feature === 'synastry') {
          return subscriptionService.useSynastryRead(userId);
        }
        // Other features are unlimited for subscribers
        return true;
      }

      // Check purchased credits first
      const productType = feature === 'detail' ? 'detail_pack' : feature;
      const availableCredits = await subscriptionService.getAvailableCredits(
        userId,
        productType as 'ask' | 'detail_pack' | 'synastry' | 'cbt_analysis'
      );

      if (availableCredits > 0) {
        return subscriptionService.consumeCredit(userId, productType);
      }

      // Fall through to free usage for logged-in users without credits
    }

    // For non-logged-in users or logged-in users using free tier
    if (deviceFingerprint) {
      return this.consumeFreeUsage(deviceFingerprint, feature);
    }

    return false;
  }

  // Get free usage record
  async getFreeUsage(deviceFingerprint: string): Promise<DbFreeUsage | null> {
    if (!isSupabaseConfigured()) return null;

    const { data } = await supabase
      .from('free_usage')
      .select('*')
      .eq('device_fingerprint', deviceFingerprint)
      .single();

    return data as DbFreeUsage | null;
  }

  // Create or get free usage record
  async getOrCreateFreeUsage(deviceFingerprint: string, ipAddress?: string): Promise<DbFreeUsage> {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured');
    }

    let freeUsage = await this.getFreeUsage(deviceFingerprint);

    if (!freeUsage) {
      const { data, error } = await supabase
        .from('free_usage')
        .insert({
          device_fingerprint: deviceFingerprint,
          ip_address: ipAddress || null,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create free usage record: ${error.message}`);
      freeUsage = data as DbFreeUsage;
    }

    return freeUsage;
  }

  // Consume free usage
  private async consumeFreeUsage(deviceFingerprint: string, feature: Feature): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    const freeUsage = await this.getOrCreateFreeUsage(deviceFingerprint);

    let updateField: string;
    let currentUsage: number;
    let limit: number;

    switch (feature) {
      case 'ask':
        updateField = 'ask_used';
        currentUsage = freeUsage.ask_used;
        limit = FREE_TIER_LIMITS.ASK_QUESTIONS;
        break;
      case 'detail':
        updateField = 'detail_used';
        currentUsage = freeUsage.detail_used;
        limit = FREE_TIER_LIMITS.DETAIL_READINGS;
        break;
      case 'synastry':
        updateField = 'synastry_used';
        currentUsage = freeUsage.synastry_used;
        limit = FREE_TIER_LIMITS.SYNASTRY_OVERVIEWS;
        break;
      default:
        return false;
    }

    if (currentUsage >= limit) {
      return false;
    }

    const { error } = await supabase
      .from('free_usage')
      .update({ [updateField]: currentUsage + 1 })
      .eq('id', freeUsage.id);

    return !error;
  }
}

export const entitlementService = new EntitlementService();
export default entitlementService;
