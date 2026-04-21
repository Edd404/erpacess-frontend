/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        apple: {
          blue:    '#0071E3',
          'blue-dark': '#0058B3',
          'blue-light': '#EAF3FF',
          green:   '#30D158',
          red:     '#FF3B30',
          amber:   '#FF9F0A',
          gray:    '#1D1D1F',
          'gray-2': '#6E6E73',
          'gray-3': '#AEAEB2',
          'bg':    '#F5F5F7',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        'apple': '12px',
        'apple-sm': '8px',
        'apple-xs': '6px',
      },
      boxShadow: {
        'apple': '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
        'apple-lg': '0 4px 24px rgba(0,0,0,0.10)',
        'apple-xl': '0 8px 48px rgba(0,0,0,0.14)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.97)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
