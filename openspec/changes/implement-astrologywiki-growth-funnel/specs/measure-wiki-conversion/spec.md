## ADDED Requirements

### Requirement: Consent-aware Page View Tracking

The system SHALL record one `page_view` for each tracked route after analytics consent and SHALL recover the current page exactly once when a first-time visitor grants consent after page load.

#### Scenario: Previously granted visitor lands directly
- **WHEN** a visitor with analytics consent loads an indexable route
- **THEN** exactly one `page_view` SHALL be recorded for the current pathname

#### Scenario: First-time visitor grants consent
- **WHEN** a visitor lands without analytics consent and later grants it
- **THEN** the current route SHALL emit exactly one recovered `page_view`
- **AND** granting consent repeatedly SHALL NOT duplicate that view

#### Scenario: SPA navigation after consent
- **WHEN** a consented visitor navigates between two different SPA routes
- **THEN** each destination SHALL emit one independent `page_view`
- **AND** `page_location` SHALL match the destination URL

### Requirement: Language-aware Page Classification

The system SHALL classify localized routes by their business segment after removing an optional language prefix.

#### Scenario: Localized wiki article
- **WHEN** `page_path` is `/en/wiki/example` or `/zh/wiki/example`
- **THEN** `page_category` SHALL be `wiki`

#### Scenario: Localized birth chart calculator
- **WHEN** `page_path` is `/en/birth-chart-calculator` or `/zh/birth-chart-calculator`
- **THEN** `page_category` SHALL be `tool`
