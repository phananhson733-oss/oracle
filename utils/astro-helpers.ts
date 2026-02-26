// INPUT: None (pure utility functions with no side effects).
// OUTPUT: Timezone formatting, CJK detection, and birth-data cache-key helpers.
// POS: Shared frontend utility functions extracted from App.tsx; if updated, keep App.tsx imports in sync.

import type { UserProfile } from '../types';

// ── Timezone helpers ────────────────────────────────────────────────

/** Return today's date (YYYY-MM-DD) in the given IANA timezone. */
export const getDateInTimeZone = (timeZone?: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

/** Calculate the UTC offset **in minutes** for an IANA timezone at a given instant. */
export const getTimeZoneOffsetMinutes = (timeZone: string, date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const valueMap = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const utcTime = Date.UTC(
    Number(valueMap.year),
    Number(valueMap.month) - 1,
    Number(valueMap.day),
    Number(valueMap.hour),
    Number(valueMap.minute),
    Number(valueMap.second)
  );

  return Math.round((utcTime - date.getTime()) / 60000);
};

/** Return a human-readable "America/New_York UTC-5" style string. */
export const formatTimezoneOffset = (timeZone?: string) => {
  if (!timeZone || timeZone === 'UTC') return 'UTC';
  try {
    const offsetMinutes = getTimeZoneOffsetMinutes(timeZone);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    const minuteLabel = minutes ? `:${String(minutes).padStart(2, '0')}` : '';

    return `${timeZone} UTC${sign}${hours}${minuteLabel}`;
  } catch {
    return timeZone;
  }
};

// ── CJK detection ───────────────────────────────────────────────────

export const CJK_REGEX = /[\u4e00-\u9fff]/;

/** Return `true` when `value` contains at least one CJK ideograph. */
export const containsCjk = (value: string) => CJK_REGEX.test(value);

/** CJK queries need only 1 char to start searching; others need 2. */
export const getLocationQueryMinLength = (value: string) => (containsCjk(value) ? 1 : 2);

// ── Cache key ───────────────────────────────────────────────────────

/** Deterministic cache key derived from birth-data fields. */
export const buildBirthCacheKey = (
  profile: Pick<UserProfile, 'birthDate' | 'birthTime' | 'birthCity' | 'lat' | 'lon' | 'timezone' | 'accuracyLevel'>,
) => [
  profile.birthDate,
  profile.birthTime || '',
  profile.birthCity,
  profile.lat ?? '',
  profile.lon ?? '',
  profile.timezone,
  profile.accuracyLevel,
].join('|');
