import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blush: {
          50: "#fff5f6",
          100: "#ffe4e8",
          200: "#fecdd6",
          300: "#fda4b3",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        cream: "#fffaf6",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Pretendard",
          "Apple SD Gothic Neo",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 4px 20px -6px rgba(244, 63, 94, 0.15)",
        soft: "0 2px 12px -4px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
