import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './shared/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#06080d',
        surface: {
          DEFAULT: '#0a0f18',
          2: '#0d1420',
          3: '#111a28',
        },
        edge: '#1b2637',
        bright: '#e8f0fb',
        muted: '#8b9cb5',
        accent: {
          DEFAULT: '#22d3ee',
          dim: '#0e7490',
        },
        sev: {
          critical: '#fb5f76',
          high: '#fb923c',
          medium: '#f5c451',
          low: '#3fb9f6',
          info: '#8fa3bd',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 40px -24px rgba(0,0,0,0.8)',
        glow: '0 0 0 1px rgba(34,211,238,0.25), 0 8px 32px -12px rgba(34,211,238,0.35)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeSlide: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '80%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        rowFlash: {
          '0%': { backgroundColor: 'rgba(34,211,238,0.10)' },
          '100%': { backgroundColor: 'transparent' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'fade-slide': 'fadeSlide 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        'row-flash': 'rowFlash 1.6s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
