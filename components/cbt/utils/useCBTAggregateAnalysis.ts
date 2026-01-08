import { useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import { fetchCBTAggregateAnalysis } from '../../../services/apiClient';

interface AggregateAnalysis {
  somatic_analysis?: { insight: string; advice: string; astro_note: string };
  root_analysis?: { insight: string; advice: string; astro_note: string };
  mood_analysis?: { insight: string; advice: string; astro_note: string };
  competence_analysis?: { insight: string; advice: string; astro_note: string };
}

const CACHE_KEY_PREFIX = 'cbt_aggregate_analysis_';

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

  useEffect(() => {
    if (!userProfile || !isEnabled) {
      setAnalysis(null);
      setLoading(false);
      return;
    }

    const periodKey = `${year}-${month + 1}`;
    const cacheKey = `${CACHE_KEY_PREFIX}${userProfile.name}_${periodKey}_${language}`;
    
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

  }, [userProfile, year, month, JSON.stringify(stats), language, isEnabled]); // Deep dependency on stats

  return { analysis, loading };
}
