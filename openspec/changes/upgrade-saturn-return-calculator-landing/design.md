## Precision contract

`date` is required. The response reports `precision: "exact"` only when both
birth `time` and `timezone` are supplied. Otherwise it reports
`precision: "estimated"`.

```ts
interface SaturnReturnPass {
  occurredAt: string; // ISO-8601 UTC
  direction: "direct" | "retrograde";
}

interface SaturnReturnPeriod {
  startDate: string; // resolved 2°-orb boundary
  endDate: string;   // resolved 2°-orb boundary
  exactPasses?: SaturnReturnPass[];
  estimatedClosestDate?: string;
}
```

The backwards-compatible `approximate` boolean remains temporarily, but UI
and API tests use `precision` as the source of truth. A request with a time but
no timezone remains estimated; the API must not silently default it to exact.

## Numerical resolution

For each approximate return year, the service samples geocentric ecliptic
Saturn longitude across a bounded search window. It normalizes the signed
longitude difference to `[-180, 180)`, refines sign-change brackets with
bisection to a 60-second tolerance, and deduplicates nearby roots. The same
approach resolves 2° orb boundaries. Local minima of the absolute difference
are additionally refined so a conjunction that touches zero at a station is
not missed without fabricating near misses.

Exact passes are UTC instants, sorted chronologically, with direction read from
the ephemeris speed at the resolved instant. Date-only responses expose only an
estimated closest calendar date.

## English content source

`data/saturnReturnLandingContent.js` is the sole source for:

- title, description, and keywords;
- six landing sections and fifteen H3 items;
- ten visible FAQs and FAQPage JSON-LD;
- three published related-tool links; and
- the static HTML renderer consumed by `generate-seo-pages.mjs`.

`relatedArticles` is empty in this release. The SPA does not render an empty
article module, placeholder, or article heading. `relatedTools` supplies three
visible cards for the live Birth Chart, Synastry, and Moon Sign calculators.
Static and runtime outputs stay EN canonical; no Chinese static page is added.

## Privacy and UI

`saturn_return_calculated` contains only precision, boolean input-completeness,
natal-sign, and total-pass-count categories. It excludes birth date, time,
city, timezone, coordinates, degrees, and exact timestamps. UI additions use
the existing paper/space, accent, and semantic text tokens defined by
`COLOR_SYSTEM_GUIDE.md`; precision is always communicated in text, not colour
alone.
