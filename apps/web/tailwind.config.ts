import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#FF2E8B",
          "primary-dark": "#E62079",
          trust: "#2563EB",
          "trust-soft": "#EFF6FF",
          "trust-border": "#BFDBFE",
        },
        ui: {
          bg: "#F7F7F8",
          surface: "#FFFFFF",
          text: "#111111",
          muted: "#6B7280",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      fontSize: {
        h1: ["48px", { lineHeight: "1.2" }],
        h2: ["36px", { lineHeight: "1.25" }],
        h3: ["28px", { lineHeight: "1.3" }],
        body: ["16px", { lineHeight: "1.5" }],
        small: ["14px", { lineHeight: "1.5" }],
      },
      spacing: {
        1: "4px",
        2: "8px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
      },
    },
  },
  plugins: [],
} satisfies Config;
