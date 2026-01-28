import type { SyntheticaConfigUnit, SyntheticaSelectionState } from '../../types';
import { SyntheticaContextFilter } from '../../types';
import { buildSyntheticaConfig } from '../../components/wiki/synthetica/buildConfig';

const selection = {
  context: SyntheticaContextFilter.LOVE,
  planet: { id: 'moon', name: 'Moon', symbol: '☽', keywords: [], archetype: '', tier: 1 },
  sign: { id: 'scorpio', name: 'Scorpio', symbol: '♏︎', element: 'Water', modality: 'Fixed', archetype: '' },
  house: { id: 'h8', name: '8th House', number: 8, archetype: '', isAngular: false },
  aspects: [],
} satisfies SyntheticaSelectionState;

const config: SyntheticaConfigUnit = buildSyntheticaConfig(selection);
void config;
