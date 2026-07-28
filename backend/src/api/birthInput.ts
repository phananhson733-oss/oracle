// INPUT: tz-lookup、geocoding 服务（resolveLocation + 错误类型 + CITY_MAX_LENGTH）、BirthInput 类型。
// OUTPUT: 共享出生数据校验/解析机器（validateBirthPayload / birthFromValidated / withValidatedBirth +
//         PII 安全的错误响应 helper）。所有 4xx 只下发 code，绝不回显原始 city / Error.message（隐私红线 #1/#3）。
// POS: API 层共享出生输入校验；natal / transit timeline 等需出生数据的端点统一复用。若更新此文件，务必更新本头注释与所属 FOLDER.md。

// tz-lookup ships no TypeScript declarations and we cannot add a separate .d.ts
// file in this change. Declare the module shape inline; the lib is a single
// function `(lat: number, lon: number) => string` (IANA tz name).
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- no upstream types
import tzLookup from "tz-lookup";
import type { BirthInput } from "../types/api.js";
import {
  CITY_MAX_LENGTH,
  GeocodingServiceError,
  LocationResolutionError,
  resolveLocation,
} from "../services/geocoding.js";

// === Input validation ===
//
// Manual validation (no zod dep). Each rule returns a stable `code` so the
// frontend can translate without parsing free-text messages. The error
// `message` is generic on purpose — landing page client maps by code, not text.

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
// HH 00-23 / MM 00-59 / optional SS 00-59. Range-checked so a direct POST cannot
// smuggle impossible times (e.g. "99:99", "24:00") past the widget's native
// type=time guard and have birthToUtcDate normalize them into a silently-wrong
// UTC instant (shared by every birth endpoint).
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
// Conservative IANA timezone pattern: Region[/Area[/Subarea]] with letters,
// digits and `_+-`. Matches "America/New_York", "Etc/GMT+8", "UTC", "Asia/Ho_Chi_Minh".
const IANA_TZ_REGEX = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+){0,2}$/;
const ACCURACY_VALUES = new Set(["exact", "time_unknown", "approximate"]);
const TIMEZONE_MAX_LENGTH = 100;

export type ValidatedBirth = {
  date: string;
  time?: string;
  city: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  accuracy: BirthInput["accuracy"];
};

type ValidationOk = { ok: true; value: ValidatedBirth };
type ValidationErr = { ok: false; code: string };
export type ValidationResult = ValidationOk | ValidationErr;

export function validateBirthPayload(
  payload: Record<string, unknown>,
): ValidationResult {
  const dateRaw = typeof payload.date === "string" ? payload.date.trim() : "";
  if (!dateRaw) return { ok: false, code: "DATE_REQUIRED" };
  if (!DATE_REGEX.test(dateRaw)) return { ok: false, code: "INVALID_DATE" };
  // Reject impossible calendar dates (e.g. 2024-02-31). `new Date("2024-02-31")`
  // silently rolls over to March 2, so we round-trip back to YYYY-MM-DD and
  // require the strings match exactly.
  const parsedDate = new Date(`${dateRaw}T00:00:00Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== dateRaw
  ) {
    return { ok: false, code: "INVALID_DATE" };
  }

  const cityRaw = typeof payload.city === "string" ? payload.city.trim() : "";
  if (cityRaw.length > CITY_MAX_LENGTH) {
    return { ok: false, code: "CITY_TOO_LONG" };
  }

  const hasLat = payload.lat !== undefined && payload.lat !== "";
  const hasLon = payload.lon !== undefined && payload.lon !== "";
  let lat: number | undefined;
  let lon: number | undefined;
  if (hasLat) {
    lat = Number(payload.lat);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return { ok: false, code: "INVALID_LAT" };
    }
  }
  if (hasLon) {
    lon = Number(payload.lon);
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      return { ok: false, code: "INVALID_LON" };
    }
  }
  // Need either a city to geocode or an explicit coord pair.
  const hasFullCoords = hasLat && hasLon;
  if (!cityRaw && !hasFullCoords) {
    return { ok: false, code: "CITY_REQUIRED" };
  }

  let time: string | undefined;
  if (typeof payload.time === "string" && payload.time.trim() !== "") {
    time = payload.time.trim();
    if (!TIME_REGEX.test(time)) return { ok: false, code: "INVALID_TIME" };
  }

  let timezone: string | undefined;
  if (typeof payload.timezone === "string" && payload.timezone.trim() !== "") {
    timezone = payload.timezone.trim();
    if (
      timezone.length > TIMEZONE_MAX_LENGTH ||
      !IANA_TZ_REGEX.test(timezone)
    ) {
      return { ok: false, code: "INVALID_TIMEZONE" };
    }
  }

  const accuracyRaw =
    typeof payload.accuracy === "string" ? payload.accuracy : "exact";
  if (!ACCURACY_VALUES.has(accuracyRaw)) {
    return { ok: false, code: "INVALID_ACCURACY" };
  }

  return {
    ok: true,
    value: {
      date: dateRaw,
      time,
      city: cityRaw,
      lat,
      lon,
      timezone,
      accuracy: accuracyRaw as BirthInput["accuracy"],
    },
  };
}

// Derive an IANA timezone from a coordinate pair. Returns null when the lookup
// fails (e.g. invalid lat/lon, library throws on out-of-range polar values).
const deriveTimezoneFromCoords = (lat: number, lon: number): string | null => {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  try {
    const tz = (tzLookup as (la: number, lo: number) => string)(lat, lon);
    return typeof tz === "string" && tz.length > 0 ? tz : null;
  } catch {
    return null;
  }
};

export async function birthFromValidated(
  input: ValidatedBirth,
): Promise<BirthInput> {
  const hasLat = input.lat !== undefined;
  const hasLon = input.lon !== undefined;
  const hasTimezone =
    typeof input.timezone === "string" && input.timezone.length > 0;
  const shouldResolve = !hasLat || !hasLon || !hasTimezone;
  const geo = shouldResolve ? await resolveLocation(input.city) : null;
  // Precedence: trust the client-supplied timezone ONLY when the client also
  // supplied exact lat+lon (i.e. asserted "I know my exact location and tz").
  // Otherwise (city-only or partial coords) derive tz from the resolved/supplied
  // coords so the browser's wall-clock zone never silently overrides the birth
  // city's actual zone — a silent override flips rising sign and houses.
  const resolvedLat = hasLat ? (input.lat as number) : geo!.lat;
  const resolvedLon = hasLon ? (input.lon as number) : geo!.lon;
  const clientAssertedExactLocation = hasLat && hasLon && hasTimezone;
  let timezone: string;
  if (clientAssertedExactLocation) {
    timezone = input.timezone as string;
  } else {
    const coordTz = deriveTimezoneFromCoords(resolvedLat, resolvedLon);
    if (coordTz) {
      timezone = coordTz;
    } else if (hasTimezone) {
      timezone = input.timezone as string;
    } else {
      timezone = geo!.timezone;
    }
  }
  return {
    date: input.date,
    time: input.time,
    city: geo?.city || input.city || "Unknown",
    lat: resolvedLat,
    lon: resolvedLon,
    timezone,
    accuracy: input.accuracy,
  };
}

// Body shape sent to res.status(...).json() for any birth-input failure.
// Intentionally minimal: only the stable `code` is enough for the client to
// localize a message; the `error` string is generic and free of user input
// to keep error_message-bearing telemetry / logs PII-free (隐私红线 #1).
type BirthErrorBody = { error: string; code: string };

export const ERROR_MESSAGES: Record<string, string> = {
  DATE_REQUIRED: "Birth date is required.",
  INVALID_DATE: "Birth date must be in YYYY-MM-DD format.",
  INVALID_TIME: "Birth time must be in HH:MM format.",
  CITY_REQUIRED: "Birthplace is required.",
  CITY_TOO_LONG: "Birthplace is too long.",
  INVALID_LAT: "Latitude must be between -90 and 90.",
  INVALID_LON: "Longitude must be between -180 and 180.",
  INVALID_TIMEZONE: "Invalid timezone.",
  INVALID_ACCURACY: "Invalid accuracy value.",
  LOCATION_UNRESOLVED: "Could not resolve birthplace.",
  GEOCODING_SERVICE_UNAVAILABLE:
    "Geocoding service temporarily unavailable. Please try again in a moment.",
};

export function sendValidationError(
  res: import("express").Response,
  code: string,
): void {
  res
    .status(400)
    .json({ error: ERROR_MESSAGES[code] ?? "Invalid input.", code });
}

export function handleBirthInputError(
  error: unknown,
  res: import("express").Response,
): boolean {
  if (error instanceof LocationResolutionError) {
    // PII-safe response: code only, no raw city, no upstream message.
    // Frontend maps `code` → localized copy in landing-v2 BirthChartSection.
    const body: BirthErrorBody = {
      error: ERROR_MESSAGES.LOCATION_UNRESOLVED,
      code: "LOCATION_UNRESOLVED",
    };
    res.status(400).json(body);
    return true;
  }
  if (error instanceof GeocodingServiceError) {
    const body: BirthErrorBody = {
      error: ERROR_MESSAGES.GEOCODING_SERVICE_UNAVAILABLE,
      code: "GEOCODING_SERVICE_UNAVAILABLE",
    };
    res.status(503).json(body);
    return true;
  }
  return false;
}

// 500 fallback: never echo error.message — it can include user input (e.g.
// city name embedded by upstream libs). 隐私红线 #1 + #3.
export function send500(res: import("express").Response): void {
  res.status(500).json({ error: "Unexpected server error.", code: "INTERNAL" });
}

// Pull birth payload from either POST body (preferred) or GET query
// (deprecated fallback for callers still on the old contract). POST body is
// preferred because GET query params with PII end up in:
//   1. Browser history / referrer header
//   2. Vercel access logs (unredactable)
//   3. Any reverse-proxy / CDN log between client and origin
// 隐私红线 #1.
export function readBirthPayload(
  req: import("express").Request,
): Record<string, unknown> {
  if (req.method === "POST") {
    return (req.body ?? {}) as Record<string, unknown>;
  }
  return req.query as Record<string, unknown>;
}

export async function withValidatedBirth(
  req: import("express").Request,
  res: import("express").Response,
): Promise<BirthInput | null> {
  const validated = validateBirthPayload(readBirthPayload(req));
  if (!validated.ok) {
    sendValidationError(res, validated.code);
    return null;
  }
  try {
    return await birthFromValidated(validated.value);
  } catch (error) {
    if (handleBirthInputError(error, res)) return null;
    send500(res);
    return null;
  }
}
