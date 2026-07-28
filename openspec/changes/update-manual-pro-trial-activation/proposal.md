# Change: Manual Airwallex-Backed Pro Trial Activation

## Why
New users currently receive Pro trial entitlements automatically at registration time. That gives access before billing information is collected, so the trial cannot convert into an automatic paid subscription when the 7-day period ends.

We need the 7-day Pro trial to be an explicit user action backed by Airwallex subscription checkout: the user chooses to start the trial, provides payment details, receives Pro access during the trial, and converts automatically to a paid subscription unless cancelled.

## What Changes
- Stop granting Pro trial entitlements during account registration.
- Add an explicit Pro trial activation flow that requires Airwallex Hosted Billing Checkout.
- Create Airwallex subscriptions with `subscription_data.trial_ends_at` for eligible users.
- Treat Airwallex subscription state (`IN_TRIAL`/`ACTIVE`/`UNPAID`/`CANCELLED`) as the source of truth for trial and paid Pro entitlements.
- Enforce one Airwallex-backed Pro trial per normalized email, surviving account deletion and re-registration.
- Preserve existing active legacy auto-trials until their original `users.trial_ends_at` expiration, but do not issue new legacy auto-trials.
- Update pricing, paywall, upgrade, settings, and A/B copy so users understand that payment information is required and the plan renews automatically after 7 days unless cancelled.
- Make 7-day trial and first-subscription discount mutually exclusive for the same user identity.

## Impact
- Affected specs: `activate-pro-trial`
- Affected code:
  - `backend/src/services/userService.ts`
  - `backend/migrations/*`
  - `backend/src/api/airwallex.ts`
  - `backend/src/services/airwallexService.ts`
  - `backend/src/services/subscriptionReconciler.ts`
  - `backend/src/services/entitlementServiceV2.ts`
  - `services/paymentClient.ts`
  - `components/auth/UpgradeModal.tsx`
  - `components/auth/PaymentSuccessPage.tsx`
  - `components/Paywall.tsx`
  - `pages/PricingPage.tsx`
  - `pages/SettingsPage.tsx`
  - `constants.ts`
  - `data/pricing.ts`
  - `docs/PRD.md`
- External dependency: Airwallex Billing Checkout subscription trial support via `subscription_data.trial_ends_at`.
