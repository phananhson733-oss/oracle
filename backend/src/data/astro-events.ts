import { ephemerisService } from '../services/ephemeris.js';
import { SIGNS } from './sources.js';

export type AstroEventType = 'mercury_retrograde' | 'new_moon' | 'full_moon' | 'planet_ingress';
export type AstroEventImportance = 'high' | 'medium' | 'low';

export interface AstroEvent {
  id: string;
  type: AstroEventType;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  importance: AstroEventImportance;
}

const EVENT_START = '2025-01-01';
const EVENT_END = '2026-12-31';

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const toAbsoluteDegree = (degree: number, sign: string, minute?: number) => {
  const signIndex = SIGNS.indexOf(sign as typeof SIGNS[number]);
  const base = signIndex >= 0 ? signIndex * 30 : 0;
  const extra = (minute || 0) / 60;
  return base + degree + extra;
};

const getMoonPhase = (moonDeg: number, sunDeg: number) => {
  const diff = ((moonDeg - sunDeg + 360) % 360);
  if (diff < 45) return 'New Moon';
  if (diff < 90) return 'Waxing Crescent';
  if (diff < 135) return 'First Quarter';
  if (diff < 180) return 'Waxing Gibbous';
  if (diff < 225) return 'Full Moon';
  if (diff < 270) return 'Waning Gibbous';
  if (diff < 315) return 'Last Quarter';
  return 'Waning Crescent';
};

let cachedEvents: AstroEvent[] | null = null;
let pendingEvents: Promise<AstroEvent[]> | null = null;

const buildAstroEvents = async (): Promise<AstroEvent[]> => {
  const events: AstroEvent[] = [];
  let current = new Date(`${EVENT_START}T12:00:00Z`);
  const end = new Date(`${EVENT_END}T12:00:00Z`);

  let previousPhase: string | null = null;
  let previousRetrograde: boolean | null = null;
  let mercuryRetrogradeStart: string | null = null;

  while (current <= end) {
    const { positions } = await ephemerisService.getPlanetPositions(current, 0, 0);
    const moon = positions.find(position => position.name === 'Moon');
    const sun = positions.find(position => position.name === 'Sun');
    const mercury = positions.find(position => position.name === 'Mercury');

    if (moon && sun) {
      const moonDeg = toAbsoluteDegree(moon.degree, moon.sign, moon.minute);
      const sunDeg = toAbsoluteDegree(sun.degree, sun.sign, sun.minute);
      const phase = getMoonPhase(moonDeg, sunDeg);

      if (phase === 'New Moon' && previousPhase !== 'New Moon') {
        const startDate = dateKey(current);
        events.push({
          id: `new_moon_${startDate}`,
          type: 'new_moon',
          title: '新月',
          description: '新月适合设定意图，开启新的节奏。',
          startDate,
          endDate: startDate,
          importance: 'medium',
        });
      }

      if (phase === 'Full Moon' && previousPhase !== 'Full Moon') {
        const startDate = dateKey(current);
        events.push({
          id: `full_moon_${startDate}`,
          type: 'full_moon',
          title: '满月',
          description: '满月适合完成与释放，观察能量高峰。',
          startDate,
          endDate: startDate,
          importance: 'medium',
        });
      }

      previousPhase = phase;
    }

    if (mercury) {
      const isRetrograde = mercury.isRetrograde;
      if (previousRetrograde === false && isRetrograde) {
        mercuryRetrogradeStart = dateKey(current);
      }
      if (previousRetrograde === true && !isRetrograde && mercuryRetrogradeStart) {
        const endDate = dateKey(current);
        events.push({
          id: `mercury_retrograde_${mercuryRetrogradeStart}`,
          type: 'mercury_retrograde',
          title: '水星逆行',
          description: '水星逆行期间注意沟通、交通与计划调整。',
          startDate: mercuryRetrogradeStart,
          endDate,
          importance: 'high',
        });
        mercuryRetrogradeStart = null;
      }
      previousRetrograde = isRetrograde;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  if (mercuryRetrogradeStart) {
    const endDate = dateKey(end);
    events.push({
      id: `mercury_retrograde_${mercuryRetrogradeStart}`,
      type: 'mercury_retrograde',
      title: '水星逆行',
      description: '水星逆行期间注意沟通、交通与计划调整。',
      startDate: mercuryRetrogradeStart,
      endDate,
      importance: 'high',
    });
  }

  return events;
};

export const loadAstroEvents = async (): Promise<AstroEvent[]> => {
  if (cachedEvents) return cachedEvents;
  if (pendingEvents) return pendingEvents;

  pendingEvents = buildAstroEvents().then((events) => {
    cachedEvents = events;
    pendingEvents = null;
    return events;
  }).catch((error) => {
    pendingEvents = null;
    throw error;
  });

  return pendingEvents;
};

export const ASTRO_EVENT_RANGE = {
  start: EVENT_START,
  end: EVENT_END,
};
