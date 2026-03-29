import {
  compareDateKeys,
  formatUpdatedAt,
  formatTipoffTime,
  getRelativeDayLabel,
  getTodayInNewYork,
} from '@/lib/time';
import {
  sortStandings,
  STANDINGS_SORT_NOTE,
  updateHeadToHeadRecord,
  type HeadToHeadMap,
} from '@/lib/standings';

const SCHEDULE_URL =
  'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';

const KNICKS_TRICODE = 'NYK';

export const EAST_TRICODES = new Set([
  'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE',
  'DET', 'IND', 'MIA', 'MIL', 'NYK', 'ORL',
  'PHI', 'TOR', 'WAS',
]);

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
  date: string;
  datetime: string;
  home_team: Team;
  visitor_team: Team;
  home_team_score: number;
  visitor_team_score: number;
  status: string;
  season: number;
  postseason: boolean;
};

export type StandingRow = {
  rank: number;
  team: Team;
  wins: number;
  losses: number;
  pct: number;
  gb: number;
  conference: string;
  conferenceWins: number;
  conferenceLosses: number;
  pointDifferential: number;
  last10: { w: number; l: number };
};

export type KnicksRecord = { wins: number; losses: number };

export type CdnTeamEntry = {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  wins: number;
  losses: number;
  score: number;
};

export type CdnGame = {
  gameId: string;
  gameStatus: number;
  gameStatusText: string;
  gameDateEst: string;
  gameDateTimeUTC: string;
  homeTeam: CdnTeamEntry;
  awayTeam: CdnTeamEntry;
};

type LeagueScheduleSnapshot = {
  games: CdnGame[];
  fetchedAt: string;
  sourceLastModified: string | null;
};

type StandingsAccumulator = {
  team: Team;
  wins: number;
  losses: number;
  conferenceWins: number;
  conferenceLosses: number;
  pointDifferential: number;
  log: boolean[];
};

export async function fetchLeagueScheduleSnapshot(): Promise<LeagueScheduleSnapshot> {
  const res = await fetch(SCHEDULE_URL, {
    next: { revalidate: 86400 },
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`NBA CDN error: ${res.status}`);

  const data = await res.json();
  const gameDates: { games: CdnGame[] }[] =
    data?.leagueSchedule?.gameDates ?? [];

  const all: CdnGame[] = [];
  for (const gd of gameDates) {
    for (const game of gd.games) {
      if (game.gameId.startsWith('002')) all.push(game);
    }
  }

  all.sort((a, b) => a.gameDateTimeUTC.localeCompare(b.gameDateTimeUTC));

  return {
    games: all,
    fetchedAt: new Date().toISOString(),
    sourceLastModified: res.headers.get('last-modified'),
  };
}

export function toTeam(team: CdnTeamEntry): Team {
  return {
    id: team.teamId,
    full_name: `${team.teamCity} ${team.teamName}`,
    abbreviation: team.teamTricode,
    city: team.teamCity,
    name: team.teamName,
    conference: EAST_TRICODES.has(team.teamTricode) ? 'East' : 'West',
    division: '',
  };
}

export function toGame(game: CdnGame): Game {
  const isFinal = game.gameStatus === 3;
  return {
    id: parseInt(game.gameId, 10),
    date: game.gameDateEst.slice(0, 10),
    datetime: game.gameDateTimeUTC,
    home_team: toTeam(game.homeTeam),
    visitor_team: toTeam(game.awayTeam),
    home_team_score: game.homeTeam.score,
    visitor_team_score: game.awayTeam.score,
    status: isFinal ? 'Final' : game.gameDateTimeUTC,
    season: 2025,
    postseason: false,
  };
}

export function isCompletedGame(game: Game): boolean {
  return game.status === 'Final';
}

export function isUpcomingGame(game: Game, today = getTodayInNewYork()): boolean {
  return !isCompletedGame(game) && compareDateKeys(game.date, today) >= 0;
}

export function selectKnicksGames(scheduleGames: CdnGame[]): Game[] {
  return scheduleGames
    .filter(
      game =>
        game.homeTeam.teamTricode === KNICKS_TRICODE ||
        game.awayTeam.teamTricode === KNICKS_TRICODE,
    )
    .map(toGame);
}

export function computeRecord(games: Game[]): KnicksRecord {
  let wins = 0;
  let losses = 0;

  for (const game of games) {
    if (!isCompletedGame(game)) continue;

    const knicksHome = game.home_team.abbreviation === KNICKS_TRICODE;
    const knicksScore = knicksHome ? game.home_team_score : game.visitor_team_score;
    const oppScore = knicksHome ? game.visitor_team_score : game.home_team_score;
    if (knicksScore > oppScore) wins += 1;
    else losses += 1;
  }

  return { wins, losses };
}

export function getRecentResults(games: Game[], count = 10): Game[] {
  return games.filter(isCompletedGame).slice(-count);
}

export function getUpcomingGames(
  games: Game[],
  count = 10,
  today = getTodayInNewYork(),
): Game[] {
  return games.filter(game => isUpcomingGame(game, today)).slice(0, count);
}

export function getNextGame(
  games: Game[],
  today = getTodayInNewYork(),
): Game | null {
  return getUpcomingGames(games, 1, today)[0] ?? null;
}

export function getRecentRecord(
  games: Game[],
  count = 10,
): { wins: number; losses: number } {
  return getRecentResults(games, count).reduce(
    (record, game) => {
      const knicksHome = game.home_team.abbreviation === KNICKS_TRICODE;
      const knicksScore = knicksHome ? game.home_team_score : game.visitor_team_score;
      const oppScore = knicksHome ? game.visitor_team_score : game.home_team_score;

      if (knicksScore > oppScore) record.wins += 1;
      else record.losses += 1;

      return record;
    },
    { wins: 0, losses: 0 },
  );
}

export function getCurrentStreak(games: Game[]): { type: 'W' | 'L' | null; count: number } {
  const completed = getRecentResults(games, games.length).reverse();
  if (completed.length === 0) return { type: null, count: 0 };

  let type: 'W' | 'L' | null = null;
  let count = 0;

  for (const game of completed) {
    const knicksHome = game.home_team.abbreviation === KNICKS_TRICODE;
    const knicksScore = knicksHome ? game.home_team_score : game.visitor_team_score;
    const oppScore = knicksHome ? game.visitor_team_score : game.home_team_score;
    const result: 'W' | 'L' = knicksScore > oppScore ? 'W' : 'L';

    if (!type) {
      type = result;
      count = 1;
      continue;
    }

    if (result !== type) break;
    count += 1;
  }

  return { type, count };
}

export function getGameMatchupLabel(game: Game): string {
  return game.home_team.abbreviation === KNICKS_TRICODE
    ? `vs ${game.visitor_team.full_name}`
    : `@ ${game.home_team.full_name}`;
}

export function getGameMatchupShortLabel(game: Game): string {
  return game.home_team.abbreviation === KNICKS_TRICODE
    ? `vs ${game.visitor_team.abbreviation}`
    : `@ ${game.home_team.abbreviation}`;
}

export function getGameTipoffLabel(game: Game): string {
  return formatTipoffTime(game.datetime) ?? 'TBD';
}

export function getGameRelativeLabel(game: Game): 'TODAY' | 'TOMORROW' | null {
  return getRelativeDayLabel(game.date);
}

function buildEasternStandings(scheduleGames: CdnGame[]): StandingRow[] {
  const records = new Map<string, StandingsAccumulator>();
  const headToHead: HeadToHeadMap = new Map();

  for (const game of scheduleGames) {
    if (game.gameStatus !== 3) continue;

    const home = game.homeTeam;
    const away = game.awayTeam;
    const homeEast = EAST_TRICODES.has(home.teamTricode);
    const awayEast = EAST_TRICODES.has(away.teamTricode);
    const homeWon = home.score > away.score;

    for (const team of [home, away]) {
      if (!EAST_TRICODES.has(team.teamTricode)) continue;
      if (!records.has(team.teamTricode)) {
        records.set(team.teamTricode, {
          team: toTeam(team),
          wins: 0,
          losses: 0,
          conferenceWins: 0,
          conferenceLosses: 0,
          pointDifferential: 0,
          log: [],
        });
      }
    }

    if (homeEast) {
      const row = records.get(home.teamTricode)!;
      row.pointDifferential += home.score - away.score;
      if (homeWon) row.wins += 1;
      else row.losses += 1;
      row.log.push(homeWon);
      if (awayEast) {
        if (homeWon) row.conferenceWins += 1;
        else row.conferenceLosses += 1;
      }
    }

    if (awayEast) {
      const row = records.get(away.teamTricode)!;
      row.pointDifferential += away.score - home.score;
      if (homeWon) row.losses += 1;
      else row.wins += 1;
      row.log.push(!homeWon);
      if (homeEast) {
        if (homeWon) row.conferenceLosses += 1;
        else row.conferenceWins += 1;
      }
    }

    if (homeEast && awayEast) {
      updateHeadToHeadRecord(
        headToHead,
        homeWon ? home.teamTricode : away.teamTricode,
        homeWon ? away.teamTricode : home.teamTricode,
      );
    }
  }

  const sorted = sortStandings(
    [...records.values()].map(row => {
      const last10 = row.log.slice(-10);
      const last10Wins = last10.filter(Boolean).length;
      return {
        teamAbbreviation: row.team.abbreviation,
        teamName: row.team.full_name,
        team: row.team,
        wins: row.wins,
        losses: row.losses,
        conferenceWins: row.conferenceWins,
        conferenceLosses: row.conferenceLosses,
        pointDifferential: row.pointDifferential,
        last10Wins,
        last10Losses: last10.length - last10Wins,
      };
    }),
    headToHead,
  );

  if (sorted.length === 0) return [];

  const leader = sorted[0];

  return sorted.map((row, index) => ({
    rank: index + 1,
    team: row.team,
    wins: row.wins,
    losses: row.losses,
    pct: row.wins / (row.wins + row.losses || 1),
    gb: ((leader.wins - row.wins) + (row.losses - leader.losses)) / 2,
    conference: 'East',
    conferenceWins: row.conferenceWins,
    conferenceLosses: row.conferenceLosses,
    pointDifferential: row.pointDifferential,
    last10: {
      w: row.last10Wins,
      l: row.last10Losses,
    },
  }));
}

export async function getKnicksGames(): Promise<Game[]> {
  const snapshot = await fetchLeagueScheduleSnapshot();
  return selectKnicksGames(snapshot.games);
}

export async function getKnicksDashboardData(): Promise<{
  games: Game[];
  standings: StandingRow[];
  updatedAtLabel: string;
}> {
  const snapshot = await fetchLeagueScheduleSnapshot();
  return {
    games: selectKnicksGames(snapshot.games),
    standings: buildEasternStandings(snapshot.games),
    updatedAtLabel: formatUpdatedAt(snapshot.sourceLastModified ?? snapshot.fetchedAt),
  };
}

export async function getEasternStandingsData(): Promise<{
  standings: StandingRow[];
  updatedAtLabel: string;
  sortNote: string;
}> {
  const snapshot = await fetchLeagueScheduleSnapshot();
  return {
    standings: buildEasternStandings(snapshot.games),
    updatedAtLabel: formatUpdatedAt(snapshot.sourceLastModified ?? snapshot.fetchedAt),
    sortNote: STANDINGS_SORT_NOTE,
  };
}

export async function getEasternStandings(): Promise<StandingRow[]> {
  const data = await getEasternStandingsData();
  return data.standings;
}
