// Astrology calculation utilities
// In production, use swisseph-js for accurate calculations

export const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', element: 'fire', mode: 'cardinal' },
  { name: 'Taurus', symbol: '♉', element: 'earth', mode: 'fixed' },
  { name: 'Gemini', symbol: '♊', element: 'air', mode: 'mutable' },
  { name: 'Cancer', symbol: '♋', element: 'water', mode: 'cardinal' },
  { name: 'Leo', symbol: '♌', element: 'fire', mode: 'fixed' },
  { name: 'Virgo', symbol: '♍', element: 'earth', mode: 'mutable' },
  { name: 'Libra', symbol: '♎', element: 'air', mode: 'cardinal' },
  { name: 'Scorpio', symbol: '♏', element: 'water', mode: 'fixed' },
  { name: 'Sagittarius', symbol: '♐', element: 'fire', mode: 'mutable' },
  { name: 'Capricorn', symbol: '♑', element: 'earth', mode: 'cardinal' },
  { name: 'Aquarius', symbol: '♒', element: 'air', mode: 'fixed' },
  { name: 'Pisces', symbol: '♓', element: 'water', mode: 'mutable' },
] as const

export const PLANETS = [
  { name: 'Sun', symbol: '☉', type: 'luminary' },
  { name: 'Moon', symbol: '☽', type: 'luminary' },
  { name: 'Mercury', symbol: '☿', type: 'personal' },
  { name: 'Venus', symbol: '♀', type: 'personal' },
  { name: 'Mars', symbol: '♂', type: 'personal' },
  { name: 'Jupiter', symbol: '♃', type: 'social' },
  { name: 'Saturn', symbol: '♄', type: 'social' },
  { name: 'Uranus', symbol: '♅', type: 'transpersonal' },
  { name: 'Neptune', symbol: '♆', type: 'transpersonal' },
  { name: 'Pluto', symbol: '♇', type: 'transpersonal' },
  { name: 'North Node', symbol: '☊', type: 'node' },
  { name: 'Chiron', symbol: '⚷', type: 'asteroid' },
] as const

export const ASPECTS = [
  { name: 'Conjunction', symbol: '☌', angle: 0, orb: 8, type: 'major' },
  { name: 'Opposition', symbol: '☍', angle: 180, orb: 8, type: 'major' },
  { name: 'Trine', symbol: '△', angle: 120, orb: 8, type: 'major' },
  { name: 'Square', symbol: '□', angle: 90, orb: 7, type: 'major' },
  { name: 'Sextile', symbol: '⚹', angle: 60, orb: 6, type: 'major' },
] as const

export interface PlanetPosition {
  planet: string
  longitude: number // 0-360
  sign: string
  degree: number // 0-30 within sign
  minute: number
  house: number
  retrograde: boolean
}

// Convert absolute degree (0-360) to sign and degree
export function longitudeToSign(longitude: number): { sign: string; degree: number; minute: number } {
  const normalized = ((longitude % 360) + 360) % 360
  const signIndex = Math.floor(normalized / 30)
  const degreeInSign = normalized % 30
  const degree = Math.floor(degreeInSign)
  const minute = Math.round((degreeInSign - degree) * 60)

  return {
    sign: ZODIAC_SIGNS[signIndex].name,
    degree,
    minute,
  }
}

// Calculate aspect between two planets
export function calculateAspect(
  long1: number,
  long2: number
): { aspect: typeof ASPECTS[number] | null; orb: number } {
  let diff = Math.abs(long1 - long2)
  if (diff > 180) diff = 360 - diff

  for (const aspect of ASPECTS) {
    const orb = Math.abs(diff - aspect.angle)
    if (orb <= aspect.orb) {
      return { aspect, orb }
    }
  }

  return { aspect: null, orb: 0 }
}

// Get element distribution
export function getElementBalance(positions: PlanetPosition[]): Record<string, number> {
  const elements = { fire: 0, earth: 0, air: 0, water: 0 }

  for (const pos of positions) {
    const sign = ZODIAC_SIGNS.find((s) => s.name === pos.sign)
    if (sign) {
      elements[sign.element]++
    }
  }

  return elements
}

// Get mode distribution
export function getModeBalance(positions: PlanetPosition[]): Record<string, number> {
  const modes = { cardinal: 0, fixed: 0, mutable: 0 }

  for (const pos of positions) {
    const sign = ZODIAC_SIGNS.find((s) => s.name === pos.sign)
    if (sign) {
      modes[sign.mode]++
    }
  }

  return modes
}

// Format degree for display
export function formatDegree(degree: number, minute: number): string {
  return `${degree}°${minute.toString().padStart(2, '0')}'`
}

// Calculate midpoint (for composite charts)
export function calculateMidpoint(long1: number, long2: number): number {
  let mid = (long1 + long2) / 2
  const diff = Math.abs(long1 - long2)

  // If planets are more than 180° apart, use the shorter arc
  if (diff > 180) {
    mid = (mid + 180) % 360
  }

  return mid
}
