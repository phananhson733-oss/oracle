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

    return (
        <>
        <SEO title="Planetary Cycles" description="Track current planetary transits and their influence on your chart." robots="noindex,nofollow" />
        <Container>
            <h1 className="text-4xl font-serif font-medium mb-2">{t.cycles.title}</h1>
            <p className="opacity-70 mb-10">{t.cycles.subtitle}</p>
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
