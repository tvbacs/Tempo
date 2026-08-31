/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FC475C",
        "primary-hover": "#FC655A",
        "bg-main": "#0B0B0E",
        "bg-sidebar": "#121217",
        "bg-card": "#181820",
        "bg-card-hover": "#22222D",
        "bg-player": "#14141A",
        "text-muted": "#606070",
        "text-secondary": "#A0A0B0",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
}
