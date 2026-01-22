// INPUT: Competitor data for comparison pages.
// OUTPUT: Exports competitor information, comparison data, and templates.
// POS: Data layer for competitor comparison pages.

export interface CompetitorFeature {
  name: string;
  astromind: string | boolean | number;
  competitor: string | boolean | number;
  winner: 'astromind' | 'competitor' | 'tie';
}

export interface CompetitorReview {
  rating: number;
  pros: string[];
  cons: string[];
}

export interface CompetitorInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  website: string;
  founded: string;
  headquarters: string;
  pricing: {
    free: string;
    premium: string;
    subscription: string;
  };
  features: {
    natalChart: CompetitorFeature;
    synastry: CompetitorFeature;
    transitAnalysis: CompetitorFeature;
    predictions: CompetitorFeature;
    socialFeatures: CompetitorFeature;
    aiInsights: CompetitorFeature;
    customization: CompetitorFeature;
    userExperience: CompetitorFeature;
  };
  reviews: {
    appStore: CompetitorReview;
    googlePlay: CompetitorReview;
    trustpilot: CompetitorReview;
  };
  strengths: string[];
  weaknesses: string[];
}

// Main competitors
export const COMPETITORS: Record<string, CompetitorInfo> = {
  'co-star': {
    id: 'co-star',
    name: 'Co-Star',
    tagline: 'AI-Powered Astrology',
    description: 'Popular astrology app known for its minimalist design and push notifications with AI-generated astrological insights.',
    logo: '/competitors/co-star.png',
    website: 'https://www.co-star.com',
    founded: '2017',
    headquarters: 'Los Angeles, CA',
    pricing: {
      free: 'Limited daily horoscopes',
      premium: '$9.99/month for personalized readings',
      subscription: 'Annual subscription available',
    },
    features: {
      natalChart: {
        name: 'Natal Chart',
        astromind: true,
        competitor: true,
        winner: 'tie',
      },
      synastry: {
        name: 'Synastry (Relationship)',
        astromind: true,
        competitor: 'Limited to premium',
        winner: 'astromind',
      },
      transitAnalysis: {
        name: 'Transit Analysis',
        astromind: 'Detailed daily with psychological context',
        competitor: 'Brief push notifications',
        winner: 'astromind',
      },
      predictions: {
        name: 'Predictions',
        astromind: 'Comprehensive with multi-level analysis',
        competitor: 'Daily briefs only',
        winner: 'astromind',
      },
      socialFeatures: {
        name: 'Social Features',
        astromind: 'Minimal, focused on content',
        competitor: 'Strong social compare features',
        winner: 'competitor',
      },
      aiInsights: {
        name: 'AI Insights',
        astromind: 'Psychological astrology integration',
        competitor: 'AI-generated concise messages',
        winner: 'tie',
      },
      customization: {
        name: 'Customization',
        astromind: 'Extensive chart customization',
        competitor: 'Minimal options',
        winner: 'astromind',
      },
      userExperience: {
        name: 'User Experience',
        astromind: 'Content-rich, learning-focused',
        competitor: 'Minimalist, quick-consumption',
        winner: 'tie',
      },
    },
    reviews: {
      appStore: { rating: 4.2, pros: ['Beautiful design', 'Accurate readings'], cons: ['Limited free features', 'Push notification spam'] },
      googlePlay: { rating: 4.1, pros: ['Clean interface', 'Daily updates'], cons: ['Expensive premium', 'Limited charts'] },
      trustpilot: { rating: 3.5, pros: ['Unique approach', 'Shareable content'], cons: ['Dark predictions', 'Subscription model'] },
    },
    strengths: ['Minimalist design', 'Strong brand presence', 'Viral social sharing', 'Daily engagement'],
    weaknesses: ['Limited chart depth', 'Expensive subscription', 'No learning resources', 'Negative messaging'],
  },
  'the-pattern': {
    id: 'the-pattern',
    name: 'The Pattern',
    tagline: 'Know Yourself Better',
    description: 'Social astrology app focused on relationship insights and personality understanding through astrological charts.',
    logo: '/competitors/the-pattern.png',
    website: 'https://www.thepattern.com',
    founded: '2016',
    headquarters: 'New York, NY',
    pricing: {
      free: 'Basic chart overview',
      premium: '$7.99/month for full access',
      subscription: 'Annual plan available',
    },
    features: {
      natalChart: {
        name: 'Natal Chart',
        astromind: true,
        competitor: true,
        winner: 'tie',
      },
      synastry: {
        name: 'Synastry (Relationship)',
        astromind: true,
        competitor: true,
        winner: 'tie',
      },
      transitAnalysis: {
        name: 'Transit Analysis',
        astromind: 'Detailed psychological context',
        competitor: 'Relationship-focused insights',
        winner: 'astromind',
      },
      predictions: {
        name: 'Predictions',
        astromind: 'Multi-level forecasts with guidance',
        competitor: 'Personality-based readings',
        winner: 'astromind',
      },
      socialFeatures: {
        name: 'Social Features',
        astromind: 'Minimal',
        competitor: 'Strong - find connections with contacts',
        winner: 'competitor',
      },
      aiInsights: {
        name: 'AI Insights',
        astromind: 'Psychological astrology with development tips',
        competitor: 'Personality profiling',
        winner: 'astromind',
      },
      customization: {
        name: 'Customization',
        astromind: 'Full control over display',
        competitor: 'Limited',
        winner: 'astromind',
      },
      userExperience: {
        name: 'User Experience',
        astromind: 'Educational and content-rich',
        competitor: 'Social and discovery-focused',
        winner: 'tie',
      },
    },
    reviews: {
      appStore: { rating: 4.4, pros: ['Beautiful visuals', 'Relationship insights'], cons: ['Battery drain', 'Limited free access'] },
      googlePlay: { rating: 4.3, pros: ['Accurate readings', 'Great for relationships'], cons: ['Cluttered UI', 'Slow loading'] },
      trustpilot: { rating: 3.8, pros: ['Deep insights', 'Beautiful design'], cons: ['Expensive', 'Limited functionality'] },
    },
    strengths: ['Relationship focus', 'Beautiful visualizations', 'Social discovery', 'Personality depth'],
    weaknesses: ['Battery intensive', 'Limited educational content', 'Focus on relationships only', 'Expensive'],
  },
  'sanctuary': {
    id: 'sanctuary',
    name: 'Sanctuary',
    tagline: 'Live Astrologer Consultations',
    description: 'Combines AI-powered astrology readings with access to human astrologers for personalized consultations.',
    logo: '/competitors/sanctuary.png',
    website: 'https://www.sanctuary.com',
    founded: '2018',
    headquarters: 'San Francisco, CA',
    pricing: {
      free: 'Basic daily readings',
      premium: '$19.99/month with live sessions',
      subscription: 'Varies by consultation',
    },
    features: {
      natalChart: {
        name: 'Natal Chart',
        astromind: true,
        competitor: true,
        winner: 'tie',
      },
      synastry: {
        name: 'Synastry (Relationship)',
        astromind: true,
        competitor: true,
        winner: 'tie',
      },
      transitAnalysis: {
        name: 'Transit Analysis',
        astromind: 'Detailed psychological forecasts',
        competitor: 'Astrologer-guided interpretations',
        winner: 'tie',
      },
      predictions: {
        name: 'Predictions',
        astromind: 'Comprehensive with development guidance',
        competitor: 'Personalized with human input',
        winner: 'competitor',
      },
      socialFeatures: {
        name: 'Social Features',
        astromind: 'Minimal',
        competitor: 'Community forums',
        winner: 'competitor',
      },
      aiInsights: {
        name: 'AI Insights',
        astromind: 'Psychological integration',
        competitor: 'Hybrid AI + human astrologer',
        winner: 'competitor',
      },
      customization: {
        name: 'Customization',
        astromind: 'Full customization',
        competitor: 'Limited',
        winner: 'astromind',
      },
      userExperience: {
        name: 'User Experience',
        astromind: 'Self-learning focused',
        competitor: 'Consultation-focused',
        winner: 'tie',
      },
    },
    reviews: {
      appStore: { rating: 4.6, pros: ['Human astrologers', 'Personalized readings'], cons: ['Very expensive', 'Consultation costs extra'] },
      googlePlay: { rating: 4.5, pros: ['Expert guidance', 'Accurate predictions'], cons: ['Pricey', 'Subscription + consultations'] },
      trustpilot: { rating: 4.0, pros: ['Professional astrologers', 'Deep insights'], cons: ['High costs', 'Variable quality'] },
    },
    strengths: ['Human expert access', 'Professional astrologers', 'Personalized consultations', 'Educational content'],
    weaknesses: ['Very expensive', 'AI features less prominent', 'Complex pricing', 'Focus on consultations'],
  },
};

// Comparison templates
export const COMPARISON_TEMPLATES = {
  'vs': [
    { title: 'Feature Comparison', metrics: ['natalChart', 'synastry', 'transitAnalysis', 'predictions'] },
    { title: 'User Experience', metrics: ['socialFeatures', 'aiInsights', 'customization', 'userExperience'] },
    { title: 'Pricing & Value', metrics: ['pricing'] },
    { title: 'Reviews & Ratings', metrics: ['reviews'] },
  ],
  'alternatives': [
    { title: 'Key Differences', points: ['Unique positioning', 'Target audience', 'Core strengths'] },
    { title: 'Feature Comparison', metrics: ['natalChart', 'synastry', 'transitAnalysis', 'predictions'] },
    { title: 'Why Choose Astromind', points: ['Psychological depth', 'Educational focus', 'Affordable pricing'] },
  ],
};

// Helper functions
export const getCompetitor = (id: string): CompetitorInfo | undefined => {
  return COMPETITORS[id];
};

export const getAllCompetitors = (): CompetitorInfo[] => {
  return Object.values(COMPETITORS);
};

export const compareFeatures = (
  astromindFeatures: Record<string, CompetitorFeature>,
  competitorId: string
): { name: string; astromind: string; competitor: string; winner: string }[] => {
  const competitor = COMPETITORS[competitorId];
  if (!competitor) return [];

  return Object.values(astromindFeatures).map((feature) => {
    const competitorFeature = competitor.features[feature.name as keyof typeof competitor.features];
    return {
      name: feature.name,
      astromind: String(feature.astromind),
      competitor: String(competitorFeature?.competitor || 'N/A'),
      winner: feature.winner,
    };
  });
};
