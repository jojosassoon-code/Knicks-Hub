// app/api/nba-stats/route.ts
// Next.js Route Handler — acts as a server-side proxy for NBA data.
// The CDN schedule JSON is ~10MB so we process it here and return only
// the computed stats the client needs, keeping the browser payload small.

import { NextResponse } from 'next/server';

const CDN_URL =
  'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';

const EAST = new Set([
  'ATL','BOS','BKN','CHA','CHI','CLE',
  'DET','IND','MIA','MIL','NYK','ORL',
  'PHI','TOR','WAS',
]);

export type TeamStat = {
  id: number;
  city: string;
  name: string;
  tricode: string;
  conference: 'East' | 'West';
  wins: number;
  losses: number;
  gamesPlayed: number;
  ppg: number;
  papg: number;
  netRating: number;
  winPct: number;
  homeRecord: { w: number; l: number };
  awayRecord: { w: number; l: number };
  last10: { w: number; l: number };
  seed: number;
};

export type GameSummary = {
  date: string;
  homeTricode: string;
  awayTricode: string;
  homeScore: number;
  awayScore: number;
};

export async function GET() {
  try {
    const res = await fetch(CDN_URL, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'CDN unavailable' }, { status: 502 });
    }

    const data = await res.json();
    const gameDates: { games: Record<string, unknown>[] }[] =
      data?.leagueSchedule?.gameDates ?? [];

    // Collect all regular-season completed games, sorted chronologically
    type RawGame = {
      gameId: string;
      gameStatus: number;
      gameDateEst: string;
      gameDateTimeUTC: string;
      homeTeam: { teamId: number; teamCity: string; teamName: string; teamTricode: string; score: number };
      awayTeam: { teamId: number; teamCity: string; teamName: string; teamTricode: string; score: number };
    };

    const completed: RawGame[] = [];
    for (const gd of gameDates) {
      for (const g of gd.games as RawGame[]) {
        if (g.gameId.startsWith('002') && g.gameStatus === 3) {
          completed.push(g);
        }
      }
    }
    completed.sort((a, b) =>
      a.gameDateTimeUTC.localeCompare(b.gameDateTimeUTC)
    );

    // Accumulate per-team stats
    type Acc = {
      id: number; city: string; name: string;
      ppgSum: number; papgSum: number;
      wins: number; losses: number;
      homeW: number; homeL: number;
      awayW: number; awayL: number;
      log: boolean[]; // true = win, in date order
    };
    const acc = new Map<string, Acc>();

    for (const g of completed) {
      for (const [team, isHome] of [
        [g.homeTeam, true],
        [g.awayTeam, false],
      ] as [RawGame['homeTeam'], boolean][]) {
        const tri = team.teamTricode;
        if (!acc.has(tri)) {
          acc.set(tri, {
            id: team.teamId, city: team.teamCity, name: team.teamName,
            ppgSum: 0, papgSum: 0,
            wins: 0, losses: 0,
            homeW: 0, homeL: 0,
            awayW: 0, awayL: 0,
            log: [],
          });
        }
        const s = acc.get(tri)!;
        const scored  = isHome ? g.homeTeam.score : g.awayTeam.score;
        const allowed = isHome ? g.awayTeam.score : g.homeTeam.score;
        const won = scored > allowed;
        s.ppgSum  += scored;
        s.papgSum += allowed;
        s.log.push(won);
        if (won) { s.wins++; isHome ? s.homeW++ : s.awayW++; }
        else     { s.losses++; isHome ? s.homeL++ : s.awayL++; }
      }
    }

    // Build final team stats
    const teams: Record<string, TeamStat> = {};
    for (const [tri, s] of acc) {
      const gp = s.wins + s.losses;
      const last10 = s.log.slice(-10);
      const l10w = last10.filter(Boolean).length;
      teams[tri] = {
        id: s.id, city: s.city, name: s.name, tricode: tri,
        conference: EAST.has(tri) ? 'East' : 'West',
        wins: s.wins, losses: s.losses, gamesPlayed: gp,
        ppg: gp > 0 ? parseFloat((s.ppgSum / gp).toFixed(1)) : 0,
        papg: gp > 0 ? parseFloat((s.papgSum / gp).toFixed(1)) : 0,
        netRating: gp > 0 ? parseFloat(((s.ppgSum - s.papgSum) / gp).toFixed(1)) : 0,
        winPct: gp > 0 ? s.wins / gp : 0,
        homeRecord: { w: s.homeW, l: s.homeL },
        awayRecord: { w: s.awayW, l: s.awayL },
        last10: { w: l10w, l: 10 - l10w },
        seed: 0, // filled below
      };
    }

    // Assign seeds within each conference
    for (const conf of ['East', 'West'] as const) {
      const confTeams = Object.values(teams)
        .filter(t => t.conference === conf)
        .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
      confTeams.forEach((t, i) => { teams[t.tricode].seed = i + 1; });
    }

    // NYK games for head-to-head lookup (client filters by opponent tricode)
    const knicksGames: GameSummary[] = completed
      .filter(
        g =>
          g.homeTeam.teamTricode === 'NYK' ||
          g.awayTeam.teamTricode === 'NYK'
      )
      .map(g => ({
        date: g.gameDateEst.slice(0, 10),
        homeTricode: g.homeTeam.teamTricode,
        awayTricode: g.awayTeam.teamTricode,
        homeScore: g.homeTeam.score,
        awayScore: g.awayTeam.score,
      }));

    return NextResponse.json({ teams, knicksGames });
  } catch (err) {
    console.error('nba-stats API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
