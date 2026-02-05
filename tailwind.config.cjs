/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Frosted Black Base (deeper)
        space: {
          950: 'rgb(var(--space-950) / <alpha-value>)', // Main Background
          900: 'rgb(var(--space-900) / <alpha-value>)', // Secondary Background
          800: 'rgb(var(--space-800) / <alpha-value>)', // Card Background
          700: 'rgb(var(--space-700) / <alpha-value>)', // Secondary Surface
          600: 'rgb(var(--space-600) / <alpha-value>)', // Border
        },
        // Light Mode Grays (Minimal)
        paper: {
          50: '#FFFFFF',
          100: '#F6F4F0',
          200: '#EFEAE2',
          300: '#D8D1C5',
          400: '#7A746B',
          600: '#4A4540',
          900: '#0A0B0D',
        },
        // Text Colors (Warm Neutral)
        star: {
          50: 'rgb(var(--star-50) / <alpha-value>)', // Primary text
          200: 'rgb(var(--star-200) / <alpha-value>)', // Secondary text
          400: 'rgb(var(--star-400) / <alpha-value>)', // Muted text
        },
        // Mystical Purple (Astrology & Spirituality)
        mystic: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
        },
        // Dark Gold Accent (refined scale)
        accent: {
          100: '#F4E8CF',
          200: '#E7D2AA',
          300: '#D5B97D',
          400: '#C6A062',
          500: '#B58A52',
          600: '#9F7645',
          700: '#7F5E36',
          DEFAULT: '#C6A062',
          hover: '#D4B47A',
          light: '#F2E4C6',
          glow: 'rgba(198, 160, 98, 0.28)',
        },
        // Gold Alias for App.tsx compatibility
        gold: {
          100: '#F4E8CF',
          200: '#E7D2AA',
          300: '#D5B97D',
          400: '#C6A062',
          500: '#B58A52',
          600: '#9F7645',
          700: '#7F5E36',
          800: '#5E442B',
        },
        // Psychology Blue (Professional & Trust)
        psycho: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Semantic Colors (improved for psychology + astrology)
        success: '#10B981', // Green - positive, growth
        warning: '#F59E0B', // Amber - attention, gold family
        danger: '#EF4444', // Red - alert, caution
        info: '#3B82F6', // Blue - professional, trust
      },
      fontFamily: {
        sans: ['"Readex Pro"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #C6A062 0%, #D4B47A 100%)',
        'gradient-dark': 'linear-gradient(180deg, rgba(5,5,6,0) 0%, #050506 100%)',
        'gradient-glass': 'radial-gradient(circle at 50% 0%, rgba(198,160,98,0.06), transparent 62%)',
      },
      boxShadow: {
        glow: '0 0 22px -6px rgba(198, 160, 98, 0.28)',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        card: '0 12px 30px -18px rgba(0, 0, 0, 0.7)',
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
