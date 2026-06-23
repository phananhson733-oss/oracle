// INPUT: /go/:code requests with optional to= destination and published redirect registry.
// OUTPUT: 302 redirect to safe AstrologyWiki destinations, or 404 for invalid/unknown links.
// POS: Public short-link redirect route for link-attribution tools.
import express from "express";
import { goRedirects, type GoRedirectRegistry } from "../data/goRedirects.js";

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

export const goRedirectRouter = express.Router();

goRedirectRouter.get("/:code", (req, res) => {
  const destination = resolveGoRedirect({
    code: req.params.code,
    inlineDestination:
      typeof req.query.to === "string" ? req.query.to : undefined,
    registry: goRedirects,
  });

  if (!destination) {
    res.status(404).send("Short link not found");
    return;
  }

  res.redirect(302, destination);
});
