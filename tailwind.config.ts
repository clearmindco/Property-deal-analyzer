import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated) / <alpha-value>)",
        navy: "rgb(var(--color-navy) / <alpha-value>)",
        "primary-blue": "rgb(var(--color-primary-blue) / <alpha-value>)",
        "soft-blue": "rgb(var(--color-soft-blue) / <alpha-value>)",
        silver: "rgb(var(--color-silver) / <alpha-value>)",
        slate: "rgb(var(--color-slate) / <alpha-value>)",
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        success: "#2F9E68",
        warning: "#C98A1E",
        danger: "#C24545",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
