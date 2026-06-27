import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        flc: {
          primary: "var(--color-primary)",
          "primary-strong": "var(--color-primary-strong)",
          accent: "var(--color-accent-warm)",
          surface: "var(--color-surface)",
          panel: "var(--color-panel)",
          "panel-muted": "var(--color-panel-muted)",
          border: "var(--color-border)",
          text: "var(--color-text)",
          "text-muted": "var(--color-text-muted)",
          success: "var(--color-success)",
          warning: "var(--color-warning)",
          danger: "var(--color-danger)"
        }
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        lg: "var(--radius-lg)",
        md: "var(--radius-md)"
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        subtle: "var(--shadow-subtle)"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fade-in 420ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
