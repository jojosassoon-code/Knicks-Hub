import StatePanel from '@/components/ui/StatePanel';
import CountdownTimer from '@/components/schedule/CountdownTimer';
import {
  computeRecord,
  getCurrentStreak,
  getGameMatchupLabel,
  getGameRelativeLabel,
  getGameTipoffLabel,
  getKnicksDashboardData,
  getNextGame,
  getRecentResults,
  getUpcomingGames,
  isCompletedGame,
  type Game,
} from '@/lib/nba';
import { formatCalendarDate } from '@/lib/time';

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function dateBlock(dateStr: string) {
  const month = MONTHS[parseInt(dateStr.slice(5, 7)) - 1] ?? '';
  const day   = parseInt(dateStr.slice(8, 10));
  return { month, day };
}

function gameResult(game: Game) {
  const knicksHome  = game.home_team.abbreviation === 'NYK';
  const knicksScore = knicksHome ? game.home_team_score : game.visitor_team_score;
  const oppScore    = knicksHome ? game.visitor_team_score : game.home_team_score;
  const won         = knicksScore > oppScore;
  const diff        = knicksScore - oppScore;
  return { won, knicksScore, oppScore, diff };
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <div style={{ width: '3px', background: '#F58426', borderRadius: '2px', flexShrink: 0 }} />
      <div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#FFFFFF', letterSpacing: '0.1em', margin: 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.82rem', marginTop: '0.15rem' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Home/Away pill ────────────────────────────────────────────────────────────

function LocationPill({ home }: { home: boolean }) {
  return (
    <span
      style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        padding: '0.15rem 0.5rem',
        borderRadius: '100px',
        background: home ? 'rgba(0,107,182,0.15)' : 'rgba(136,153,170,0.12)',
        color: home ? '#4AA9F1' : '#8899AA',
        border: home ? '1px solid rgba(0,107,182,0.3)' : '1px solid rgba(136,153,170,0.2)',
      }}
    >
      {home ? 'HOME' : 'AWAY'}
    </span>
  );
}

// ── Date block ────────────────────────────────────────────────────────────────

function DateBlock({ dateStr }: { dateStr: string }) {
  const { month, day } = dateBlock(dateStr);
  return (
    <div
      style={{
        background: 'rgba(8,12,20,0.8)',
        border: '1px solid rgba(30,45,61,0.8)',
        borderRadius: '10px',
        padding: '0.4rem 0.65rem',
        textAlign: 'center',
        flexShrink: 0,
        minWidth: '3rem',
      }}
    >
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8899AA' }}>
        {month}
      </div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', lineHeight: 1.05, color: '#FFFFFF', letterSpacing: '0.02em' }}>
        {day}
      </div>
    </div>
  );
}

// ── 1. SEASON RECORD BAR ──────────────────────────────────────────────────────

function SeasonRecordBar({
  wins, losses,
  homeW, homeL,
  awayW, awayL,
}: {
  wins: number; losses: number;
  homeW: number; homeL: number;
  awayW: number; awayL: number;
}) {
  const pct = ((wins / ((wins + losses) || 1)) * 100).toFixed(1);

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
        border: '1px solid #1E2D3D',
        borderRadius: '14px',
        padding: '1rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '1.5rem',
      }}
    >
      {/* Overall record */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#FFFFFF', letterSpacing: '0.02em', lineHeight: 1 }}>
          {wins}–{losses}
        </span>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: '#8899AA', letterSpacing: '0.06em' }}>
          2025–26
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '2rem', background: 'rgba(30,45,61,0.9)', flexShrink: 0 }} className="hidden sm:block" />

      {/* Win rate bar */}
      <div style={{ flex: '1 1 10rem', minWidth: '10rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', color: '#8899AA', textTransform: 'uppercase' }}>
            Win Rate
          </span>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem', color: '#FFFFFF', letterSpacing: '0.06em' }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#006BB6', borderRadius: '100px' }} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '2rem', background: 'rgba(30,45,61,0.9)', flexShrink: 0 }} className="hidden sm:block" />

      {/* Home / Away */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#4AA9F1', letterSpacing: '0.02em', lineHeight: 1 }}>
            {homeW}–{homeL}
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8899AA', textTransform: 'uppercase', marginTop: '0.1rem' }}>
            Home
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#9BAEBB', letterSpacing: '0.02em', lineHeight: 1 }}>
            {awayW}–{awayL}
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8899AA', textTransform: 'uppercase', marginTop: '0.1rem' }}>
            Away
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. NEXT TIPOFF HERO ───────────────────────────────────────────────────────

function NextTipoffHero({ game }: { game: Game }) {
  const knicksHome = game.home_team.abbreviation === 'NYK';
  const opponent   = knicksHome ? game.visitor_team : game.home_team;
  const isToday    = getGameRelativeLabel(game) === 'TODAY';
  const isTomorrow = getGameRelativeLabel(game) === 'TOMORROW';
  const label      = getGameRelativeLabel(game);

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #0b1830 0%, #080C14 100%)',
        borderTop: '1px solid rgba(0,107,182,0.2)',
        borderRight: '1px solid rgba(0,107,182,0.2)',
        borderBottom: '1px solid rgba(0,107,182,0.2)',
        borderLeft: '4px solid #006BB6',
        borderRadius: '4px',
        padding: '1.75rem 2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle blue glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: '-3rem', right: '-2rem',
          width: '18rem', height: '18rem',
          background: 'radial-gradient(circle, rgba(0,107,182,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Label */}
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.26em', color: '#006BB6', textTransform: 'uppercase', margin: 0 }}>
          Next Tipoff
        </p>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between" style={{ gap: '1rem' }}>
          <div>
            {/* Opponent name */}
            <h2
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 'clamp(2rem, 6vw, 3rem)',
                color: '#FFFFFF',
                letterSpacing: '0.03em',
                lineHeight: 1,
                margin: 0,
              }}
            >
              {knicksHome ? 'vs' : '@'} {opponent.full_name}
            </h2>

            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
              <LocationPill home={knicksHome} />
              {isToday && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', color: '#F58426', background: 'rgba(245,132,38,0.12)', border: '1px solid rgba(245,132,38,0.3)', borderRadius: '100px', padding: '0.2rem 0.65rem' }}>
                  <span className="pulse-dot" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#F58426', flexShrink: 0 }} />
                  TODAY
                </span>
              )}
              {!isToday && label && (
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', color: '#8899AA', background: 'rgba(136,153,170,0.1)', border: '1px solid rgba(136,153,170,0.18)', borderRadius: '100px', padding: '0.2rem 0.65rem' }}>
                  {label}
                </span>
              )}
            </div>

            {/* Date + time + countdown */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', color: '#AFC0D2' }}>
                {formatCalendarDate(game.date, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span style={{ color: 'rgba(136,153,170,0.35)', fontSize: '0.5rem' }}>●</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', color: '#8899AA' }}>
                {getGameTipoffLabel(game)}
              </span>
              {game.datetime && (
                <>
                  <span style={{ color: 'rgba(136,153,170,0.35)', fontSize: '0.5rem' }}>●</span>
                  <CountdownTimer tipoffAt={game.datetime} />
                </>
              )}
            </div>
          </div>

          {/* Date block (desktop right) */}
          <div className="hidden sm:block" style={{ flexShrink: 0 }}>
            <DateBlock dateStr={game.date} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. STREAK DOTS ────────────────────────────────────────────────────────────

function StreakHeader({
  last10Results,
  streakType,
  streakCount,
}: {
  last10Results: boolean[];
  streakType: 'W' | 'L' | null;
  streakCount: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
      {/* Circles */}
      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        {last10Results.map((won, i) => (
          <div
            key={i}
            title={won ? 'W' : 'L'}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: won ? '#006BB6' : '#FF3D3D',
              flexShrink: 0,
              boxShadow: won ? '0 0 5px rgba(0,107,182,0.5)' : '0 0 5px rgba(255,61,61,0.4)',
            }}
          />
        ))}
      </div>

      {/* Current streak badge */}
      {streakType && (
        <span
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.2rem',
            color: streakType === 'W' ? '#00C853' : '#FF3D3D',
            letterSpacing: '0.04em',
            background: streakType === 'W' ? 'rgba(0,200,83,0.1)' : 'rgba(255,61,61,0.1)',
            border: `1px solid ${streakType === 'W' ? 'rgba(0,200,83,0.28)' : 'rgba(255,61,61,0.28)'}`,
            borderRadius: '6px',
            padding: '0.1rem 0.55rem',
            lineHeight: 1.4,
          }}
        >
          {streakType}{streakCount}
        </span>
      )}
    </div>
  );
}

// ── 4. RESULT CARD ────────────────────────────────────────────────────────────

function ResultCard({ game }: { game: Game }) {
  const knicksHome = game.home_team.abbreviation === 'NYK';
  const { won, knicksScore, oppScore, diff } = gameResult(game);
  const accentColor = won ? '#00C853' : '#FF3D3D';

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
        border: '1px solid #1E2D3D',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: '12px',
        padding: '0.9rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.9rem',
      }}
    >
      {/* Date block */}
      <DateBlock dateStr={game.date} />

      {/* Center: matchup + location */}
      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <LocationPill home={knicksHome} />
        </div>
        <div
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.2rem',
            color: '#FFFFFF',
            letterSpacing: '0.03em',
            lineHeight: 1.1,
            marginTop: '0.3rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {getGameMatchupLabel(game)}
        </div>
      </div>

      {/* Score block */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
        {/* W/L + scores */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', justifyContent: 'flex-end' }}>
            <span
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.5rem',
                color: accentColor,
                letterSpacing: '0.04em',
                lineHeight: 1,
              }}
            >
              {won ? 'W' : 'L'}
            </span>
            <span
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.1rem',
                color: accentColor,
                letterSpacing: '0.02em',
                lineHeight: 1,
                opacity: 0.85,
              }}
            >
              {knicksScore}–{oppScore}
            </span>
          </div>
        </div>

        {/* Differential badge */}
        <div
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '0.85rem',
            letterSpacing: '0.04em',
            color: accentColor,
            background: won ? 'rgba(0,200,83,0.1)' : 'rgba(255,61,61,0.1)',
            border: `1px solid ${accentColor}30`,
            borderRadius: '6px',
            padding: '0.15rem 0.45rem',
            minWidth: '2.8rem',
            textAlign: 'center',
          }}
        >
          {diff > 0 ? '+' : ''}{diff}
        </div>
      </div>
    </div>
  );
}

// ── 5. UPCOMING CARD ──────────────────────────────────────────────────────────

function UpcomingCard({ game, isNext }: { game: Game; isNext: boolean }) {
  const knicksHome = game.home_team.abbreviation === 'NYK';
  const isToday    = getGameRelativeLabel(game) === 'TODAY';

  return (
    <div
      style={{
        background: isToday
          ? 'linear-gradient(160deg, rgba(245,132,38,0.06) 0%, rgba(8,12,20,0.95) 100%)'
          : 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
        border: isNext
          ? '1px solid rgba(245,132,38,0.45)'
          : '1px solid #1E2D3D',
        borderLeft: isToday ? '3px solid #F58426' : '3px solid transparent',
        borderRadius: '12px',
        padding: '0.9rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.9rem',
        boxShadow: isNext
          ? '0 0 20px rgba(245,132,38,0.12), 0 4px 16px rgba(0,0,0,0.3)'
          : undefined,
      }}
    >
      {/* Date block */}
      <DateBlock dateStr={game.date} />

      {/* Center: matchup + location + time */}
      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <LocationPill home={knicksHome} />
          {isToday && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.16em', color: '#F58426', background: 'rgba(245,132,38,0.1)', border: '1px solid rgba(245,132,38,0.28)', borderRadius: '100px', padding: '0.15rem 0.5rem' }}>
              <span className="pulse-dot" style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#F58426' }} />
              TODAY
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.2rem',
            color: '#FFFFFF',
            letterSpacing: '0.03em',
            lineHeight: 1.1,
            marginTop: '0.3rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {getGameMatchupLabel(game)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: '#8899AA' }}>
            {getGameTipoffLabel(game)}
          </span>
        </div>
      </div>

      {/* Right: upcoming label */}
      <div style={{ flexShrink: 0 }}>
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: isNext ? '#F58426' : '#4A5568',
            textTransform: 'uppercase',
          }}
        >
          {isNext ? 'NEXT' : 'UPCOMING'}
        </span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

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

  // Core data
  const nextGame   = getNextGame(games);
  const upcoming   = getUpcomingGames(games, 8);
  const last10     = getRecentResults(games, 10);          // oldest → newest
  const results    = [...last10].reverse();                 // newest first
  const record     = computeRecord(games);
  const streak     = getCurrentStreak(games);

  // Home/away split
  const homeRecord = { w: 0, l: 0 };
  const awayRecord = { w: 0, l: 0 };
  for (const g of games.filter(isCompletedGame)) {
    const kh  = g.home_team.abbreviation === 'NYK';
    const ks  = kh ? g.home_team_score : g.visitor_team_score;
    const os  = kh ? g.visitor_team_score : g.home_team_score;
    const won = ks > os;
    if (kh) { won ? homeRecord.w++ : homeRecord.l++; }
    else    { won ? awayRecord.w++ : awayRecord.l++; }
  }

  // Last-10 W/L for dots (chronological, oldest first)
  const last10Results = last10.map(g => {
    const kh = g.home_team.abbreviation === 'NYK';
    return (kh ? g.home_team_score : g.visitor_team_score) > (kh ? g.visitor_team_score : g.home_team_score);
  });

  const nextGameId = nextGame?.id ?? null;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* Page title */}
      <header>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '3px', background: '#F58426', borderRadius: '2px' }} />
          <div>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', color: '#FFFFFF', letterSpacing: '0.05em', lineHeight: 1, margin: 0 }}>
              SCHEDULE
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.82rem', marginTop: '0.15rem' }}>
              2025–26 New York Knicks · {updatedAtLabel}
            </p>
          </div>
        </div>
      </header>

      {/* Season record bar */}
      <SeasonRecordBar
        wins={record.wins}
        losses={record.losses}
        homeW={homeRecord.w}
        homeL={homeRecord.l}
        awayW={awayRecord.w}
        awayL={awayRecord.l}
      />

      {/* Next Tipoff hero */}
      {nextGame && (
        <section>
          <NextTipoffHero game={nextGame} />
        </section>
      )}

      {/* Recent Results — above upcoming */}
      {results.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.75rem' }}>
              <div style={{ width: '3px', background: '#F58426', borderRadius: '2px', flexShrink: 0 }} />
              <div>
                <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#FFFFFF', letterSpacing: '0.1em', margin: 0 }}>
                  Recent Results
                </h2>
                <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                  Last {results.length} completed games
                </p>
              </div>
            </div>
            {last10Results.length > 0 && (
              <StreakHeader
                last10Results={last10Results}
                streakType={streak.type}
                streakCount={streak.count}
              />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {results.map(game => (
              <ResultCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Games */}
      {upcoming.length > 0 && (
        <section>
          <SectionLabel
            title="Upcoming Games"
            subtitle={`Next ${upcoming.length} games on the schedule`}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {upcoming.map((game, i) => (
              <UpcomingCard
                key={game.id}
                game={game}
                isNext={game.id === nextGameId && i === 0}
              />
            ))}
          </div>
        </section>
      )}

      {results.length === 0 && upcoming.length === 0 && (
        <StatePanel
          title="No games found"
          body="The schedule feed did not return any Knicks games for this season."
          variant="empty"
        />
      )}

    </div>
  );
}
