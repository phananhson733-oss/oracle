import type { SyntheticaConfigUnit, SyntheticaSelectionState } from '../../../types';

export function buildSyntheticaConfig(selection: SyntheticaSelectionState): SyntheticaConfigUnit {
  return {
    planetId: selection.planet?.id || '',
    signId: selection.sign?.id || '',
    house: selection.house?.number ?? null,
    aspects: selection.aspects.map((item) => ({
      targetPlanetId: item.planet.id,
      aspectType: item.aspect.id,
    })),
  };
}
