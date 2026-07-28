// INPUT: User profile for planetary cycle calculations.
// OUTPUT: Cycles page displaying upcoming planetary transits with timeline cards.
// POS: Cycles page component extracted from App.tsx.

import React, { useState, useEffect } from 'react';
import { SEO } from '../components/SEO';
import { Container, TimelineCard, useLanguage } from '../components/UIComponents';
import * as T from '../types';
import * as Astro from '../services/astroService';
import { generateContent } from '../services/geminiService';
import { trackEvent } from '../services/analytics';
import SaveReadingButton from '../components/SaveReadingButton';

const CyclesPage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
    const { t, language } = useLanguage();
    const [cycles, setCycles] = useState<any[]>([]);
    const [namedCycles, setNamedCycles] = useState<Record<string, T.CycleCardContent>>({});

    useEffect(() => {
      let mounted = true;
      const loadCycles = async () => {
        try {
          const base = await Astro.calculateCycles(3, profile);
          if (mounted) {
            setCycles(base);
            trackEvent('cycle_forecast_viewed', { cycles_count: base.length });
          }
        } catch {}
      };
      loadCycles();
      return () => { mounted = false; };
    }, [profile]);

    const loadName = async (id: string, cycleInfo: any) => {
      if (namedCycles[id]) return;
      try {
        const res = await generateContent<T.CycleCardContent>('CYCLE_CARD_NAMING', { cycle: cycleInfo }, language);
        if (res) setNamedCycles(prev => ({...prev, [id]: res}));
      } catch (err) {}
    };

    // Build the FULL cycle snapshot at Save time: eagerly name every cycle that
    // wasn't lazily loaded yet, so a saved reading never persists with empty
    // names (returns fresh data directly to avoid stale-closure capture).
    const prepareCycleSave = async () => {
      const named: Record<string, T.CycleCardContent> = { ...namedCycles };
      await Promise.all(
        cycles.map(async (c) => {
          if (named[c.id]) return;
          try {
            const res = await generateContent<T.CycleCardContent>('CYCLE_CARD_NAMING', { cycle: c }, language);
            if (res) named[c.id] = res;
          } catch (err) {}
        }),
      );
      setNamedCycles(named);
      return {
        inputJson: { profile, months: 3 } as Record<string, unknown>,
        outputJson: { cycles, namedCycles: named } as Record<string, unknown>,
      };
    };

    return (
        <>
        <SEO title="Planetary Cycles" description="Track current planetary transits and their influence on your chart." robots="noindex,nofollow" />
        <Container>
            <h1 className="text-4xl font-serif font-medium mb-2">{t.cycles.title}</h1>
            <p className="opacity-70 mb-10">{t.cycles.subtitle}</p>
            {cycles.length > 0 && (
              <div className="mb-6">
                <SaveReadingButton
                  toolType="cycle"
                  title={t.saved?.type_cycle || 'Cycles'}
                  inputJson={{ profile, months: 3 } as unknown as Record<string, unknown>}
                  outputJson={{ cycles, namedCycles } as unknown as Record<string, unknown>}
                  prepare={prepareCycleSave}
                />
              </div>
            )}
            <div className="space-y-3">
              {cycles.map(c => {
                const named = namedCycles[c.id];
                return (
                  <TimelineCard
                    key={c.id}
                    title={named?.title || `${c.planet} ${c.type}`}
                    tags={named?.tags || [c.planet]}
                    intensity={named?.intensity || 'med'}
                    dates={{start: c.start, peak: c.peak, end: c.end}}
                    onClick={() => loadName(c.id, c)}
                  />
                );
              })}
            </div>
        </Container>
        </>
    );
};

export default CyclesPage;
