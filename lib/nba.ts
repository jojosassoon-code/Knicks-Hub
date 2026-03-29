// lib/nba.ts
// All NBA data comes from the official NBA CDN — free, no API key required.
// The schedule JSON contains every game (regular season, preseason, playoffs).
// We filter to regular season only by checking that the gameId starts with "002".
// Next.js caches the response for 24 hours via { next: { revalidate: 86400 } }.

const SCHEDULE_URL =
  'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';

const KNICKS_TRICODE = 'NYK';

// Eastern Conference team tricodes — used to filter the standings table.
const EAST_TRICODES = new Set([
  'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE',
  'DET', 'IND', 'MIA', 'MIL', 'NYK', 'ORL',
  'PHI', 'TOR', 'WAS',
]);

// --- Types -----------------------------------------------------------

export type Team = {
  id: number;
  full_name: string;
  abbreviation: string;
  city: string;
  name: string;
  conference: string;
  division: string;
};

export type Game = {
  id: number;
  date: string;       // "YYYY-MM-DD"
  datetime: string;   // ISO UTC string, e.g. "2026-03-29T23:30:00Z"
  home_team: Team;
  visitor_team: Team;
  home_team_score: number;
  visitor_team_score: number;
  status: string;     // "Final" for completed games, ISO time string for upcoming
  season: number;
  postseason: boolean;
};

export type StandingRow = {
  team: Team;
  wins: number;
  losses: number;
  pct: number;
  gb: number;
  conference: string;
};

export type KnicksRecord = { wins: number; losses: number };

// --- Raw CDN types (what the NBA JSON actually looks like) ------------

type CdnTeamEntry = {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  wins: number;
  losses: number;
  score: number;
};

type CdnGame = {
  gameId: string;
  gameStatus: number;        // 1 = upcoming, 2 = live, 3 = final
  gameStatusText: string;
  gameDateEst: string;       // "2026-03-29T00:00:00Z"
  gameDateTimeUTC: string;   // "2026-03-29T23:30:00Z"
  homeTeam: CdnTeamEntry;
  awayTeam: CdnTeamEntry;
};

// --- Fetch & cache the full schedule ---------------------------------

async function fetchSchedule(): Promise<CdnGame[]> {
  const res = await fetch(SCHEDULE_URL, {
    next: { revalidate: 86400 },
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`NBA CDN error: ${res.status}`);
  const data = await res.json();

  const gameDates: { games: CdnGame[] }[] =
    data?.leagueSchedule?.gameDates ?? [];

  // Keep only regular season games (gameId prefix "002")
  const all: CdnGame[] = [];
  for (const gd of gameDates) {
    for (const g of gd.games) {
      if (g.gameId.startsWith('002')) all.push(g);
    }
  }

  // Sort chronologically by UTC tip-off time
  all.sort((a, b) => a.gameDateTimeUTC.localeCompare(b.gameDateTimeUTC));
  return all;
}

// Convert a CDN team entry into our shared Team type
function toTeam(t: CdnTeamEntry): Team {
  return {
    id: t.teamId,
    full_name: `${t.teamCity} ${t.teamName}`,
    abbreviation: t.teamTricode,
    city: t.teamCity,
    name: t.teamName,
    conference: EAST_TRICODES.has(t.teamTricode) ? 'East' : 'West',
    division: '',
  };
}

// Convert a CDN game into our shared Game type
function toGame(g: CdnGame): Game {
  const isFinal = g.gameStatus === 3;
  return {
    id: parseInt(g.gameId, 10),
    date: g.gameDateEst.slice(0, 10),          // "YYYY-MM-DD"
    datetime: g.gameDateTimeUTC,
    home_team: toTeam(g.homeTeam),
    visitor_team: toTeam(g.awayTeam),
    home_team_score: g.homeTeam.score,
    visitor_team_score: g.awayTeam.score,
    status: isFinal ? 'Final' : g.gameDateTimeUTC,
    season: 2025,
    postseason: false,
  };
}

// --- Public API ------------------------------------------------------

/** All regular-season Knicks games, sorted by date. */
export async function getKnicksGames(): Promise<Game[]> {
  const all = await fetchSchedule();
  return all
    .filter(
      g => g.homeTeam.teamTricode === KNICKS_TRICODE ||
           g.awayTeam.teamTricode === KNICKS_TRICODE
    )
    .map(toGame);
}

/** Compute W-L from a list of games. */
export function computeRecord(games: Game[]): KnicksRecord {
  let wins = 0, losses = 0;
  for (const g of games) {
    if (g.status !== 'Final') continue;
    const knicksHome  = g.home_team.abbreviation === KNICKS_TRICODE;
    const knicksScore = knicksHome ? g.home_team_score : g.visitor_team_score;
    const oppScore    = knicksHome ? g.visitor_team_score : g.home_team_score;
    if (knicksScore > oppScore) wins++; else losses++;
  }
  return { wins, losses };
}

/** Next unplayed game on or after today. */
export function getNextGame(games: Game[]): Game | null {
  const today = new Date().toISOString().slice(0, 10);
  return games.find(g => g.status !== 'Final' && g.date >= today) ?? null;
}

/** Last N completed games. */
export function getRecentResults(games: Game[], count = 10): Game[] {
  return games.filter(g => g.status === 'Final').slice(-count);
}

/** Next N upcoming (unplayed) games. */
export function getUpcomingGames(games: Game[], count = 10): Game[] {
  const today = new Date().toISOString().slice(0, 10);
  return games
    .filter(g => g.status !== 'Final' && g.date >= today)
    .slice(0, count);
}

/** Full Eastern Conference standings, computed from the schedule. */
export async function getEasternStandings(): Promise<StandingRow[]> {
  const all = await fetchSchedule();

  // Accumulate W-L for every Eastern team
  const records = new Map<
    string,
    { team: Team; wins: number; losses: number }
  >();

  for (const g of all) {
    if (g.gameStatus !== 3) continue; // only count finished games

    const h = g.homeTeam;
    const a = g.awayTeam;

    for (const t of [h, a]) {
      if (!EAST_TRICODES.has(t.teamTricode)) continue;
      if (!records.has(t.teamTricode)) {
        records.set(t.teamTricode, { team: toTeam(t), wins: 0, losses: 0 });
      }
    }

    const hEast = EAST_TRICODES.has(h.teamTricode);
    const aEast = EAST_TRICODES.has(a.teamTricode);
    const hWon  = h.score > a.score;

    if (hEast) {
      const r = records.get(h.teamTricode)!;
      hWon ? r.wins++ : r.losses++;
    }
    if (aEast) {
      const r = records.get(a.teamTricode)!;
      hWon ? r.losses++ : r.wins++;
    }
  }

  // Sort by wins desc, losses asc, then compute games back
  const sorted = [...records.values()].sort(
    (a, b) => b.wins - a.wins || a.losses - b.losses
  );

  if (sorted.length === 0) return [];

  const leaderW = sorted[0].wins;
  const leaderL = sorted[0].losses;

  return sorted.map(r => ({
    team: r.team,
    wins: r.wins,
    losses: r.losses,
    pct: r.wins / (r.wins + r.losses || 1),
    gb: ((leaderW - r.wins) + (r.losses - leaderL)) / 2,
    conference: 'East',
  }));
}
