import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#B7222E",
          "red-dark": "#8E1B25",
          ink: "#14171A",
          paper: "#F7F5F2",
        },
        surface: {
          DEFAULT: "#F7F5F2",
          raised: "#FFFFFF",
          dark: "var(--surface-dark, #14171A)",
          "dark-raised": "var(--surface-dark-raised, #1C2024)",
        },
        line: {
          DEFAULT: "#D8D6D2",
          dark: "var(--line-dark, #2C3136)",
        },
        ink: {
          DEFAULT: "#14171A",
          secondary: "#6B7075",
          dark: "var(--ink-dark, #F2F1EE)",
          "dark-secondary": "var(--ink-dark-secondary, #9BA0A6)",
        },
        status: {
          positive: "#5B8C6E",
          warning: "#B98A4E",
        },
      },
      fontFamily: {
        serif: ["var(--font-headline)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["2.125rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        "display-sm": ["1.625rem", { lineHeight: "2rem", fontWeight: "700" }],
        "headline-l": ["1.5rem", { lineHeight: "1.875rem", fontWeight: "700" }],
        "headline-m": ["1.125rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        "headline-s": ["0.9375rem", { lineHeight: "1.25rem", fontWeight: "600" }],
        body: ["1.0625rem", { lineHeight: "1.75rem", fontWeight: "400" }],
        meta: ["0.75rem", { lineHeight: "1rem", fontWeight: "500" }],
        caption: ["0.8125rem", { lineHeight: "1.125rem", fontWeight: "400" }],
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "2px",
        full: "9999px",
      },
      maxWidth: {
        page: "1320px",
        measure: "68ch",
      },
      typography: () => ({
        DEFAULT: {
          css: {
            maxWidth: "68ch",
            fontSize: "1.0625rem",
            lineHeight: "1.75rem",
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
