/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        shift: {
          primary: '#6366f1', // Indigo 500
          dark: '#4f46e5',
          light: '#eef2ff'
        }
      }
    },
  },
  plugins: [],
}