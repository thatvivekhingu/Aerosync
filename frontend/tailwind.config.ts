import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#028090",
          hover: "#006876",
          light: "#e0f2f1",
          glow: "rgba(2, 128, 144, 0.25)",
        },
        teal: {
          accent: "#00a896",
          emerald: "#02c39a",
        },
        slate: {
          850: "#152033",
          950: "#0b1329",
        },
        cadastral: {
          building: "#ff9800",
          road: "#ffeb3b",
          water: "#00a6fb",
          greenery: "#2ec4b6",
          alert: "#e63946",
          verified: "#10b981",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        heading: ["var(--font-outfit)", "Outfit", "sans-serif"],
      },
      boxShadow: {
        'glow-primary': '0 4px 20px rgba(2, 128, 144, 0.3)',
        'glow-emerald': '0 4px 20px rgba(2, 195, 154, 0.3)',
        'premium': '0 12px 35px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
};
export default config;
