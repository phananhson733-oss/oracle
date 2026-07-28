// INPUT: Published short-link registry for /go/:code.
// OUTPUT: code -> destination URL mappings used by the SPA redirect route.
// POS: Link attribution redirect registry; add clean code-only redirects here when publishing mapped short links.

import type { GoRedirectRegistry } from "../src/utils/goRedirects";

export const goRedirects: GoRedirectRegistry = {};
