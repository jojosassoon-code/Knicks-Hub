import PageHeader from '@/components/ui/PageHeader';
import SectionShell from '@/components/ui/SectionShell';
import StatePanel from '@/components/ui/StatePanel';
import TableShell from '@/components/ui/TableShell';
import { getPrimaryColor } from '@/lib/teamColors';
import { getEasternStandingsData } from '@/lib/nba';

export default async function StandingsPage() {
  let data: Awaited<ReturnType<typeof getEasternStandingsData>> | null = null;

  try {
    data = await getEasternStandingsData();
  } catch {}

  if (!data) {
    return (
      <StatePanel
        title="Could not load standings"
        body="The standings feed is unavailable right now. Please try again shortly."
        variant="error"
      />
    );
  }

  const { standings, updatedAtLabel, sortNote } = data;
  const knicksIndex = standings.findIndex(row => row.team.abbreviation === 'NYK');

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="EASTERN CONFERENCE"
        eyebrow="PLAYOFF PICTURE"
        metadata={['2025-26 Season', updatedAtLabel]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[0.72fr_1.28fr] gap-6">
        <SectionShell
          title="KNICKS SNAPSHOT"
          subtitle="Quick scan of New York's place in the East."
        >
          <div className="card rounded-2xl p-5 space-y-4">
            {knicksIndex >= 0 ? (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-widest" style={{ color: '#F58426', letterSpacing: '0.18em' }}>
                      CURRENT SLOT
                    </p>
                    <p
                      className="mt-2"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '3.2rem',
                        lineHeight: 1,
                        color: '#FFFFFF',
                      }}
                    >
                      #{standings[knicksIndex].rank}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: '#8899AA', fontSize: '0.8rem' }}>Record</p>
                    <p style={{ color: '#FFFFFF', fontSize: '1.1rem' }}>
                      {standings[knicksIndex].wins}-{standings[knicksIndex].losses}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(0,107,182,0.08)', border: '1px solid rgba(0,107,182,0.16)' }}>
                    <p style={{ color: '#8899AA', fontSize: '0.75rem' }}>Games back</p>
                    <p style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
                      {standings[knicksIndex].gb === 0 ? 'LEAD' : standings[knicksIndex].gb.toFixed(standings[knicksIndex].gb % 1 === 0 ? 0 : 1)}
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245,132,38,0.08)', border: '1px solid rgba(245,132,38,0.16)' }}>
                    <p style={{ color: '#8899AA', fontSize: '0.75rem' }}>Last 10</p>
                    <p style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
                      {standings[knicksIndex].last10.w}-{standings[knicksIndex].last10.l}
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: 'rgba(15,25,35,0.72)', border: '1px solid rgba(30,45,61,0.8)' }}
                >
                  <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: '#F58426', letterSpacing: '0.16em' }}>
                    RACE WINDOW
                  </p>
                  <div className="space-y-2">
                    {standings
                      .slice(Math.max(0, knicksIndex - 2), Math.min(standings.length, knicksIndex + 3))
                      .map(row => (
                        <div key={row.team.abbreviation} className="flex items-center justify-between text-sm">
                          <span style={{ color: row.team.abbreviation === 'NYK' ? '#FFFFFF' : '#AFC0D2' }}>
                            #{row.rank} {row.team.abbreviation}
                          </span>
                          <span style={{ color: '#8899AA' }}>
                            {row.wins}-{row.losses}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: '#8899AA' }}>Knicks standings data is unavailable.</p>
            )}
          </div>
        </SectionShell>

        <SectionShell
          title="FULL TABLE"
          subtitle="Deterministic fallback sorting improves tie handling without pretending to be the full NBA rulebook."
          metadata={[sortNote]}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {standings.map(row => {
                const isKnicks = row.team.abbreviation === 'NYK';
                const playoffTag = row.rank <= 6 ? 'Playoff' : row.rank <= 10 ? 'Play-In' : 'Chasing';
                return (
                  <div
                    key={row.team.abbreviation}
                    className="card rounded-2xl p-4"
                    style={{
                      boxShadow: isKnicks ? 'inset 4px 0 0 #F58426' : undefined,
                      backgroundColor: isKnicks ? 'rgba(0,107,182,0.12)' : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="rounded-full"
                          style={{
                            width: '10px',
                            height: '10px',
                            backgroundColor: getPrimaryColor(row.team.abbreviation),
                            boxShadow: `0 0 8px ${getPrimaryColor(row.team.abbreviation)}80`,
                          }}
                        />
                        <div>
                          <p style={{ color: '#FFFFFF', fontWeight: 600 }}>
                            #{row.rank} {row.team.full_name}
                          </p>
                          <p style={{ color: '#8899AA', fontSize: '0.8rem' }}>
                            {playoffTag} • GB {row.gb === 0 ? '—' : row.gb.toFixed(row.gb % 1 === 0 ? 0 : 1)}
                          </p>
                        </div>
                      </div>
                      {isKnicks && (
                        <span
                          className="px-2 py-1 rounded-full text-xs"
                          style={{
                            backgroundColor: 'rgba(245,132,38,0.18)',
                            color: '#F58426',
                            border: '1px solid rgba(245,132,38,0.32)',
                          }}
                        >
                          NYK
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                      <div>
                        <p style={{ color: '#8899AA' }}>Record</p>
                        <p style={{ color: '#FFFFFF' }}>{row.wins}-{row.losses}</p>
                      </div>
                      <div>
                        <p style={{ color: '#8899AA' }}>Pct</p>
                        <p style={{ color: '#FFFFFF' }}>{row.pct.toFixed(3).replace(/^0/, '')}</p>
                      </div>
                      <div>
                        <p style={{ color: '#8899AA' }}>Last 10</p>
                        <p style={{ color: '#FFFFFF' }}>{row.last10.w}-{row.last10.l}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <TableShell>
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,107,182,0.18)', borderBottom: '1px solid #1E2D3D' }}>
                      {[
                        { label: '#', align: 'center' },
                        { label: 'Team', align: 'left' },
                        { label: 'W', align: 'center' },
                        { label: 'L', align: 'center' },
                        { label: 'PCT', align: 'center' },
                        { label: 'GB', align: 'center' },
                        { label: 'L10', align: 'center' },
                      ].map(column => (
                        <th
                          key={column.label}
                          className="py-3 px-4"
                          style={{
                            textAlign: column.align as 'left' | 'center',
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.75rem',
                            letterSpacing: '0.12em',
                            color: '#8899AA',
                          }}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map(row => {
                      const isKnicks = row.team.abbreviation === 'NYK';
                      return (
                        <tr
                          key={row.team.abbreviation}
                          className="standings-row"
                          style={{
                            backgroundColor: isKnicks ? 'rgba(0,107,182,0.12)' : undefined,
                            boxShadow: isKnicks ? 'inset 4px 0 0 #F58426' : undefined,
                            borderBottom: '1px solid rgba(30,45,61,0.45)',
                          }}
                        >
                          <td className="py-3.5 px-4 text-center" style={{ color: isKnicks ? '#F58426' : '#8899AA' }}>
                            {row.rank}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span
                                className="rounded-full"
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  backgroundColor: getPrimaryColor(row.team.abbreviation),
                                  boxShadow: `0 0 8px ${getPrimaryColor(row.team.abbreviation)}80`,
                                }}
                              />
                              <span style={{ color: '#FFFFFF', fontWeight: isKnicks ? 700 : 500 }}>
                                {row.team.full_name}
                              </span>
                              {isKnicks && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: 'rgba(245,132,38,0.18)',
                                    color: '#F58426',
                                    border: '1px solid rgba(245,132,38,0.32)',
                                  }}
                                >
                                  KNICKS
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center" style={{ color: '#FFFFFF' }}>{row.wins}</td>
                          <td className="py-3.5 px-4 text-center" style={{ color: '#8899AA' }}>{row.losses}</td>
                          <td className="py-3.5 px-4 text-center" style={{ color: '#AFC0D2' }}>
                            {row.pct.toFixed(3).replace(/^0/, '')}
                          </td>
                          <td className="py-3.5 px-4 text-center" style={{ color: '#8899AA' }}>
                            {row.gb === 0 ? '—' : row.gb.toFixed(row.gb % 1 === 0 ? 0 : 1)}
                          </td>
                          <td className="py-3.5 px-4 text-center" style={{ color: '#AFC0D2' }}>
                            {row.last10.w}-{row.last10.l}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableShell>
            </div>
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
