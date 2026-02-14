## MODIFIED Requirements

### Requirement: Synastry Access Control

The system SHALL require authentication to use the synastry (compatibility) feature (replacing the previous free-3-times + credits model).

#### Scenario: Unauthenticated user attempts to use synastry
- **WHEN** an unauthenticated user navigates to the synastry page or clicks the synastry navigation item
- **THEN** the system SHALL trigger the Login Modal with a contextual message (e.g., "Sign in to explore relationship compatibility")
- **AND** the synastry input form SHALL NOT be accessible

#### Scenario: Authenticated user uses synastry
- **WHEN** an authenticated user generates a synastry report
- **THEN** the system SHALL process the request without any usage count check, hash validation for free quota, or credit deduction
- **AND** all overview sections (core dynamics, practice tools, relationship timing, highlights, vibe tags, growth task, conflict loop, weather forecast, action plan) SHALL be fully accessible

#### Scenario: No usage counter for authenticated users
- **WHEN** an authenticated user views the synastry page
- **THEN** the system SHALL NOT display remaining synastry count or usage limits
