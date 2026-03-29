import Link from 'next/link';
import SectionShell from '@/components/ui/SectionShell';
import StatePanel from '@/components/ui/StatePanel';
import StatCard from '@/components/ui/StatCard';
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
} from '@/lib/nba';
import { formatCalendarDate } from '@/lib/time';

function winPctLabel(wins: number, losses: number) {
  const total = wins + losses;
  return `${((wins / (total || 1)) * 100).toFixed(1)}% win rate`;
}

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
  const record = computeRecord(games);
  const nextGame = getNextGame(games);
  const last10 = getRecentRecord(games, 10);
  const streak = getCurrentStreak(games);
  const knicksStanding = standings.find(row => row.team.abbreviation === 'NYK');

  return (
    <div className="space-y-12">
      <section
        className="hero-mesh rounded-3xl overflow-hidden fade-in relative"
        style={{ border: '1px solid #1E2D3D' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            style={{
              position: 'absolute',
              inset: '10% auto auto 8%',
              width: '16rem',
              height: '16rem',
              background: 'radial-gradient(circle, rgba(0,107,182,0.18) 0%, transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '5%',
              bottom: '8%',
              width: '14rem',
              height: '14rem',
              background: 'radial-gradient(circle, rgba(245,132,38,0.14) 0%, transparent 72%)',
            }}
          />
        </div>

        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p
                className="text-xs font-semibold tracking-widest mb-4"
                style={{ color: '#F58426', letterSpacing: '0.2em' }}
              >
                KNICKS CONTROL CENTER
              </p>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(3.25rem, 10vw, 6.5rem)',
                  lineHeight: 0.92,
                  letterSpacing: '0.04em',
                  color: '#FFFFFF',
                }}
              >
                <span style={{ color: '#F58426' }}>NEW YORK</span>
                <br />
                KNICKS
              </h1>
              <p className="mt-5 max-w-xl text-sm sm:text-base" style={{ color: '#AFC0D2', lineHeight: 1.7 }}>
                Built around the next thing a fan wants to know: where the Knicks sit, who is next,
                how they are trending, and where to jump for the deeper context.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {[
                  knicksStanding ? `East #${knicksStanding.rank}` : '',
                  `${record.wins}-${record.losses}`,
                  streak.type ? `${streak.type}${streak.count} streak` : 'No streak yet',
                  updatedAtLabel,
                ].filter(Boolean).map(item => (
                  <span
                    key={item}
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      color: '#DCE7F3',
                      backgroundColor: 'rgba(15,25,35,0.72)',
                      border: '1px solid rgba(30,45,61,0.8)',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="card rounded-3xl p-6 w-full xl:max-w-md"
              style={{
                backgroundColor: 'rgba(11,20,31,0.84)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <p
                className="text-xs font-semibold tracking-widest"
                style={{ color: '#F58426', letterSpacing: '0.18em' }}
              >
                NEXT GAME
              </p>
              {nextGame ? (
                <>
                  <h2
                    className="mt-3"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2.3rem',
                      lineHeight: 1,
                      letterSpacing: '0.05em',
                      color: '#FFFFFF',
                    }}
                  >
                    {getGameMatchupShortLabel(nextGame)}
                  </h2>
                  <p className="mt-2 text-base" style={{ color: '#DCE7F3' }}>
                    {getGameMatchupLabel(nextGame)}
                  </p>
                  <div className="mt-4 space-y-1 text-sm" style={{ color: '#8899AA' }}>
                    <p>{formatCalendarDate(nextGame.date)}</p>
                    <p>{getGameTipoffLabel(nextGame)}</p>
                  </div>
                  {getGameRelativeLabel(nextGame) && (
                    <span
                      className="inline-flex mt-4 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: 'rgba(245,132,38,0.14)',
                        color: '#F58426',
                        border: '1px solid rgba(245,132,38,0.3)',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {getGameRelativeLabel(nextGame)}
                    </span>
                  )}
                </>
              ) : (
                <p className="mt-4" style={{ color: '#8899AA' }}>
                  No upcoming regular-season games were found.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 fade-in-delay">
        <StatCard
          label="EAST SEED"
          value={knicksStanding ? `#${knicksStanding.rank}` : '—'}
          detail={knicksStanding ? `${knicksStanding.gb === 0 ? 'Conference lead' : `${knicksStanding.gb.toFixed(knicksStanding.gb % 1 === 0 ? 0 : 1)} GB`} in the East` : 'Standings unavailable'}
          accent="#006BB6"
        />
        <StatCard
          label="RECORD"
          value={`${record.wins}–${record.losses}`}
          detail={winPctLabel(record.wins, record.losses)}
        />
        <StatCard
          label="CURRENT STREAK"
          value={streak.type ? `${streak.type}${streak.count}` : '—'}
          detail={streak.type ? `${streak.type === 'W' ? 'Wins' : 'Losses'} in a row` : 'No completed games yet'}
          accent={streak.type === 'L' ? '#FF3D3D' : '#F58426'}
        />
        <StatCard
          label="LAST 10"
          value={`${last10.wins}–${last10.losses}`}
          detail={last10.wins >= 7 ? 'Trending up' : last10.wins >= 5 ? 'Holding steady' : 'Needs attention'}
          accent={last10.wins >= 7 ? '#00C853' : last10.wins >= 5 ? '#F58426' : '#FF3D3D'}
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 fade-in-delay-2">
        <SectionShell
          title="FAST PATHS"
          subtitle="Jump into the three views that matter most on game day."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/standings', label: 'Standings', sub: 'Conference race and playoff line', icon: '📊' },
              { href: '/schedule', label: 'Schedule', sub: 'Upcoming games and recent results', icon: '📅' },
              { href: '/analyst', label: 'Analyst', sub: 'Matchup breakdowns and scouting', icon: '🔬' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="card card-orange rounded-2xl p-5 block"
                style={{ textDecoration: 'none' }}
              >
                <div className="text-3xl mb-3">{link.icon}</div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.15rem',
                    color: '#FFFFFF',
                    letterSpacing: '0.06em',
                  }}
                >
                  {link.label.toUpperCase()}
                </div>
                <p className="mt-2 text-sm" style={{ color: '#8899AA', lineHeight: 1.6 }}>
                  {link.sub}
                </p>
              </Link>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          title="RACE CHECK"
          subtitle="Context around where New York sits right now."
        >
          <div className="card rounded-2xl p-5 space-y-3">
            {knicksStanding ? (
              <>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#8899AA' }}>Knicks position</span>
                  <span style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>
                    #{knicksStanding.rank} East
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#8899AA' }}>Games back</span>
                  <span style={{ color: '#FFFFFF' }}>
                    {knicksStanding.gb === 0 ? 'Leading the East' : `${knicksStanding.gb.toFixed(knicksStanding.gb % 1 === 0 ? 0 : 1)} GB`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#8899AA' }}>Conference record</span>
                  <span style={{ color: '#FFFFFF' }}>
                    {knicksStanding.conferenceWins}-{knicksStanding.conferenceLosses}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#8899AA' }}>Point differential</span>
                  <span style={{ color: '#FFFFFF' }}>
                    {knicksStanding.pointDifferential > 0 ? '+' : ''}
                    {knicksStanding.pointDifferential}
                  </span>
                </div>
              </>
            ) : (
              <p style={{ color: '#8899AA' }}>Standings context is unavailable right now.</p>
            )}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
