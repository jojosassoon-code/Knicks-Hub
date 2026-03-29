// lib/teamColors.ts
// Single source of truth for all 30 NBA team colors.
// Each team has a primary and secondary color.
// getOpponentColor() applies smart contrast logic so the opponent side
// never looks too similar to Knicks blue (#006BB6, hue ≈ 205°).

type TeamColorEntry = { primary: string; secondary: string };

export const TEAM_COLOR_MAP: Record<string, TeamColorEntry> = {
  ATL: { primary: '#E03A3E', secondary: '#C1D32F' },
  BOS: { primary: '#007A33', secondary: '#BA9653' },
  BKN: { primary: '#C4CED4', secondary: '#000000' }, // black → use silver so it's visible
  CHA: { primary: '#1D1160', secondary: '#00788C' },
  CHI: { primary: '#CE1141', secondary: '#000000' },
  CLE: { primary: '#860038', secondary: '#FDBB30' },
  DAL: { primary: '#00538C', secondary: '#B8C4CA' }, // primary ≈ hue 205 → secondary silver
  DEN: { primary: '#0E2240', secondary: '#FEC524' }, // primary ≈ hue 218 → secondary gold
  DET: { primary: '#C8102E', secondary: '#1D42BA' },
  GSW: { primary: '#1D428A', secondary: '#FFC72C' }, // primary ≈ hue 220 → secondary gold
  HOU: { primary: '#CE1141', secondary: '#000000' },
  IND: { primary: '#002D62', secondary: '#FDBB30' }, // primary ≈ hue 213 → secondary gold
  LAC: { primary: '#C8102E', secondary: '#1D428A' },
  LAL: { primary: '#552583', secondary: '#FDB927' },
  MEM: { primary: '#5D76A9', secondary: '#F5B722' }, // primary ≈ hue 220 → secondary gold
  MIA: { primary: '#98002E', secondary: '#F9A01B' },
  MIL: { primary: '#00471B', secondary: '#EEE1C6' },
  MIN: { primary: '#0C2340', secondary: '#78BE20' }, // primary ≈ hue 214 → secondary green
  NOP: { primary: '#0C2340', secondary: '#C8102E' }, // primary ≈ hue 215 → secondary red
  NYK: { primary: '#006BB6', secondary: '#F58426' },
  OKC: { primary: '#007AC1', secondary: '#EF3B24' }, // primary ≈ hue 202 → secondary orange
  ORL: { primary: '#0077C0', secondary: '#C4CED4' }, // primary ≈ hue 203 → secondary silver
  PHI: { primary: '#006BB6', secondary: '#ED174C' }, // primary = NYK blue → secondary red
  PHX: { primary: '#E56020', secondary: '#1D1160' },
  POR: { primary: '#E03A3E', secondary: '#000000' },
  SAC: { primary: '#5A2D81', secondary: '#63727A' },
  SAS: { primary: '#C4CED4', secondary: '#000000' },
  TOR: { primary: '#CE1141', secondary: '#000000' },
  UTA: { primary: '#002B5C', secondary: '#F9A01B' }, // primary ≈ hue 213 → secondary gold
  WAS: { primary: '#002B5C', secondary: '#E31837' }, // primary ≈ hue 213 → secondary red
};

// ── Contrast logic ────────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, ((max - min) / (l > 0.5 ? 2 - max - min : max + min)) * 100, l * 100];
}

function hueDiff(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2);
  return Math.min(d, 360 - d);
}

const NYK_HUE = 205; // Knicks blue hue
const CLASH_THRESHOLD = 40; // degrees

function isClashing(hex: string): boolean {
  try {
    const [hue, sat, light] = hexToHsl(hex);
    // Very dark colors (near black) are also unusable on dark bg
    if (light < 12) return true;
    // Very low saturation = gray/white, doesn't clash by hue but may look washed out
    if (sat < 10) return false;
    return hueDiff(hue, NYK_HUE) <= CLASH_THRESHOLD;
  } catch {
    return false;
  }
}

/**
 * Returns the best display color for an opponent team.
 * Falls back to secondary if primary clashes with Knicks blue.
 * Falls back to neutral gray if both clash.
 */
export function getOpponentColor(tricode: string): string {
  const entry = TEAM_COLOR_MAP[tricode];
  if (!entry) return '#C4CED4';

  if (!isClashing(entry.primary)) return entry.primary;
  if (entry.secondary && !isClashing(entry.secondary)) return entry.secondary;
  return '#C4CED4'; // neutral fallback
}

/** Raw primary color, no contrast checking — use only where needed. */
export function getPrimaryColor(tricode: string): string {
  return TEAM_COLOR_MAP[tricode]?.primary ?? '#888888';
}
