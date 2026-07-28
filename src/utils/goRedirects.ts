// INPUT: Short-link code from /go/:code or /:code, optional inline destination, and published redirect registry.
// OUTPUT: Safe AstrologyWiki destination URL or null.
// POS: Shared resolver for owned short-link routing.

export type GoRedirectRegistry = Record<string, string>;

const SITE_ORIGIN = "https://www.astrologywiki.com";
const ALLOWED_HOSTS = new Set(["astrologywiki.com", "www.astrologywiki.com"]);
const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

const normalizeDestination = (rawDestination: string): string | null => {
  const value = rawDestination.trim();
  if (!value) return null;

  try {
    const url = value.startsWith("/")
      ? new URL(value, SITE_ORIGIN)
      : new URL(value);
    if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
      return null;
    }
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
};

export const resolveGoRedirect = ({
  code,
  inlineDestination,
  registry,
}: {
  code: string | undefined;
  inlineDestination: string | null | undefined;
  registry: GoRedirectRegistry;
}): string | null => {
  const normalizedCode = String(code || "").trim().toLowerCase();
  if (!CODE_PATTERN.test(normalizedCode)) {
    return null;
  }

  const registeredDestination = registry[normalizedCode];
  if (registeredDestination) {
    return normalizeDestination(registeredDestination);
  }

  if (inlineDestination) {
    return normalizeDestination(inlineDestination);
  }

  return null;
};
