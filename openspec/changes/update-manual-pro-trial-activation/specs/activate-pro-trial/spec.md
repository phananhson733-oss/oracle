## ADDED Requirements

### Requirement: Registration Creates Free Account
The system SHALL create newly registered users as free users without automatically granting Pro trial entitlements.

#### Scenario: New email registration has no automatic Pro trial
- **GIVEN** an email is not currently registered
- **WHEN** the user completes registration
- **THEN** the user account is created
- **AND** the user is not marked as a Pro subscriber
- **AND** the user is not marked as trialing
- **AND** registration does not create an Airwallex-backed Pro trial claim

#### Scenario: New OAuth registration has no automatic Pro trial
- **GIVEN** a user signs in for the first time with Google or Apple
- **WHEN** the account is created
- **THEN** the user is logged in as a free user
- **AND** Pro trial access is not granted until the user completes manual trial activation

### Requirement: Manual Trial Activation Requires Airwallex Checkout
The system SHALL require an eligible authenticated user to complete Airwallex Hosted Billing Checkout before granting a new 7-day Pro trial.

#### Scenario: Eligible user starts trial
- **GIVEN** an authenticated user is eligible for an Airwallex-backed Pro trial
- **WHEN** the user clicks the trial activation CTA and completes Airwallex checkout
- **THEN** an Airwallex subscription is created with a trial ending 7 days after activation
- **AND** the local subscription is recorded as trialing
- **AND** Pro entitlements become available after checkout ownership is verified

#### Scenario: User abandons trial checkout
- **GIVEN** an authenticated eligible user starts Airwallex trial checkout
- **WHEN** the user cancels or abandons checkout
- **THEN** no Pro trial entitlement is granted
- **AND** no Airwallex-backed Pro trial claim is consumed

#### Scenario: Trial checkout uses normal plan pricing
- **GIVEN** an authenticated eligible user starts a 7-day Pro trial
- **WHEN** the backend creates the Airwallex subscription checkout
- **THEN** the checkout uses the normal selected plan price ID
- **AND** the checkout includes `subscription_data.trial_ends_at`
- **AND** the checkout does not apply first-subscription discount pricing

### Requirement: One Airwallex Trial Per Email Identity
The system SHALL allow at most one Airwallex-backed Pro trial per normalized email identity, even if the user deletes the account and re-registers.

#### Scenario: Trial claim blocks repeat activation
- **GIVEN** a normalized email identity has already activated an Airwallex-backed Pro trial
- **WHEN** any account using that identity attempts to start another Pro trial
- **THEN** the backend rejects the trial activation
- **AND** the frontend presents the normal paid subscription option instead

#### Scenario: Deleted account cannot reset Airwallex trial
- **GIVEN** a user activated an Airwallex-backed Pro trial and later deleted the account
- **WHEN** the same normalized email identity registers again
- **THEN** the new account is created as a free account
- **AND** the user is not eligible for another Airwallex-backed Pro trial

### Requirement: Subscription State Grants Trial and Paid Pro Access
The system SHALL derive new trial and paid Pro entitlements from local subscription rows synchronized from Airwallex subscription state.

#### Scenario: Airwallex trial state grants Pro access
- **GIVEN** Airwallex reports a subscription as `IN_TRIAL`
- **WHEN** the subscription is reconciled locally
- **THEN** the local subscription status is `trialing`
- **AND** the user receives Pro entitlements until the trial period ends or the subscription is cancelled

#### Scenario: Airwallex active state grants paid Pro access
- **GIVEN** Airwallex reports a subscription as `ACTIVE`
- **WHEN** the subscription is reconciled locally
- **THEN** the local subscription status is `active`
- **AND** the user receives paid Pro entitlements
- **AND** the user is not shown as trialing

#### Scenario: Airwallex unpaid state does not silently grant full paid access
- **GIVEN** Airwallex reports a subscription as `UNPAID`
- **WHEN** the subscription is reconciled locally
- **THEN** the local subscription status is `past_due`
- **AND** access follows the existing past-due policy rather than being treated as active paid Pro

### Requirement: Legacy Auto Trials Expire Naturally
The system SHALL preserve active legacy registration-time auto-trials until their original expiration while preventing new legacy auto-trial grants.

#### Scenario: Existing active legacy trial remains valid
- **GIVEN** a user has an existing future `users.trial_ends_at` created before this change
- **WHEN** the user requests entitlements before that timestamp
- **THEN** the system preserves the legacy trial entitlement
- **AND** no Airwallex payment method is assumed to exist for that legacy trial

#### Scenario: Legacy trial expiration does not renew automatically
- **GIVEN** a user only has a legacy registration-time trial
- **WHEN** the legacy `users.trial_ends_at` timestamp passes
- **THEN** the user no longer receives Pro trial entitlements
- **AND** the user must activate an Airwallex-backed trial if eligible or subscribe normally

### Requirement: Trial CTA Discloses Payment and Renewal Terms
The system SHALL clearly disclose payment-method collection, automatic renewal, and cancellation terms before the user starts an Airwallex-backed Pro trial.

#### Scenario: Eligible user sees trial disclosure
- **GIVEN** an eligible authenticated free user views a Pro trial CTA
- **WHEN** the CTA is rendered
- **THEN** the UI states that payment information is required
- **AND** the UI states that the plan renews automatically after 7 days unless cancelled
- **AND** the UI provides the selected plan price that will apply after the trial

#### Scenario: Ineligible user sees paid subscription option
- **GIVEN** an authenticated user is not eligible for an Airwallex-backed Pro trial
- **WHEN** the user views upgrade or paywall UI
- **THEN** the UI does not promise a free trial
- **AND** the UI presents the normal paid subscription option
