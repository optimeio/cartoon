/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Outfit', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        purple: { DEFAULT: '#a855f7', dark: '#7c3aed', light: '#c084fc' },
        indigo: { DEFAULT: '#6366f1' },
        cyan: { DEFAULT: '#06b6d4' },
        pink: { DEFAULT: '#ec4899' },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
