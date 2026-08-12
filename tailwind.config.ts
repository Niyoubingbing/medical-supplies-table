import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Claude / warm-paper palette
        paper: {
          50: "#FCFAF7",
          100: "#FAF8F5",
          200: "#F2EDE4",
          300: "#E5DDCC",
        },
        ink: {
          900: "#1F1410",
          800: "#2B1810",
          700: "#3F2A1E",
          600: "#5C4232",
          500: "#7A5A48",
          400: "#9C7A66",
        },
        accent: {
          DEFAULT: "#C96442",
          hover: "#B55636",
          soft: "#F4D7C7",
        },
        line: "#E5DDCC",
      },
      fontFamily: {
        serif: [
          "Source Serif 4",
          "Source Serif Pro",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(43, 24, 16, 0.04), 0 8px 24px rgba(43, 24, 16, 0.06)",
        soft: "0 1px 2px rgba(43, 24, 16, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
