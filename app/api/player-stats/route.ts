// app/api/player-stats/route.ts
// Fetches player season averages from ESPN's unofficial (but public) statistics API.
// ESPN uses slightly different team abbreviations, so we normalise them to the
// same tricodes used by the NBA CDN (NYK, GSW, NOP, SAS, UTA, WAS).
// Data is cached for 24 hours. Returns ~60KB of JSON so the browser payload
// stays small even though we fetch all 560 qualified players.

import { NextResponse } from 'next/server';

// Map ESPN team abbreviations → NBA tricode
const ESPN_TO_NBA: Record<string, string> = {
  GS: 'GSW', NO: 'NOP', NY: 'NYK', SA: 'SAS', UTAH: 'UTA', WSH: 'WAS',
};

function normalise(espnTri: string): string {
  return ESPN_TO_NBA[espnTri] ?? espnTri;
}

export type PlayerStat = {
  id: string;
  name: string;
  tricode: string;
  gamesPlayed: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  fgPct: number;
  threePct: number;
  stl: number;
  blk: number;
};

// ESPN stat positions within each named category's `totals` array
// Verified against a live response (2025-26 season):
//   general  → [0]=GP, [1]=MIN/g, [11]=REB/g
//   offensive→ [0]=PTS/g, [3]=FG%, [6]=3P%, [10]=AST/g
//   defensive→ [0]=STL/g, [1]=BLK/g
function extractStats(categories: { name: string; totals: string[] }[]): Omit<PlayerStat, 'id' | 'name' | 'tricode'> | null {
  const byName: Record<string, string[]> = {};
  for (const c of categories) byName[c.name] = c.totals ?? [];

  const gen = byName['general'] ?? [];
  const off = byName['offensive'] ?? [];
  const dfn = byName['defensive'] ?? [];

  const gp = parseInt(gen[0] ?? '0', 10);
  if (!gp) return null; // skip players with 0 games

  return {
    gamesPlayed: gp,
    min: parseFloat(gen[1] ?? '0'),
    reb: parseFloat(gen[11] ?? '0'),
    pts: parseFloat(off[0] ?? '0'),
    fgPct: parseFloat(off[3] ?? '0'),
    threePct: parseFloat(off[6] ?? '0'),
    ast: parseFloat(off[10] ?? '0'),
    stl: parseFloat(dfn[0] ?? '0'),
    blk: parseFloat(dfn[1] ?? '0'),
  };
}

async function fetchPage(page: number): Promise<PlayerStat[]> {
  const url = `http://site.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?contentorigin=espn&isqualified=true&lang=en&region=us&season=2025&seasontype=2&limit=200&page=${page}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return [];

  const data = await res.json();
  const athletes: {
    athlete: { id: string; displayName: string; teamShortName?: string };
    categories: { name: string; totals: string[] }[];
  }[] = data?.athletes ?? [];

  const results: PlayerStat[] = [];
  for (const a of athletes) {
    const stats = extractStats(a.categories);
    if (!stats) continue;
    results.push({
      id: a.athlete.id,
      name: a.athlete.displayName,
      tricode: normalise(a.athlete.teamShortName ?? ''),
      ...stats,
    });
  }
  return results;
}

export async function GET() {
  try {
    // Fetch all 3 pages in parallel
    const [p1, p2, p3] = await Promise.all([
      fetchPage(1),
      fetchPage(2),
      fetchPage(3),
    ]);

    const allPlayers = [...p1, ...p2, ...p3];

    // Group by team tricode for fast client-side lookup
    const byTeam: Record<string, PlayerStat[]> = {};
    for (const p of allPlayers) {
      if (!byTeam[p.tricode]) byTeam[p.tricode] = [];
      byTeam[p.tricode].push(p);
    }

    // Sort each team's players by PPG descending
    for (const tri of Object.keys(byTeam)) {
      byTeam[tri].sort((a, b) => b.pts - a.pts);
    }

    return NextResponse.json({ byTeam });
  } catch (err) {
    console.error('player-stats error:', err);
    return NextResponse.json({ error: 'Failed to load player stats' }, { status: 500 });
  }
}
