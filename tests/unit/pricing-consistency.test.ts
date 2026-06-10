// INPUT: data/pricing.ts (frontend display constants) + backend/src/config/airwallex.ts (read as text).
// OUTPUT: vitest specs that fail loudly if the public pricing page's display amounts drift
//         from the backend Airwallex payment source of truth, plus formatDisplayPrice unit checks.
// POS: Billing-adjacent regression guard for backlog #14 (public pricing page). If a price changes
//      in airwallex.ts but not data/pricing.ts (or vice-versa), the page would advertise a price
//      users don't actually pay — this catches it. Update when AIRWALLEX_SUBSCRIPTION_PRICING changes.

import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  SUBSCRIPTION_DISPLAY_PRICING,
  CREDIT_PACKS_DISPLAY,
  YEARLY_SAVE_PERCENT,
  FIRST_DISCOUNT_PERCENT,
  TRIAL_DAYS,
  formatDisplayPrice,
} from "../../data/pricing";

// Read the backend configs as text (no import — they run dotenv + logger side
// effects at module load). Text matching pins each amount/currency/metadata cell.
const airwallexSrc = readFileSync(
  new URL("../../backend/src/config/airwallex.ts", import.meta.url),
  "utf-8",
);
const authSrc = readFileSync(
  new URL("../../backend/src/config/auth.ts", import.meta.url),
  "utf-8",
);

const hasAmount = (amount: number, currency: "USD" | "CNY"): boolean =>
  new RegExp(`amount:\\s*${amount},\\s*currency:\\s*'${currency}'`).test(
    airwallexSrc,
  );

describe("pricing display constants stay in sync with backend Airwallex config (#14)", () => {
  it("subscription USD (en) amounts match airwallex.ts", () => {
    const en = SUBSCRIPTION_DISPLAY_PRICING.en;
    expect(en.monthly.currency).toBe("USD");
    expect(en.yearly.currency).toBe("USD");
    expect(hasAmount(en.monthly.amount, "USD")).toBe(true);
    expect(hasAmount(en.yearly.amount, "USD")).toBe(true);
  });

  it("subscription CNY (zh) amounts match airwallex.ts", () => {
    const zh = SUBSCRIPTION_DISPLAY_PRICING.zh;
    expect(zh.monthly.currency).toBe("CNY");
    expect(zh.yearly.currency).toBe("CNY");
    expect(hasAmount(zh.monthly.amount, "CNY")).toBe(true);
    expect(hasAmount(zh.yearly.amount, "CNY")).toBe(true);
  });

  it("every credit pack amount matches airwallex.ts (USD + CNY)", () => {
    expect(CREDIT_PACKS_DISPLAY.length).toBe(4);
    for (const pack of CREDIT_PACKS_DISPLAY) {
      expect(hasAmount(pack.usd, "USD")).toBe(true);
      expect(hasAmount(pack.cny, "CNY")).toBe(true);
    }
  });
});

describe("formatDisplayPrice mirrors backend formatPrice (deterministic, locale-free)", () => {
  it("formats USD with 2 decimals and a $ symbol", () => {
    expect(formatDisplayPrice(699, "USD")).toBe("$6.99");
    expect(formatDisplayPrice(4199, "USD")).toBe("$41.99");
    expect(formatDisplayPrice(499, "USD")).toBe("$4.99");
  });

  it("formats CNY as whole yuan with a ¥ symbol", () => {
    expect(formatDisplayPrice(4900, "CNY")).toBe("¥49");
    expect(formatDisplayPrice(29400, "CNY")).toBe("¥294");
    expect(formatDisplayPrice(3400, "CNY")).toBe("¥34");
  });
});

describe("pricing metadata constants cross-check against backend sources (#14)", () => {
  it("YEARLY_SAVE_PERCENT matches the saving implied by the actual amounts", () => {
    const en = SUBSCRIPTION_DISPLAY_PRICING.en;
    const impliedSave = Math.round(
      (1 - en.yearly.amount / (en.monthly.amount * 12)) * 100,
    );
    expect(impliedSave).toBe(YEARLY_SAVE_PERCENT);
  });

  it("FIRST_DISCOUNT_PERCENT matches AIRWALLEX_FIRST_DISCOUNT_RATE in airwallex.ts", () => {
    expect(FIRST_DISCOUNT_PERCENT).toBe(50);
    expect(airwallexSrc).toMatch(
      new RegExp(
        `AIRWALLEX_FIRST_DISCOUNT_RATE\\s*=\\s*${FIRST_DISCOUNT_PERCENT / 100}\\b`,
      ),
    );
  });

  it("TRIAL_DAYS matches TRIAL_DAYS in backend auth.ts", () => {
    expect(authSrc).toMatch(new RegExp(`TRIAL_DAYS:\\s*${TRIAL_DAYS}\\b`));
  });
});
