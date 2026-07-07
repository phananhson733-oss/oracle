## ADDED Requirements

### Requirement: PageSpeed Baseline and Regression Gates

The system SHALL maintain a reproducible PageSpeed/Lighthouse baseline for the home route across desktop and mobile before and after performance changes.

#### Scenario: Baseline captured before optimization
- **WHEN** a performance optimization change starts
- **THEN** the implementer records desktop and mobile values for Performance, Accessibility, Best Practices, SEO, LCP, TBT, CLS, FCP, Speed Index, and total transfer size for `https://www.astrologywiki.com/`
- **AND** the implementer records the deployed asset filenames used by the tested page

#### Scenario: Final verification meets target
- **WHEN** the optimization is deployed
- **THEN** desktop and mobile Lighthouse/PageSpeed lab results show Performance at least `90`
- **AND** LCP is at most `2.5s`
- **AND** TBT is at most `200ms`
- **AND** CLS is at most `0.1`
- **AND** Accessibility is at least `95`
- **AND** Best Practices and SEO remain `100`

### Requirement: Efficient Critical Brand Assets

The system SHALL NOT load oversized brand images for first-viewport icon-sized UI.

#### Scenario: Navigation logo loads a right-sized asset
- **WHEN** the home page renders the navigation brand mark
- **THEN** the requested image resource is dimensioned for the displayed size or supplied via responsive candidates
- **AND** the transfer size for that first-viewport logo resource is less than `10KB`
- **AND** the `1024x1024` source logo is not requested during the initial home-page load

#### Scenario: Structured data logo remains valid
- **WHEN** crawlers parse Organization or WebSite structured data
- **THEN** the referenced logo URL returns a valid image with appropriate dimensions for schema consumers
- **AND** changing first-viewport UI logo assets does not break the structured-data logo URL

### Requirement: Visible and Stable Hero Text

The system SHALL render the home hero text immediately with stable fallback metrics and without document-level font visibility blocking.

#### Scenario: Hero text is not hidden by font readiness
- **WHEN** the home page starts loading
- **THEN** the document body remains visible before web fonts finish loading
- **AND** the hero heading text is visible using a fallback font if the web font is not ready

#### Scenario: Hero text does not cause layout shift
- **WHEN** web fonts finish loading after the first paint
- **THEN** the hero heading does not produce a layout shift that causes CLS to exceed `0.1`
- **AND** Lighthouse no longer reports the hero heading font load as a material CLS contributor

### Requirement: Landing Runtime Work Budget

The system SHALL keep non-critical runtime work out of the home page's initial rendering path.

#### Scenario: Analytics preserves consent while avoiding first-paint cost
- **WHEN** an anonymous visitor loads the home page before granting analytics consent
- **THEN** consent defaults are set in the required order
- **AND** non-consent analytics events are not sent before consent
- **AND** analytics script work is deferred so it does not materially increase LCP or TBT

#### Scenario: Entitlements do not duplicate on landing
- **WHEN** an anonymous visitor loads the home page and takes no account or paywall action
- **THEN** the app does not issue duplicate `/api/entitlements/v2` requests
- **AND** entitlement fetching does not block first paint or hero interactivity

#### Scenario: Third-party ad loader stays out of default first-byte HTML
- **WHEN** the home page is built without `VITE_ADSENSE_HEAD_LOADER_ENABLED=true`
- **THEN** the first-byte HTML does not include `adsbygoogle.js`
- **AND** AdSense can still be loaded at runtime by eligible ad slots after consent and placement gates pass
- **AND** the explicit head-loader switch can be enabled for an AdSense verification deployment without enabling runtime ad placement

### Requirement: Safe Static Asset Caching

The system SHALL serve hashed static assets with immutable caching while preventing missing asset paths from falling back to cached HTML.

#### Scenario: Existing hashed asset is immutable
- **WHEN** a request is made for an existing `/assets/<hash>.js` or `/assets/<hash>.css` file
- **THEN** the response has the correct JavaScript or CSS content type
- **AND** the response includes `Cache-Control: public, max-age=31536000, immutable`

#### Scenario: Missing hashed asset is not rewritten to HTML
- **WHEN** a request is made for a missing `/assets/<missing>.js` or `/assets/<missing>.css` path
- **THEN** the response status is `404` or `410`
- **AND** the response is not `/index.html`
- **AND** the response is not cached as an immutable JavaScript or CSS asset

### Requirement: Landing Accessibility Signals

The system SHALL preserve or improve landing-page accessibility while optimizing performance.

#### Scenario: Accent CTA contrast passes
- **WHEN** PageSpeed or an accessibility audit evaluates primary landing CTA buttons
- **THEN** foreground and background colors meet WCAG AA contrast for the rendered font size
- **AND** the colors remain compliant with `COLOR_SYSTEM_GUIDE.md`

#### Scenario: Landing tag links meet target size
- **WHEN** PageSpeed evaluates article tag links on mobile or desktop
- **THEN** each actionable tag target has at least `24px` effective size or equivalent spacing from adjacent targets
- **AND** the change does not remove crawlable keyword-bearing links
