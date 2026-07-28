# Payment Integration Capability

## ADDED Requirements

### Requirement: Airwallex subscription checkout
The system SHALL create subscription checkout sessions via Airwallex Billing API, supporting monthly and yearly plans in both USD and CNY.

#### Scenario: Western user subscribes with credit card
- **Given** user is logged in with language set to `en`
- **When** user selects the monthly plan ($6.99) and clicks subscribe
- **Then** backend creates an Airwallex Billing Checkout Session with USD pricing
- **And** user is redirected to Airwallex hosted checkout showing credit card / Apple Pay / Google Pay options
- **And** after successful payment, webhook `subscription.active` triggers subscription creation with `payment_provider: 'airwallex'`

#### Scenario: Chinese user subscribes with WeChat Pay
- **Given** user is logged in with language set to `zh`
- **When** user selects the monthly plan (¥49) and clicks subscribe
- **Then** backend creates an Airwallex Billing Checkout Session with CNY pricing
- **And** user is redirected to Airwallex hosted checkout showing WeChat Pay / Alipay options

#### Scenario: First-time discount applied
- **Given** user has never used the first discount
- **When** user selects a plan with first-time discount
- **Then** backend creates checkout with the discounted price ID
- **And** user's `used_first_discount` flag is set to true after successful payment

### Requirement: Airwallex credits purchase
The system SHALL support one-time credits purchases via Airwallex PaymentIntent in both USD and CNY.

#### Scenario: User purchases credits package
- **Given** user is logged in
- **When** user selects a credits package
- **Then** backend creates an Airwallex PaymentIntent with the correct amount and currency based on user language
- **And** user is redirected to Airwallex payment page
- **And** after successful payment, webhook triggers credits addition to user's balance

#### Scenario: Currency matches user language
- **Given** user language is `en`
- **When** pricing is displayed
- **Then** all prices are shown in USD
- **Given** user language is `zh`
- **When** pricing is displayed
- **Then** all prices are shown in CNY

### Requirement: Payment provider switching
The system SHALL support enabling or disabling payment providers via the `PAYMENT_PROVIDER` environment variable without code changes.

#### Scenario: Airwallex only mode
- **Given** `PAYMENT_PROVIDER` is set to `airwallex`
- **When** backend starts
- **Then** only `/api/airwallex/*` routes are registered
- **And** `/api/payment/*` and `/api/paypal/*` routes return 404

#### Scenario: All providers mode
- **Given** `PAYMENT_PROVIDER` is set to `all`
- **When** backend starts
- **Then** all payment routes are registered and functional

#### Scenario: Frontend adapts to active provider
- **Given** `PAYMENT_PROVIDER` is `airwallex`
- **When** user opens the upgrade modal or credits modal
- **Then** UI shows Airwallex checkout flow
- **And** PayPal and Stripe UI elements are hidden

### Requirement: Airwallex webhook processing
The system SHALL process Airwallex webhook events idempotently with signature verification.

#### Scenario: Subscription activated webhook
- **Given** Airwallex sends a `subscription.active` webhook event
- **When** backend receives the webhook
- **Then** signature is verified using `AIRWALLEX_WEBHOOK_SECRET`
- **And** subscription is created/updated in database with status `active`
- **And** bonus credits are awarded to user
- **And** duplicate events with the same event ID are ignored

#### Scenario: Subscription cancelled webhook
- **Given** Airwallex sends a `subscription.cancelled` webhook event
- **When** backend receives the webhook
- **Then** subscription status is updated to `canceled` in database

### Requirement: Airwallex authentication token management
The system SHALL obtain and cache Airwallex Bearer tokens with automatic refresh before expiry.

#### Scenario: Token acquisition and caching
- **Given** Airwallex Client ID and API Key are configured
- **When** first API call is made to Airwallex
- **Then** service obtains Bearer token via POST `/api/v1/authentication/login`
- **And** token is cached in memory
- **And** subsequent calls reuse the cached token

#### Scenario: Token auto-refresh
- **Given** cached token will expire within 5 minutes
- **When** an API call is made
- **Then** service obtains a new token before making the call

## MODIFIED Requirements

### Requirement: Subscription data model supports Airwallex provider
The existing subscription storage SHALL be extended to support Airwallex as a payment provider alongside Stripe and PayPal.

#### Scenario: Airwallex subscription stored correctly
- **Given** a user completes subscription via Airwallex
- **When** subscription is persisted
- **Then** `payment_provider` is set to `'airwallex'`
- **And** `airwallex_subscription_id` and `airwallex_customer_id` are populated
- **And** existing Stripe/PayPal fields remain null
