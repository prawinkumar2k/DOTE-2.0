/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e40af',
          light: '#3b82f6',
          dark: '#1e3a8a',
        },
        secondary: '#10b981',
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
}
