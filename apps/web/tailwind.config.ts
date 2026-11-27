import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f0ff",
          100: "#ebe2ff",
          200: "#d8c7ff",
          300: "#bea2ff",
          400: "#a47aff",
          500: "#8951f5",
          600: "#7434df",
          700: "#6128bd",
          800: "#51239a",
          900: "#431e7c"
        },
        ink: "#201936"
      },
      boxShadow: {
        soft: "0 12px 40px rgba(39, 20, 79, 0.08)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-bengali)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;