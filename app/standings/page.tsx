import StatePanel from '@/components/ui/StatePanel';
import { getEasternStandingsData, type StandingRow } from '@/lib/nba';

// ── Seed dot colour ────────────────────────────────────────────────────────────

function seedDotColor(rank: number): string {
  if (rank <= 2)  return '#F5C542'; // gold
  if (rank <= 6)  return '#006BB6'; // blue
  if (rank <= 10) return '#F58426'; // orange
  return '#4A5568';                  // gray
}

// ── Zone row background ────────────────────────────────────────────────────────

function rowZoneBg(rank: number, isKnicks: boolean): string {
  if (isKnicks) return 'rgba(0,107,182,0.1)';
  if (rank >= 7  && rank <= 10) return 'rgba(245,132,38,0.04)';
  if (rank >= 11) return 'rgba(255,61,61,0.04)';
  return 'transparent';
}

// ── Zone divider ───────────────────────────────────────────────────────────────

function ZoneDivider({ label }: { label: string }) {
  return (
    <tr aria-hidden="true">
      <td
        colSpan={8}
        style={{
          padding: '0.35rem 1rem',
          background: 'rgba(8,12,20,0.6)',
          borderTop: '1px solid rgba(30,45,61,0.7)',
          borderBottom: '1px solid rgba(30,45,61,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(30,45,61,0.7)' }} />
          <span
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              color: '#4A5568',
            }}
          >
            {label}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(30,45,61,0.7)' }} />
        </div>
      </td>
    </tr>
  );
}

// ── L10 dots ───────────────────────────────────────────────────────────────────

function L10Dots({ w, l }: { w: number; l: number }) {
  const dots: boolean[] = [
    ...Array(w).fill(true),
    ...Array(l).fill(false),
  ];
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center', justifyContent: 'center' }}>
      {dots.map((won, i) => (
        <div
          key={i}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            flexShrink: 0,
            background: won ? '#006BB6' : '#FF3D3D',
          }}
        />
      ))}
    </div>
  );
}

// ── PCT bar ────────────────────────────────────────────────────────────────────

function PctCell({ pct }: { pct: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', color: '#AFC0D2' }}>
        {pct.toFixed(3).replace(/^0/, '')}
      </span>
      <div
        style={{
          width: '3.5rem',
          height: '3px',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: '100px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${(pct * 100).toFixed(1)}%`,
            height: '100%',
            background: '#006BB6',
            borderRadius: '100px',
          }}
        />
      </div>
    </div>
  );
}

// ── Table row ──────────────────────────────────────────────────────────────────

function StandingRowEl({ row }: { row: StandingRow }) {
  const isKnicks = row.team.abbreviation === 'NYK';

  return (
    <tr
      className="standings-row"
      style={{
        background: rowZoneBg(row.rank, isKnicks),
        borderBottom: '1px solid rgba(30,45,61,0.4)',
        borderLeft: isKnicks ? '4px solid #006BB6' : '4px solid transparent',
      }}
    >
      {/* Seed dot */}
      <td style={{ padding: '0.7rem 0.5rem 0.7rem 0.85rem', width: '1.5rem' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: seedDotColor(row.rank),
            margin: '0 auto',
          }}
        />
      </td>

      {/* Rank */}
      <td
        style={{
          padding: '0.7rem 0.5rem',
          textAlign: 'center',
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '1rem',
          letterSpacing: '0.04em',
          color: isKnicks ? '#F58426' : '#8899AA',
          width: '2rem',
        }}
      >
        {row.rank}
      </td>

      {/* Team */}
      <td style={{ padding: '0.7rem 0.75rem 0.7rem 0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.9rem',
              fontWeight: isKnicks ? 700 : 500,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            {row.team.full_name}
          </span>
          {isKnicks && (
            <span
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.58rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#F58426',
                background: 'rgba(245,132,38,0.14)',
                border: '1px solid rgba(245,132,38,0.3)',
                borderRadius: '4px',
                padding: '0.1rem 0.4rem',
              }}
            >
              NYK
            </span>
          )}
        </div>
      </td>

      {/* W */}
      <td
        style={{
          padding: '0.7rem 0.5rem',
          textAlign: 'center',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.88rem',
          fontWeight: 600,
          color: '#FFFFFF',
        }}
      >
        {row.wins}
      </td>

      {/* L */}
      <td
        style={{
          padding: '0.7rem 0.5rem',
          textAlign: 'center',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.88rem',
          color: '#8899AA',
        }}
      >
        {row.losses}
      </td>

      {/* PCT with bar */}
      <td style={{ padding: '0.7rem 0.5rem', textAlign: 'center' }}>
        <PctCell pct={row.pct} />
      </td>

      {/* GB */}
      <td
        style={{
          padding: '0.7rem 0.5rem',
          textAlign: 'center',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.88rem',
          color: row.gb === 0 ? '#4AA9F1' : '#8899AA',
          fontWeight: row.gb === 0 ? 700 : 400,
        }}
      >
        {row.gb === 0 ? '—' : row.gb % 1 === 0 ? row.gb : row.gb.toFixed(1)}
      </td>

      {/* L10 dots */}
      <td style={{ padding: '0.7rem 0.75rem 0.7rem 0.5rem', textAlign: 'center' }}>
        <L10Dots w={row.last10.w} l={row.last10.l} />
      </td>
    </tr>
  );
}

// ── Mobile card ────────────────────────────────────────────────────────────────

function MobileCard({ row }: { row: StandingRow }) {
  const isKnicks = row.team.abbreviation === 'NYK';
  return (
    <div
      style={{
        background: rowZoneBg(row.rank, isKnicks) !== 'transparent'
          ? rowZoneBg(row.rank, isKnicks)
          : 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
        border: '1px solid #1E2D3D',
        borderLeft: isKnicks ? '4px solid #006BB6' : `4px solid ${seedDotColor(row.rank)}30`,
        borderRadius: '12px',
        padding: '0.9rem 1rem',
        marginBottom: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: seedDotColor(row.rank), flexShrink: 0 }} />
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: isKnicks ? '#F58426' : '#8899AA', letterSpacing: '0.04em' }}>
            #{row.rank}
          </span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', fontWeight: isKnicks ? 700 : 500, color: '#FFFFFF' }}>
            {row.team.full_name}
          </span>
          {isKnicks && (
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em', color: '#F58426', background: 'rgba(245,132,38,0.14)', border: '1px solid rgba(245,132,38,0.3)', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>
              NYK
            </span>
          )}
        </div>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#FFFFFF', letterSpacing: '0.04em' }}>
          {row.wins}–{row.losses}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.65rem', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8899AA', textTransform: 'uppercase' }}>PCT</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', color: '#AFC0D2' }}>{row.pct.toFixed(3).replace(/^0/, '')}</div>
        </div>
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8899AA', textTransform: 'uppercase' }}>GB</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', color: row.gb === 0 ? '#4AA9F1' : '#8899AA' }}>
            {row.gb === 0 ? '—' : row.gb % 1 === 0 ? row.gb : row.gb.toFixed(1)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8899AA', textTransform: 'uppercase', marginBottom: '0.25rem' }}>L10</div>
          <L10Dots w={row.last10.w} l={row.last10.l} />
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

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

  const { standings, updatedAtLabel } = data;
  const knicks = standings.find(r => r.team.abbreviation === 'NYK');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Page header ── */}
      <header>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.75rem' }}>
          <div style={{ width: '3px', background: '#F58426', borderRadius: '2px' }} />
          <div>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', color: '#FFFFFF', letterSpacing: '0.05em', lineHeight: 1, margin: 0 }}>
              Eastern Conference
            </h1>
            <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.95rem', color: '#F58426', letterSpacing: '0.18em', marginTop: '0.2rem' }}>
              2025–26 STANDINGS
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.78rem', marginTop: '0.25rem' }}>
              {updatedAtLabel}
            </p>
          </div>
        </div>
      </header>

      {/* ── Knicks snapshot strip ── */}
      {knicks && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
            border: '1px solid #1E2D3D',
            borderTop: '3px solid #006BB6',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          {[
            { label: 'East Seed', value: `#${knicks.rank}` },
            { label: 'Record',    value: `${knicks.wins}–${knicks.losses}` },
            { label: 'Games Back', value: knicks.gb === 0 ? 'LEAD' : (knicks.gb % 1 === 0 ? String(knicks.gb) : knicks.gb.toFixed(1)) },
            { label: 'Last 10',   value: `${knicks.last10.w}–${knicks.last10.l}` },
          ].map((tile, i, arr) => (
            <div
              key={tile.label}
              style={{
                padding: '1rem 1.1rem',
                textAlign: 'center',
                borderRight: i < arr.length - 1 ? '1px solid rgba(30,45,61,0.7)' : 'none',
              }}
            >
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.68rem', color: '#F58426', letterSpacing: '0.2em', marginBottom: '0.3rem' }}>
                {tile.label}
              </div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', color: '#FFFFFF', letterSpacing: '0.02em', lineHeight: 1 }}>
                {tile.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <section>
        {/* Desktop table */}
        <div className="hidden md:block" style={{ background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)', border: '1px solid #1E2D3D', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,107,182,0.12)', borderBottom: '2px solid rgba(0,107,182,0.25)' }}>
                {/* dot column */}
                <th style={{ width: '1.5rem', padding: '0.65rem 0.5rem 0.65rem 0.85rem' }} />
                {[
                  { label: '#',    width: '2rem',   align: 'center' },
                  { label: 'Team', width: 'auto',   align: 'left'   },
                  { label: 'W',    width: '3rem',   align: 'center' },
                  { label: 'L',    width: '3rem',   align: 'center' },
                  { label: 'PCT',  width: '5.5rem', align: 'center' },
                  { label: 'GB',   width: '3.5rem', align: 'center' },
                  { label: 'L10',  width: '5.5rem', align: 'center' },
                ].map(col => (
                  <th
                    key={col.label}
                    style={{
                      padding: '0.65rem 0.5rem',
                      textAlign: col.align as 'left' | 'center',
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '0.75rem',
                      letterSpacing: '0.16em',
                      color: '#F58426',
                      width: col.width,
                      fontWeight: 400,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <>
                  {i === 6  && <ZoneDivider key="divider-6"  label="— PLAY-IN ZONE —" />}
                  {i === 10 && <ZoneDivider key="divider-10" label="— OUT OF PLAYOFF PICTURE —" />}
                  <StandingRowEl key={row.team.abbreviation} row={row} />
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {standings.map((row, i) => (
            <div key={row.team.abbreviation}>
              {i === 6 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(30,45,61,0.7)' }} />
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.65rem', letterSpacing: '0.18em', color: '#4A5568' }}>
                    PLAY-IN ZONE
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(30,45,61,0.7)' }} />
                </div>
              )}
              {i === 10 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(30,45,61,0.7)' }} />
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.65rem', letterSpacing: '0.18em', color: '#4A5568' }}>
                    OUT OF PLAYOFF PICTURE
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(30,45,61,0.7)' }} />
                </div>
              )}
              <MobileCard row={row} />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(30,45,61,0.5)' }}>
          {[
            { color: '#F5C542', label: 'Top 2 Seed' },
            { color: '#006BB6', label: 'Playoff (3–6)' },
            { color: '#F58426', label: 'Play-In (7–10)' },
            { color: '#4A5568', label: 'Chasing (11+)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: '#8899AA' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
