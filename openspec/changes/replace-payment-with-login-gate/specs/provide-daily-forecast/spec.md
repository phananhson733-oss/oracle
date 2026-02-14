## MODIFIED Requirements

### Requirement: Daily Forecast Access Tiers

The system SHALL provide two access tiers for daily forecast based on authentication status (replacing the previous free/credits model).

**Basic tier (unauthenticated):**
- Theme title and explanation
- 4 psychological dimensions (Energy, Tension, Frictions, Pleasures)
- Time windows (Morning, Midday, Evening)
- Daily focus and strategy

**Full tier (authenticated):**
- All basic tier content
- Daily Script Details (theme elaboration, personalization, scenes, challenge, practice, question, technical layer)
- Transit detail expansions

#### Scenario: Unauthenticated user views daily forecast
- **WHEN** an unauthenticated user visits the daily forecast page
- **THEN** the system SHALL display the theme, 4 dimensions, time windows, and daily strategy
- **AND** the "Read Today's Script" detail section SHALL show a login-gated lock

#### Scenario: Unauthenticated user clicks Daily Script Details
- **WHEN** an unauthenticated user attempts to expand the Daily Script Details
- **THEN** the system SHALL trigger the Login Modal with a contextual message (e.g., "Sign in to read your daily script")

#### Scenario: Authenticated user views daily forecast
- **WHEN** an authenticated user visits the daily forecast page
- **THEN** the system SHALL provide full access to all content including Daily Script Details and transit details without any lock
