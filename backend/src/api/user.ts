// INPUT: User status API routes.
// OUTPUT: Return user status for personalization.
// POS: User status endpoint.

import { Router, Request, Response } from 'express';
import { authMiddleware } from './auth.js';
import { userService } from '../services/userService.js';
import entitlementService from '../services/entitlementService.js';
import { cacheService } from '../cache/redis.js';
import { logger } from "../utils/logger.js";

export const userRouter = Router();

const isNewWithinDays = (registeredAt: string | null, days: number) => {
  if (!registeredAt) return false;
  const created = new Date(registeredAt).getTime();
  if (!Number.isFinite(created)) return false;
  const diff = Date.now() - created;
  return diff <= days * 24 * 60 * 60 * 1000;
};

userRouter.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deviceFingerprint = req.headers['x-device-fingerprint'] as string | undefined;
    const userId = req.userId || null;
    const user = userId ? await userService.findById(userId) : null;

    const registeredAt = user ? user.created_at : null;
    const hasBirthChart = !!(user && user.birth_profile);
    const recentActions: string[] = [];

    let hasUsedSynastry = false;
    if (deviceFingerprint) {
      const freeUsage = await entitlementService.getFreeUsage(deviceFingerprint);
      hasUsedSynastry = !!(freeUsage && freeUsage.synastry_used > 0);
    }

    let lastCBTEntry: string | null = null;
    if (userId) {
      const key = `cbt:records:${userId}`;
      const records = await cacheService.get<Array<{ timestamp: number }>>(key) || [];
      if (records.length > 0) {
        const latest = records.reduce((acc, record) => Math.max(acc, record.timestamp), 0);
        if (latest > 0) {
          lastCBTEntry = new Date(latest).toISOString();
        }
      }
    }

    res.json({
      isNewUser: isNewWithinDays(registeredAt, 3),
      registeredAt,
      hasBirthChart,
      hasUsedSynastry,
      lastCBTEntry,
      recentActions,
    });
  } catch (error) {
    logger.error('Get user status error', { error });
    res.status(500).json({ error: 'Failed to get user status' });
  }
});
