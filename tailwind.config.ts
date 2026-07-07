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
      },
    },
  },
  plugins: [],
} satisfies Config;
