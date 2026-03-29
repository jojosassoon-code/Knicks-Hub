import PageHeader from '@/components/ui/PageHeader';
import SectionShell from '@/components/ui/SectionShell';
import StatePanel from '@/components/ui/StatePanel';
import {
  getGameMatchupLabel,
  getGameRelativeLabel,
  getGameTipoffLabel,
  getKnicksDashboardData,
  getNextGame,
  getRecentResults,
  getUpcomingGames,
  type Game,
} from '@/lib/nba';
import { getOpponentColor } from '@/lib/teamColors';
import { formatCalendarDate } from '@/lib/time';

function GameCard({ game, isResult }: { game: Game; isResult: boolean }) {
  const knicksHome = game.home_team.abbreviation === 'NYK';
  const opponent = knicksHome ? game.visitor_team : game.home_team;
  const opponentColor = getOpponentColor(opponent.abbreviation);
  const relativeLabel = getGameRelativeLabel(game);

  let scoreLabel = '';
  let resultColor = '#F58426';

  if (isResult) {
    const knicksScore = knicksHome ? game.home_team_score : game.visitor_team_score;
    const oppScore = knicksHome ? game.visitor_team_score : game.home_team_score;
    const won = knicksScore > oppScore;
    scoreLabel = `${won ? 'W' : 'L'} ${knicksScore}-${oppScore}`;
    resultColor = won ? '#00C853' : '#FF3D3D';
  }

  return (
    <div
      className="card rounded-2xl p-4 sm:p-5"
      style={{ borderLeft: `4px solid ${resultColor}` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="rounded-2xl px-3 py-2 text-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(8,12,20,0.72)', border: '1px solid rgba(30,45,61,0.85)' }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem',
                lineHeight: 1,
                color: '#FFFFFF',
              }}
            >
              {Number(game.date.slice(8, 10))}
            </div>
            <div style={{ color: '#8899AA', fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              {formatCalendarDate(game.date, { month: 'short' }).toUpperCase()}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-2 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: knicksHome ? 'rgba(0,107,182,0.15)' : 'rgba(136,153,170,0.12)',
                  color: knicksHome ? '#4AA9F1' : '#B7C6D8',
                  border: '1px solid rgba(30,45,61,0.8)',
                  letterSpacing: '0.08em',
                }}
              >
                {knicksHome ? 'HOME' : 'AWAY'}
              </span>
              {relativeLabel && (
                <span
                  className="px-2 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: 'rgba(245,132,38,0.14)',
                    color: '#F58426',
                    border: '1px solid rgba(245,132,38,0.28)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {relativeLabel}
                </span>
              )}
            </div>

            <p
              className="mt-3"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                lineHeight: 1.1,
                color: '#FFFFFF',
                letterSpacing: '0.04em',
              }}
            >
              {getGameMatchupLabel(game)}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full" style={{ width: '8px', height: '8px', backgroundColor: opponentColor }} />
              <span style={{ color: '#AFC0D2' }}>{formatCalendarDate(game.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <span style={{ color: '#1E2D3D' }}>•</span>
              <span style={{ color: '#8899AA' }}>{getGameTipoffLabel(game)}</span>
            </div>
          </div>
        </div>

        <div className="sm:text-right">
          {isResult ? (
            <span
              className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: `${resultColor}1A`,
                color: resultColor,
                border: `1px solid ${resultColor}33`,
                letterSpacing: '0.08em',
              }}
            >
              {scoreLabel}
            </span>
          ) : (
            <span
              className="inline-flex px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(245,132,38,0.14)',
                color: '#F58426',
                border: '1px solid rgba(245,132,38,0.28)',
                letterSpacing: '0.1em',
              }}
            >
              UPCOMING
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function SchedulePage() {
  let data: Awaited<ReturnType<typeof getKnicksDashboardData>> | null = null;

  try {
    data = await getKnicksDashboardData();
  } catch {}

  if (!data) {
    return (
      <StatePanel
        title="Could not load schedule"
        body="The NBA schedule feed is unavailable right now. Please try again shortly."
        variant="error"
      />
    );
  }

  const { games, updatedAtLabel } = data;
  const nextGame = getNextGame(games);
  const upcoming = getUpcomingGames(games, 8);
  const results = [...getRecentResults(games, 10)].reverse();

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="SCHEDULE"
        eyebrow="TRACK THE RUN"
        metadata={['2025-26 Season', 'New York Knicks', updatedAtLabel]}
      />

      {nextGame && (
        <div
          className="card rounded-3xl p-6 sm:p-7"
          style={{ border: '1px solid rgba(245,132,38,0.24)' }}
        >
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#F58426', letterSpacing: '0.18em' }}>
            NEXT TIPOFF
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  color: '#FFFFFF',
                  lineHeight: 0.95,
                  letterSpacing: '0.05em',
                }}
              >
                {getGameMatchupLabel(nextGame)}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span style={{ color: '#AFC0D2' }}>{formatCalendarDate(nextGame.date)}</span>
                <span style={{ color: '#1E2D3D' }}>•</span>
                <span style={{ color: '#8899AA' }}>{getGameTipoffLabel(nextGame)}</span>
              </div>
            </div>
            {getGameRelativeLabel(nextGame) && (
              <span
                className="inline-flex px-3 py-2 rounded-full text-sm font-semibold"
                style={{
                  backgroundColor: 'rgba(245,132,38,0.14)',
                  color: '#F58426',
                  border: '1px solid rgba(245,132,38,0.28)',
                  letterSpacing: '0.1em',
                }}
              >
                {getGameRelativeLabel(nextGame)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <SectionShell
          title="UPCOMING GAMES"
          subtitle="The next stretch on the schedule."
          metadata={[`${upcoming.length} games listed`]}
        >
          {upcoming.length === 0 ? (
            <StatePanel
              title="No upcoming games found"
              body="The current schedule feed did not return any future Knicks games."
              variant="empty"
            />
          ) : (
            <div className="space-y-3">
              {upcoming.map(game => (
                <GameCard key={game.id} game={game} isResult={false} />
              ))}
            </div>
          )}
        </SectionShell>

        <SectionShell
          title="RECENT RESULTS"
          subtitle="Latest completed Knicks games."
          metadata={[`${results.length} final scores`]}
        >
          {results.length === 0 ? (
            <StatePanel
              title="No recent results"
              body="Completed game results will appear here once the season is underway."
              variant="empty"
            />
          ) : (
            <div className="space-y-3">
              {results.map(game => (
                <GameCard key={game.id} game={game} isResult={true} />
              ))}
            </div>
          )}
        </SectionShell>
      </div>
    </div>
  );
}
