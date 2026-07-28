import { describe, it, expect } from 'vitest';
import { normalizeSyntheticaConfig } from '../syntheticaConfig.js';

describe('normalizeSyntheticaConfig', () => {
  it('maps ids to labels and tiers', () => {
    const result = normalizeSyntheticaConfig(
      {
        planetId: 'moon',
        signId: 'scorpio',
        house: 8,
        aspects: [{ targetPlanetId: 'pluto', aspectType: 'conjunction', orb: 2 }],
      },
      'zh'
    );

    expect(result.planet.id).toBe('moon');
    expect(result.planet.tier).toBe(1);
    expect(result.sign.id).toBe('scorpio');
    expect(result.house?.id).toBe('h8');
    expect(result.aspects[0].aspect.id).toBe('conjunction');
    expect(result.aspects[0].planet.id).toBe('pluto');
  });
});
