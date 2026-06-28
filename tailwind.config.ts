import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#FFCE00", soft: "#FFE680", wash: "#FFF6CF", cream: "#FFFBEC" },
        ink: { DEFAULT: "#1A1A1A", black: "#111" },
        line: "#06C755",
      },
      fontFamily: {
        display: ["var(--font-baloo)", "sans-serif"],
        sans: ["var(--font-noto)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
