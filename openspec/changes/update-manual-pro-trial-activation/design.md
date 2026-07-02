# Design: Manual Pro Trial Activation

## Context
The current implementation grants a 7-day Pro trial during user creation:

- `userService.createUser()` calls the `create_user_with_trial` RPC.
- The RPC inserts or reuses `trial_claims` and writes `users.trial_ends_at`.
- `entitlementServiceV2` treats future `users.trial_ends_at` as `isSubscriber=true` and `isTrialing=true`.

That model is not compatible with automatic post-trial billing because no payment method exists. Airwallex Billing Checkout supports creating subscriptions with a free trial by sending `subscription_data.trial_ends_at`, and Airwallex then owns the trial-to-paid lifecycle.

## Goals / Non-Goals
- Goals:
  - Registration creates a free account only.
  - Eligible users manually activate a 7-day Pro trial through Airwallex checkout.
  - Airwallex subscription state is authoritative for new trial and paid Pro entitlements.
  - Existing active legacy auto-trials continue until their original expiry.
  - Account deletion and re-registration cannot reset an Airwallex-backed trial.
  - Trial copy clearly discloses payment information, auto-renewal, and cancellation.
- Non-Goals:
  - Replacing Airwallex with a new payment abstraction.
  - Changing credit-pack checkout.
  - Changing Pro plan prices.
  - Reworking unrelated login, newsletter, or onboarding behavior.

## Decisions

### Decision: Use Airwallex subscription trials, not local-only trials
Create trial subscriptions through Airwallex Hosted Billing Checkout with `subscription_data.trial_ends_at = now + 7 days`. The checkout must collect the customer payment method before the local system grants new Pro trial entitlements.

Reason: this matches the desired business behavior. The same subscription that grants the trial can renew automatically after the trial period, and cancellation/payment failure events flow through the existing Airwallex lifecycle.

### Decision: Keep registration free-only
Replace the registration-time trial grant path with a free-account creation path. New user rows must not receive a future `users.trial_ends_at`, and registration must not insert a trial claim that burns eligibility.

The existing `create_user_with_trial` RPC can be replaced or complemented by a new RPC such as `create_user_without_trial`. The implementation should keep the atomic user insert and duplicate-email behavior from the existing RPC.

### Decision: Use a separate Airwallex trial claim marker
Do not rely on the legacy `trial_claims.trial_ends_at` alone to decide Airwallex-backed trial eligibility, because existing rows were created by the old registration-time auto-trial model.

Preferred implementation: add a dedicated table such as `pro_trial_claims` keyed by normalized-email SHA-256, with fields for:

- `email_hash`
- `airwallex_subscription_id`
- `airwallex_customer_id`
- `trial_started_at`
- `trial_ends_at`
- `created_user_id`
- `created_at`

This keeps legacy auto-trial history separate from the new payment-backed trial claim. If the implementation instead extends `trial_claims`, it must explicitly distinguish `legacy_auto` claims from `airwallex_checkout` claims.

### Decision: Subscription state drives new entitlements
For new manual trials, Pro entitlement comes from the `subscriptions` row:

- Airwallex `IN_TRIAL` maps to local `trialing`.
- Airwallex `ACTIVE` maps to local `active`.
- Airwallex `UNPAID` maps to local `past_due`.
- Airwallex `CANCELLED`/`CANCELED` maps to local `canceled`.

`entitlementServiceV2` should keep honoring active legacy `users.trial_ends_at` only as a migration bridge. New trial activations should not require writing `users.trial_ends_at`.

### Decision: Trial and first discount are mutually exclusive
A user identity can choose the Airwallex-backed 7-day Pro trial or the first-subscription discount, but the two must not stack. Starting an Airwallex-backed Pro trial consumes the promotional choice for that normalized email. The trial checkout uses normal plan price IDs with `trial_ends_at`, not first-discount price IDs.

### Decision: Use explicit trial activation API semantics
Prefer a dedicated endpoint, for example `POST /api/airwallex/start-pro-trial`, accepting `plan`, `successUrl`, and `cancelUrl`. This keeps eligibility, disclosure, and trial claim logic separate from immediate paid subscription checkout.

If the implementation reuses `POST /api/airwallex/subscribe`, it must use an explicit request field such as `startTrial: true` and keep the non-trial subscription path unchanged.

## Lifecycle
1. User registers or signs in.
2. Entitlements return `isSubscriber=false`, `isTrialing=false`, and trial eligibility metadata for users who have not activated an Airwallex-backed trial.
3. User clicks the trial CTA.
4. Backend verifies eligibility by normalized email hash and active subscription state.
5. Backend creates Airwallex Hosted Billing Checkout in `SUBSCRIPTION` mode with `subscription_data.trial_ends_at`.
6. User completes Airwallex checkout and payment method setup.
7. Success page confirms checkout and/or webhook/reconciler persists the subscription as `trialing`.
8. Entitlements refresh and Pro access begins.
9. On trial end, Airwallex transitions the subscription to paid `ACTIVE` or `UNPAID`; webhook/reconciler updates local state.
10. If user cancels during trial, Airwallex cancellation prevents automatic renewal and local entitlement expires according to Airwallex state/current period.

## Migration Plan
- Leave existing `users.trial_ends_at` values in place.
- Continue honoring currently active legacy auto-trials until their original expiration.
- Stop creating new `users.trial_ends_at` values for new registrations.
- Introduce the Airwallex-backed trial claim table before enabling the new trial CTA in production.
- Backfill is not required for the new claim table. Existing legacy claim rows do not block the new Airwallex-backed trial unless the product decision changes.
- After all legacy auto-trials have naturally expired, remove or narrow the legacy entitlement branch in a later cleanup change.

## Risks / Trade-offs
- Airwallex status naming mismatch: documentation uses `IN_TRIAL`, while local code currently maps `TRIALING`/`TRIAL`. Mitigation: update status mapping and tests.
- Frontend success page may race webhook delivery. Mitigation: keep confirm-checkout and reconciler paths idempotent and refresh entitlements after either path succeeds.
- Existing copy says "trial when you sign up". Mitigation: update all pricing/paywall/settings/AB strings in the same implementation.
- Some legacy users may receive both an old automatic trial and a new payment-backed trial. Mitigation: allow this only as a transition policy, and enforce one Airwallex-backed trial going forward.

## Open Questions
- Should existing users with an expired legacy auto-trial be eligible for one Airwallex-backed trial? This proposal assumes yes for transition fairness.
- Should the trial default to monthly or let users choose monthly/yearly before checkout? This proposal assumes the plan remains user-selected.
