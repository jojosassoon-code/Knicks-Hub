// app/page.tsx — Home Page (/)
import { getKnicksGames, computeRecord, getNextGame, getRecentResults } from '@/lib/nba';
import Link from 'next/link';

function formatGameDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
}

function formatGameTime(datetimeStr: string) {
  if (!datetimeStr) return 'TBD';
  const d = new Date(datetimeStr);
  if (d.getUTCHours() === 0) return 'TBD';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
    timeZone: 'America/New_York', timeZoneName: 'short',
  });
}

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T12:00:00`);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export default async function HomePage() {
  let games;
  try {
    games = await getKnicksGames();
  } catch {
    return (
      <div className="text-center py-20 fade-in">
        <p style={{ color: '#FF3D3D', fontSize: '1.1rem' }}>Could not load data. Please try again later.</p>
      </div>
    );
  }

  const record   = computeRecord(games);
  const nextGame = getNextGame(games);
  const last10   = getRecentResults(games, 10);
  const winPct   = ((record.wins / (record.wins + record.losses || 1)) * 100).toFixed(1);

  const l10 = last10.reduce(
    (acc, g) => {
      const knicksHome = g.home_team.abbreviation === 'NYK';
      const scored  = knicksHome ? g.home_team_score : g.visitor_team_score;
      const allowed = knicksHome ? g.visitor_team_score : g.home_team_score;
      return scored > allowed ? { ...acc, w: acc.w + 1 } : { ...acc, l: acc.l + 1 };
    },
    { w: 0, l: 0 },
  );

  const nextOpponentShort = nextGame
    ? nextGame.home_team.abbreviation === 'NYK'
      ? `vs ${nextGame.visitor_team.abbreviation}`
      : `@ ${nextGame.home_team.abbreviation}`
    : null;

  const nextOpponentFull = nextGame
    ? nextGame.home_team.abbreviation === 'NYK'
      ? `vs ${nextGame.visitor_team.full_name}`
      : `@ ${nextGame.home_team.full_name}`
    : null;

  const formLabel = l10.w >= 8 ? 'On Fire 🔥' : l10.w >= 6 ? 'Playing Well' : l10.w >= 4 ? 'Mixed Bag' : 'Rough Stretch';

  return (
    <div className="space-y-12">

      {/* ── Hero ── */}
      <section className="hero-mesh rounded-3xl overflow-hidden fade-in" style={{ border: '1px solid #1E2D3D' }}>
        <div className="px-8 py-14 sm:py-20 text-center relative">
          {/* Glow accent */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div style={{
              width: '50%', height: '60%',
              background: 'radial-gradient(ellipse, rgba(0,107,182,0.12) 0%, transparent 70%)',
            }} />
          </div>

          <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: '#F58426', fontFamily: 'var(--font-body)', letterSpacing: '0.2em' }}>
            2025 – 26 SEASON
          </p>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3.5rem, 12vw, 7rem)',
            lineHeight: 0.92,
            letterSpacing: '0.04em',
            color: '#FFFFFF',
          }}>
            <span style={{ color: '#F58426' }}>NEW YORK</span>
            <br />KNICKS
          </h1>

          {/* Record pill */}
          <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
            <div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
              style={{ backgroundColor: 'rgba(0,107,182,0.25)', border: '1px solid rgba(0,107,182,0.5)' }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#FFFFFF', letterSpacing: '0.05em' }}>
                {record.wins}–{record.losses}
              </span>
              <span style={{ color: '#8899AA', fontSize: '0.85rem' }}>·</span>
              <span style={{ color: '#8899AA', fontSize: '0.85rem' }}>{winPct}% WIN</span>
            </div>
          </div>

          {/* Next game card */}
          {nextGame && (
            <div
              className="mt-8 inline-block rounded-2xl px-8 py-4 text-center"
              style={{
                backgroundColor: 'rgba(15,25,35,0.8)',
                border: '1px solid rgba(245,132,38,0.35)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p className="text-xs tracking-widest mb-2" style={{ color: '#F58426', fontFamily: 'var(--font-body)' }}>
                NEXT GAME
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#FFFFFF', letterSpacing: '0.05em' }}>
                {nextOpponentFull}
              </p>
              <p className="text-sm mt-1" style={{ color: '#8899AA' }}>
                {formatGameDate(nextGame.date)} · {formatGameTime(nextGame.datetime)}
              </p>
              {daysUntil(nextGame.date) === 0 && (
                <p className="text-xs mt-1 font-semibold" style={{ color: '#00C853' }}>TONIGHT</p>
              )}
              {daysUntil(nextGame.date) === 1 && (
                <p className="text-xs mt-1 font-semibold" style={{ color: '#FFD600' }}>TOMORROW</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Stat Cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-in-delay">

        {/* Record */}
        <div className="card rounded-2xl p-7 text-center">
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: '#F58426', fontFamily: 'var(--font-body)', letterSpacing: '0.18em' }}>
            SEASON RECORD
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', color: '#FFFFFF', lineHeight: 1 }}>
            {record.wins}–{record.losses}
          </p>
          <p className="text-xs mt-2" style={{ color: '#8899AA' }}>
            {winPct}% win rate
          </p>
        </div>

        {/* Last 10 */}
        <div className="card rounded-2xl p-7 text-center">
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: '#F58426', fontFamily: 'var(--font-body)', letterSpacing: '0.18em' }}>
            LAST 10 GAMES
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', color: '#FFFFFF', lineHeight: 1 }}>
            {l10.w}–{l10.l}
          </p>
          <p className="text-xs mt-2" style={{ color: l10.w >= 6 ? '#00C853' : l10.w >= 4 ? '#FFD600' : '#FF3D3D' }}>
            {formLabel}
          </p>
        </div>

        {/* Next game */}
        <div className="card rounded-2xl p-7 text-center">
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: '#F58426', fontFamily: 'var(--font-body)', letterSpacing: '0.18em' }}>
            UP NEXT
          </p>
          {nextGame ? (
            <>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: '#FFFFFF', lineHeight: 1.1 }}>
                {nextOpponentShort}
              </p>
              <p className="text-xs mt-2" style={{ color: '#8899AA' }}>
                {formatGameDate(nextGame.date)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#8899AA' }}>
                {formatGameTime(nextGame.datetime)}
              </p>
            </>
          ) : (
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#8899AA' }}>Season Over</p>
          )}
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="fade-in-delay-2">
        <div className="section-label mb-6">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#FFFFFF', letterSpacing: '0.06em' }}>
            EXPLORE
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/standings', label: 'Standings', sub: 'East Conference', icon: '📊' },
            { href: '/schedule',  label: 'Schedule',  sub: '2025–26 Season', icon: '📅' },
            { href: '/analyst',   label: 'Analyst',   sub: 'Matchup Analysis', icon: '🔬' },
            { href: '/news',      label: 'News',      sub: 'Latest Headlines', icon: '📰' },
          ].map(({ href, label, sub, icon }) => (
            <Link
              key={href}
              href={href}
              className="card card-orange rounded-2xl p-5 text-center block"
              style={{ textDecoration: 'none' }}
            >
              <div className="text-3xl mb-3">{icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#FFFFFF', letterSpacing: '0.06em' }}>
                {label.toUpperCase()}
              </div>
              <div className="text-xs mt-1" style={{ color: '#8899AA' }}>{sub}</div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
