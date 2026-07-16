// INPUT: Angular longitude samples and a bracketed scalar function.
// OUTPUT: Pure helpers for Saturn Return root and orb-boundary resolution.
// POS: Numerical primitives shared by the Saturn Return service; keep free of ephemeris IO.

export interface TimedValue {
  at: number;
  value: number;
}

export interface TimeBracket {
  start: number;
  end: number;
}

/** Normalizes a longitude difference to [-180, 180). */
export const normalizeSignedDegrees = (value: number): number =>
  ((value + 180) % 360 + 360) % 360 - 180;

export const findSignChangeBrackets = (
  samples: readonly TimedValue[],
): TimeBracket[] => {
  const brackets: TimeBracket[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (
      previous.value === 0 ||
      current.value === 0 ||
      previous.value * current.value < 0
    ) {
      brackets.push({ start: previous.at, end: current.at });
    }
  }
  return brackets;
};

/** Finds sampled valleys that can contain a stationary, non-crossing root. */
export const findLocalMinimumBrackets = (
  samples: readonly TimedValue[],
): TimeBracket[] => {
  const brackets: TimeBracket[] = [];
  for (let index = 1; index < samples.length - 1; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const next = samples[index + 1];
    if (current.value <= previous.value && current.value <= next.value) {
      brackets.push({ start: previous.at, end: next.at });
    }
  }
  return brackets;
};

/**
 * Resolves a root in a sign-changing bracket. The caller owns sampling/caching,
 * which keeps this primitive deterministic and independent of the ephemeris.
 */
export const refineRoot = async (
  start: number,
  end: number,
  sample: (at: number) => Promise<number>,
  toleranceMs: number,
): Promise<number> => {
  let low = start;
  let high = end;
  let lowValue = await sample(low);
  const highValue = await sample(high);

  if (lowValue === 0) return low;
  if (highValue === 0) return high;
  if (lowValue * highValue > 0) {
    throw new Error("Root refinement requires a sign-changing bracket.");
  }

  while (high - low > toleranceMs) {
    const middle = Math.floor((low + high) / 2);
    const middleValue = await sample(middle);
    if (middleValue === 0) return middle;
    if (lowValue * middleValue < 0) {
      high = middle;
    } else {
      low = middle;
      lowValue = middleValue;
    }
  }

  return Math.floor((low + high) / 2);
};

/**
 * Locates the minimum of a unimodal non-negative function using ternary search.
 * This captures conjunctions reached exactly at a Saturn station, where the
 * signed longitude difference touches zero without changing sign.
 */
export const refineMinimum = async (
  start: number,
  end: number,
  sample: (at: number) => Promise<number>,
  toleranceMs: number,
): Promise<number> => {
  let low = start;
  let high = end;

  while (high - low > toleranceMs * 2) {
    const left = Math.floor(low + (high - low) / 3);
    const right = Math.floor(high - (high - low) / 3);
    if ((await sample(left)) <= (await sample(right))) {
      high = right;
    } else {
      low = left;
    }
  }

  const candidates = [low, Math.floor((low + high) / 2), high];
  let minimumAt = candidates[0];
  let minimumValue = await sample(minimumAt);
  for (const candidate of candidates.slice(1)) {
    const value = await sample(candidate);
    if (value < minimumValue) {
      minimumAt = candidate;
      minimumValue = value;
    }
  }
  return minimumAt;
};
