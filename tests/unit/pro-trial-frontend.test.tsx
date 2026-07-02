// @vitest-environment jsdom
// INPUT: UpgradeModal / PaymentSuccessPage with mocked auth, entitlement, and payment clients.
// OUTPUT: guards manual Pro trial CTA/disclosure, checkout routing, and success-page entitlement refresh.
// POS: Frontend Pro trial activation contract tests. Update tests/unit/FOLDER.md when changing coverage.

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockSetShowUpgradeModal = vi.fn();
const mockOpenLoginModal = vi.fn();
const mockOpenCreditsModal = vi.fn();
const mockRefreshAuthEntitlements = vi.fn(async () => undefined);
const mockRefreshUser = vi.fn(async () => undefined);
const mockRefreshV2Entitlements = vi.fn(async () => undefined);
const mockNavigate = vi.fn();

const baseEntitlements = {
  isLoggedIn: true,
  isSubscriber: false,
  isTrialing: false,
  trialEndsAt: null,
  isFirstDiscountEligible: false,
  proTrial: { eligible: true, days: 7 },
  subscription: undefined,
  ask: { freeLeft: 3, subscriptionLeft: 0, purchasedLeft: 0, totalLeft: 3, resetAt: "" },
  synastry: { freeLeft: 3, subscriptionLeft: 0, totalLeft: 3, resetAt: "" },
  synthetica: { freeLeft: 3, subscriptionLeft: 0, purchasedLeft: 0, totalLeft: 3, resetAt: "" },
  purchasedFeatures: { dimensions: [], coreThemes: [], details: [], synastryHashes: [] },
  monthlyUnlocked: { cbtStats: false },
  credits: 0,
  discount: 0.3,
};

let mockAuthState: Record<string, unknown>;
let mockV2Entitlements: Record<string, unknown> | null;

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("../../contexts/EntitlementContext", () => ({
  useEntitlement: () => ({
    entitlements: mockV2Entitlements,
    refreshEntitlements: mockRefreshV2Entitlements,
  }),
}));

vi.mock("../../components/UIComponents", () => ({
  useTheme: () => ({ theme: "light" }),
  useLanguage: () => ({
    language: "en",
    t: {
      subscription: {
        title: "Subscribe Pro",
        monthly: "Monthly",
        yearly: "Yearly",
        save_badge: "Save {percent}%",
        free_plan: "Free",
        free_desc: "Basic features forever",
        current_plan: "Current plan",
        buy_credits_cta: "Buy Credits Instead",
        pro_plan: "Pro subscription",
        recommend: "Recommended",
        trial_badge: "7-day trial",
        trial_desc: "Start with a 7-day Pro trial. Payment details are required.",
        trial_disclosure:
          "Payment information is required. After {days} days, the selected plan renews automatically at {price} unless cancelled.",
        start_trial: "Start {days}-day Pro trial",
        benefits: ["Unlimited Ask", "Unlimited reports"],
        login: "Sign in to continue",
        pricing_error: "Failed to load pricing",
        checkout_error: "Failed to start checkout",
      },
    },
  }),
  Modal: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title?: React.ReactNode;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <section aria-label={String(title || "modal")}>
        <h1>{title}</h1>
        {children}
      </section>
    ) : null,
  ActionButton: ({
    children,
    disabled,
    onClick,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
  Container: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
  Card: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

const mockGetAirwallexPricing = vi.fn(async (_lang?: unknown) => ({
  subscription: {
    monthly: { amount: 699, currency: "USD" },
    yearly: { amount: 4199, currency: "USD" },
    firstDiscount: {
      rate: 0.5,
      monthly: { amount: 350, currency: "USD" },
      yearly: { amount: 2100, currency: "USD" },
    },
  },
}));
const mockCreateProTrialCheckout = vi.fn(
  async (_plan: unknown, _successUrl: unknown, _cancelUrl: unknown, _options: unknown) => ({ url: "" }),
);
const mockCreateSubscriptionCheckout = vi.fn(
  async (_plan: unknown, _successUrl: unknown, _cancelUrl: unknown, _options: unknown) => ({ url: "" }),
);
const mockConfirmAirwallexCheckout = vi.fn(async (_checkoutId: unknown) => ({ confirmed: true }));
const mockConfirmAirwallexRenewal = vi.fn(async (_renewalId: unknown) => ({ confirmed: false }));
const mockCreatePortalSession = vi.fn(async (_returnUrl: unknown) => ({ url: "https://portal.example.test" }));

vi.mock("../../services/paymentClient", () => ({
  getAirwallexPricing: (lang?: unknown) => mockGetAirwallexPricing(lang),
  createProTrialCheckout: (plan: unknown, successUrl: unknown, cancelUrl: unknown, options: unknown) =>
    mockCreateProTrialCheckout(plan, successUrl, cancelUrl, options),
  createSubscriptionCheckout: (plan: unknown, successUrl: unknown, cancelUrl: unknown, options: unknown) =>
    mockCreateSubscriptionCheckout(plan, successUrl, cancelUrl, options),
  createPortalSession: (returnUrl: unknown) => mockCreatePortalSession(returnUrl),
  confirmAirwallexCheckout: (checkoutId: unknown) => mockConfirmAirwallexCheckout(checkoutId),
  confirmAirwallexRenewal: (renewalId: unknown) => mockConfirmAirwallexRenewal(renewalId),
  cancelSubscription: vi.fn(async () => ({ success: true })),
  formatPrice: (amount: number, currency: string) =>
    `${currency === "USD" ? "$" : ""}${(amount / 100).toFixed(2)}`,
}));

vi.mock("../../services/airwallexCheckout", () => ({
  redirectToAirwallexCheckout: vi.fn(async () => undefined),
}));

vi.mock("../../components/PaywallConversion", () => ({
  PaywallSocialProof: () => <div data-testid="proof" />,
  RiskReversal: () => <div data-testid="risk" />,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import UpgradeModal from "../../components/auth/UpgradeModal";
import PaymentSuccessPage from "../../components/auth/PaymentSuccessPage";

function resetAuthState(entitlements: Record<string, unknown> = baseEntitlements) {
  mockAuthState = {
    showUpgradeModal: true,
    setShowUpgradeModal: mockSetShowUpgradeModal,
    isAuthenticated: true,
    openLoginModal: mockOpenLoginModal,
    openCreditsModal: mockOpenCreditsModal,
    entitlements,
    upgradeModalReason: undefined,
    refreshEntitlements: mockRefreshAuthEntitlements,
    refreshUser: mockRefreshUser,
  };
  mockV2Entitlements = entitlements;
}

describe("frontend Pro trial activation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    resetAuthState();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("shows eligible users a manual Pro trial CTA with payment and renewal disclosure", async () => {
    render(<UpgradeModal />);

    expect(await screen.findByText("7-day trial")).toBeTruthy();
    expect(
      screen.getByText(
        /Payment information is required\. After 7 days, the selected plan renews automatically at \$41\.99 unless cancelled\./,
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Start 7-day Pro trial/i }));

    await waitFor(() => {
      expect(mockCreateProTrialCheckout).toHaveBeenCalledWith(
        "yearly",
        expect.stringContaining("/payment/success"),
        expect.any(String),
        { lang: "en" },
      );
    });
    expect(mockCreateSubscriptionCheckout).not.toHaveBeenCalled();
  });

  it("marks trial checkout success, confirms Airwallex checkout, and refreshes entitlements", async () => {
    sessionStorage.setItem("aw_checkout_id", "chk_trial");
    sessionStorage.setItem("aw_checkout_kind", "pro_trial");
    resetAuthState({
      ...baseEntitlements,
      isSubscriber: true,
      isTrialing: true,
      trialEndsAt: "2999-01-08T00:00:00.000Z",
      subscription: {
        plan: "monthly",
        status: "trialing",
        expiresAt: "2999-01-08T00:00:00.000Z",
        provider: "airwallex",
      },
    });

    render(<PaymentSuccessPage />);

    expect(await screen.findByText("Pro Trial Activated!")).toBeTruthy();
    expect(screen.getByText("Your 7-day Pro trial has started")).toBeTruthy();

    await waitFor(() => {
      expect(mockConfirmAirwallexCheckout).toHaveBeenCalledWith("chk_trial");
    });
    await waitFor(
      () => {
        expect(mockRefreshUser).toHaveBeenCalled();
        expect(mockRefreshAuthEntitlements).toHaveBeenCalled();
        expect(mockRefreshV2Entitlements).toHaveBeenCalled();
      },
      { timeout: 1500 },
    );
    expect(sessionStorage.getItem("aw_checkout_kind")).toBeNull();
  });
});
