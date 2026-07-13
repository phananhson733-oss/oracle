<!-- INPUT: API / bot / AI 成本 / 私有入口保护需求增量。 -->
<!-- OUTPUT: protect-api-costs 新能力规范。 -->
<!-- POS: protect-api-costs 能力增量规范；若更新此文件，务必同步 proposal/design/tasks。 -->
## ADDED Requirements

### Requirement: Public acquisition pages remain anonymous

The system SHALL keep public acquisition content available without a site-wide login wall while protecting non-public capabilities at the API layer.

#### Scenario: Public crawler visits marketing content
- **WHEN** an anonymous crawler requests public marketing, pricing, or wiki content
- **THEN** the system allows the public content to render
- **AND** the request does not grant access to private user data, paid capabilities, or internal actions

### Requirement: API responses are non-indexable by default

The system SHALL mark `/api/*` responses as non-indexable robot content.

#### Scenario: API response carries robot exclusion header
- **WHEN** any `/api/*` route returns a response
- **THEN** the response includes `X-Robots-Tag: noindex, nofollow, noarchive`

### Requirement: Cost-sensitive endpoints apply bot-aware limits

The system SHALL apply stricter request limits to known crawler, AI agent, or missing user-agent traffic on endpoints that can trigger AI generation or expensive computation.

#### Scenario: AI agent repeatedly hits a cost endpoint
- **WHEN** a request with a known AI/crawler user-agent repeatedly calls a cost-sensitive API route
- **THEN** the system rate-limits that traffic before it can repeatedly trigger expensive work

#### Scenario: Normal user stays within existing limits
- **WHEN** a normal browser user calls the same endpoint within expected usage volume
- **THEN** the system preserves the existing product flow and does not require a site-wide login wall

### Requirement: Internal operations require explicit gates

The system SHALL require explicit secret, signature, or admin/development gates for internal operations.

#### Scenario: GM route is called without a GM secret
- **WHEN** a sensitive GM endpoint is enabled but the request lacks the configured GM secret
- **THEN** the system rejects the request before performing the operation

#### Scenario: Cron route lacks cron secret
- **WHEN** a cron endpoint request lacks `Authorization: Bearer <CRON_SECRET>`
- **THEN** the system rejects the request

### Requirement: Robots policy separates public content from private and API surfaces

The system SHALL keep public SEO surfaces crawlable while disallowing API, private user, payment, and internal surfaces in `robots.txt`.

#### Scenario: Robots file is requested
- **WHEN** a crawler fetches `/robots.txt`
- **THEN** the file allows public wiki/marketing pages
- **AND** disallows `/api/`, private app routes, payment routes, and internal/admin surfaces
