import { useMemo, useState, useEffect } from "react";
import { UserProfile } from "../../../types";
import {
  fetchCBTAggregateAnalysis,
  fetchCBTSomaticAnalysis,
  fetchCBTRootAnalysis,
  fetchCBTMoodAnalysis,
  fetchCBTCompetenceAnalysis,
  sha256Hex,
  CBTAnalysisResult,
} from "../../../services/apiClient";

interface AggregateAnalysis {
  somatic_analysis?: { insight: string; advice: string; astro_note: string };
  root_analysis?: { insight: string; advice: string; astro_note: string };
  mood_analysis?: { insight: string; advice: string; astro_note: string };
  competence_analysis?: { insight: string; advice: string; astro_note: string };
}

const CACHE_KEY_PREFIX = "cbt_aggregate_analysis_";
// Bump version for SHA-256 cache keys (drops legacy 32-bit-hash + PII userKey
// entries that violated CLAUDE.md 隐私红线 #2).
const CACHE_VERSION = "v4";

// SHA-256 hex digest of any JSON-serializable input. Replaces the prior 32-bit
// string hash so neither the stats payload nor the user identifier leak into
// reversible localStorage cache keys.
const hashInput = (input: unknown): Promise<string> =>
  sha256Hex(JSON.stringify(input));

export type CBTAnalysisType = "somatic" | "root" | "mood" | "competence";

/**
 * 独立的 CBT 分析 hook - 按需加载单个维度
 */
export function useCBTIndividualAnalysis(
  userProfile: UserProfile,
  year: number,
  month: number,
  analysisType: CBTAnalysisType,
  stats: unknown,
  language: "zh" | "en" = "zh",
  options?: { enabled?: boolean },
) {
  const [analysis, setAnalysis] = useState<CBTAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const isEnabled = options?.enabled ?? true;
  // Stable identity key for the stats payload (resolved inside the effect, but
  // memoized as a Promise so it only fires when `stats` actually changes).
  const statsHashPromise = useMemo(() => hashInput(stats), [stats]);
  // Hash the user identifier so neither a UUID nor a fallback to `name` (PII)
  // ever appears verbatim in localStorage keys (CLAUDE.md 隐私红线 #2).
  const userIdentity = userProfile?.userId || userProfile?.name || "unknown";
  const userKeyPromise = useMemo(() => sha256Hex(userIdentity), [userIdentity]);

  useEffect(() => {
    if (!userProfile || !isEnabled) {
      setAnalysis(null);
      setLoading(false);
      return;
    }

    const periodKey = `${year}-${month + 1}`;
    let cancelled = false;

    const loadAnalysis = async () => {
      const [statsHash, userKey] = await Promise.all([
        statsHashPromise,
        userKeyPromise,
      ]);
      if (cancelled) return;
      const cacheKey = `${CACHE_KEY_PREFIX}${CACHE_VERSION}_${analysisType}_${userKey}_${periodKey}_${language}_${statsHash}`;

      // 1. Try local storage cache
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (cancelled) return;
          setAnalysis(parsed);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      if (cancelled) return;
      setLoading(true);
      try {
        let response: { lang: string; content: CBTAnalysisResult };

        switch (analysisType) {
          case "somatic":
            response = await fetchCBTSomaticAnalysis(
              userProfile,
              periodKey,
              stats,
              language,
            );
            break;
          case "root":
            response = await fetchCBTRootAnalysis(
              userProfile,
              periodKey,
              stats,
              language,
            );
            break;
          case "mood":
            response = await fetchCBTMoodAnalysis(
              userProfile,
              periodKey,
              stats,
              language,
            );
            break;
          case "competence":
            response = await fetchCBTCompetenceAnalysis(
              userProfile,
              periodKey,
              stats,
              language,
            );
            break;
        }

        if (cancelled) return;
        if (response && response.content) {
          setAnalysis(response.content);
          localStorage.setItem(cacheKey, JSON.stringify(response.content));
        }
      } catch (error) {
        if (cancelled) return;
        console.error(`Failed to fetch ${analysisType} analysis`, error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Debounce slightly to avoid rapid calls
    const timer = setTimeout(loadAnalysis, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    userProfile,
    year,
    month,
    analysisType,
    statsHashPromise,
    userKeyPromise,
    stats,
    language,
    isEnabled,
  ]);

  return { analysis, loading };
}

/**
 * @deprecated 使用 useCBTIndividualAnalysis 替代，按需加载单个维度性能更好
 */
export function useCBTAggregateAnalysis(
  userProfile: UserProfile,
  year: number,
  month: number,
  stats: any,
  language: "zh" | "en" = "zh",
  options?: { enabled?: boolean },
) {
  const [analysis, setAnalysis] = useState<AggregateAnalysis | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading=true to prevent mock data flash
  const isEnabled = options?.enabled ?? true;
  const statsHashPromise = useMemo(() => hashInput(stats), [stats]);
  // Hash the user identifier so PII never reaches localStorage cache keys.
  const userIdentity = userProfile?.userId || userProfile?.name || "unknown";
  const userKeyPromise = useMemo(() => sha256Hex(userIdentity), [userIdentity]);

  useEffect(() => {
    if (!userProfile || !isEnabled) {
      setAnalysis(null);
      setLoading(false);
      return;
    }

    const periodKey = `${year}-${month + 1}`;
    let cancelled = false;

    const loadAnalysis = async () => {
      const [statsHash, userKey] = await Promise.all([
        statsHashPromise,
        userKeyPromise,
      ]);
      if (cancelled) return;
      const cacheKey = `${CACHE_KEY_PREFIX}${CACHE_VERSION}_${userKey}_${periodKey}_${language}_${statsHash}`;

      // 1. Try local storage cache
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (cancelled) return;
          setAnalysis(parsed);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      if (cancelled) return;
      setLoading(true);
      try {
        const response = await fetchCBTAggregateAnalysis(
          userProfile,
          periodKey,
          stats,
          language,
        );

        if (cancelled) return;
        if (response && response.content) {
          setAnalysis(response.content);
          localStorage.setItem(cacheKey, JSON.stringify(response.content));
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to fetch aggregate analysis", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Debounce slightly to avoid rapid calls if stats change fast (though stats are memoized)
    const timer = setTimeout(loadAnalysis, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    userProfile,
    year,
    month,
    statsHashPromise,
    userKeyPromise,
    stats,
    language,
    isEnabled,
  ]); // Deep dependency on stats

  return { analysis, loading };
}
