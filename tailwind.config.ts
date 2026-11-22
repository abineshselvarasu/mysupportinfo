import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#FF8E60",
        "primary-dark": "#FF7D54",
        "secondary": "#009E52",
        "accent": "#FFC4B7",
        "background": "#FAF6F0",
        "background-dark": "#00473E",
        "foreground": "#002924",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        mono: ["monospace"],
      },
      fontSize: {
        "2xs":        ["11px", { lineHeight: "1.4" }],
        "3xs":        ["10px", { lineHeight: "1.4" }],
        "4xs":        ["9px",  { lineHeight: "1.4" }],
        "5xs":        ["8px",  { lineHeight: "1.4" }],
        "display":    ["5.5rem", { lineHeight: "1" }],
        "display-lg": ["7rem",   { lineHeight: "1" }],
        // Loopio-inspired fluid clamp typography scale
        "fluid-hero": ["clamp(2.25rem, 1.25rem + 3.33vw, 3.75rem)", { lineHeight: "1.12", letterSpacing: "-0.02em" }],
        "fluid-h1":   ["clamp(2rem, 1rem + 2.67vw, 3.25rem)",       { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "fluid-h2":   ["clamp(1.5rem, 0.85rem + 1.8vw, 2.375rem)",   { lineHeight: "1.2",  letterSpacing: "-0.015em" }],
        "fluid-h3":   ["clamp(1.25rem, 0.95rem + 0.8vw, 1.625rem)",  { lineHeight: "1.3",  letterSpacing: "-0.01em" }],
        "fluid-lead": ["clamp(1.125rem, 1rem + 0.33vw, 1.25rem)",    { lineHeight: "1.55" }],
        "fluid-body": ["clamp(1rem, 0.925rem + 0.2vw, 1.125rem)",    { lineHeight: "1.6" }],
      },
      spacing: {
        // Loopio-inspired fluid padding and section spacing
        "fluid-xs": "clamp(0.75rem, 0.5rem + 0.8vw, 1.25rem)",
        "fluid-sm": "clamp(1rem, 0.65rem + 1.2vw, 1.75rem)",
        "fluid":    "clamp(2.5rem, 1.5rem + 2.5vw, 4rem)",
        "fluid-lg": "clamp(3.5rem, 2rem + 4.5vw, 6.25rem)",
        "fluid-xl": "clamp(4.5rem, 2.5rem + 6vw, 8.5rem)",
      },
      letterSpacing: {
        "micro":      "0.18em",
        "ui":         "0.2em",
        "ui-wide":    "0.25em",
        "ui-wider":   "0.3em",
        "ui-widest":  "0.35em",
      },
      maxWidth: {
        "orb":  "560px",
        "site": "1200px",
      },
      minHeight: {
        "card": "260px",
      },
      scale: {
        "101": "1.01",
        "102": "1.02",
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "none": "0",
        "sm": "0.125rem",
        "md": "0.375rem",
        "lg": "0.5rem",
        "xl": "1rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem", // 28px Loopio container radius
        "4xl": "2rem",    // 32px
      },
      boxShadow: {
        "block":          "4px 4px 0px 0px #00473E",
        "block-sm":       "2px 2px 0px 0px #00473E",
        "block-lg":       "8px 8px 0px 0px #00473E",
        // Loopio-inspired soft diffuse elevation shadows
        "soft":           "0px 4px 40px rgba(0, 0, 0, 0.08)",
        "soft-sm":        "0px 2px 16px rgba(0, 0, 0, 0.06)",
        "soft-lg":        "0px 8px 50px rgba(0, 0, 0, 0.12)",
        "soft-card":      "0px 4px 24px rgba(0, 71, 62, 0.08)",
        "glow-green":     "0 0 30px rgba(0,158,82,0.4)",
        "glow-green-md":  "0 0 30px rgba(0,158,82,0.3)",
        "glow-green-sm":  "0 0 20px rgba(0,158,82,0.4)",
        "glow-orange":    "0 0 30px rgba(255,142,96,0.4)",
        "glow-orange-md": "0 0 30px rgba(255,142,96,0.3)",
        "glow-orange-sm": "0 0 20px rgba(255,142,96,0.4)",
        "glow-red":       "0 0 30px rgba(239,68,68,0.4)",
        "glow-red-sm":    "0 0 20px rgba(239,68,68,0.4)",
      },
      dropShadow: {
        "orange": "0 2px 4px rgba(255,142,96,0.3)",
      },
      transitionProperty: {
        "max-height": "max-height",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
