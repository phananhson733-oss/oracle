import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSyntheticaConfig } from '../syntheticaConfig.js';

test('normalizeSyntheticaConfig maps ids to labels and tiers', () => {
  const result = normalizeSyntheticaConfig(
    {
      planetId: 'moon',
      signId: 'scorpio',
      house: 8,
      aspects: [{ targetPlanetId: 'pluto', aspectType: 'conjunction', orb: 2 }],
    },
    'zh'
  );

  assert.equal(result.planet.id, 'moon');
  assert.equal(result.planet.tier, 1);
  assert.equal(result.sign.id, 'scorpio');
  assert.equal(result.house?.id, 'h8');
  assert.equal(result.aspects[0].aspect.id, 'conjunction');
  assert.equal(result.aspects[0].planet.id, 'pluto');
});
