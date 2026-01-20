import { useMemo, useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import {
  fetchCBTAggregateAnalysis,
  fetchCBTSomaticAnalysis,
  fetchCBTRootAnalysis,
  fetchCBTMoodAnalysis,
  fetchCBTCompetenceAnalysis,
  CBTAnalysisResult
} from '../../../services/apiClient';

interface AggregateAnalysis {
  somatic_analysis?: { insight: string; advice: string; astro_note: string };
  root_analysis?: { insight: string; advice: string; astro_note: string };
  mood_analysis?: { insight: string; advice: string; astro_note: string };
  competence_analysis?: { insight: string; advice: string; astro_note: string };
}

const CACHE_KEY_PREFIX = 'cbt_aggregate_analysis_';
const CACHE_VERSION = 'v3'; // Bump version for new independent API

const hashInput = (input: unknown): string => {
  const str = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

export type CBTAnalysisType = 'somatic' | 'root' | 'mood' | 'competence';

/**
 * 独立的 CBT 分析 hook - 按需加载单个维度
 */
export function useCBTIndividualAnalysis(
  userProfile: UserProfile,
  year: number,
  month: number,
  analysisType: CBTAnalysisType,
  stats: unknown,
  language: 'zh' | 'en' = 'zh',
  options?: { enabled?: boolean }
) {
  const [analysis, setAnalysis] = useState<CBTAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const isEnabled = options?.enabled ?? true;
  const statsHash = useMemo(() => hashInput(stats), [stats]);

  useEffect(() => {
    if (!userProfile || !isEnabled) {
      setAnalysis(null);
      setLoading(false);
      return;
    }

    const periodKey = `${year}-${month + 1}`;
    const userKey = userProfile.userId || userProfile.name || 'unknown';
    const cacheKey = `${CACHE_KEY_PREFIX}${CACHE_VERSION}_${analysisType}_${userKey}_${periodKey}_${language}_${statsHash}`;

    const loadAnalysis = async () => {
      // 1. Try local storage cache
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setAnalysis(parsed);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      setLoading(true);
      try {
        let response: { lang: string; content: CBTAnalysisResult };

        switch (analysisType) {
          case 'somatic':
            response = await fetchCBTSomaticAnalysis(userProfile, periodKey, stats, language);
            break;
          case 'root':
            response = await fetchCBTRootAnalysis(userProfile, periodKey, stats, language);
            break;
          case 'mood':
            response = await fetchCBTMoodAnalysis(userProfile, periodKey, stats, language);
            break;
          case 'competence':
            response = await fetchCBTCompetenceAnalysis(userProfile, periodKey, stats, language);
            break;
        }

        if (response && response.content) {
          setAnalysis(response.content);
          localStorage.setItem(cacheKey, JSON.stringify(response.content));
        }
      } catch (error) {
        console.error(`Failed to fetch ${analysisType} analysis`, error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce slightly to avoid rapid calls
    const timer = setTimeout(loadAnalysis, 300);
    return () => clearTimeout(timer);

  }, [userProfile, year, month, analysisType, statsHash, language, isEnabled]);

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
  language: 'zh' | 'en' = 'zh',
  options?: { enabled?: boolean }
) {
  const [analysis, setAnalysis] = useState<AggregateAnalysis | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading=true to prevent mock data flash
  const isEnabled = options?.enabled ?? true;
  const statsHash = useMemo(() => hashInput(stats), [stats]);

  useEffect(() => {
    if (!userProfile || !isEnabled) {
      setAnalysis(null);
      setLoading(false);
      return;
    }

    const periodKey = `${year}-${month + 1}`;
    const userKey = userProfile.userId || userProfile.name || 'unknown';
    const cacheKey = `${CACHE_KEY_PREFIX}${CACHE_VERSION}_${userKey}_${periodKey}_${language}_${statsHash}`;

    const loadAnalysis = async () => {
      // 1. Try local storage cache
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setAnalysis(parsed);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      setLoading(true);
      try {
        const response = await fetchCBTAggregateAnalysis(
          userProfile,
          periodKey,
          stats,
          language
        );

        if (response && response.content) {
          setAnalysis(response.content);
          localStorage.setItem(cacheKey, JSON.stringify(response.content));
        }
      } catch (error) {
        console.error('Failed to fetch aggregate analysis', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce slightly to avoid rapid calls if stats change fast (though stats are memoized)
    const timer = setTimeout(loadAnalysis, 500);
    return () => clearTimeout(timer);

  }, [userProfile, year, month, statsHash, language, isEnabled]); // Deep dependency on stats

  return { analysis, loading };
}
