import StatePanel from '@/components/ui/StatePanel';
import HomeClient from '@/components/home/HomeClient';
import {
  computeRecord,
  getCurrentStreak,
  getGameMatchupLabel,
  getGameMatchupShortLabel,
  getGameRelativeLabel,
  getGameTipoffLabel,
  getKnicksDashboardData,
  getNextGame,
  getRecentRecord,
  getRecentResults,
} from '@/lib/nba';
import { formatCalendarDate } from '@/lib/time';

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof getKnicksDashboardData>> | null = null;

  try {
    data = await getKnicksDashboardData();
  } catch {}

  if (!data) {
    return (
      <StatePanel
        title="Could not load Knicks dashboard"
        body="The schedule feed did not return cleanly. Please try again in a moment."
        variant="error"
      />
    );
  }

  const { games, standings, updatedAtLabel } = data;
  const record    = computeRecord(games);
  const nextGame  = getNextGame(games);
  const last10    = getRecentRecord(games, 10);
  const streak    = getCurrentStreak(games);
  const knicksStanding = standings.find(row => row.team.abbreviation === 'NYK');

  // Last 10 individual W/L results for circles visualization
  const last10Games = getRecentResults(games, 10);
  const last10Results = last10Games.map(game => {
    const knicksHome  = game.home_team.abbreviation === 'NYK';
    const knicksScore = knicksHome ? game.home_team_score : game.visitor_team_score;
    const oppScore    = knicksHome ? game.visitor_team_score : game.home_team_score;
    return knicksScore > oppScore;
  });

  const nextGameData = nextGame
    ? {
        shortLabel:    getGameMatchupShortLabel(nextGame),
        matchupLabel:  getGameMatchupLabel(nextGame),
        date:          formatCalendarDate(nextGame.date, { weekday: 'short', month: 'short', day: 'numeric' }),
        time:          getGameTipoffLabel(nextGame),
        relativeLabel: getGameRelativeLabel(nextGame) ?? '',
      }
    : null;

  const standingData = knicksStanding
    ? {
        rank:               knicksStanding.rank,
        gb:                 knicksStanding.gb,
        conferenceWins:     knicksStanding.conferenceWins,
        conferenceLosses:   knicksStanding.conferenceLosses,
        pointDifferential:  knicksStanding.pointDifferential,
      }
    : null;

  return (
    <HomeClient
      record={record}
      last10={last10}
      streak={streak}
      standing={standingData}
      updatedAtLabel={updatedAtLabel}
      last10Results={last10Results}
      nextGame={nextGameData}
    />
  );
}
