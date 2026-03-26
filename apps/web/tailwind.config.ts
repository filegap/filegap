import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "rgb(var(--color-accent-primary-rgb) / <alpha-value>)",
          "primary-dark": "rgb(var(--color-accent-primary-hover-rgb) / <alpha-value>)",
          trust: "rgb(var(--color-trust-primary-rgb) / <alpha-value>)",
          "trust-soft": "rgb(var(--color-trust-soft-rgb) / <alpha-value>)",
          "trust-border": "rgb(var(--color-trust-border-rgb) / <alpha-value>)",
        },
        ui: {
          bg: "rgb(var(--color-bg-canvas-rgb) / <alpha-value>)",
          surface: "rgb(var(--color-bg-surface-rgb) / <alpha-value>)",
          text: "rgb(var(--color-text-primary-rgb) / <alpha-value>)",
          muted: "rgb(var(--color-text-secondary-rgb) / <alpha-value>)",
          border: "rgb(var(--color-border-default-rgb) / <alpha-value>)",
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
