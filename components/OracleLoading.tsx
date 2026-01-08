import React, { useState, useEffect } from 'react';

interface OracleLoadingProps {
  phrases: string[];
  thinkingLabel?: string;
  phraseInterval?: number;
  className?: string;
}

/**
 * OracleLoading - 神谕加载动画共享组件
 *
 * 用于 Ask Oracle 和合盘分析等场景的统一加载体验。
 * 支持：可配置文案轮播、dark/light 主题适配、星盘风格视觉效果。
 */
export const OracleLoading: React.FC<OracleLoadingProps> = ({
  phrases,
  thinkingLabel = 'CONSULTING THE STARS',
  phraseInterval = 3200,
  className = '',
}) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (phrases.length === 0) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, phraseInterval);
    return () => clearInterval(interval);
  }, [phrases, phraseInterval]);

  const currentPhrase = phrases[phraseIndex] || thinkingLabel;

  return (
    <div className={`w-full h-full min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden ${className}`}>
      {/* Deep cosmic background layer - fixed to viewport */}
      <div className="fixed inset-0 pointer-events-none bg-space-950">
        {/* Multi-layer nebula gradient backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(147,112,219,0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(70,130,180,0.08) 0%, transparent 45%),
              radial-gradient(ellipse at center, rgba(212,175,55,0.1) 0%, transparent 55%)
            `
          }}
        />

        {/* Constellation silhouette SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.05]"
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Zodiac wheel silhouette */}
          <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gold-500" />
          <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-purple-400" />
          <circle cx="200" cy="200" r="100" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-blue-400" />
          {/* Zodiac division lines */}
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="200" y1="20" x2="200" y2="60"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-gold-500"
              transform={`rotate(${i * 30} 200 200)`}
            />
          ))}
          {/* Star points with varied colors */}
          <circle cx="80" cy="80" r="2" fill="#D4AF37" opacity="0.6" />
          <circle cx="320" cy="100" r="1.5" fill="#9370DB" opacity="0.5" />
          <circle cx="350" cy="280" r="2" fill="#4682B4" opacity="0.4" />
          <circle cx="50" cy="300" r="1.5" fill="#D4AF37" opacity="0.5" />
          <circle cx="150" cy="50" r="1" fill="#9370DB" opacity="0.4" />
          <circle cx="280" cy="350" r="1" fill="#4682B4" opacity="0.5" />
          {/* Constellation lines */}
          <path d="M80 80 L120 120 L160 100 L200 140" stroke="#D4AF37" strokeWidth="0.3" fill="none" opacity="0.4" />
          <path d="M320 100 L280 140 L300 180" stroke="#9370DB" strokeWidth="0.3" fill="none" opacity="0.3" />
          <path d="M350 280 L300 260 L280 300 L320 340" stroke="#4682B4" strokeWidth="0.3" fill="none" opacity="0.3" />
        </svg>

        {/* Floating cosmic particles - varied colors */}
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-purple-400/40 animate-pulse" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 rounded-full bg-gold-400/50 animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-blue-400/30 animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 rounded-full bg-purple-300/40 animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />
        <div className="absolute bottom-1/4 right-1/5 w-1.5 h-1.5 rounded-full bg-gold-500/35 animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }} />
        <div className="absolute top-1/5 right-1/2 w-0.5 h-0.5 rounded-full bg-blue-300/50 animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '3s' }} />
        <div className="absolute bottom-1/5 left-1/5 w-1 h-1 rounded-full bg-amber-400/40 animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '4.2s' }} />
      </div>

      {/* Central Oracle Orb - Enhanced Cosmic Crystal */}
      <div className="relative w-72 h-72 md:w-80 md:h-80 m-8">

        {/* Outermost nebula corona - purple/blue haze */}
        <div
          className="absolute -inset-8 rounded-full animate-pulse"
          style={{
            background: `
              radial-gradient(circle,
                rgba(147,112,219,0.15) 0%,
                rgba(70,130,180,0.1) 30%,
                rgba(212,175,55,0.05) 50%,
                transparent 70%
              )
            `,
            animationDuration: '4s',
            filter: 'blur(8px)'
          }}
        />

        {/* Secondary aurora glow ring */}
        <div
          className="absolute -inset-4 rounded-full"
          style={{
            background: `
              radial-gradient(circle,
                rgba(212,175,55,0.2) 0%,
                rgba(147,112,219,0.1) 40%,
                transparent 65%
              )
            `,
            animation: 'pulse 3s ease-in-out infinite alternate'
          }}
        />

        {/* Rotating outer cosmic ring */}
        <div className="absolute inset-2 animate-spin-slow">
          <svg viewBox="0 0 240 240" className="w-full h-full">
            <defs>
              <linearGradient id="cosmicRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.7" />
                <stop offset="25%" stopColor="#9370DB" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#4682B4" stopOpacity="0.3" />
                <stop offset="75%" stopColor="#9370DB" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="innerRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4D03F" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#DDA0DD" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#F4D03F" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <circle cx="120" cy="120" r="115" fill="none" stroke="url(#cosmicRingGradient)" strokeWidth="1.5" strokeDasharray="12 8 4 8" />
            <circle cx="120" cy="120" r="100" fill="none" stroke="url(#innerRingGradient)" strokeWidth="0.8" strokeDasharray="6 12" opacity="0.7" />
          </svg>
        </div>

        {/* Counter-rotating mystical ring */}
        <div className="absolute inset-10 animate-spin-reverse" style={{ animationDuration: '25s' }}>
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="mysticalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9370DB" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#9370DB" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="85" fill="none" stroke="url(#mysticalGradient)" strokeWidth="0.6" strokeDasharray="3 9 1 9" />
            {/* Orbital markers */}
            <circle cx="100" cy="18" r="2.5" fill="#D4AF37" opacity="0.6" />
            <circle cx="182" cy="100" r="2" fill="#9370DB" opacity="0.5" />
            <circle cx="100" cy="182" r="2.5" fill="#4682B4" opacity="0.5" />
            <circle cx="18" cy="100" r="2" fill="#D4AF37" opacity="0.6" />
          </svg>
        </div>

        {/* === CENTRAL CRYSTAL ORB === */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-28 h-28 md:w-32 md:h-32">

            {/* Outer ambient glow - soft diffused light */}
            <div
              className="absolute -inset-8 rounded-full"
              style={{
                background: `
                  radial-gradient(circle,
                    rgba(180,150,90,0.12) 0%,
                    rgba(120,100,140,0.08) 40%,
                    transparent 65%
                  )
                `,
                animation: 'pulse 4s ease-in-out infinite',
                filter: 'blur(12px)'
              }}
            />

            {/* Inner ambient layer - subtle warmth */}
            <div
              className="absolute -inset-4 rounded-full"
              style={{
                background: `
                  radial-gradient(circle at 45% 35%,
                    rgba(200,170,100,0.15) 0%,
                    rgba(160,130,80,0.1) 40%,
                    transparent 70%
                  )
                `,
                animation: 'pulse 3.5s ease-in-out infinite 0.8s'
              }}
            />

            {/* Core orb - sophisticated crystal with depth */}
            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(circle at 32% 28%,
                    rgba(255,250,240,0.25) 0%,
                    rgba(200,175,120,0.35) 12%,
                    rgba(170,145,90,0.45) 28%,
                    rgba(140,115,75,0.5) 45%,
                    rgba(100,85,60,0.45) 65%,
                    rgba(70,60,50,0.5) 85%,
                    rgba(50,45,40,0.55) 100%
                  )
                `,
                boxShadow: `
                  0 0 40px rgba(180,150,90,0.2),
                  0 0 80px rgba(140,110,70,0.1),
                  inset 0 0 30px rgba(100,80,50,0.3),
                  inset -8px -8px 25px rgba(60,50,40,0.4),
                  inset 6px 6px 15px rgba(220,200,160,0.15)
                `
              }}
            >
              {/* Deep internal glow - very subtle */}
              <div
                className="absolute inset-3 rounded-full animate-spin-slow"
                style={{
                  animationDuration: '12s',
                  background: `
                    conic-gradient(from 0deg,
                      transparent 0deg,
                      rgba(200,170,110,0.08) 60deg,
                      transparent 120deg,
                      rgba(150,130,100,0.06) 200deg,
                      transparent 280deg,
                      rgba(180,150,100,0.07) 340deg,
                      transparent 360deg
                    )
                  `,
                  filter: 'blur(10px)'
                }}
              />

              {/* Subtle secondary rotation */}
              <div
                className="absolute inset-6 rounded-full animate-spin-reverse"
                style={{
                  animationDuration: '18s',
                  background: `
                    conic-gradient(from 90deg,
                      transparent 0deg,
                      rgba(180,155,100,0.06) 100deg,
                      transparent 200deg,
                      rgba(160,140,110,0.05) 300deg,
                      transparent 360deg
                    )
                  `,
                  filter: 'blur(8px)'
                }}
              />
            </div>

            {/* Primary glass highlight - refined specular */}
            <div
              className="absolute top-2 left-2 w-8 h-8 md:w-9 md:h-9 rounded-full"
              style={{
                background: `
                  linear-gradient(135deg,
                    rgba(255,255,255,0.35) 0%,
                    rgba(255,250,240,0.15) 30%,
                    rgba(255,245,230,0.05) 60%,
                    transparent 80%
                  )
                `,
                filter: 'blur(0.5px)'
              }}
            />

            {/* Secondary highlight - edge catch */}
            <div
              className="absolute top-4 left-5 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)'
              }}
            />

            {/* Rim light - subtle bottom right */}
            <div
              className="absolute bottom-2 right-2 w-6 h-6 md:w-7 md:h-7 rounded-full"
              style={{
                background: `
                  radial-gradient(circle at 70% 70%,
                    rgba(200,180,140,0.12) 0%,
                    transparent 60%
                  )
                `,
                filter: 'blur(2px)'
              }}
            />

            {/* Core inner light - gentle pulsing */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-4 h-4 md:w-5 md:h-5 rounded-full"
                style={{
                  background: `
                    radial-gradient(circle,
                      rgba(255,248,230,0.4) 0%,
                      rgba(220,195,140,0.25) 30%,
                      rgba(180,155,100,0.15) 60%,
                      transparent 85%
                    )
                  `,
                  animation: 'pulse 3s ease-in-out infinite',
                  filter: 'blur(2px)'
                }}
              />
            </div>

            {/* Subtle center point */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,250,235,0.6) 0%, rgba(200,175,120,0.3) 50%, transparent 100%)',
                  boxShadow: '0 0 6px rgba(220,195,140,0.4), 0 0 12px rgba(180,155,100,0.2)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Orbiting celestial bodies - refined muted tones */}
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '15s' }}>
          <div
            className="absolute top-6 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 35%, rgba(220,195,140,0.8), rgba(180,155,100,0.6))',
              boxShadow: '0 0 6px rgba(200,175,120,0.3)'
            }}
          />
        </div>
        <div className="absolute inset-0 animate-spin-reverse" style={{ animationDuration: '20s' }}>
          <div
            className="absolute bottom-10 right-6 w-1.5 h-1.5 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 35%, rgba(180,160,190,0.7), rgba(140,120,160,0.5))',
              boxShadow: '0 0 5px rgba(160,140,180,0.25)'
            }}
          />
        </div>
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '25s' }}>
          <div
            className="absolute top-1/3 left-3 w-1 h-1 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 35%, rgba(160,180,200,0.6), rgba(120,140,160,0.4))',
              boxShadow: '0 0 4px rgba(140,160,180,0.2)'
            }}
          />
        </div>
        <div className="absolute inset-0 animate-spin-reverse" style={{ animationDuration: '30s' }}>
          <div
            className="absolute bottom-1/4 left-10 w-0.5 h-0.5 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(200,180,140,0.7), rgba(170,150,110,0.5))',
              boxShadow: '0 0 3px rgba(185,165,125,0.2)'
            }}
          />
        </div>
      </div>

      {/* Loading text with cosmic gradient */}
      <div className="relative z-10 mt-8">
        <div className="text-[10px] uppercase tracking-[0.5em] text-gold-500/60 mb-3 font-mono">
          {thinkingLabel}
        </div>
        <div className="text-2xl md:text-3xl font-serif tracking-tight min-h-[2.5rem] max-w-md">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, #D4AF37 0%, #F4D03F 25%, #DDA0DD 50%, #F4D03F 75%, #D4AF37 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite'
            }}
          >
            {currentPhrase}
          </span>
        </div>
        {/* Animated dots with cosmic colors */}
        <div className="flex justify-center gap-2 mt-4">
          <div
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{
              animationDelay: '0ms',
              animationDuration: '1s',
              background: 'linear-gradient(135deg, #D4AF37, #F4D03F)',
              boxShadow: '0 0 4px rgba(212,175,55,0.5)'
            }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{
              animationDelay: '150ms',
              animationDuration: '1s',
              background: 'linear-gradient(135deg, #9370DB, #DDA0DD)',
              boxShadow: '0 0 4px rgba(147,112,219,0.5)'
            }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{
              animationDelay: '300ms',
              animationDuration: '1s',
              background: 'linear-gradient(135deg, #4682B4, #87CEEB)',
              boxShadow: '0 0 4px rgba(70,130,180,0.5)'
            }}
          />
        </div>
      </div>

      {/* CSS Keyframes for shimmer effect */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};

export default OracleLoading;
