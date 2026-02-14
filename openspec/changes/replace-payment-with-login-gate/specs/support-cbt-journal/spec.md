## MODIFIED Requirements

### Requirement: CBT Journal Access Tiers

The system SHALL provide two access tiers for CBT journal based on authentication status (replacing the previous free-journal + credits-stats model).

**Always available (regardless of auth):**
- CBT record creation (wizard)
- Timeline/history browsing
- Calendar view

**Requires authentication:**
- Monthly statistics and analysis cards (Mood Composition, Somatic Pattern, Source Support, CBT Competence)

#### Scenario: Unauthenticated user creates CBT record
- **WHEN** an unauthenticated user opens the CBT journal and creates a new record
- **THEN** the system SHALL allow full record creation through the wizard without any login requirement

#### Scenario: Unauthenticated user clicks statistics
- **WHEN** an unauthenticated user attempts to view the statistics/analysis cards
- **THEN** the system SHALL trigger the Login Modal with a contextual message (e.g., "Sign in to view your mood insights")

#### Scenario: Authenticated user views statistics
- **WHEN** an authenticated user views the CBT statistics
- **THEN** the system SHALL display all analysis cards without any monthly credit check or payment requirement
