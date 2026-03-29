import { NextResponse } from 'next/server';
import {
  EAST_TRICODES,
  fetchLeagueScheduleSnapshot,
} from '@/lib/nba';
import {
  sortStandings,
  updateHeadToHeadRecord,
  type HeadToHeadMap,
} from '@/lib/standings';

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

type Acc = {
  id: number;
  city: string;
  name: string;
  conference: 'East' | 'West';
  ppgSum: number;
  papgSum: number;
  pointDifferential: number;
  wins: number;
  losses: number;
  conferenceWins: number;
  conferenceLosses: number;
  homeW: number;
  homeL: number;
  awayW: number;
  awayL: number;
  log: boolean[];
};

export async function GET() {
  try {
    const snapshot = await fetchLeagueScheduleSnapshot();
    const completed = snapshot.games.filter(game => game.gameStatus === 3);

    const acc = new Map<string, Acc>();
    const eastHeadToHead: HeadToHeadMap = new Map();
    const westHeadToHead: HeadToHeadMap = new Map();

    for (const game of completed) {
      const home = game.homeTeam;
      const away = game.awayTeam;
      const homeConference: 'East' | 'West' = EAST_TRICODES.has(home.teamTricode) ? 'East' : 'West';
      const awayConference: 'East' | 'West' = EAST_TRICODES.has(away.teamTricode) ? 'East' : 'West';
      const sameConference = homeConference === awayConference;
      const homeWon = home.score > away.score;

      for (const [team, isHome, conference] of [
        [home, true, homeConference],
        [away, false, awayConference],
      ] as const) {
        const tri = team.teamTricode;
        if (!acc.has(tri)) {
          acc.set(tri, {
            id: team.teamId,
            city: team.teamCity,
            name: team.teamName,
            conference,
            ppgSum: 0,
            papgSum: 0,
            pointDifferential: 0,
            wins: 0,
            losses: 0,
            conferenceWins: 0,
            conferenceLosses: 0,
            homeW: 0,
            homeL: 0,
            awayW: 0,
            awayL: 0,
            log: [],
          });
        }

        const row = acc.get(tri)!;
        const scored = isHome ? home.score : away.score;
        const allowed = isHome ? away.score : home.score;
        const won = scored > allowed;

        row.ppgSum += scored;
        row.papgSum += allowed;
        row.pointDifferential += scored - allowed;
        row.log.push(won);

        if (won) {
          row.wins += 1;
          if (isHome) row.homeW += 1;
          else row.awayW += 1;
        } else {
          row.losses += 1;
          if (isHome) row.homeL += 1;
          else row.awayL += 1;
        }

        if (sameConference) {
          if (won) row.conferenceWins += 1;
          else row.conferenceLosses += 1;
        }
      }

      if (sameConference) {
        const map = homeConference === 'East' ? eastHeadToHead : westHeadToHead;
        updateHeadToHeadRecord(
          map,
          homeWon ? home.teamTricode : away.teamTricode,
          homeWon ? away.teamTricode : home.teamTricode,
        );
      }
    }

    const teams: Record<string, TeamStat> = {};
    for (const [tri, row] of acc) {
      const gp = row.wins + row.losses;
      const last10 = row.log.slice(-10);
      const last10Wins = last10.filter(Boolean).length;

      teams[tri] = {
        id: row.id,
        city: row.city,
        name: row.name,
        tricode: tri,
        conference: row.conference,
        wins: row.wins,
        losses: row.losses,
        gamesPlayed: gp,
        ppg: gp > 0 ? parseFloat((row.ppgSum / gp).toFixed(1)) : 0,
        papg: gp > 0 ? parseFloat((row.papgSum / gp).toFixed(1)) : 0,
        netRating: gp > 0 ? parseFloat((row.pointDifferential / gp).toFixed(1)) : 0,
        winPct: gp > 0 ? row.wins / gp : 0,
        homeRecord: { w: row.homeW, l: row.homeL },
        awayRecord: { w: row.awayW, l: row.awayL },
        last10: { w: last10Wins, l: last10.length - last10Wins },
        seed: 0,
      };
    }

    for (const conference of ['East', 'West'] as const) {
      const headToHead = conference === 'East' ? eastHeadToHead : westHeadToHead;
      const conferenceTeams = sortStandings(
        Object.values(teams)
          .filter(team => team.conference === conference)
          .map(team => ({
            ...team,
            teamAbbreviation: team.tricode,
            teamName: `${team.city} ${team.name}`,
            conferenceWins: acc.get(team.tricode)?.conferenceWins ?? 0,
            conferenceLosses: acc.get(team.tricode)?.conferenceLosses ?? 0,
            pointDifferential: acc.get(team.tricode)?.pointDifferential ?? 0,
            last10Wins: team.last10.w,
            last10Losses: team.last10.l,
          })),
        headToHead,
      );

      conferenceTeams.forEach((team, index) => {
        teams[team.tricode].seed = index + 1;
      });
    }

    const knicksGames: GameSummary[] = completed
      .filter(
        game =>
          game.homeTeam.teamTricode === 'NYK' ||
          game.awayTeam.teamTricode === 'NYK',
      )
      .map(game => ({
        date: game.gameDateEst.slice(0, 10),
        homeTricode: game.homeTeam.teamTricode,
        awayTricode: game.awayTeam.teamTricode,
        homeScore: game.homeTeam.score,
        awayScore: game.awayTeam.score,
      }));

    return NextResponse.json({ teams, knicksGames });
  } catch (err) {
    console.error('nba-stats API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
