import { useMemo } from 'react'

interface Props {
  size?: number
  showTransit?: boolean
}

// Zodiac signs with their starting degrees
const SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

// Mock planet positions (degrees 0-360)
const NATAL_PLANETS = [
  { symbol: '☉', name: 'Sun', degree: 218 },      // Scorpio
  { symbol: '☽', name: 'Moon', degree: 105 },     // Cancer
  { symbol: '☿', name: 'Mercury', degree: 230 },  // Scorpio
  { symbol: '♀', name: 'Venus', degree: 195 },    // Libra
  { symbol: '♂', name: 'Mars', degree: 45 },      // Taurus
  { symbol: '♃', name: 'Jupiter', degree: 280 },  // Capricorn
  { symbol: '♄', name: 'Saturn', degree: 165 },   // Virgo
]

const TRANSIT_PLANETS = [
  { symbol: '☉', degree: 258 },
  { symbol: '☽', degree: 45 },
  { symbol: '☿', degree: 270 },
  { symbol: '♀', degree: 240 },
  { symbol: '♂', degree: 120 },
]

export default function AstrologyChart({ size = 400, showTransit = true }: Props) {
  const center = size / 2
  const outerRadius = size / 2 - 20
  const zodiacWidth = 35
  const innerRadius = outerRadius - zodiacWidth
  const planetRadius = innerRadius - 30
  const transitRadius = outerRadius + 25

  // Convert degree to SVG coordinates (0° = Aries = right side, counter-clockwise)
  const degToCoord = (deg: number, r: number) => {
    const rad = ((90 - deg) * Math.PI) / 180
    return {
      x: center + r * Math.cos(rad),
      y: center - r * Math.sin(rad),
    }
  }

  const zodiacSegments = useMemo(() => {
    return SIGNS.map((sign, i) => {
      const startAngle = i * 30
      const midAngle = startAngle + 15
      const pos = degToCoord(midAngle, innerRadius + zodiacWidth / 2)
      return { sign, pos, startAngle }
    })
  }, [innerRadius, zodiacWidth])

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Background glow */}
      <defs>
        <radialGradient id="chartGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(212, 175, 55, 0.1)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx={center} cy={center} r={outerRadius} fill="url(#chartGlow)" />

      {/* Outer circle */}
      <circle cx={center} cy={center} r={outerRadius} fill="none" stroke="#2D2D30" strokeWidth="1" />

      {/* Inner circle */}
      <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="#2D2D30" strokeWidth="1" />

      {/* Zodiac divisions */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = i * 30
        const outer = degToCoord(angle, outerRadius)
        const inner = degToCoord(angle, innerRadius)
        return (
          <line
            key={i}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="#2D2D30"
            strokeWidth="1"
          />
        )
      })}

      {/* Zodiac signs */}
      {zodiacSegments.map(({ sign, pos }, i) => (
        <text
          key={i}
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted text-sm"
        >
          {sign}
        </text>
      ))}

      {/* House cusps (simplified - equal houses) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = i * 30
        const inner = degToCoord(angle, innerRadius)
        const center2 = degToCoord(angle, 30)
        return (
          <line
            key={`house-${i}`}
            x1={center2.x}
            y1={center2.y}
            x2={inner.x}
            y2={inner.y}
            stroke="#1A1A1D"
            strokeWidth="1"
            strokeDasharray="2,4"
          />
        )
      })}

      {/* Natal planets */}
      {NATAL_PLANETS.map(({ symbol, degree }, i) => {
        const pos = degToCoord(degree, planetRadius)
        return (
          <g key={`natal-${i}`}>
            <circle cx={pos.x} cy={pos.y} r={12} fill="#0A0A0B" stroke="#D4AF37" strokeWidth="1" />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gold text-xs"
            >
              {symbol}
            </text>
          </g>
        )
      })}

      {/* Transit planets (outer ring) */}
      {showTransit &&
        TRANSIT_PLANETS.map(({ symbol, degree }, i) => {
          const pos = degToCoord(degree, transitRadius)
          return (
            <g key={`transit-${i}`}>
              <circle cx={pos.x} cy={pos.y} r={10} fill="#0A0A0B" stroke="#9CA3AF" strokeWidth="1" />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-gray-400 text-xs"
              >
                {symbol}
              </text>
            </g>
          )
        })}

      {/* Center point */}
      <circle cx={center} cy={center} r={3} fill="#D4AF37" />
    </svg>
  )
}
