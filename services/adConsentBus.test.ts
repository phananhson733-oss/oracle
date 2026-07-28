// @vitest-environment jsdom
// INPUT: adConsentBus 的发布/订阅 API。
// OUTPUT: 断言 notify/subscribe 与 open/subscribeOpen 的收发与取消订阅。
// POS: adConsentBus 单测；随 adConsentBus.ts 变更同步。

import { describe, it, expect, vi } from "vitest";
import {
  notifyAdConsentChanged,
  subscribeAdConsent,
  openConsentPreferences,
  subscribeOpenConsentPreferences,
} from "./adConsentBus";

describe("adConsentBus", () => {
  it("subscribeAdConsent 收到 notifyAdConsentChanged，取消后不再收到", () => {
    const cb = vi.fn();
    const unsubscribe = subscribeAdConsent(cb);
    notifyAdConsentChanged();
    expect(cb).toHaveBeenCalledTimes(1);
    unsubscribe();
    notifyAdConsentChanged();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("openConsentPreferences 触发 subscribeOpenConsentPreferences", () => {
    const cb = vi.fn();
    const unsubscribe = subscribeOpenConsentPreferences(cb);
    openConsentPreferences();
    expect(cb).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
