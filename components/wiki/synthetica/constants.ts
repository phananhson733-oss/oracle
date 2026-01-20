import {
  SyntheticaPlanet,
  SyntheticaSign,
  SyntheticaHouse,
  SyntheticaContextFilter,
  SyntheticaAspect,
  SyntheticaAspectCategory
} from '../../../types';

export const CONTEXTS = [
  { id: SyntheticaContextFilter.LOVE, icon: '❤️' },
  { id: SyntheticaContextFilter.SELF, icon: '🧘' },
  { id: SyntheticaContextFilter.HEALING, icon: '🩹' },
  { id: SyntheticaContextFilter.CAREER, icon: '🌟' },
  { id: SyntheticaContextFilter.TIMING, icon: '⏳' },
  { id: SyntheticaContextFilter.SOCIAL, icon: '👯' },
];

export const PLANETS: SyntheticaPlanet[] = [
  { id: 'sun', name: 'Sun', symbol: '☉', keywords: ['self', 'identity', 'life purpose'], archetype: 'The Hero', tier: 1 },
  { id: 'moon', name: 'Moon', symbol: '☽', keywords: ['emotions', 'needs', 'security'], archetype: 'Inner Child / Mother', tier: 1 },
  { id: 'mercury', name: 'Mercury', symbol: '☿', keywords: ['communication', 'logic', 'mind'], archetype: 'The Messenger', tier: 2 },
  { id: 'venus', name: 'Venus', symbol: '♀', keywords: ['love', 'values', 'harmony'], archetype: 'The Lover', tier: 2 },
  { id: 'mars', name: 'Mars', symbol: '♂', keywords: ['action', 'drive', 'conflict'], archetype: 'The Warrior', tier: 2 },
  { id: 'jupiter', name: 'Jupiter', symbol: '♃', keywords: ['expansion', 'wisdom', 'fortune'], archetype: 'The Sage', tier: 3 },
  { id: 'saturn', name: 'Saturn', symbol: '♄', keywords: ['structure', 'discipline', 'time'], archetype: 'The Builder', tier: 3 },
  { id: 'uranus', name: 'Uranus', symbol: '♅', keywords: ['change', 'rebellion', 'innovation'], archetype: 'The Awakener', tier: 4 },
  { id: 'neptune', name: 'Neptune', symbol: '♆', keywords: ['dreams', 'illusion', 'spirit'], archetype: 'The Mystic', tier: 4 },
  { id: 'pluto', name: 'Pluto', symbol: '♇', keywords: ['transformation', 'power', 'rebirth'], archetype: 'The Transformer', tier: 4 },
];

export const SIGNS: SyntheticaSign[] = [
  { id: 'aries', name: 'Aries', symbol: '♈︎', element: 'Fire', modality: 'Cardinal', archetype: 'The Pioneer' },
  { id: 'taurus', name: 'Taurus', symbol: '♉︎', element: 'Earth', modality: 'Fixed', archetype: 'The Stabilizer' },
  { id: 'gemini', name: 'Gemini', symbol: '♊︎', element: 'Air', modality: 'Mutable', archetype: 'The Communicator' },
  { id: 'cancer', name: 'Cancer', symbol: '♋︎', element: 'Water', modality: 'Cardinal', archetype: 'The Nurturer' },
  { id: 'leo', name: 'Leo', symbol: '♌︎', element: 'Fire', modality: 'Fixed', archetype: 'The Creator' },
  { id: 'virgo', name: 'Virgo', symbol: '♍︎', element: 'Earth', modality: 'Mutable', archetype: 'The Analyst' },
  { id: 'libra', name: 'Libra', symbol: '♎︎', element: 'Air', modality: 'Cardinal', archetype: 'The Diplomat' },
  { id: 'scorpio', name: 'Scorpio', symbol: '♏︎', element: 'Water', modality: 'Fixed', archetype: 'The Alchemist' },
  { id: 'sagittarius', name: 'Sagittarius', symbol: '♐︎', element: 'Fire', modality: 'Mutable', archetype: 'The Explorer' },
  { id: 'capricorn', name: 'Capricorn', symbol: '♑︎', element: 'Earth', modality: 'Cardinal', archetype: 'The Strategist' },
  { id: 'aquarius', name: 'Aquarius', symbol: '♒︎', element: 'Air', modality: 'Fixed', archetype: 'The Innovator' },
  { id: 'pisces', name: 'Pisces', symbol: '♓︎', element: 'Water', modality: 'Mutable', archetype: 'The Dreamer' },
];

export const HOUSES: SyntheticaHouse[] = [
  { id: 'h1', name: '1st House', number: 1, archetype: 'Identity & Appearance', isAngular: true },
  { id: 'h2', name: '2nd House', number: 2, archetype: 'Values & Assets', isAngular: false },
  { id: 'h3', name: '3rd House', number: 3, archetype: 'Communication & Learning', isAngular: false },
  { id: 'h4', name: '4th House', number: 4, archetype: 'Home & Roots', isAngular: true },
  { id: 'h5', name: '5th House', number: 5, archetype: 'Creativity & Joy', isAngular: false },
  { id: 'h6', name: '6th House', number: 6, archetype: 'Routine & Health', isAngular: false },
  { id: 'h7', name: '7th House', number: 7, archetype: 'Partnership & Others', isAngular: true },
  { id: 'h8', name: '8th House', number: 8, archetype: 'Intimacy & Transformation', isAngular: false },
  { id: 'h9', name: '9th House', number: 9, archetype: 'Philosophy & Travel', isAngular: false },
  { id: 'h10', name: '10th House', number: 10, archetype: 'Career & Public Image', isAngular: true },
  { id: 'h11', name: '11th House', number: 11, archetype: 'Community & Future', isAngular: false },
  { id: 'h12', name: '12th House', number: 12, archetype: 'Spirituality & Unconscious', isAngular: false },
];

export const ASPECTS: SyntheticaAspect[] = [
  { id: 'conjunction', name: 'Conjunction', symbol: '☌', angle: 0, category: SyntheticaAspectCategory.FUSION, description: 'Fusion: two forces merge as one.' },
  { id: 'sextile', name: 'Sextile', symbol: '⚹', angle: 60, category: SyntheticaAspectCategory.FLOW, description: 'Support: easy opportunities and collaboration.' },
  { id: 'square', name: 'Square', symbol: '□', angle: 90, category: SyntheticaAspectCategory.FRICTION, description: 'Friction: inner tension and action.' },
  { id: 'trine', name: 'Trine', symbol: '△', angle: 120, category: SyntheticaAspectCategory.FLOW, description: 'Flow: gifts and comfort zone.' },
  { id: 'opposition', name: 'Opposition', symbol: '☍', angle: 180, category: SyntheticaAspectCategory.FRICTION, description: 'Opposition: polarity and perspective.' },
];
