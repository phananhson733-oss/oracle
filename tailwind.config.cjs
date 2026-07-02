/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './backend/src/data/wiki.ts', // Wiki color_token gradient classes
  ],
  theme: {
    extend: {
      colors: {
        // Editorial ground scale (CSS-var-backed, flips with body.light/dark).
        // Light: warm paper #F4EFE4 family. Dark: "night sky" #16130F family.
        space: {
          950: 'rgb(var(--space-950) / <alpha-value>)', // Main Background
          900: 'rgb(var(--space-900) / <alpha-value>)', // Secondary Background
          800: 'rgb(var(--space-800) / <alpha-value>)', // Card Background
          700: 'rgb(var(--space-700) / <alpha-value>)', // Secondary Surface
          600: 'rgb(var(--space-600) / <alpha-value>)', // Border
        },
        // Static warm-paper ramp (light-branch classes). 100 = paper ground,
        // 900 = ink; aligned to the editorial system so bg-paper-100/text-paper-900
        // equals the :root var values.
        paper: {
          50: '#FBF8F1',  // raised surface
          100: '#F4EFE4', // paper ground
          200: '#EBE3D4', // sunken surface
          300: '#D8CFBF', // strong hairline
          400: '#736A5C', // muted text (4.5:1 AA on paper #F4EFE4)
          500: '#6B6053', // ink-60 secondary text
          600: '#4A4238',
          700: '#3A342B', // ink-80
          800: '#241F18',
          900: '#16130F', // ink
        },
        // Text Colors (CSS-var-backed: ink on paper / warm white on night)
        star: {
          50: 'rgb(var(--star-50) / <alpha-value>)', // Primary text
          100: 'rgb(var(--star-100) / <alpha-value>)', // Near-primary text
          200: 'rgb(var(--star-200) / <alpha-value>)', // Secondary text
          300: 'rgb(var(--star-300) / <alpha-value>)', // Near-secondary text
          400: 'rgb(var(--star-400) / <alpha-value>)', // Muted text
        },
        // Mystical Purple — astrology domain tag color. Deliberately desaturated
        // ("极弱化"): reserved for small labels/chips only, never large surfaces.
        mystic: {
          50: '#F8F5FB',
          100: '#EFE9F6',
          200: '#DFD3EC',
          300: '#C4AFDB',
          400: '#A98FC7',
          500: '#9273B8',
          600: '#7B5CA3',
          700: '#674E89',
          800: '#533F70',
          900: '#413158',
        },
        // Aged-gold accent（陈金）。DEFAULT/hover are CSS-var-driven so the accent
        // lifts one step on night ground (#9A7B3F ↔ #C6A15E) without per-site edits.
        accent: {
          100: '#EFE4CC',
          200: '#DFCCA3',
          300: '#C6A15E',
          400: '#AE8C4D',
          500: '#9A7B3F',
          600: '#7F6534',
          700: '#64502A',
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          light: '#EFE4CC',
          glow: 'rgba(154, 123, 63, 0.22)',
        },
        // Gold Alias for App.tsx compatibility (aged-gold ramp)
        gold: {
          100: '#EFE4CC',
          200: '#DFCCA3',
          300: '#C6A15E',
          400: '#AE8C4D',
          500: '#9A7B3F',
          600: '#7F6534',
          700: '#64502A',
          800: '#4A3B1F',
        },
        // Psychology Blue — CBT/psychology domain tag color, desaturated to a
        // dusty steel blue; small labels/chips only.
        psycho: {
          50: '#F2F6FA',
          100: '#E3EBF4',
          200: '#C9D8E9',
          300: '#A3BCD8',
          400: '#7C97C8',
          500: '#5F7FB4',
          600: '#4B6AA0',
          700: '#3E5A8A',
          800: '#334B73',
          900: '#2A3D5E',
        },
        // Semantic Colors (improved for psychology + astrology)
        success: '#10B981', // Green - positive, growth
        warning: '#F59E0B', // Amber - attention, gold family
        danger: '#EF4444', // Red - alert, caution
        info: '#3B82F6', // Blue - professional, trust
      },
      fontFamily: {
        sans: ['"Readex Pro"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
        serif: ['"Cormorant Garamond"', '"Songti SC"', '"STSong"', '"SimSun"', '"Noto Serif SC"', 'serif'],
        // Reading serif for long-form surfaces (wiki/articles/reports) only;
        // tool/form surfaces stay on sans. See COLOR_SYSTEM_GUIDE.md §字体.
        reading: ['"Newsreader"', 'Georgia', '"Songti SC"', '"STSong"', '"Noto Serif SC"', 'serif'],
        mono: ['"IBM Plex Mono"', '"PingFang SC"', '"Microsoft YaHei"', 'monospace'],
      },
      // Print-flat editorial: near-square corners everywhere; only rounded-full
      // stays a pill (kept for specific CTAs/avatars by design).
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        '3xl': '2px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #9A7B3F 0%, #AE8C4D 100%)',
        'gradient-dark': 'linear-gradient(180deg, rgba(22,19,15,0) 0%, #16130F 100%)',
        'gradient-glass': 'radial-gradient(circle at 50% 0%, rgba(154,123,63,0.05), transparent 62%)',
      },
      // Editorial elevation: line, not shadow. glow/card intentionally neutralized;
      // only overlays (drawer/modal) may cast a soft shadow.
      boxShadow: {
        glow: 'none',
        sm: '0 1px 2px 0 rgba(22, 19, 15, 0.08)',
        card: 'none',
        drawer: '0 24px 70px -10px rgba(22, 19, 15, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'spin-slow': 'spinSlow 26s linear infinite',
        'spin-reverse': 'spinReverse 16s linear infinite',
        breathe: 'breathe 2.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        spinReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        breathe: {
          '0%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
          '100%': { opacity: '0.4', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
