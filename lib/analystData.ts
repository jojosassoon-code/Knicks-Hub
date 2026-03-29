import { fetchLeagueScheduleSnapshot } from '@/lib/nba';
import { getCurrentSeasonLabel, type PlayerStat } from '@/lib/analyst';

type StatsRow = {
  playerId: string;
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
  threeAttempts: number;
};

type RosterEntry = {
  playerId: string;
  name: string;
};

type ResultSet = {
  headers: string[];
  rowSet: Array<Array<string | number | null>>;
};

const NBA_STATS_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  Origin: 'https://www.nba.com',
  Referer: 'https://www.nba.com/',
  'User-Agent': 'Mozilla/5.0',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
};

const REVALIDATE_SECONDS = 60 * 60 * 6;

function getValue<T>(
  row: Array<string | number | null>,
  headers: string[],
  header: string,
  fallback: T,
): T {
  const index = headers.indexOf(header);
  if (index === -1) return fallback;
  const value = row[index];
  return (value ?? fallback) as T;
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return 0;
}

function readResultSet(data: unknown, targetName?: string): ResultSet | null {
  if (!data || typeof data !== 'object') return null;
  const maybe = data as {
    resultSets?: Array<{ name?: string; headers?: string[]; rowSet?: Array<Array<string | number | null>> }>;
    resultSet?: { name?: string; headers?: string[]; rowSet?: Array<Array<string | number | null>> };
  };

  if (Array.isArray(maybe.resultSets)) {
    const chosen = targetName
      ? maybe.resultSets.find(set => set.name === targetName)
      : maybe.resultSets[0];
    if (chosen?.headers && chosen.rowSet) {
      return { headers: chosen.headers, rowSet: chosen.rowSet };
    }
  }

  if (maybe.resultSet?.headers && maybe.resultSet.rowSet) {
    return { headers: maybe.resultSet.headers, rowSet: maybe.resultSet.rowSet };
  }

  return null;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: NBA_STATS_HEADERS,
  });

  if (!res.ok) {
    throw new Error(`NBA stats error ${res.status} for ${url}`);
  }

  return res.json();
}

async function fetchLeagueDashPlayerStats(
  season: string,
  lastNGames: number,
): Promise<Map<string, StatsRow>> {
  const params = new URLSearchParams({
    College: '',
    Conference: '',
    Country: '',
    DateFrom: '',
    DateTo: '',
    Division: '',
    DraftPick: '',
    DraftYear: '',
    GameScope: '',
    GameSegment: '',
    Height: '',
    LastNGames: String(lastNGames),
    LeagueID: '00',
    Location: '',
    MeasureType: 'Base',
    Month: '0',
    OpponentTeamID: '0',
    Outcome: '',
    PORound: '0',
    PaceAdjust: 'N',
    PerMode: 'PerGame',
    Period: '0',
    PlayerExperience: '',
    PlayerPosition: '',
    PlusMinus: 'N',
    Rank: 'N',
    Season: season,
    SeasonSegment: '',
    SeasonType: 'Regular Season',
    ShotClockRange: '',
    StarterBench: '',
    TeamID: '0',
    TwoWay: '',
    VsConference: '',
    VsDivision: '',
    Weight: '',
  });

  const data = await fetchJson(`https://stats.nba.com/stats/leaguedashplayerstats?${params.toString()}`);
  const resultSet = readResultSet(data, 'LeagueDashPlayerStats');
  if (!resultSet) return new Map();

  const rows = new Map<string, StatsRow>();
  for (const row of resultSet.rowSet) {
    const playerId = String(getValue(row, resultSet.headers, 'PLAYER_ID', ''));
    const tricode = String(getValue(row, resultSet.headers, 'TEAM_ABBREVIATION', ''));
    if (!playerId || !tricode) continue;

    rows.set(playerId, {
      playerId,
      name: String(getValue(row, resultSet.headers, 'PLAYER_NAME', '')),
      tricode,
      gamesPlayed: toNumber(getValue(row, resultSet.headers, 'GP', 0)),
      min: toNumber(getValue(row, resultSet.headers, 'MIN', 0)),
      pts: toNumber(getValue(row, resultSet.headers, 'PTS', 0)),
      reb: toNumber(getValue(row, resultSet.headers, 'REB', 0)),
      ast: toNumber(getValue(row, resultSet.headers, 'AST', 0)),
      fgPct: toNumber(getValue(row, resultSet.headers, 'FG_PCT', 0)),
      threePct: toNumber(getValue(row, resultSet.headers, 'FG3_PCT', 0)) * 100,
      stl: toNumber(getValue(row, resultSet.headers, 'STL', 0)),
      blk: toNumber(getValue(row, resultSet.headers, 'BLK', 0)),
      threeAttempts: toNumber(getValue(row, resultSet.headers, 'FG3A', 0)),
    });
  }

  return rows;
}

async function fetchTeamRoster(teamId: number, season: string): Promise<RosterEntry[]> {
  const params = new URLSearchParams({
    LeagueID: '00',
    Season: season,
    TeamID: String(teamId),
  });

  const data = await fetchJson(`https://stats.nba.com/stats/commonteamroster?${params.toString()}`);
  const resultSet = readResultSet(data, 'CommonTeamRoster');
  if (!resultSet) return [];

  const roster: RosterEntry[] = [];
  for (const row of resultSet.rowSet) {
    const playerId = String(getValue(row, resultSet.headers, 'PLAYER_ID', ''));
    const name = String(getValue(row, resultSet.headers, 'PLAYER', ''));
    if (!playerId || !name) continue;
    roster.push({ playerId, name });
  }

  return roster;
}

export async function fetchAnalystPlayerData(): Promise<{
  byTeam: Record<string, PlayerStat[]>;
  season: string;
  notes: string[];
}> {
  const season = getCurrentSeasonLabel();
  const snapshot = await fetchLeagueScheduleSnapshot();
  const notes: string[] = [];

  const teams = new Map<string, number>();
  for (const game of snapshot.games) {
    teams.set(game.homeTeam.teamTricode, game.homeTeam.teamId);
    teams.set(game.awayTeam.teamTricode, game.awayTeam.teamId);
  }

  const [seasonStats, recentStats, rosterResults] = await Promise.all([
    fetchLeagueDashPlayerStats(season, 0),
    fetchLeagueDashPlayerStats(season, 10),
    Promise.allSettled(
      [...teams.entries()].map(async ([tricode, teamId]) => [
        tricode,
        await fetchTeamRoster(teamId, season),
      ] as const),
    ),
  ]);

  const byTeam: Record<string, PlayerStat[]> = {};

  for (const rosterResult of rosterResults) {
    if (rosterResult.status !== 'fulfilled') {
      notes.push('One or more team rosters could not be verified from NBA Stats.');
      continue;
    }

    const [tricode, roster] = rosterResult.value;
    const players: PlayerStat[] = [];

    for (const rosterPlayer of roster) {
      const seasonRow = seasonStats.get(rosterPlayer.playerId);
      const recentRow = recentStats.get(rosterPlayer.playerId);

      if (!seasonRow && !recentRow) continue;

      players.push({
        id: rosterPlayer.playerId,
        name: seasonRow?.name || recentRow?.name || rosterPlayer.name,
        tricode,
        gamesPlayed: seasonRow?.gamesPlayed ?? recentRow?.gamesPlayed ?? 0,
        min: seasonRow?.min ?? 0,
        pts: seasonRow?.pts ?? 0,
        reb: seasonRow?.reb ?? 0,
        ast: seasonRow?.ast ?? 0,
        fgPct: seasonRow?.fgPct ?? 0,
        threePct: seasonRow?.threePct ?? 0,
        stl: seasonRow?.stl ?? 0,
        blk: seasonRow?.blk ?? 0,
        threeAttempts: seasonRow?.threeAttempts ?? 0,
        recentGamesPlayed: recentRow?.gamesPlayed ?? 0,
        recentMin: recentRow?.min ?? 0,
        recentThreePct: recentRow?.threePct ?? 0,
        recentThreeAttempts: recentRow?.threeAttempts ?? 0,
        isOnCurrentRoster: true,
      });
    }

    byTeam[tricode] = players.sort((a, b) => {
      if (b.recentMin !== a.recentMin) return b.recentMin - a.recentMin;
      if (b.pts !== a.pts) return b.pts - a.pts;
      return a.name.localeCompare(b.name);
    });
  }

  if (Object.keys(byTeam).length === 0) {
    notes.push('No current rosters could be merged with recent NBA Stats player data.');
  }

  return { byTeam, season, notes };
}
