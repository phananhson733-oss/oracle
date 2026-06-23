// INPUT: /go/:code requests with optional to= destination, registered redirect submissions, and published redirect registry.
// OUTPUT: 302 redirect to safe AstrologyWiki destinations, root short-link submission JSON, or 404/4xx for invalid links.
// POS: Public short-link redirect route for link-attribution tools.
import express from "express";
import Redis from "ioredis";
import { goRedirects, type GoRedirectRegistry } from "../data/goRedirects.js";
import { isSupabaseConfigured, supabase } from "../db/supabase.js";

const SITE_ORIGIN = "https://www.astrologywiki.com";
const ALLOWED_HOSTS = new Set(["astrologywiki.com", "www.astrologywiki.com"]);
const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;
const REDIRECT_KEY_PREFIX = "go_redirect:";

const memoryRedirects = new Map<string, string>();
let redisClient: Redis | null | undefined;

const normalizeCode = (rawCode: unknown): string | null => {
  const value = String(rawCode || "").trim().toLowerCase();
  return CODE_PATTERN.test(value) ? value : null;
};

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

const canUseMemoryStore = () =>
  process.env.NODE_ENV === "test" ||
  process.env.LINK_ATTRIBUTION_MEMORY_STORE === "true";

const getRedisClient = async (): Promise<Redis | null> => {
  if (canUseMemoryStore()) return null;
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) return null;
  if (redisClient) return redisClient;
  if (redisClient === null) return null;

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
  });

  try {
    await client.connect();
    redisClient = client;
    return client;
  } catch {
    redisClient = null;
    client.disconnect();
    return null;
  }
};

const getStoredRedirect = async (code: string): Promise<string | null> => {
  if (!canUseMemoryStore() && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("link_redirects")
      .select("destination_url")
      .eq("code", code)
      .maybeSingle();
    if (!error && typeof data?.destination_url === "string") {
      return normalizeDestination(data.destination_url);
    }
  }

  const client = await getRedisClient();
  if (client) {
    return client.get(`${REDIRECT_KEY_PREFIX}${code}`);
  }
  return memoryRedirects.get(code) || null;
};

const setStoredRedirect = async (
  code: string,
  destination: string,
): Promise<boolean> => {
  if (!canUseMemoryStore() && isSupabaseConfigured()) {
    const { error } = await supabase.from("link_redirects").insert({
      code,
      destination_url: destination,
    });
    if (!error) {
      return true;
    }
  }

  const client = await getRedisClient();
  if (client) {
    await client.set(`${REDIRECT_KEY_PREFIX}${code}`, destination);
    return true;
  }
  if (!canUseMemoryStore()) {
    return false;
  }
  memoryRedirects.set(code, destination);
  return true;
};

export const resetGoRedirectStoreForTests = (): void => {
  memoryRedirects.clear();
};

export const goRedirectRouter = express.Router();

goRedirectRouter.get("/:code", async (req, res) => {
  const code = normalizeCode(req.params.code);
  if (!code) {
    res.status(404).send("Short link not found");
    return;
  }

  const registeredDestination = resolveGoRedirect({
    code,
    inlineDestination: null,
    registry: goRedirects,
  });
  const storedDestination = registeredDestination || (await getStoredRedirect(code));
  const inlineDestination = resolveGoRedirect({
    code: req.params.code,
    inlineDestination:
      typeof req.query.to === "string" ? req.query.to : undefined,
    registry: {},
  });
  const destination = storedDestination || inlineDestination;

  if (!destination) {
    res.status(404).send("Short link not found");
    return;
  }

  res.redirect(302, destination);
});

export const goRedirectRegistrationRouter = express.Router();

goRedirectRegistrationRouter.post("/", async (req, res) => {
  const code = normalizeCode(req.body?.code);
  const destination = normalizeDestination(
    req.body?.destination_url || req.body?.destinationUrl || "",
  );

  if (!code) {
    res.status(400).json({
      success: false,
      error: "Invalid short-link code.",
      code: "invalid_code",
    });
    return;
  }

  if (!destination) {
    res.status(400).json({
      success: false,
      error: "Destination must be an AstrologyWiki URL.",
      code: "invalid_destination",
    });
    return;
  }

  const existing =
    resolveGoRedirect({ code, inlineDestination: null, registry: goRedirects }) ||
    (await getStoredRedirect(code));

  if (existing && existing !== destination) {
    res.status(409).json({
      success: false,
      error: "Short-link code already points to a different destination.",
      code: "code_conflict",
    });
    return;
  }

  const stored = existing || (await setStoredRedirect(code, destination));
  if (!stored) {
    res.status(503).json({
      success: false,
      error: "Short-link storage is not configured.",
      code: "storage_unconfigured",
    });
    return;
  }

  res.status(existing ? 200 : 201).json({
    success: true,
    code,
    short_url: `${SITE_ORIGIN}/${code}`,
    destination_url: destination,
    redirect_status: 302,
  });
});
