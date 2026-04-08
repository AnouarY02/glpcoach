import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: "#1B4332",
          50: "#F0F7F4",
          100: "#D4EDE3",
          500: "#2D6A4F",
          600: "#1B4332",
          700: "#143526",
          800: "#0D2218",
          900: "#071109",
        },
        orange: {
          DEFAULT: "#F97316",
          50: "#FFF7ED",
          100: "#FFEDD5",
          500: "#F97316",
          600: "#EA6C0A",
        },
        cream: {
          DEFAULT: "#FAFAF8",
          50: "#FAFAF8",
          100: "#F5F5F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
