# Change: Upgrade the Saturn Return calculator and English landing page

## Why

The previous calculator reported a sampled calendar day as `exactDate`, even
though it was found by coarse scanning. Its runtime page, static SEO stub, and
FAQ schema also maintained separate copies of the English content. That made
the precision claim misleading and allowed crawler, browser, and structured
data output to drift.

## What Changes

- Replace the sampled `exactDate` contract with two explicit precision modes:
  date-only input returns an estimate; date, time, and timezone return exact
  UTC conjunction passes with direct/retrograde direction.
- Resolve conjunction and two-degree orb boundary roots numerically against
  Swiss Ephemeris longitude data, including stationary non-crossing touches.
- Render the English canonical page, static HTML, metadata, and FAQPage JSON-LD
  from one content model.
- Publish the approved structure: one H1, six H2s, fifteen H3s, and ten visible
  FAQ entries. Do not show unpublished related articles.
- Link only to the live Birth Chart, Synastry, and Moon Sign calculators in
  three visible tool cards.
- Track calculator completion with categorical, non-identifying analytics
  fields only.

## Out of Scope

- A Chinese static SEO landing page or new Saturn Return editorial articles.
- Predictions, guaranteed outcomes, or any interpretation that substitutes for
  medical, legal, financial, or mental-health advice.
- Sending birth data, city, timezone, coordinates, or calculated timestamps to
  analytics.

## Impact

- Affected specs: `provide-saturn-return-calculation` and
  `publish-calculator-landing-content`.
- Affected areas: Saturn Return service/API, calculator UI, static page
  generator, generated public HTML, and frontend/backend test coverage.
