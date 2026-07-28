// INPUT: Wiki color_token strings from API/static data.
// OUTPUT: Safe inline CSS gradient style for Wiki cards without dynamic Tailwind class generation.
// POS: Wiki gradient helper; update components/wiki/FOLDER.md when this file changes.

import type { CSSProperties } from "react";

type GradientStopKind = "from" | "via" | "to";

interface GradientStop {
  kind: GradientStopKind;
  color: string;
}

const DEFAULT_TOKEN = "from-gold-500/20 via-gold-500/5 to-transparent";

const STOP_ORDER: Record<GradientStopKind, number> = {
  from: 0,
  via: 1,
  to: 2,
};

const STOP_CLASS_RE =
  /^(from|via|to)-([a-z]+(?:-\d{2,3})?|black|white|transparent)(?:\/(\d{1,3}))?$/;

const COLOR_VALUES: Record<string, string> = {
  transparent: "transparent",
  black: "#000000",
  white: "#ffffff",
  "slate-200": "#e2e8f0",
  "slate-300": "#cbd5e1",
  "slate-500": "#64748b",
  "slate-600": "#475569",
  "slate-700": "#334155",
  "slate-800": "#1e293b",
  "slate-900": "#0f172a",
  "gray-600": "#4b5563",
  "gray-800": "#1f2937",
  "stone-700": "#44403c",
  "amber-400": "#fbbf24",
  "amber-500": "#f59e0b",
  "amber-600": "#d97706",
  "amber-900": "#78350f",
  "yellow-400": "#facc15",
  "yellow-500": "#eab308",
  "yellow-600": "#ca8a04",
  "orange-300": "#fdba74",
  "orange-500": "#f97316",
  "orange-600": "#ea580c",
  "orange-700": "#c2410c",
  "red-500": "#ef4444",
  "red-600": "#dc2626",
  "red-700": "#b91c1c",
  "red-800": "#991b1b",
  "red-900": "#7f1d1d",
  "rose-300": "#fda4af",
  "rose-600": "#e11d48",
  "rose-900": "#881337",
  "pink-300": "#f9a8d4",
  "pink-400": "#f472b6",
  "pink-500": "#ec4899",
  "pink-800": "#9d174d",
  "purple-400": "#c084fc",
  "purple-500": "#a855f7",
  "purple-600": "#9333ea",
  "purple-800": "#6b21a8",
  "violet-400": "#a78bfa",
  "violet-600": "#7c3aed",
  "violet-800": "#5b21b6",
  "fuchsia-400": "#e879f9",
  "indigo-400": "#818cf8",
  "indigo-500": "#6366f1",
  "indigo-600": "#4f46e5",
  "indigo-800": "#3730a3",
  "indigo-900": "#312e81",
  "blue-200": "#bfdbfe",
  "blue-300": "#93c5fd",
  "blue-400": "#60a5fa",
  "blue-500": "#3b82f6",
  "blue-600": "#2563eb",
  "blue-700": "#1d4ed8",
  "cyan-400": "#22d3ee",
  "cyan-500": "#06b6d4",
  "sky-400": "#38bdf8",
  "teal-400": "#2dd4bf",
  "teal-500": "#14b8a6",
  "teal-600": "#0d9488",
  "emerald-500": "#10b981",
  "emerald-600": "#059669",
  "emerald-700": "#047857",
  "emerald-900": "#064e3b",
  "green-500": "#22c55e",
  "gold-500": "#B58A52",
};

const applyAlpha = (color: string, alphaPercent?: string) => {
  if (!alphaPercent || color === "transparent") return color;

  const alpha = Math.min(Math.max(Number(alphaPercent), 0), 100) / 100;
  const hex = color.replace("#", "");
  if (hex.length !== 6 || Number.isNaN(alpha)) return color;

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const parseStop = (classToken: string): GradientStop | null => {
  const match = classToken.match(STOP_CLASS_RE);
  if (!match) return null;

  const [, kind, colorToken, alphaPercent] = match;
  const color = COLOR_VALUES[colorToken];
  if (!color) return null;

  return {
    kind: kind as GradientStopKind,
    color: applyAlpha(color, alphaPercent),
  };
};

const parseStops = (token: string) =>
  token
    .split(/\s+/)
    .map(parseStop)
    .filter((stop): stop is GradientStop => Boolean(stop))
    .sort((a, b) => STOP_ORDER[a.kind] - STOP_ORDER[b.kind]);

export const getWikiGradientStyle = (token?: string): CSSProperties => {
  const stops = parseStops(token || DEFAULT_TOKEN);
  const safeStops = stops.length >= 2 ? stops : parseStops(DEFAULT_TOKEN);

  return {
    backgroundImage: `linear-gradient(135deg, ${safeStops
      .map((stop) => stop.color)
      .join(", ")})`,
  };
};
