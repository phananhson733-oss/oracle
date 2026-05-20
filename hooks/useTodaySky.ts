// INPUT: fetchTodaySky from services/apiClient (TodaySkyResponse from /api/astro/today).
// OUTPUT: useTodaySky() returns { data, loading, hasError, reload } shared by HeroSection's
//         editorial mini-card and CosmicWeatherSection's full grid. Module-level promise cache
//         de-dupes concurrent mounts so the API is hit at most once per page load.
//         Cache is keyed to today's UTC date so a long-lived tab that crosses midnight UTC
//         refetches instead of serving yesterday's ephemeris.
// POS: Landing-page data hook. Both Hero (above-the-fold, eager) and CosmicWeather (below-the-fold,
//      lazy) consume this; reuse keeps a single network request and a single source of truth for
//      "today's actual sky data" — the narrative spine of the landing hero per FINDING-H01 fix.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { useCallback, useEffect, useState } from "react";
import {
  fetchTodaySky,
  type TodaySkyResponse,
} from "../services/apiClient";

// Today's UTC date key (YYYY-MM-DD). Module-cache invalidates whenever this
// rolls over — covers both the "open a new tab tomorrow" case (new module
// scope sees the fresh date directly) and the "tab open across midnight UTC"
// case (the next getOrFetchTodaySky call detects the rollover).
const todayUtcKey = (): string => new Date().toISOString().slice(0, 10);

// Module-scoped cache. Hero mounts eagerly; CosmicWeather mounts via React.lazy
// some hundred ms later. Without a shared cache we'd fire /api/astro/today
// twice on every cold landing. The promise (not the resolved value) is cached
// so concurrent first-mounts also share the in-flight request.
let cachedDate: string | null = null;
let cachedPromise: Promise<TodaySkyResponse> | null = null;
let cachedValue: TodaySkyResponse | null = null;

function getOrFetchTodaySky(force = false): Promise<TodaySkyResponse> {
  const today = todayUtcKey();
  // UTC date rolled over since the cache was populated — drop stale entries
  // so we don't serve yesterday's positions.
  if (cachedDate !== null && cachedDate !== today) {
    cachedDate = null;
    cachedPromise = null;
    cachedValue = null;
  }
  if (force) {
    cachedPromise = null;
    cachedValue = null;
  }
  if (cachedValue) return Promise.resolve(cachedValue);
  if (cachedPromise) return cachedPromise;
  cachedDate = today;
  cachedPromise = fetchTodaySky()
    .then((result) => {
      cachedValue = result;
      return result;
    })
    .catch((err) => {
      // Drop the failed promise so a manual reload() can re-attempt.
      cachedPromise = null;
      cachedDate = null;
      throw err;
    });
  return cachedPromise;
}

export interface UseTodaySkyResult {
  data: TodaySkyResponse | null;
  loading: boolean;
  hasError: boolean;
  reload: () => Promise<void>;
}

export function useTodaySky(): UseTodaySkyResult {
  // Seed state from the module cache so a second consumer (CosmicWeather)
  // hydrates instantly when Hero already has the data.
  const [data, setData] = useState<TodaySkyResponse | null>(cachedValue);
  const [loading, setLoading] = useState<boolean>(!cachedValue);
  const [hasError, setHasError] = useState<boolean>(false);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setHasError(false);
    try {
      const result = await getOrFetchTodaySky(force);
      setData(result);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedValue && cachedDate === todayUtcKey()) {
      // Already hydrated for today — skip the fetch.
      return;
    }
    void load(false);
  }, [load]);

  // When the tab becomes visible again, re-check. If the UTC date rolled
  // over while the tab was hidden, getOrFetchTodaySky will invalidate the
  // stale cache and refetch; otherwise it's a cheap cache hit.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (cachedDate !== null && cachedDate === todayUtcKey()) return;
      void load(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const reload = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, loading, hasError, reload };
}
