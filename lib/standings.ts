export type SortableStandingRow = {
  teamAbbreviation: string;
  teamName: string;
  wins: number;
  losses: number;
  conferenceWins: number;
  conferenceLosses: number;
  pointDifferential: number;
  last10Wins: number;
  last10Losses: number;
};

export type HeadToHeadRecord = {
  wins: number;
  losses: number;
};

export type HeadToHeadMap = Map<string, HeadToHeadRecord>;

function toPairKey(teamA: string, teamB: string): string {
  return [teamA, teamB].sort().join('::');
}

export function updateHeadToHeadRecord(
  records: HeadToHeadMap,
  winner: string,
  loser: string,
) {
  const key = toPairKey(winner, loser);
  const current = records.get(key) ?? { wins: 0, losses: 0 };

  if (winner < loser) {
    current.wins += 1;
  } else {
    current.losses += 1;
  }

  records.set(key, current);
}

export function getHeadToHeadRecord(
  records: HeadToHeadMap,
  teamA: string,
  teamB: string,
): HeadToHeadRecord | null {
  const key = toPairKey(teamA, teamB);
  const record = records.get(key);
  if (!record) return null;

  if (teamA < teamB) return record;
  return {
    wins: record.losses,
    losses: record.wins,
  };
}

function winPct(wins: number, losses: number): number {
  const total = wins + losses;
  return total > 0 ? wins / total : 0;
}

export const STANDINGS_SORT_NOTE =
  'Fallback sort: win pct, two-team head-to-head, conference win pct, point differential, last 10, then alphabetical.';

export function compareStandingsRows(
  a: SortableStandingRow,
  b: SortableStandingRow,
  headToHeadRecords: HeadToHeadMap,
): number {
  const pctDiff = winPct(b.wins, b.losses) - winPct(a.wins, a.losses);
  if (pctDiff !== 0) return pctDiff;

  const h2h = getHeadToHeadRecord(headToHeadRecords, a.teamAbbreviation, b.teamAbbreviation);
  if (h2h && h2h.wins !== h2h.losses) {
    return h2h.wins > h2h.losses ? -1 : 1;
  }

  const conferencePctDiff =
    winPct(b.conferenceWins, b.conferenceLosses) -
    winPct(a.conferenceWins, a.conferenceLosses);
  if (conferencePctDiff !== 0) return conferencePctDiff;

  const pointDiff = b.pointDifferential - a.pointDifferential;
  if (pointDiff !== 0) return pointDiff;

  const last10Diff = winPct(b.last10Wins, b.last10Losses) - winPct(a.last10Wins, a.last10Losses);
  if (last10Diff !== 0) return last10Diff;

  return a.teamName.localeCompare(b.teamName);
}

export function sortStandings<T extends SortableStandingRow>(
  rows: T[],
  headToHeadRecords: HeadToHeadMap,
): T[] {
  return [...rows].sort((a, b) => compareStandingsRows(a, b, headToHeadRecords));
}
