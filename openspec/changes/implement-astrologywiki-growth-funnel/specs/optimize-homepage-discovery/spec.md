## ADDED Requirements

### Requirement: Homepage Search Intent

The homepage SHALL present its primary search intent in both the document title and visible H1.

#### Scenario: Final title length
- **WHEN** the homepage is rendered
- **THEN** the complete document title including brand SHALL be no longer than 60 characters

#### Scenario: Visible H1
- **WHEN** a visitor or crawler reads the homepage H1
- **THEN** it SHALL contain both `astrology` and `birth chart` in natural language

### Requirement: Homepage Brand Schema

The homepage SHALL emit first-byte Organization and WebSite structured data without duplicating the hydrated SPA output.

#### Scenario: Organization contact
- **WHEN** the root HTML is requested
- **THEN** Organization JSON-LD SHALL include the support contact point and verified social URLs

### Requirement: Visible FAQ Parity

The homepage SHALL display at least five visible FAQ entries and SHALL generate FAQPage JSON-LD from the same data.

#### Scenario: FAQ UI and schema
- **WHEN** the homepage is rendered
- **THEN** every FAQPage question and answer SHALL have a matching visible FAQ entry

### Requirement: Crawlable Homepage Content

The root HTML SHALL expose substantial, structured, truthful homepage copy without requiring scroll-triggered JavaScript.

#### Scenario: First-byte content
- **WHEN** a crawler requests `/`
- **THEN** the response SHALL contain the H1, core tool links, multiple H2 sections, use cases, trust signals, and FAQ content
- **AND** the content SHALL not rely on fabricated user counts, ratings, media mentions, or author credentials

### Requirement: Truthful Editorial Authorship

The system SHALL keep editorial personas disclosed and SHALL use the editorial Organization as the Article author unless a real verified author is introduced.

#### Scenario: Editorial persona remains disclosed
- **WHEN** an editorial persona page or byline is rendered
- **THEN** the interface SHALL disclose that it is an editorial persona with AI-assisted content
- **AND** the Article author schema SHALL NOT claim fabricated Person credentials
