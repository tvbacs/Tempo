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
        secondary: "#FC655A",
        "primary-dark": "#7A1822",
        "bg-primary": "#000000",
        "bg-surface": "#121217",
        "bg-card": "#181820",
        "bg-card-hover": "#22222D",
        "bg-player": "#0B0B0E",
        "text-muted": "#606070",
        "text-secondary": "#8E8E93",
      },
      borderRadius: {
        none: "0px",
        xs: "4px",
        sm: "6px",
        md: "8px",
        DEFAULT: "8px",
        card: "8px",
        lg: "10px",
        xl: "10px",
        "2xl": "10px",
        "3xl": "12px",
        full: "9999px",
      },
      backgroundImage: {
        'tempo-gradient': 'linear-gradient(135deg, #FC475C 0%, #FC655A 100%)',
        'tempo-gradient-subtle': 'linear-gradient(135deg, rgba(252,71,92,0.2) 0%, rgba(252,101,90,0.2) 100%)',
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
}
