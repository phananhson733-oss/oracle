// INPUT: subscriptionReconcilerDriver + mock 的 airwallexService 与对账核心。
// OUTPUT: vitest 套件，覆盖驱动器分页/取 billing customer email/plan 映射/聚合报告/单条失败隔离/dry-run 透传。
// POS: P0 对账驱动器测试；若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockList = vi.fn();
const mockGetCustomer = vi.fn();
const mockGetDetails = vi.fn();
vi.mock('./airwallexService.js', () => ({
  airwallexService: {
    listSubscriptions: (...a: unknown[]) => mockList(...a),
    getBillingCustomer: (...a: unknown[]) => mockGetCustomer(...a),
    getSubscriptionDetails: (...a: unknown[]) => mockGetDetails(...a),
  },
}));

const mockReconcile = vi.fn();
vi.mock('./subscriptionReconciler.js', () => ({
  reconcileAirwallexSubscription: (...a: unknown[]) => mockReconcile(...a),
}));

import {
  reconcileAllAirwallexSubscriptions,
  reconcileAirwallexSubscriptionById,
} from './subscriptionReconcilerDriver.js';

describe('reconcileAllAirwallexSubscriptions', () => {
  beforeEach(() => {
    mockList.mockReset();
    mockGetCustomer.mockReset();
    mockGetDetails.mockReset();
    mockReconcile.mockReset();
  });

  it('reconcileAirwallexSubscriptionById：按 id 拉详情→取 email→调对账核心', async () => {
    mockGetDetails.mockResolvedValueOnce({
      id: 'sub_x',
      billing_customer_id: 'bcus_x',
      status: 'ACTIVE',
      recurring: { period_unit: 'MONTH' },
      current_period_ends_at: '2026-07-04T00:00:00.000Z',
    });
    mockGetCustomer.mockResolvedValueOnce({
      id: 'bcus_x',
      email: 'z@example.com',
    });
    mockReconcile.mockResolvedValueOnce({
      reconciled: true,
      userId: 'uz',
      action: 'update',
    });

    const r = await reconcileAirwallexSubscriptionById('sub_x');

    expect(mockGetDetails).toHaveBeenCalledWith('sub_x');
    expect(mockReconcile).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: 'sub_x',
        customerId: 'bcus_x',
        customerEmail: 'z@example.com',
        plan: 'monthly',
        currentPeriodEnd: '2026-07-04T00:00:00.000Z',
      }),
    );
    expect(r.reconciled).toBe(true);
  });

  it('拉订阅→按 billing_customer_id 取 email→映射 plan→调对账核心→聚合报告', async () => {
    mockList.mockResolvedValueOnce({
      items: [
        {
          id: 'sub_1',
          billing_customer_id: 'bcus_1',
          status: 'ACTIVE',
          recurring: { period_unit: 'MONTH' },
          current_period_starts_at: '2026-06-04T00:00:00.000Z',
          current_period_ends_at: '2026-07-04T00:00:00.000Z',
        },
      ],
      hasMore: false,
    });
    mockGetCustomer.mockResolvedValueOnce({
      id: 'bcus_1',
      email: 'buyer@example.com',
    });
    mockReconcile.mockResolvedValueOnce({
      reconciled: true,
      userId: 'u1',
      action: 'insert',
    });

    const report = await reconcileAllAirwallexSubscriptions();

    expect(report.scanned).toBe(1);
    expect(report.reconciled).toBe(1);
    expect(report.skipped).toEqual([]);
    expect(mockGetCustomer).toHaveBeenCalledWith('bcus_1');
    expect(mockReconcile).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: 'sub_1',
        customerId: 'bcus_1',
        customerEmail: 'buyer@example.com',
        plan: 'monthly',
        status: 'ACTIVE',
        currentPeriodEnd: '2026-07-04T00:00:00.000Z',
        dryRun: false,
      }),
    );
  });

  it('period_unit=YEAR 映射为 yearly', async () => {
    mockList.mockResolvedValueOnce({
      items: [
        {
          id: 'sub_y',
          billing_customer_id: 'bcus_y',
          status: 'ACTIVE',
          recurring: { period_unit: 'YEAR' },
        },
      ],
      hasMore: false,
    });
    mockGetCustomer.mockResolvedValueOnce({
      id: 'bcus_y',
      email: 'y@example.com',
    });
    mockReconcile.mockResolvedValueOnce({
      reconciled: true,
      userId: 'u2',
      action: 'insert',
    });

    await reconcileAllAirwallexSubscriptions();

    expect(mockReconcile).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'yearly' }),
    );
  });

  it('单条取 customer 失败不影响其它条，记入 skipped', async () => {
    mockList.mockResolvedValueOnce({
      items: [
        {
          id: 'sub_ok',
          billing_customer_id: 'bcus_ok',
          status: 'ACTIVE',
          recurring: { period_unit: 'MONTH' },
        },
        {
          id: 'sub_bad',
          billing_customer_id: 'bcus_bad',
          status: 'ACTIVE',
          recurring: { period_unit: 'MONTH' },
        },
      ],
      hasMore: false,
    });
    mockGetCustomer.mockImplementation(async (id: string) => {
      if (id === 'bcus_bad') throw new Error('boom');
      return { id, email: 'ok@example.com' };
    });
    mockReconcile.mockResolvedValue({
      reconciled: true,
      userId: 'u1',
      action: 'insert',
    });

    const report = await reconcileAllAirwallexSubscriptions();

    expect(report.scanned).toBe(2);
    expect(report.reconciled).toBe(1);
    expect(report.skipped).toHaveLength(1);
    expect(report.skipped[0].subscriptionId).toBe('sub_bad');
  });

  it('对账核心返回 reconciled=false（无法映射用户）时记入 skipped', async () => {
    mockList.mockResolvedValueOnce({
      items: [
        {
          id: 'sub_ghost',
          billing_customer_id: 'bcus_g',
          status: 'ACTIVE',
          recurring: { period_unit: 'MONTH' },
        },
      ],
      hasMore: false,
    });
    mockGetCustomer.mockResolvedValueOnce({
      id: 'bcus_g',
      email: 'ghost@example.com',
    });
    mockReconcile.mockResolvedValueOnce({
      reconciled: false,
      reason: 'no_user_mapping',
    });

    const report = await reconcileAllAirwallexSubscriptions();

    expect(report.reconciled).toBe(0);
    expect(report.skipped[0]).toEqual({
      subscriptionId: 'sub_ghost',
      reason: 'no_user_mapping',
    });
  });

  it('dryRun=true 透传给对账核心', async () => {
    mockList.mockResolvedValueOnce({
      items: [
        {
          id: 'sub_1',
          billing_customer_id: 'bcus_1',
          status: 'ACTIVE',
          recurring: { period_unit: 'MONTH' },
        },
      ],
      hasMore: false,
    });
    mockGetCustomer.mockResolvedValueOnce({ id: 'bcus_1', email: 'a@b.com' });
    mockReconcile.mockResolvedValueOnce({
      reconciled: true,
      userId: 'u1',
      action: 'insert',
    });

    await reconcileAllAirwallexSubscriptions({ dryRun: true });

    expect(mockReconcile).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: true }),
    );
  });

  it('分页：hasMore=true 时继续拉下一页', async () => {
    mockList
      .mockResolvedValueOnce({
        items: [
          {
            id: 'a',
            billing_customer_id: 'bc_a',
            status: 'ACTIVE',
            recurring: { period_unit: 'MONTH' },
          },
        ],
        hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'b',
            billing_customer_id: 'bc_b',
            status: 'ACTIVE',
            recurring: { period_unit: 'MONTH' },
          },
        ],
        hasMore: false,
      });
    mockGetCustomer.mockResolvedValue({ email: 'x@example.com' });
    mockReconcile.mockResolvedValue({
      reconciled: true,
      userId: 'u',
      action: 'insert',
    });

    const report = await reconcileAllAirwallexSubscriptions();

    expect(report.scanned).toBe(2);
    expect(mockList).toHaveBeenCalledTimes(2);
  });
});
