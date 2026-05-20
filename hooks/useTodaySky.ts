// INPUT: fetchTodaySky from services/apiClient (TodaySkyResponse from /api/astro/today).
// OUTPUT: useTodaySky() returns { data, loading, hasError, reload } shared by HeroSection's
//         editorial mini-card and CosmicWeatherSection's full grid. Module-level promise cache
//         de-dupes concurrent mounts so the API is hit at most once per page load.
// POS: Landing-page data hook. Both Hero (above-the-fold, eager) and CosmicWeather (below-the-fold,
//      lazy) consume this; reuse keeps a single network request and a single source of truth for
//      "today's actual sky data" — the narrative spine of the landing hero per FINDING-H01 fix.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { useCallback, useEffect, useState } from "react";
import {
  fetchTodaySky,
  type TodaySkyResponse,
} from "../services/apiClient";

// Module-scoped cache. Hero mounts eagerly; CosmicWeather mounts via React.lazy
// some hundred ms later. Without a shared cache we'd fire /api/astro/today
// twice on every cold landing. The promise (not the resolved value) is cached
// so concurrent first-mounts also share the in-flight request.
let cachedPromise: Promise<TodaySkyResponse> | null = null;
let cachedValue: TodaySkyResponse | null = null;

function getOrFetchTodaySky(force = false): Promise<TodaySkyResponse> {
  if (force) {
    cachedPromise = null;
    cachedValue = null;
  }
  if (cachedValue) return Promise.resolve(cachedValue);
  if (cachedPromise) return cachedPromise;
  cachedPromise = fetchTodaySky()
    .then((result) => {
      cachedValue = result;
      return result;
    })
    .catch((err) => {
      // Drop the failed promise so a manual reload() can re-attempt.
      cachedPromise = null;
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
    if (cachedValue) {
      // Already hydrated from cache — skip the fetch.
      return;
    }
    void load(false);
  }, [load]);

  const reload = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, loading, hasError, reload };
}
