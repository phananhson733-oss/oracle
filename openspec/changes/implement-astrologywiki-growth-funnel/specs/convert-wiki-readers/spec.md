## ADDED Requirements

### Requirement: Persistent Birth Chart Entry

The system SHALL expose a language-aware Birth Chart Calculator CTA from the global navigation without requiring authentication.

#### Scenario: Desktop navigation
- **WHEN** a visitor views any page on a desktop viewport
- **THEN** the navigation SHALL display a `Get Free Birth Chart` CTA linking to the localized calculator

#### Scenario: Mobile navigation
- **WHEN** a visitor views any page on a mobile viewport
- **THEN** the current mobile navigation SHALL expose a compact, touch-accessible localized Birth Chart CTA

### Requirement: Scroll-triggered Article CTA

The system SHALL show a secondary tool bar on selected Wiki article pages after meaningful scroll progress.

#### Scenario: Show after scrolling
- **WHEN** the visitor scrolls to at least 400px on a Wiki selected-article page
- **THEN** the Sticky CTA SHALL appear below the fixed navigation

#### Scenario: Hide near the top
- **WHEN** the visitor returns to 100px or less
- **THEN** the Sticky CTA SHALL hide

#### Scenario: Reduced motion
- **WHEN** the visitor prefers reduced motion
- **THEN** the CTA SHALL change visibility without a sliding animation

### Requirement: Article Lead CTA

The system SHALL render a tool recommendation after the article header and before the Markdown body.

#### Scenario: Celebrity article
- **WHEN** an article has a reliable celebrity name
- **THEN** the CTA SHALL personalize the copy with that name
- **AND** the primary action SHALL open the localized Birth Chart Calculator

#### Scenario: Generic article
- **WHEN** an article has no reliable celebrity name
- **THEN** the CTA SHALL use generic natal-chart copy

#### Scenario: Mobile secondary action
- **WHEN** the CTA is viewed on a mobile viewport
- **THEN** the tutorial secondary action SHALL be visually hidden

### Requirement: Unified Tool Click Attribution

Every Wiki-to-tool CTA SHALL emit `tool_click` through the shared analytics service.

#### Scenario: CTA click
- **WHEN** a visitor activates module A, B, C, or the article-bottom CTA
- **THEN** the event SHALL include `cta_module`, `page_location`, `page_path`, and `tool_target`
