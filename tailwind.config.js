/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#171717',
        surfaceHover: '#262626',
        primary: '#8b5cf6', // Violet 500
        primaryHover: '#7c3aed', // Violet 600
        textMain: '#f5f5f5',
        textMuted: '#a3a3a3',
      }
    },
  },
  plugins: [],
}
