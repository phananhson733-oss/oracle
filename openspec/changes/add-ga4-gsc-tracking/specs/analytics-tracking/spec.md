## ADDED Requirements

### Requirement: GA4 Data Collection
The system SHALL load the Google Analytics 4 measurement script when a valid `VITE_GA4_MEASUREMENT_ID` is configured and the user has granted analytics consent.

#### Scenario: GA4 script injection with consent
- **WHEN** a user visits the site AND has previously granted analytics consent
- **THEN** the GA4 gtag.js script SHALL be injected into the page head
- **AND** the GA4 measurement ID SHALL be configured with `send_page_view: false` (manual page view tracking)

#### Scenario: GA4 not loaded without consent
- **WHEN** a user visits the site AND has NOT granted analytics consent
- **THEN** no GA4 scripts SHALL be loaded
- **AND** no tracking data SHALL be sent to Google

#### Scenario: GA4 debug mode in development
- **WHEN** the application is running in development mode (`import.meta.env.DEV === true`)
- **THEN** the GA4 config SHALL include `debug_mode: true`
- **AND** events SHALL appear in GA4 DebugView

### Requirement: Google Search Console Verification
The system SHALL include the GSC site verification meta tag in the HTML head to enable search performance data collection.

#### Scenario: GSC meta tag present
- **WHEN** the page HTML is rendered
- **THEN** a `<meta name="google-site-verification" content="...">` tag SHALL be present in `<head>`

#### Scenario: Sitemap accessible to GSC
- **WHEN** Googlebot requests `/sitemap.xml`
- **THEN** the server SHALL return a valid XML sitemap with all indexable page URLs
- **AND** the Sitemap URL in `robots.txt` SHALL match the registered domain

### Requirement: COOP Header Configuration
The system SHALL set appropriate Cross-Origin-Opener-Policy headers to allow Google Sign-In popup communication.

#### Scenario: COOP allows Google Sign-In popups
- **WHEN** a user initiates Google Sign-In
- **THEN** the `Cross-Origin-Opener-Policy` header SHALL be set to `same-origin-allow-popups`
- **AND** the Google Sign-In popup SHALL be able to communicate with the main window via `postMessage`

### Requirement: Page View Tracking
The system SHALL track page views on every route change within the HashRouter SPA.

#### Scenario: Page view on route change
- **WHEN** the user navigates to a different route (hash change)
- **THEN** a `page_view` event SHALL be sent with `page_path`, `page_title`, `page_location`, and `page_category`

#### Scenario: Page category classification
- **WHEN** a `page_view` event is sent
- **THEN** the `page_category` parameter SHALL classify the page (e.g., home, natal, daily, wiki, ask, synastry, cbt, profile)

### Requirement: User Authentication Event Tracking
The system SHALL track all authentication-related user actions.

#### Scenario: Login failure tracked
- **WHEN** a user attempts to log in AND the login fails
- **THEN** a `login_failed` event SHALL be sent with `method` (google/apple/email) and `error_type`

#### Scenario: Login modal opened
- **WHEN** the login modal is displayed to the user
- **THEN** a `login_modal_opened` event SHALL be sent with `trigger_source` (e.g., paywall, profile, header)

### Requirement: Core Feature Event Tracking
The system SHALL track usage of all core astrology features.

#### Scenario: Daily forecast viewed
- **WHEN** a user views the daily forecast page or switches forecast date
- **THEN** a `daily_forecast_viewed` event SHALL be sent

#### Scenario: Profile updated
- **WHEN** a user saves changes to their profile (birth data)
- **THEN** a `profile_updated` event SHALL be sent with changed field indicators

### Requirement: Payment Funnel Tracking
The system SHALL track the complete payment conversion funnel.

#### Scenario: Paywall displayed
- **WHEN** a paywall or quota limit message is shown to the user
- **THEN** a `paywall_displayed` event SHALL be sent with `feature_type` and `trigger_context`

#### Scenario: Paywall dismissed
- **WHEN** a user closes the paywall without converting
- **THEN** a `paywall_dismissed` event SHALL be sent

#### Scenario: Purchase completed
- **WHEN** a payment is successfully processed
- **THEN** a `purchase_completed` event SHALL be sent with `payment_method`, `amount`, and `product_type`

#### Scenario: Purchase failed
- **WHEN** a payment attempt fails or is cancelled
- **THEN** a `purchase_failed` event SHALL be sent with `payment_method` and `error_type`

### Requirement: Content Interaction Tracking
The system SHALL track user interactions with wiki and content features.

#### Scenario: Wiki search performed
- **WHEN** a user submits a search query on the wiki
- **THEN** a `wiki_search_performed` event SHALL be sent with `search_term` and `results_count`

#### Scenario: Wiki category clicked
- **WHEN** a user clicks on a wiki category
- **THEN** a `wiki_category_clicked` event SHALL be sent with `category_name`

### Requirement: User Experience Event Tracking
The system SHALL track user experience interactions for optimization.

#### Scenario: Theme changed
- **WHEN** a user switches between dark and light theme
- **THEN** a `theme_changed` event SHALL be sent with `from_theme` and `to_theme`

#### Scenario: Language changed
- **WHEN** a user switches the display language
- **THEN** a `language_changed` event SHALL be sent with `from_lang` and `to_lang`

#### Scenario: Frontend error tracked
- **WHEN** an unhandled JavaScript error or promise rejection occurs
- **THEN** an `error_occurred` event SHALL be sent with `error_message` and `error_source`

#### Scenario: API error tracked
- **WHEN** an API call returns a non-2xx status code
- **THEN** an `api_error` event SHALL be sent with `endpoint`, `status_code`, and `error_message`

### Requirement: User Properties
The system SHALL maintain up-to-date GA4 User Properties for segmentation.

#### Scenario: User properties set on login
- **WHEN** a user successfully logs in
- **THEN** the following GA4 User Properties SHALL be set: `user_type`, `subscription_tier`

#### Scenario: User properties updated on preference change
- **WHEN** a user changes language or theme preference
- **THEN** the corresponding User Property SHALL be updated (`language`, `theme`)

### Requirement: Consent Compliance
The system SHALL respect user consent decisions for all analytics operations.

#### Scenario: Consent denied blocks all tracking
- **WHEN** a user denies analytics consent
- **THEN** no GA4 scripts SHALL be loaded
- **AND** no events SHALL be sent
- **AND** no cookies SHALL be set by analytics

#### Scenario: Web Vitals flushed after consent
- **WHEN** a user grants consent after page load
- **THEN** any queued Web Vitals metrics SHALL be sent to GA4
