/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'peys': {
          DEFAULT: '#6C63FF',
          dark: '#5B52E0',
          light: '#8B85FF',
        }
      }
    },
  },
  plugins: [],
}
