import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // EngineeringExpert brand — indigo/violet, matching the PW + mockup palette
        brand: {
          50: "#eef0ff",
          100: "#e0e3ff",
          200: "#c7ccff",
          300: "#a4a9ff",
          400: "#8079fb",
          500: "#6c5ce7", // primary
          600: "#5a47d6",
          700: "#4b39b8",
          800: "#3d3094",
          900: "#352c76",
          950: "#201a45",
        },
        accent: {
          DEFAULT: "#22c55e",
          soft: "#dcfce7",
        },
        ink: {
          DEFAULT: "#0f1024",
          soft: "#3a3b54",
          muted: "#6b6c84",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f6f6fb",
          muted: "#eef0f6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(16, 16, 36, 0.08), 0 8px 24px -8px rgba(16, 16, 36, 0.10)",
        card: "0 1px 2px rgba(16,16,36,0.04), 0 8px 30px -12px rgba(16,16,36,0.12)",
        glow: "0 10px 40px -10px rgba(108, 92, 231, 0.45)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #6c5ce7 0%, #8079fb 45%, #5a47d6 100%)",
        "hero-grid":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        "spin-slow": "spin-slow 18s linear infinite",
      },
    },
  },
  plugins: [typography],
};

export default config;
