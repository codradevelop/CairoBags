import { breakpoints } from "./src/theme/breakpoints.js";
import { spacing } from "./src/theme/spacing.js";
import { fontFamily, fontSize } from "./src/theme/typography.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#111111",
          secondary: "#EAE4D8",
          background: "#F5F1E8",
          border: "#D8D0C2",
          text: "#111111",
          muted: "#666666",
          surface: "#FFFFFF",
          accent: "#C9A962",
          "accent-muted": "#E8D5A3",
          "accent-deep": "#A8853E",
          "surface-2": "#F9F7F3",
          "surface-dark": "#1E1C19",
          "border-subtle": "#EDE8E0",
        },
        gold: {
          50: "#FEFBF0",
          100: "#FDF4D3",
          200: "#FAE8A0",
          300: "#F5D05A",
          400: "#E8B93A",
          500: "#C9A962",
          600: "#A8853E",
          700: "#7D6027",
          800: "#5A4318",
          900: "#3A2B0D",
        },
      },
      fontFamily,
      fontSize,
      spacing,
      screens: breakpoints,
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "var(--cb-shadow-elevated)",
        card: "var(--cb-shadow-card)",
        modal: "var(--cb-shadow-modal)",
        toast: "var(--cb-shadow-dropdown)",
        "card-hover": "var(--cb-shadow-hover)",
        "glow-gold": "var(--cb-shadow-glow)",
        "glow-sm": "var(--cb-shadow-glow)",
        inner: "inset 0 1px 4px rgba(17, 17, 17, 0.04)",
        "inner-gold": "inset 0 0 0 1px rgba(201, 169, 98, 0.25)",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "200ms",
        slow: "350ms",
        slower: "500ms",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "ease-out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(0.75rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-0.75rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-1.5rem)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "blur-in": {
          from: { opacity: "0", filter: "blur(8px)" },
          to: { opacity: "1", filter: "blur(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "border-pulse": {
          "0%, 100%": { borderColor: "rgba(201, 169, 98, 0.3)" },
          "50%": { borderColor: "rgba(201, 169, 98, 0.7)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        "reveal-width": {
          from: { width: "0" },
          to: { width: "100%" },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "fade-out": "fade-out 200ms ease-in",
        "slide-up": "slide-up 350ms cubic-bezier(0.19, 1, 0.22, 1)",
        "slide-down": "slide-down 350ms cubic-bezier(0.19, 1, 0.22, 1)",
        "slide-in-left": "slide-in-left 400ms cubic-bezier(0.19, 1, 0.22, 1)",
        "scale-in": "scale-in 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "blur-in": "blur-in 400ms ease-out",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
        "border-pulse": "border-pulse 2s ease-in-out infinite",
        spin: "spin 0.8s linear infinite",
      },
      maxWidth: {
        container: "88rem",
        "container-wide": "96rem",
        prose: "65ch",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
      letterSpacing: {
        luxury: "0.28em",
        wide: "0.12em",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #C9A962 0%, #E8D5A3 35%, #C9A962 65%, #A8853E 100%)",
        "gold-shimmer": "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%), linear-gradient(135deg, #C9A962 0%, #E8D5A3 50%, #A8853E 100%)",
        "dark-surface": "linear-gradient(180deg, #1E1C19 0%, #111111 100%)",
        "hero-radial": "radial-gradient(ellipse at 70% 50%, rgba(201, 169, 98, 0.18) 0%, transparent 65%)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
