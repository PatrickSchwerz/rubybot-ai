// Design tokens extraídos de tailwind.config.js e index.html do nxredirect.site
// ZERO invenção — tudo veio do código real

import { loadFont } from "@remotion/google-fonts/Inter";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

// Cores reais do tailwind.config.js
export const C = {
  brand500: "#E50914",   // brand-500
  brand400: "#F87171",   // brand-400
  brand700: "#470000",   // brand-700
  gold400: "#FFD700",    // gold-400
  surface950: "#09090B", // surface-950
  surface900: "#18181B", // surface-900
  surface800: "#27272A", // surface-800
  bgDark: "#0B0B0B",    // landing bg (index.html)
  darkMode: "#0f0f17",  // app.css html.dark
  white: "#F5F5F5",     // text primary
  muted: "#A0A0A0",     // text secondary
  dim: "#71717A",       // zinc-500
  blue: "#3b82f6",
  purple: "#8b5cf6",
  amber: "#f59e0b",
  emerald: "#10b981",
  cyan: "#06b6d4",
  red400: "#ef4444",
  orange: "#f97316",
  // Glass card (from index.html .gc class)
  glassBg: "rgba(255,255,255,0.02)",
  glassBorder: "rgba(255,255,255,0.06)",
  // Icon ring (from .ir class)
  iconRingBg: "rgba(229,9,20,0.08)",
  iconRingBorder: "rgba(229,9,20,0.12)",
} as const;

// Pseudo-random determinístico (seed fixo)
export function sr(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// 25 partículas com seed fixo
export const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  x: (i * 137.508) % 1080,
  y: (i * 97.3) % 1920,
  size: 2 + (i % 4),
  speed: 0.3 + (i % 10) * 0.07,
  opacity: 0.3 + (i % 5) * 0.1,
  color: i % 3 === 0 ? C.brand500 : i % 3 === 1 ? C.gold400 : "rgba(255,255,255,0.4)",
}));
