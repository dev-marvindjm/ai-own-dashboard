/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: { DEFAULT: '#0a0a0f', hover: '#1a1a2e', active: '#252540' },
        surface: { DEFAULT: '#f8f9fc', card: '#ffffff', muted: '#f1f3f9' },
        trading: {
          win: '#22c55e',
          loss: '#ef4444',
          pending: '#f59e0b',
          info: '#3b82f6',
          template: '#8b5cf6',
        },
        border: { DEFAULT: '#e5e7eb', light: '#f0f0f5' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        sidebar: '4px 0 24px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
