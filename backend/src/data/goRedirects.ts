// INPUT: Published short-link registry for /go/:code backend redirects.
// OUTPUT: code -> destination URL mappings used when no inline to= fallback is present.
// POS: Backend link-attribution redirect registry; keep in sync with frontend data/goRedirects.ts when publishing clean code-only links.

export type GoRedirectRegistry = Record<string, string>;

export const goRedirects: GoRedirectRegistry = {};
