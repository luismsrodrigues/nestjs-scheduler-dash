/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
        },
      },
      keyframes: {
        pulse_dot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        pulse_dot: 'pulse_dot 1.4s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease forwards',
        'slide-in': 'slide-in 0.25s ease forwards',
      },
    },
  },
  plugins: [],
};
