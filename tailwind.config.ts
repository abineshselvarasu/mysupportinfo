import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core semantic theme surface & ink tokens (CSS vars in globals.css)
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        well: "rgb(var(--well) / <alpha-value>)",
        hover: "rgb(var(--hover) / <alpha-value>)",
        brand: "rgb(var(--brand) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--ink-muted) / <alpha-value>)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",

        // Preserved MySupportInfo signature brand palette
        primary: "#FF8E60",
        "primary-dark": "#E87143",
        secondary: "#009E52",
        accent: "#FFC4B7",
        background: "#FAF6F0",
        "background-dark": "#00473E",
        foreground: "#002924",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1.4" }],
        "3xs": ["0.625rem", { lineHeight: "1.4" }],
        "4xs": ["0.5625rem", { lineHeight: "1.4" }],
        "fluid-hero": ["clamp(2rem, 1.25rem + 2.5vw, 3.35rem)", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
        "fluid-h1": ["clamp(1.75rem, 1.15rem + 2vw, 2.75rem)", { lineHeight: "1.12", letterSpacing: "-0.025em" }],
        "fluid-h2": ["clamp(1.375rem, 1.05rem + 1vw, 1.875rem)", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "fluid-h3": ["clamp(1.125rem, 1rem + 0.4vw, 1.375rem)", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "fluid-lead": ["clamp(1rem, 0.94rem + 0.3vw, 1.125rem)", { lineHeight: "1.6" }],
        "fluid-body": ["clamp(0.9375rem, 0.9rem + 0.2vw, 1rem)", { lineHeight: "1.65" }],
      },
      maxWidth: {
        orb: "440px",
        site: "1200px",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0, 41, 36, 0.05), 0 8px 24px -12px rgba(0, 41, 36, 0.10)",
        elevated: "0 2px 6px rgba(0, 41, 36, 0.06), 0 18px 40px -18px rgba(0, 41, 36, 0.18)",
        "brand-ring": "0 0 0 1px rgba(0, 71, 62, 0.12), 0 24px 48px -24px rgba(0, 41, 36, 0.35)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
