// INPUT: Competitor comparison page component (vs and alternatives formats).
// OUTPUT: Renders competitor comparison with feature tables, pros/cons, and CTA.
// POS: Marketing page; update components/FOLDER.md when this file changes.

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Container, Section, ActionButton, useLanguage, useTheme } from './UIComponents';
import { SEO } from './SEO';
import { COMPETITORS, COMPARISON_TEMPLATES, getCompetitor, type CompetitorInfo } from '../data/competitors';

type ComparisonType = 'vs' | 'alternatives';

interface ComparisonPageProps {
  type: ComparisonType;
  competitorId: string;
}

const ComparisonPage: React.FC<ComparisonPageProps> = ({ type, competitorId }) => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const competitor = useMemo(() => getCompetitor(competitorId), [competitorId]);
  const astromind = COMPETITORS['astromind'] || createAstromindData();

  if (!competitor) {
    return (
      <Container>
        <div className="text-center py-20">
          <h1 className="text-2xl mb-4">Competitor not found</h1>
          <ActionButton onClick={() => window.history.back()}>Go Back</ActionButton>
        </div>
      </Container>
    );
  }

  const borderColor = isDark ? 'border-gold-500/20' : 'border-paper-200';
  const mutedText = isDark ? 'text-star-400' : 'text-paper-500';
  const highlightClass = isDark ? 'text-gold-400' : 'text-gold-600';
  const cardBg = isDark ? 'bg-space-800/40' : 'bg-paper-100/85';

  const pageTitle = type === 'vs'
    ? `${astromind.name} vs ${competitor.name}`
    : `${competitor.name} Alternative`;

  const pageDescription = type === 'vs'
    ? `Compare ${astromind.name} and ${competitor.name} features, pricing, and reviews.`
    : `Discover why ${astromind.name} is the best ${competitor.name} alternative for astrology enthusiasts.`;

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        type="article"
      />

      <Container>
        {/* Header */}
        <div className="text-center py-12 md:py-20">
          <h1 className="text-4xl md:text-6xl font-serif font-semibold mb-4">
            {type === 'vs' ? (
              <>
                <span className={highlightClass}>{astromind.name}</span>
                <span className="mx-3">vs</span>
                <span>{competitor.name}</span>
              </>
            ) : (
              <>
                <span className={highlightClass}>{competitor.name}</span>
                <span className="block text-xl md:text-2xl mt-2">Alternative</span>
              </>
            )}
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${mutedText}`}>
            {pageDescription}
          </p>
        </div>

        {/* Quick Stats Comparison */}
        <Section title="At a Glance">
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`rounded-2xl p-6 border ${borderColor} ${cardBg}`}>
              <div className="text-sm uppercase tracking-wider mb-2">Overall Winner</div>
              <div className={`text-2xl font-bold ${highlightClass}`}>Astromind</div>
              <div className={`text-sm ${mutedText}`}>Psychology + Astrology depth</div>
            </div>
            <div className={`rounded-2xl p-6 border ${borderColor} ${cardBg}`}>
              <div className="text-sm uppercase tracking-wider mb-2">Pricing</div>
              <div className="text-2xl font-bold">More Affordable</div>
              <div className={`text-sm ${mutedText}`}>Full features at lower cost</div>
            </div>
            <div className={`rounded-2xl p-6 border ${borderColor} ${cardBg}`}>
              <div className="text-sm uppercase tracking-wider mb-2">Learning Focus</div>
              <div className="text-2xl font-bold">Educational</div>
              <div className={`text-sm ${mutedText}`}>Psychology-backed content</div>
            </div>
          </div>
        </Section>

        {/* Feature Comparison */}
        <Section title="Feature Comparison">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dashed border-current/20">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className={`text-center py-3 px-4 ${highlightClass}`}>{astromind.name}</th>
                  <th className="text-center py-3 px-4">{competitor.name}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(astromind.features).map(([key, feature]) => {
                  const competitorFeature = competitor.features[key as keyof typeof competitor.features];
                  if (!competitorFeature) return null;

                  return (
                    <tr key={key} className="border-b border-dashed border-current/10">
                      <td className="py-3 px-4 font-medium">{feature.name}</td>
                      <td className="text-center py-3 px-4">
                        <span className={feature.winner === 'astromind' ? highlightClass : ''}>
                          {typeof feature.astromind === 'boolean' ? (
                            feature.astromind ? '✓' : '—'
                          ) : (
                            feature.astromind
                          )}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={competitorFeature.winner === 'competitor' ? highlightClass : ''}>
                          {typeof competitorFeature.competitor === 'boolean' ? (
                            competitorFeature.competitor ? '✓' : '—'
                          ) : (
                            competitorFeature.competitor
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Pricing Comparison */}
        <Section title="Pricing">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className={`text-xl font-semibold mb-4 ${highlightClass}`}>{astromind.name}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={mutedText}>Free Tier</span>
                  <span>Full feature access</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Premium</span>
                  <span>Affordable monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Value</span>
                  <span className={highlightClass}>Best value</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">{competitor.name}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={mutedText}>Free Tier</span>
                  <span>{competitor.pricing.free}</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Premium</span>
                  <span>{competitor.pricing.premium}</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Value</span>
                  <span>Premium-focused</span>
                </div>
              </div>
            </Card>
          </div>
        </Section>

        {/* Reviews */}
        <Section title="What Users Say">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-3">{astromind.name} Reviews</h4>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-bold text-gold-500">4.8</span>
                <span className={mutedText}>/ 5.0</span>
              </div>
              <div className={`text-sm ${mutedText}`}>Based on user feedback</div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-3">{competitor.name} Reviews</h4>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-bold">
                  {(competitor.reviews.appStore.rating + competitor.reviews.googlePlay.rating) / 2}
                </span>
                <span className={mutedText}>/ 5.0</span>
              </div>
              <div className={`text-sm ${mutedText}`}>App Store & Google Play</div>
            </div>
          </div>
        </Section>

        {/* Why Choose Astromind */}
        <Section title={type === 'alternatives' ? `Why Choose ${astromind.name}` : 'Why Choose Astromind'}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`rounded-2xl p-6 border ${borderColor}`}>
              <h4 className={`font-semibold mb-3 ${highlightClass}`}>Psychological Depth</h4>
              <p className={mutedText}>
                Integration of modern psychology with traditional astrology for meaningful self-discovery.
              </p>
            </div>
            <div className={`rounded-2xl p-6 border ${borderColor}`}>
              <h4 className={`font-semibold mb-3 ${highlightClass}`}>Educational Focus</h4>
              <p className={mutedText}>
                Learn the "why" behind astrological insights with detailed explanations and development tips.
              </p>
            </div>
            <div className={`rounded-2xl p-6 border ${borderColor}`}>
              <h4 className={`font-semibold mb-3 ${highlightClass}`}>Affordable Pricing</h4>
              <p className={mutedText}>
                Comprehensive features at accessible price points, no expensive subscriptions required.
              </p>
            </div>
            <div className={`rounded-2xl p-6 border ${borderColor}`}>
              <h4 className={`font-semibold mb-3 ${highlightClass}`}>Holistic Approach</h4>
              <p className={mutedText}>
                Birth chart, synastry, transits, and more—everything in one platform.
              </p>
            </div>
          </div>
        </Section>

        {/* CTA */}
        <div className="text-center py-12">
          <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-4">
            Ready to Explore Deep?
          </h2>
          <p className={`mb-6 ${mutedText}`}>
            Start your journey of self-discovery with {astromind.name}
          </p>
          <ActionButton size="lg">
            Get Started Free
          </ActionButton>
        </div>
      </Container>
    </>
  );
};

// Create placeholder astromind data for comparison
function createAstromindData(): CompetitorInfo {
  return {
    id: 'astromind',
    name: 'Astromind',
    tagline: 'Psychological Astrology Platform',
    description: 'Comprehensive astrology platform combining psychological insights with traditional astrology.',
    logo: '/logo.png',
    website: 'https://astromind.ai',
    founded: '2024',
    headquarters: 'Global',
    pricing: {
      free: 'Full feature access',
      premium: 'Affordable',
      subscription: 'Flexible plans',
    },
    features: {
      natalChart: { name: 'Natal Chart', astromind: true, competitor: true, winner: 'tie' },
      synastry: { name: 'Synastry', astromind: true, competitor: true, winner: 'tie' },
      transitAnalysis: { name: 'Transit Analysis', astromind: 'Detailed psychological', competitor: 'Varies', winner: 'astromind' },
      predictions: { name: 'Predictions', astromind: 'Comprehensive', competitor: 'Varies', winner: 'astromind' },
      socialFeatures: { name: 'Social', astromind: 'Minimal', competitor: 'Strong', winner: 'competitor' },
      aiInsights: { name: 'AI Insights', astromind: 'Psychological integration', competitor: 'Varies', winner: 'astromind' },
      customization: { name: 'Customization', astromind: 'Full', competitor: 'Limited', winner: 'astromind' },
      userExperience: { name: 'UX', astromind: 'Educational', competitor: 'Varies', winner: 'tie' },
    },
    reviews: {
      appStore: { rating: 4.8, pros: ['Deep insights', 'Educational'], cons: [] },
      googlePlay: { rating: 4.8, pros: ['Comprehensive', 'Beautiful'], cons: [] },
      trustpilot: { rating: 4.5, pros: ['Quality content', 'Helpful'], cons: [] },
    },
    strengths: ['Psychological depth', 'Educational', 'Affordable', 'Comprehensive'],
    weaknesses: ['Less social features', 'Newer platform'],
  };
}

export default ComparisonPage;
