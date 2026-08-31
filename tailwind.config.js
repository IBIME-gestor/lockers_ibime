/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta inspirada en placas de locker metálicas y pizarrones escolares
        panel: {
          50: '#f4f6f6',
          100: '#e3e9ea',
          200: '#c3d0d2',
          300: '#9bb0b3',
          400: '#6f8b8f',
          500: '#4f6d71',
          600: '#3c565a',
          700: '#2f4548',
          800: '#28393b',
          900: '#1c2829',
        },
        brass: {
          400: '#c9a15a',
          500: '#b5893f',
          600: '#96702f',
        },
        alert: '#b3492f',
        ok: '#3f7d5c',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
