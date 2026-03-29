// app/schedule/page.tsx — Schedule Page (/schedule)
import {
  getKnicksGames,
  getRecentResults,
  getUpcomingGames,
  type Game,
} from '@/lib/nba';
import { getOpponentColor } from '@/lib/teamColors';

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(datetimeStr: string) {
  if (!datetimeStr) return '';
  const d = new Date(datetimeStr);
  if (d.getUTCHours() === 0) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  });
}

function GameCard({ game, isResult }: { game: Game; isResult: boolean }) {
  const knicksHome    = game.home_team.abbreviation === 'NYK';
  const opponent      = knicksHome ? game.visitor_team : game.home_team;
  const locationLabel = knicksHome ? 'vs' : '@';
  const oppColor      = getOpponentColor(opponent.abbreviation);

  let isWin = false;
  let knicksScore = 0;
  let oppScore    = 0;

  if (isResult) {
    knicksScore = knicksHome ? game.home_team_score : game.visitor_team_score;
    oppScore    = knicksHome ? game.visitor_team_score : game.home_team_score;
    isWin = knicksScore > oppScore;
  }

  const accentColor = isResult
    ? isWin ? '#00C853' : '#FF3D3D'
    : '#F58426';

  const gameTime = formatTime(game.datetime);

  return (
    <div
      className="card rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
      style={{
        borderLeft: `4px solid ${accentColor}`,
        padding: 0,
      }}
    >
      <div className="px-5 py-4 flex items-center gap-4">

        {/* Date column */}
        <div className="flex-shrink-0 text-center" style={{ minWidth: '3.5rem' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            color: '#FFFFFF',
            lineHeight: 1,
            letterSpacing: '0.04em',
          }}>
            {new Date(`${game.date}T12:00:00`).getDate()}
          </div>
          <div style={{
            fontSize: '0.65rem',
            color: '#8899AA',
            fontFamily: 'var(--font-body)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {new Date(`${game.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '2.5rem', backgroundColor: '#1E2D3D', flexShrink: 0 }} />

        {/* Matchup */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {/* Home/Away badge */}
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                color: knicksHome ? '#006BB6' : '#8899AA',
                backgroundColor: knicksHome ? 'rgba(0,107,182,0.15)' : 'rgba(136,153,170,0.1)',
                border: `1px solid ${knicksHome ? 'rgba(0,107,182,0.3)' : 'rgba(136,153,170,0.2)'}`,
                flexShrink: 0,
              }}
            >
              {locationLabel.toUpperCase()}
            </span>
            {/* Opponent name */}
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {opponent.full_name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Opponent color indicator */}
            <span
              className="rounded-full flex-shrink-0"
              style={{ width: '6px', height: '6px', backgroundColor: oppColor }}
            />
            <span style={{ fontSize: '0.75rem', color: '#8899AA', fontFamily: 'var(--font-body)' }}>
              {formatDate(game.date)}{gameTime ? ` · ${gameTime}` : ''}
            </span>
          </div>
        </div>

        {/* Score / Status */}
        <div className="flex-shrink-0 text-right">
          {isResult ? (
            <div className="flex items-center gap-2">
              <span
                className="font-bold rounded-lg px-2.5 py-1"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.8rem',
                  letterSpacing: '0.1em',
                  color: isWin ? '#00C853' : '#FF3D3D',
                  backgroundColor: isWin ? 'rgba(0,200,83,0.12)' : 'rgba(255,61,61,0.12)',
                  border: `1px solid ${isWin ? 'rgba(0,200,83,0.3)' : 'rgba(255,61,61,0.3)'}`,
                }}
              >
                {isWin ? 'W' : 'L'}
              </span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                color: '#FFFFFF',
                letterSpacing: '0.06em',
              }}>
                {knicksScore}–{oppScore}
              </span>
            </div>
          ) : (
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              color: '#F58426',
              opacity: 0.7,
            }}>
              UPCOMING
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function SchedulePage() {
  let results: Game[] = [];
  let upcoming: Game[] = [];

  try {
    const games = await getKnicksGames();
    results  = getRecentResults(games, 10);
    upcoming = getUpcomingGames(games, 10);
  } catch {
    return (
      <div className="text-center py-20 fade-in">
        <p style={{ color: '#FF3D3D', fontSize: '1.1rem' }}>Could not load schedule. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 fade-in">

      {/* ── Header ── */}
      <div className="section-label">
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
            color: '#FFFFFF',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}>
            SCHEDULE
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#8899AA' }}>
            2025–26 Season · New York Knicks
          </p>
        </div>
      </div>

      {/* ── Upcoming Games ── */}
      <section className="fade-in-delay">
        <div className="section-label mb-5">
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            color: '#FFFFFF',
            letterSpacing: '0.06em',
          }}>
            UPCOMING GAMES
          </h2>
        </div>
        {upcoming.length === 0 ? (
          <p style={{ color: '#8899AA' }}>No upcoming games found.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(game => (
              <GameCard key={game.id} game={game} isResult={false} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recent Results ── */}
      <section className="fade-in-delay-2">
        <div className="section-label mb-5">
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            color: '#FFFFFF',
            letterSpacing: '0.06em',
          }}>
            RECENT RESULTS
          </h2>
        </div>
        {results.length === 0 ? (
          <p style={{ color: '#8899AA' }}>No results yet.</p>
        ) : (
          <div className="space-y-2">
            {[...results].reverse().map(game => (
              <GameCard key={game.id} game={game} isResult={true} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
