// INPUT: Lightweight A/B testing assignment helpers.
// OUTPUT: Exports experiment registration and variant selection utilities.
// POS: A/B testing service module; update services/FOLDER.md when this file changes.

import { trackEvent } from './analytics';

export type ExperimentConfig = {
  id: string;
  variants: string[];
  weights?: Record<string, number>;
};

type ExperimentState = ExperimentConfig & { assignedVariant?: string };

const experiments = new Map<string, ExperimentState>();

const normalizeWeights = (config: ExperimentConfig): Record<string, number> => {
  if (!config.weights) {
    const weight = 1 / config.variants.length;
    return Object.fromEntries(config.variants.map((variant) => [variant, weight]));
  }
  return config.weights;
};

const assignVariant = (config: ExperimentConfig): string => {
  const weights = normalizeWeights(config);
  const entries = config.variants.map((variant) => ({
    variant,
    weight: Number(weights[variant] ?? 0),
  }));
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const random = Math.random() * (total || 1);
  let cumulative = 0;
  for (const entry of entries) {
    cumulative += entry.weight;
    if (random <= cumulative) return entry.variant;
  }
  return config.variants[0] || 'control';
};

export const defineExperiment = (config: ExperimentConfig) => {
  experiments.set(config.id, { ...config });
};

export const getVariant = (experimentId: string): string => {
  const experiment = experiments.get(experimentId);
  if (!experiment) return 'control';
  const storageKey = `ab_${experimentId}`;
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) return stored;
  }
  const variant = assignVariant(experiment);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, variant);
  }
  trackEvent('ab_test_assigned', {
    experiment_id: experimentId,
    variant,
  });
  return variant;
};
