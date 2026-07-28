## MODIFIED Requirements

### Requirement: Oracle Q&A Access Control

The system SHALL require authentication to use the Oracle Q&A feature (replacing the previous weekly quota + credits model).

#### Scenario: Unauthenticated user visits Ask page
- **WHEN** an unauthenticated user navigates to the Oracle Q&A page
- **THEN** the system SHALL display the question categories and interface
- **BUT** attempting to submit a question SHALL trigger the Login Modal with a contextual message (e.g., "Sign in to ask the Oracle")

#### Scenario: Authenticated user uses Ask
- **WHEN** an authenticated user submits a question
- **THEN** the system SHALL process the question without any quota check, credit deduction, or usage tracking
- **AND** the user SHALL have unlimited questions

#### Scenario: No quota display for authenticated users
- **WHEN** an authenticated user views the Ask page
- **THEN** the system SHALL NOT display remaining quota counters or usage limits
