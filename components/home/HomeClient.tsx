'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

export type HomeClientProps = {
  record: { wins: number; losses: number };
  last10: { wins: number; losses: number };
  streak: { type: 'W' | 'L' | null; count: number };
  standing: {
    rank: number;
    gb: number;
    conferenceWins: number;
    conferenceLosses: number;
    pointDifferential: number;
  } | null;
  updatedAtLabel: string;
  last10Results: boolean[]; // true = W, chronological oldest → newest
  nextGame: {
    shortLabel: string;
    matchupLabel: string;
    date: string;
    time: string;
    relativeLabel: string;
  } | null;
};

// ── Count-up hook ──────────────────────────────────────────────────────────────

function useCountUp(target: number, durationMs = 800, delayMs = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const tid = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / durationMs, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(eased * target));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      clearTimeout(tid);
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs, delayMs]);
  return value;
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function BarChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="13" width="4" height="8" rx="1" />
      <rect x="10" y="8" width="4" height="13" rx="1" />
      <rect x="17" y="4" width="4" height="17" rx="1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polyline points="3,17 9,11 13,15 21,7" />
      <polyline points="16,7 21,7 21,12" />
    </svg>
  );
}

// ── Section Label ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '0.75rem',
        marginBottom: '1.25rem',
      }}
    >
      <div
        style={{
          width: '3px',
          borderRadius: '2px',
          background: '#F58426',
          flexShrink: 0,
        }}
      />
      <div>{children}</div>
    </div>
  );
}

// ── Playoff Status helper ──────────────────────────────────────────────────────

function getPlayoffStatus(rank: number): { label: string; color: string } {
  if (rank <= 6) return { label: 'CLINCHED', color: '#00C853' };
  if (rank <= 10) return { label: 'IN CONTENTION', color: '#F58426' };
  return { label: 'ELIMINATED', color: '#FF3D3D' };
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function HomeClient({
  record,
  last10,
  streak,
  standing,
  updatedAtLabel,
  last10Results,
  nextGame,
}: HomeClientProps) {
  // Count-up animation targets
  const seedAnim     = useCountUp(standing?.rank ?? 0, 600, 80);
  const recordWAnim  = useCountUp(record.wins,          800, 60);
  const recordLAnim  = useCountUp(record.losses,        800, 60);
  const streakAnim   = useCountUp(streak.count,         600, 120);
  const last10WAnim  = useCountUp(last10.wins,          700, 180);
  const last10LAnim  = useCountUp(last10.losses,        700, 180);

  const winPct = (record.wins / ((record.wins + record.losses) || 1)) * 100;

  const isToday = nextGame?.relativeLabel === 'TODAY';
  const isTomorrow = nextGame?.relativeLabel === 'TOMORROW';

  // Trending: last 5 vs first 5
  const first5W = last10Results.slice(0, 5).filter(Boolean).length;
  const last5W  = last10Results.slice(5).filter(Boolean).length;
  const trendLabel = last5W > first5W ? 'Trending Up' : last5W < first5W ? 'Trending Down' : 'Holding Steady';
  const trendColor = last5W > first5W ? '#00C853' : last5W < first5W ? '#FF3D3D' : '#F58426';

  const streakColor = streak.type === 'L' ? '#FF3D3D' : streak.type === 'W' ? '#00C853' : '#F58426';

  const ps = standing ? getPlayoffStatus(standing.rank) : null;

  const fastPaths = [
    { href: '/standings', label: 'Standings', sub: 'Conference race and playoff line',   Icon: BarChartIcon },
    { href: '/schedule',  label: 'Schedule',  sub: 'Upcoming games and recent results',  Icon: CalendarIcon },
    { href: '/analyst',   label: 'Analyst',   sub: 'Matchup breakdowns and scouting',    Icon: TrendIcon    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — full-bleed, no border, cinematic
      ════════════════════════════════════════════════════════════════════════ */}
      <section
        className="fade-in"
        style={{
          margin: '0 -1rem',
          padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)',
          background: 'radial-gradient(ellipse 90% 80% at 40% 45%, rgba(12,26,44,0.98) 0%, #080C14 72%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: '-5rem', left: '-3rem', width: '32rem', height: '32rem', background: 'radial-gradient(circle, rgba(0,107,182,0.13) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-3rem', right: '3%', width: '22rem', height: '22rem', background: 'radial-gradient(circle, rgba(245,132,38,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div
          className="flex flex-col xl:flex-row xl:items-end xl:justify-between"
          style={{ position: 'relative', gap: '2.5rem', maxWidth: '70rem', margin: '0 auto' }}
        >
          {/* ── Left: title block ── */}
          <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: '38rem' }}>

            {/* Editorial label */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderLeft: '3px solid #F58426',
                paddingLeft: '0.7rem',
                marginBottom: '1.5rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.3em',
                  color: '#F58426',
                  textTransform: 'uppercase',
                }}
              >
                Knicks Control Center
              </span>
            </div>

            {/* H1 */}
            <h1
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 'clamp(4rem, 11vw, 8rem)',
                lineHeight: 0.9,
                letterSpacing: '0.02em',
                margin: 0,
                color: '#FFFFFF',
              }}
            >
              <span style={{ color: '#F58426' }}>NEW YORK</span>
              <br />
              KNICKS
            </h1>

            {/* Tagline */}
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.93rem',
                color: '#8899AA',
                lineHeight: 1.75,
                marginTop: '1.25rem',
                maxWidth: '30rem',
              }}
            >
              Built around the next thing a fan wants to know: where the Knicks sit,
              who is next, how they are trending, and where to jump for deeper context.
            </p>

            {/* Stat chips — border only, no fill */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.25rem' }}>
              {[
                standing ? `East #${standing.rank}` : null,
                `${record.wins}–${record.losses}`,
                streak.type ? `${streak.type}${streak.count} streak` : null,
                updatedAtLabel,
              ]
                .filter(Boolean)
                .map(chip => (
                  <span
                    key={chip as string}
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#AFC0D2',
                      border: '1px solid rgba(255,255,255,0.13)',
                      borderRadius: '4px',
                      padding: '0.22rem 0.65rem',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {chip}
                  </span>
                ))}
            </div>
          </div>

          {/* ── Right: Next Game card ── */}
          <div
            style={{
              flexShrink: 0,
              width: '100%',
              maxWidth: '22rem',
              background: 'rgba(8,16,28,0.88)',
              backdropFilter: 'blur(14px)',
              borderTop: '1px solid rgba(0,107,182,0.22)',
              borderRight: '1px solid rgba(0,107,182,0.22)',
              borderBottom: '1px solid rgba(0,107,182,0.22)',
              borderLeft: '4px solid #006BB6',
              borderRadius: '4px',
              padding: '1.5rem 1.75rem',
            }}
          >
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.26em',
                color: '#006BB6',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Next Game
            </p>

            {nextGame ? (
              <>
                <div
                  style={{
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: 'clamp(2.2rem, 5vw, 2.8rem)',
                    lineHeight: 1,
                    letterSpacing: '0.03em',
                    color: '#FFFFFF',
                  }}
                >
                  {nextGame.shortLabel}
                </div>
                <p
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.85rem',
                    color: '#8FCBFF',
                    marginTop: '0.35rem',
                  }}
                >
                  {nextGame.matchupLabel}
                </p>
                <div
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.82rem',
                    color: '#8899AA',
                    marginTop: '0.75rem',
                    lineHeight: 1.6,
                  }}
                >
                  <p>{nextGame.date}</p>
                  <p>{nextGame.time}</p>
                </div>

                {(isToday || isTomorrow || nextGame.relativeLabel) && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isToday && (
                      <span className="pulse-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#F58426', flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.16em',
                        color: isToday ? '#F58426' : '#8899AA',
                        border: `1px solid ${isToday ? 'rgba(245,132,38,0.4)' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: '4px',
                        padding: '0.2rem 0.6rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {nextGame.relativeLabel}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.9rem' }}>
                No upcoming games found.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STAT CARDS — 4 cards, Record featured
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="fade-in-delay">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
          }}
          className="sm:grid-cols-2 xl:grid-cols-4"
        >
          {/* East Seed */}
          <div
            style={{
              background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
              border: '1px solid #1E2D3D',
              borderTop: '3px solid #006BB6',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
            }}
          >
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', color: '#006BB6', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              East Seed
            </p>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FFFFFF', lineHeight: 1, letterSpacing: '0.02em' }}>
              #{seedAnim}
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {standing ? (standing.gb === 0 ? 'Conference lead' : `${standing.gb % 1 === 0 ? standing.gb : standing.gb.toFixed(1)} GB`) : 'East'}
            </p>
          </div>

          {/* Record — featured */}
          <div
            style={{
              background: 'linear-gradient(160deg, #111d2e 0%, #0b1825 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderTop: '3px solid #FFFFFF',
              borderRadius: '16px',
              padding: '1.75rem',
              gridColumn: 'span 1',
              boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
              position: 'relative',
            }}
          >
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', color: '#FFFFFF', marginBottom: '0.75rem', textTransform: 'uppercase', opacity: 0.7 }}>
              Record
            </p>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2.8rem, 7vw, 4rem)', color: '#FFFFFF', lineHeight: 1, letterSpacing: '0.02em' }}>
              {recordWAnim}–{recordLAnim}
            </div>
            {/* Win rate progress bar */}
            <div style={{ marginTop: '0.85rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '100px', height: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${winPct}%`,
                    background: '#006BB6',
                    height: '100%',
                    borderRadius: '100px',
                    transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
              </div>
              <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                {winPct.toFixed(1)}% win rate
              </p>
            </div>
          </div>

          {/* Current Streak */}
          <div
            style={{
              background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
              border: '1px solid #1E2D3D',
              borderTop: `3px solid ${streakColor}`,
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
            }}
          >
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', color: streakColor, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Streak
            </p>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FFFFFF', lineHeight: 1, letterSpacing: '0.02em' }}>
              {streak.type ? `${streak.type}${streakAnim}` : '—'}
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {streak.type ? `${streak.type === 'W' ? 'Wins' : 'Losses'} in a row` : 'No completed games yet'}
            </p>
          </div>

          {/* Last 10 */}
          <div
            style={{
              background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
              border: '1px solid #1E2D3D',
              borderTop: '3px solid #F58426',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
            }}
          >
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', color: '#F58426', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Last 10
            </p>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FFFFFF', lineHeight: 1, letterSpacing: '0.02em' }}>
              {last10WAnim}–{last10LAnim}
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {last10.wins >= 7 ? 'Trending up' : last10.wins >= 5 ? 'Holding steady' : 'Needs attention'}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LAST 10 CIRCLES
      ════════════════════════════════════════════════════════════════════════ */}
      {last10Results.length > 0 && (
        <section className="fade-in-delay-2">
          <div
            style={{
              background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
              border: '1px solid #1E2D3D',
              borderRadius: '16px',
              padding: '1.5rem 1.75rem',
            }}
          >
            <p
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '0.78rem',
                letterSpacing: '0.24em',
                color: '#F58426',
                marginBottom: '1rem',
                textTransform: 'uppercase',
              }}
            >
              Last 10 Games
            </p>

            {/* Circles row */}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {last10Results.map((won, i) => (
                <div
                  key={i}
                  title={won ? 'Win' : 'Loss'}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: won ? '#006BB6' : '#FF3D3D',
                    flexShrink: 0,
                    boxShadow: won
                      ? '0 0 8px rgba(0,107,182,0.45)'
                      : '0 0 8px rgba(255,61,61,0.35)',
                  }}
                />
              ))}
            </div>

            {/* Record + trend */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginTop: '1rem' }}>
              <span
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '2.4rem',
                  color: '#FFFFFF',
                  lineHeight: 1,
                  letterSpacing: '0.02em',
                }}
              >
                {last10.wins}–{last10.losses}
              </span>
              <span
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: trendColor,
                  letterSpacing: '0.04em',
                }}
              >
                {trendLabel}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FAST PATHS + RACE CHECK
      ════════════════════════════════════════════════════════════════════════ */}
      <div
        className="fade-in-delay-3"
        style={{ display: 'grid', gap: '1.5rem' }}
        data-cols="two"
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
          {/* ── Fast Paths ── */}
          <section>
            <SectionLabel>
              <h2
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.1rem',
                  color: '#FFFFFF',
                  letterSpacing: '0.1em',
                  margin: 0,
                }}
              >
                Fast Paths
              </h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Jump into the three views that matter most on game day.
              </p>
            </SectionLabel>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {fastPaths.map(({ href, label, sub, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="fast-path-card"
                  style={{
                    display: 'block',
                    background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
                    border: '1px solid #1E2D3D',
                    borderRadius: '16px',
                    padding: '1.4rem 1.5rem',
                    textDecoration: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                  }}
                >
                  <div
                    className="fast-path-icon"
                    style={{
                      color: '#8899AA',
                      marginBottom: '0.9rem',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <Icon />
                  </div>
                  <div
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1.1rem',
                      color: '#FFFFFF',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {label.toUpperCase()}
                  </div>
                  <p
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '0.82rem',
                      color: '#8899AA',
                      lineHeight: 1.6,
                      marginTop: '0.4rem',
                    }}
                  >
                    {sub}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Race Check ── */}
          <section>
            <SectionLabel>
              <h2
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.1rem',
                  color: '#FFFFFF',
                  letterSpacing: '0.1em',
                  margin: 0,
                }}
              >
                Race Check
              </h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Context around where New York sits right now.
              </p>
            </SectionLabel>

            <div
              style={{
                background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
                border: '1px solid #1E2D3D',
                borderRadius: '16px',
                padding: '1.4rem 1.5rem',
              }}
            >
              {standing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

                  {/* Knicks Position with seed indicator */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.7rem 0',
                      borderBottom: '1px solid rgba(30,45,61,0.7)',
                    }}
                  >
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#8899AA' }}>
                      Knicks Position
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Seed indicator bars */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                        {Array.from({ length: 8 }, (_, i) => {
                          const pos = i + 1;
                          const isActive = pos === standing.rank;
                          const isPlayoff = pos <= 6;
                          return (
                            <div
                              key={pos}
                              style={{
                                height: '3px',
                                width: `${26 - i * 2}px`,
                                borderRadius: '2px',
                                background: isActive
                                  ? '#F58426'
                                  : isPlayoff
                                    ? 'rgba(0,107,182,0.28)'
                                    : 'rgba(136,153,170,0.12)',
                              }}
                            />
                          );
                        })}
                      </div>
                      <span
                        style={{
                          fontFamily: 'Bebas Neue, sans-serif',
                          fontSize: '1.5rem',
                          color: '#FFFFFF',
                          letterSpacing: '0.02em',
                          lineHeight: 1,
                        }}
                      >
                        #{standing.rank} East
                      </span>
                    </div>
                  </div>

                  {/* Games Back */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.7rem 0',
                      borderBottom: '1px solid rgba(30,45,61,0.7)',
                    }}
                  >
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#8899AA' }}>
                      Games Back
                    </span>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#FFFFFF', letterSpacing: '0.02em' }}>
                      {standing.gb === 0
                        ? 'Leading'
                        : `${standing.gb % 1 === 0 ? standing.gb : standing.gb.toFixed(1)} GB`}
                    </span>
                  </div>

                  {/* Conference Record */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.7rem 0',
                      borderBottom: '1px solid rgba(30,45,61,0.7)',
                    }}
                  >
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#8899AA' }}>
                      Conf. Record
                    </span>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#FFFFFF', letterSpacing: '0.02em' }}>
                      {standing.conferenceWins}–{standing.conferenceLosses}
                    </span>
                  </div>

                  {/* Point Differential */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.7rem 0',
                      borderBottom: '1px solid rgba(30,45,61,0.7)',
                    }}
                  >
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#8899AA' }}>
                      Point Diff
                    </span>
                    <span
                      style={{
                        fontFamily: 'Bebas Neue, sans-serif',
                        fontSize: '1.3rem',
                        color: standing.pointDifferential >= 0 ? '#00C853' : '#FF3D3D',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}
                    </span>
                  </div>

                  {/* Playoff Status */}
                  {ps && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.7rem 0',
                      }}
                    >
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#8899AA' }}>
                        Playoff Status
                      </span>
                      <span
                        style={{
                          fontFamily: 'Bebas Neue, sans-serif',
                          fontSize: '1rem',
                          color: ps.color,
                          letterSpacing: '0.06em',
                          border: `1px solid ${ps.color}40`,
                          borderRadius: '4px',
                          padding: '0.15rem 0.55rem',
                          background: `${ps.color}12`,
                        }}
                      >
                        {ps.label}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.9rem' }}>
                  Standings context is unavailable right now.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

    </div>
  );
}
