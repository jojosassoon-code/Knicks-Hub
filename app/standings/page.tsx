// app/standings/page.tsx — Eastern Conference Standings (/standings)
import { getEasternStandings } from '@/lib/nba';
import { getPrimaryColor } from '@/lib/teamColors';

export default async function StandingsPage() {
  let standings;

  try {
    standings = await getEasternStandings();
  } catch {
    return (
      <div className="text-center py-20 fade-in">
        <p style={{ color: '#FF3D3D', fontSize: '1.1rem' }}>Could not load standings. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">

      {/* ── Page Header ── */}
      <div className="section-label">
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
            color: '#FFFFFF',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}>
            EASTERN CONFERENCE
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#8899AA' }}>
            2025–26 Season · Updated every 24 hours
          </p>
        </div>
      </div>

      {/* ── Standings Table ── */}
      <div
        className="card rounded-2xl overflow-hidden fade-in-delay"
        style={{ padding: 0 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(0,107,182,0.2)', borderBottom: '1px solid #1E2D3D' }}>
                {[
                  { label: '#',    align: 'center', width: '3rem'  },
                  { label: 'Team', align: 'left',   width: 'auto'  },
                  { label: 'W',    align: 'center', width: '3.5rem'},
                  { label: 'L',    align: 'center', width: '3.5rem'},
                  { label: 'PCT',  align: 'center', width: '4rem'  },
                  { label: 'GB',   align: 'center', width: '4rem'  },
                ].map(col => (
                  <th
                    key={col.label}
                    className="py-3 px-4 text-left"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.12em',
                      color: '#8899AA',
                      textAlign: col.align as 'left' | 'center',
                      width: col.width,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => {
                const isKnicks  = row.team.abbreviation === 'NYK';
                const isPlayoff = i < 6;
                const isPlayIn  = i >= 6 && i < 10;
                const teamColor = getPrimaryColor(row.team.abbreviation);
                // Insert divider markers
                const showPlayoffLine  = i === 6;
                const showPlayInLine   = i === 10;

                return [
                  // Playoff divider — dashed row between seeds 6 & 7
                  showPlayoffLine && (
                    <tr key="playoff-line" style={{ height: '0' }}>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div
                          className="flex items-center gap-3 px-4 py-1"
                          style={{ borderTop: '1px dashed rgba(0,200,83,0.4)', borderBottom: '1px dashed rgba(0,200,83,0.4)' }}
                        >
                          <span style={{
                            fontSize: '0.6rem',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '0.14em',
                            color: '#00C853',
                            opacity: 0.7,
                          }}>
                            — PLAYOFF LINE —
                          </span>
                        </div>
                      </td>
                    </tr>
                  ),
                  // Play-in divider — dashed row between seeds 10 & 11
                  showPlayInLine && (
                    <tr key="playin-line" style={{ height: '0' }}>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div
                          className="flex items-center gap-3 px-4 py-1"
                          style={{ borderTop: '1px dashed rgba(245,132,38,0.4)', borderBottom: '1px dashed rgba(245,132,38,0.4)' }}
                        >
                          <span style={{
                            fontSize: '0.6rem',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '0.14em',
                            color: '#F58426',
                            opacity: 0.7,
                          }}>
                            — PLAY-IN LINE —
                          </span>
                        </div>
                      </td>
                    </tr>
                  ),
                  // Data row
                  <tr
                    key={row.team.abbreviation}
                    className="standings-row"
                    style={{
                      backgroundColor: isKnicks
                        ? 'rgba(0,107,182,0.12)'
                        : i % 2 === 0
                          ? 'rgba(15,25,35,0.6)'
                          : 'rgba(10,21,32,0.4)',
                      borderBottom: '1px solid rgba(30,45,61,0.5)',
                      boxShadow: isKnicks ? 'inset 4px 0 0 #F58426' : undefined,
                    }}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1rem',
                        color: isKnicks ? '#F58426' : '#8899AA',
                        letterSpacing: '0.04em',
                      }}>
                        {i + 1}
                      </span>
                    </td>

                    {/* Team name + color dot */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {/* Team color dot */}
                        <span
                          className="flex-shrink-0 rounded-full"
                          style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: teamColor,
                            boxShadow: `0 0 6px ${teamColor}80`,
                          }}
                        />
                        {/* Name */}
                        <span
                          style={{
                            fontFamily: isKnicks ? 'var(--font-display)' : 'var(--font-body)',
                            fontSize: isKnicks ? '1rem' : '0.9rem',
                            color: isKnicks ? '#FFFFFF' : '#CCDDEE',
                            letterSpacing: isKnicks ? '0.05em' : '0.01em',
                            fontWeight: isKnicks ? undefined : 500,
                          }}
                        >
                          {row.team.full_name}
                        </span>
                        {/* Knicks badge */}
                        {isKnicks && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 'rgba(245,132,38,0.2)',
                              color: '#F58426',
                              border: '1px solid rgba(245,132,38,0.4)',
                              fontFamily: 'var(--font-display)',
                              letterSpacing: '0.1em',
                              fontSize: '0.65rem',
                            }}
                          >
                            YOU
                          </span>
                        )}
                        {/* Playoff/play-in tag */}
                        {(isPlayoff || isPlayIn) && !isKnicks && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: isPlayoff
                                ? 'rgba(0,200,83,0.12)'
                                : 'rgba(245,132,38,0.12)',
                              color: isPlayoff ? '#00C853' : '#F58426',
                              fontSize: '0.6rem',
                              fontFamily: 'var(--font-display)',
                              letterSpacing: '0.08em',
                            }}
                          >
                            {isPlayoff ? 'PO' : 'PI'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* W */}
                    <td className="py-3.5 px-4 text-center">
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1rem',
                        color: '#FFFFFF',
                        letterSpacing: '0.04em',
                      }}>
                        {row.wins}
                      </span>
                    </td>

                    {/* L */}
                    <td className="py-3.5 px-4 text-center">
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1rem',
                        color: '#8899AA',
                        letterSpacing: '0.04em',
                      }}>
                        {row.losses}
                      </span>
                    </td>

                    {/* PCT */}
                    <td className="py-3.5 px-4 text-center">
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.85rem',
                        color: '#AABBCC',
                      }}>
                        {row.pct.toFixed(3).replace(/^0/, '')}
                      </span>
                    </td>

                    {/* GB */}
                    <td className="py-3.5 px-4 text-center">
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.85rem',
                        color: '#8899AA',
                      }}>
                        {row.gb === 0 ? '—' : row.gb % 1 === 0 ? row.gb : row.gb.toFixed(1)}
                      </span>
                    </td>
                  </tr>,
                ].filter(Boolean);
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-5 text-xs fade-in-delay-2" style={{ color: '#8899AA' }}>
        <span className="flex items-center gap-2">
          <span
            className="rounded-full inline-block"
            style={{ width: '8px', height: '8px', backgroundColor: '#00C853' }}
          />
          Playoff berth (Top 6)
        </span>
        <span className="flex items-center gap-2">
          <span
            className="rounded-full inline-block"
            style={{ width: '8px', height: '8px', backgroundColor: '#F58426' }}
          />
          Play-In Tournament (7–10)
        </span>
        <span className="flex items-center gap-2">
          <span
            className="rounded-full inline-block"
            style={{ width: '8px', height: '8px', backgroundColor: '#8899AA' }}
          />
          Eliminated (11–15)
        </span>
      </div>

    </div>
  );
}
