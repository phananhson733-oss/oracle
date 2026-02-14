## MODIFIED Requirements

### Requirement: Natal Content Access Tiers

The system SHALL provide two access tiers for natal insights based on authentication status (replacing the previous free/subscription/credits model).

**Basic tier (unauthenticated):**
- Birth chart visualization
- Quick Glance overview
- First 2 dimensions (Emotions, Attachment)
- Technical specifications

**Full tier (authenticated):**
- All basic tier content
- All remaining dimensions (index >= 2)
- Core themes (Drive, Fear, Growth)
- All detail expansions

#### Scenario: Unauthenticated user views natal page
- **WHEN** an unauthenticated user with a local profile visits the natal dashboard
- **THEN** the system SHALL display the birth chart, Quick Glance, first 2 dimensions, and tech specs
- **AND** dimensions 3+ and core themes SHALL show a login-gated lock with a "Sign in to unlock" action

#### Scenario: Unauthenticated user clicks locked dimension
- **WHEN** an unauthenticated user clicks a locked dimension or core theme
- **THEN** the system SHALL trigger the Login Modal with a contextual message (e.g., "Sign in to unlock all personality dimensions")

#### Scenario: Authenticated user views natal page
- **WHEN** an authenticated user visits the natal dashboard
- **THEN** the system SHALL display all dimensions, core themes, and detail expansions without any lock or paywall
