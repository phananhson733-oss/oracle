## ADDED Requirements

### Requirement: Login-Based Access Gate

The system SHALL enforce a two-tier access model: unauthenticated users access basic content only; authenticated users access all content without payment.

#### Scenario: Unauthenticated user clicks a login-required feature
- **WHEN** an unauthenticated user clicks a feature that requires login (Ask, Synastry, Wiki Tools, CBT Stats, paid Natal dimensions, Daily Script Details)
- **THEN** the system SHALL display a "Login Reminder" prompt with context-specific messaging
- **AND** the prompt SHALL offer navigation to the existing Login Modal

#### Scenario: Authenticated user accesses any feature
- **WHEN** an authenticated user accesses any feature
- **THEN** the system SHALL grant full access without payment, subscription, or credit checks

#### Scenario: Login Gate mode can be disabled
- **WHEN** the `LOGIN_GATE_MODE` constant is set to `false`
- **THEN** the system SHALL revert to the previous `FREE_MODE` behavior

## MODIFIED Requirements

### Requirement: Route Access Control

Unauthenticated users SHALL be allowed to access protected routes (dashboard, forecast, wiki, journal) if they have a local profile, but feature-level access within those routes SHALL be gated by login status when `LOGIN_GATE_MODE` is enabled.

#### Scenario: Unauthenticated user with local profile visits dashboard
- **WHEN** an unauthenticated user with a local profile navigates to `/dashboard`
- **THEN** the system SHALL render the MePage with basic content visible and login-gated content locked

#### Scenario: Unauthenticated user with local profile visits synastry
- **WHEN** an unauthenticated user with a local profile navigates to `/us`
- **THEN** the system SHALL display a login prompt instead of the synastry interface
