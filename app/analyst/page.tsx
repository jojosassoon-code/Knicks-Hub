'use client';
// app/analyst/page.tsx — Analyst Mode
// Fully client-side interactive page. User picks an opponent from the dropdown,
// the page computes three analytical sections from the NBA CDN schedule data
// (processed by our /api/nba-stats route handler).

import { useState, useEffect, useMemo } from 'react';
import type { TeamStat, GameSummary } from '@/app/api/nba-stats/route';
import type { PlayerStat } from '@/app/api/player-stats/route';
import { getOpponentColor } from '@/lib/teamColors';
import { getCoach } from '@/lib/coaches';

const NYK_BLUE   = '#006BB6';
const NYK_ORANGE = '#F58426';

// ── Grade helpers ─────────────────────────────────────────────────────────────
type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

function gradeColor(g: Grade) {
  if (g === 'A' || g === 'B') return '#4ade80';
  if (g === 'C') return '#facc15';
  return '#f87171';
}

function gradeFromDiff(diff: number, thresholds: [number, number, number, number]): Grade {
  const [a, b, c, d] = thresholds;
  if (diff >= a) return 'A';
  if (diff >= b) return 'B';
  if (diff >= c) return 'C';
  if (diff >= d) return 'D';
  return 'F';
}

function computeGrades(
  nyk: TeamStat,
  opp: TeamStat,
  h2hW: number,
  h2hGames: number,
) {
  // 1. Offense vs their defense: how does NYK scoring compare to what OPP allows?
  //    Positive = NYK scores more than OPP typically allows
  const offEdge = nyk.ppg - opp.papg;

  // 2. Defense vs their offense: how well does NYK defend relative to what OPP scores?
  //    Negative = NYK allows less than OPP scores on average (good)
  const defEdge = opp.ppg - nyk.papg; // positive = OPP can exceed our defense

  // 3. Overall net rating edge
  const netEdge = nyk.netRating - opp.netRating;

  // 4. Head-to-head season series
  const h2hPct = h2hGames > 0 ? h2hW / h2hGames : 0.5;

  // 5. Seeding: lower seed number = better (1 = best)
  // If cross-conference, base it purely on net rating
  const seedEdge = opp.seed - nyk.seed; // positive = NYK is seeded higher

  // 6. Recent form (last 10)
  const nykL10Pct = nyk.last10.w / 10;
  const oppL10Pct = opp.last10.w / 10;
  const formEdge = nykL10Pct - oppL10Pct;

  return {
    offense: gradeFromDiff(offEdge, [5, 2, -2, -5]),
    defense: gradeFromDiff(-defEdge, [5, 2, -1, -4]), // invert: lower defEdge = better defense
    netRating: gradeFromDiff(netEdge, [4, 1.5, -0.5, -3]),
    h2h: gradeFromDiff(h2hPct, [0.75, 0.51, 0.49, 0.26]),
    seeding: gradeFromDiff(seedEdge, [4, 1, -1, -4]),
    form: gradeFromDiff(formEdge, [0.3, 0.1, -0.1, -0.3]),
  };
}

// ── Reusable subcomponents ────────────────────────────────────────────────────

function StatBar({
  label,
  nykVal,
  oppVal,
  oppColor,
  lowerIsBetter = false,
}: {
  label: string;
  nykVal: number;
  oppVal: number;
  oppColor: string;
  lowerIsBetter?: boolean;
}) {
  // Normalise both values into a 0-100 bar width.
  // We use min-max relative to the two values so both always fill meaningfully.
  const lo = Math.min(nykVal, oppVal) * 0.9;
  const hi = Math.max(nykVal, oppVal) * 1.05 + 0.1;
  const nykW = Math.round(((nykVal - lo) / (hi - lo)) * 70 + 25);
  const oppW = Math.round(((oppVal - lo) / (hi - lo)) * 70 + 25);

  // For lower-is-better metrics, visually the shorter bar is the better one.
  const nykBetter = lowerIsBetter ? nykVal <= oppVal : nykVal >= oppVal;

  return (
    <div className="mb-5">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: 'rgba(147,197,253,0.7)', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: 'rgba(147,197,253,0.4)' }}>
          {lowerIsBetter ? '↓ lower is better' : '↑ higher is better'}
        </span>
      </div>

      {/* NYK bar */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs w-8 text-right font-bold" style={{ color: NYK_BLUE }}>NYK</span>
        <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
          <div
            className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
            style={{ width: `${nykW}%`, backgroundColor: NYK_BLUE }}
          >
            <span className="text-xs font-bold text-white">{nykVal.toFixed(1)}</span>
          </div>
        </div>
        {nykBetter && <span className="text-xs">✓</span>}
      </div>

      {/* OPP bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-8 text-right font-bold" style={{ color: oppColor }}>OPP</span>
        <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
          <div
            className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
            style={{ width: `${oppW}%`, backgroundColor: oppColor }}
          >
            <span className="text-xs font-bold text-white">{oppVal.toFixed(1)}</span>
          </div>
        </div>
        {!nykBetter && <span className="text-xs">✓</span>}
      </div>
    </div>
  );
}

function GradeCard({ label, grade, detail }: { label: string; grade: Grade; detail: string }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col items-center gap-2 text-center"
      style={{ backgroundColor: '#111d35', border: `1px solid ${gradeColor(grade)}30` }}
    >
      <span
        className="text-5xl font-black leading-none"
        style={{
          fontFamily: 'Oswald, sans-serif',
          color: gradeColor(grade),
          textShadow: `0 0 20px ${gradeColor(grade)}60`,
        }}
      >
        {grade}
      </span>
      <span
        className="text-xs font-bold tracking-widest uppercase"
        style={{ color: 'rgba(255,255,255,0.85)' }}
      >
        {label}
      </span>
      <span className="text-xs" style={{ color: 'rgba(147,197,253,0.55)' }}>{detail}</span>
    </div>
  );
}



// ── X-Factor Card ─────────────────────────────────────────────────────────────
function XFactorCard({
  player, reason, teamColor, teamLabel,
}: {
  player: PlayerStat;
  reason: string;
  teamColor: string;
  teamLabel: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#111d35', border: `2px solid ${teamColor}40` }}
    >
      {/* X-Factor badge */}
      <div
        className="px-5 py-2 flex items-center justify-between"
        style={{ backgroundColor: `${teamColor}20` }}
      >
        <span
          className="font-black tracking-widest text-xs"
          style={{ fontFamily: 'Oswald, sans-serif', color: teamColor, letterSpacing: '0.12em' }}
        >
          ⚡ X-FACTOR
        </span>
        <span className="text-xs" style={{ color: 'rgba(147,197,253,0.5)' }}>{teamLabel}</span>
      </div>

      <div className="p-5">
        {/* Player name */}
        <div
          className="font-black mb-1"
          style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.5rem', color: teamColor, letterSpacing: '0.03em', lineHeight: 1.1 }}
        >
          {player.name}
        </div>

        {/* Season averages pill row */}
        <div className="flex flex-wrap gap-2 my-3">
          {[
            { label: 'PPG', val: player.pts.toFixed(1) },
            { label: 'RPG', val: player.reb.toFixed(1) },
            { label: 'APG', val: player.ast.toFixed(1) },
            { label: '3P%', val: `${player.threePct.toFixed(1)}%` },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-lg px-3 py-1.5 text-center"
              style={{ backgroundColor: '#0d1829', minWidth: '52px' }}
            >
              <div
                className="font-black leading-none"
                style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.05rem', color: teamColor }}
              >
                {s.val}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(147,197,253,0.5)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Reason */}
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(147,197,253,0.75)' }}>
          {reason}
        </p>
      </div>
    </div>
  );
}

// ── Coaching Matchup Section ──────────────────────────────────────────────────

function CoachingMatchupSection({
  oppTricode,
  oppColor,
  oppName,
}: {
  oppTricode: string;
  oppColor: string;
  oppName: string;
}) {
  const nykCoach = getCoach('NYK');
  const oppCoach = getCoach(oppTricode);
  if (!nykCoach || !oppCoach) return null;

  // Head-to-head: nykCoach's record vs this opponent coach
  const h2h = oppCoach.h2hVsKnicksCoach;
  const h2hTotal = h2h.nykW + h2h.nykL;
  const h2hLabel = h2hTotal === 0
    ? 'First Matchup'
    : `${h2h.nykW}–${h2h.nykL} (NYK)`;

  // Coaching edge score: win%, playoff record, experience
  const nykPlayoffTotal = nykCoach.playoffRecord.w + nykCoach.playoffRecord.l;
  const oppPlayoffTotal = oppCoach.playoffRecord.w + oppCoach.playoffRecord.l;
  const nykPlayoffWinPct = nykPlayoffTotal > 0 ? (nykCoach.playoffRecord.w / nykPlayoffTotal) * 100 : 50;
  const oppPlayoffWinPct = oppPlayoffTotal > 0 ? (oppCoach.playoffRecord.w / oppPlayoffTotal) * 100 : 50;

  // Composite score: weighted sum
  const nykScore = nykCoach.winPct * 0.45 + nykPlayoffWinPct * 0.35 + Math.min(nykCoach.experience, 20) * 0.5 * 0.2 * 10;
  const oppScore = oppCoach.winPct * 0.45 + oppPlayoffWinPct * 0.35 + Math.min(oppCoach.experience, 20) * 0.5 * 0.2 * 10;

  // Tug-of-war bar
  const total = nykScore + oppScore || 1;
  const nykBarPct = Math.round((nykScore / total) * 100);

  const edgeLabel =
    Math.abs(nykScore - oppScore) < 2
      ? 'EVEN'
      : nykScore > oppScore
        ? 'KNICKS'
        : oppTricode;

  const edgeColor =
    edgeLabel === 'EVEN'
      ? 'rgba(255,255,255,0.4)'
      : edgeLabel === 'KNICKS'
        ? NYK_BLUE
        : oppColor;

  type StatItem = { label: string; nykVal: string; oppVal: string };
  const stats: StatItem[] = [
    {
      label: 'Experience',
      nykVal: `${nykCoach.experience} yrs`,
      oppVal: `${oppCoach.experience} yrs`,
    },
    {
      label: 'RS Win %',
      nykVal: `${nykCoach.winPct.toFixed(1)}%`,
      oppVal: `${oppCoach.winPct.toFixed(1)}%`,
    },
    {
      label: 'Playoff Record',
      nykVal: `${nykCoach.playoffRecord.w}–${nykCoach.playoffRecord.l}`,
      oppVal: `${oppCoach.playoffRecord.w}–${oppCoach.playoffRecord.l}`,
    },
    {
      label: 'Head-to-Head',
      nykVal: h2hLabel,
      oppVal: '',
    },
  ];

  return (
    <section className="fade-in-delay-3">
      {/* Section header */}
      <div className="section-label mb-4">
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            color: '#FFFFFF',
            letterSpacing: '0.08em',
          }}>
            04 — COACHING MATCHUP
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#8899AA', fontStyle: 'italic' }}>
            The chess match behind the X&apos;s and O&apos;s
          </p>
        </div>
      </div>

      {/* Main card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#0F1923', border: '1px solid #1E2D3D' }}
      >
        {/* ── Side-by-side coach panels ── */}
        <div className="flex flex-col sm:flex-row">

          {/* NYK side */}
          <div
            className="flex-1 p-6"
            style={{ borderBottom: '1px solid #1E2D3D' }}
          >
            {/* Accent bar */}
            <div
              className="w-10 h-1 rounded-full mb-4"
              style={{ backgroundColor: NYK_BLUE }}
            />
            {/* Name */}
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              color: NYK_BLUE,
              letterSpacing: '0.04em',
              lineHeight: 1.05,
            }}>
              {nykCoach.name}
            </div>
            <div
              className="mt-1 mb-5 text-xs font-bold tracking-widest"
              style={{ color: '#8899AA', letterSpacing: '0.18em' }}
            >
              HEAD COACH · NEW YORK KNICKS
            </div>

            {/* Stats 2x2 grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {stats.map(s => (
                <div
                  key={s.label}
                  className="rounded-xl p-3"
                  style={{ backgroundColor: 'rgba(0,107,182,0.08)', border: '1px solid rgba(0,107,182,0.15)' }}
                >
                  <div
                    className="text-xs mb-1"
                    style={{ color: '#8899AA', fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: s.label === 'Head-to-Head' ? '0.85rem' : '1.1rem',
                      color: '#FFFFFF',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {s.label === 'Head-to-Head' ? h2hLabel : s.nykVal}
                  </div>
                </div>
              ))}
            </div>

            {/* Style badge */}
            <div className="mb-4">
              <span
                className="inline-block px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: 'rgba(0,107,182,0.18)',
                  color: NYK_BLUE,
                  border: '1px solid rgba(0,107,182,0.35)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.1em',
                }}
              >
                {nykCoach.style.toUpperCase()}
              </span>
            </div>

            {/* Scouting note */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: '#8899AA', fontStyle: 'italic' }}
            >
              &ldquo;{nykCoach.scoutingNote}&rdquo;
            </p>
          </div>

          {/* ── VS divider (desktop: vertical, mobile: horizontal) ── */}
          <div
            className="hidden sm:flex flex-col items-center justify-center px-2"
            style={{ borderLeft: '1px solid #1E2D3D', borderRight: '1px solid #1E2D3D', minWidth: '3rem' }}
          >
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.12em',
              writingMode: 'vertical-rl',
            }}>
              VS
            </span>
          </div>
          {/* Mobile VS bar */}
          <div
            className="flex sm:hidden items-center justify-center gap-3 py-2 px-6"
            style={{ borderTop: '1px solid #1E2D3D', borderBottom: '1px solid #1E2D3D' }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1E2D3D' }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.14em',
            }}>
              VS
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1E2D3D' }} />
          </div>

          {/* OPP side */}
          <div className="flex-1 p-6">
            {/* Accent bar */}
            <div
              className="w-10 h-1 rounded-full mb-4"
              style={{ backgroundColor: oppColor }}
            />
            {/* Name */}
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              color: oppColor,
              letterSpacing: '0.04em',
              lineHeight: 1.05,
            }}>
              {oppCoach.name}
            </div>
            <div
              className="mt-1 mb-5 text-xs font-bold tracking-widest"
              style={{ color: '#8899AA', letterSpacing: '0.18em' }}
            >
              HEAD COACH · {oppName.toUpperCase()}
            </div>

            {/* Stats 2x2 grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {stats.map(s => (
                <div
                  key={s.label}
                  className="rounded-xl p-3"
                  style={{ backgroundColor: `${oppColor}0D`, border: `1px solid ${oppColor}25` }}
                >
                  <div
                    className="text-xs mb-1"
                    style={{ color: '#8899AA', fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: s.label === 'Head-to-Head' ? '0.85rem' : '1.1rem',
                      color: '#FFFFFF',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {s.label === 'Head-to-Head' ? h2hLabel : s.oppVal}
                  </div>
                </div>
              ))}
            </div>

            {/* Style badge */}
            <div className="mb-4">
              <span
                className="inline-block px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${oppColor}20`,
                  color: oppColor,
                  border: `1px solid ${oppColor}40`,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.1em',
                }}
              >
                {oppCoach.style.toUpperCase()}
              </span>
            </div>

            {/* Scouting note */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: '#8899AA', fontStyle: 'italic' }}
            >
              &ldquo;{oppCoach.scoutingNote}&rdquo;
            </p>
          </div>
        </div>

        {/* ── Coaching Edge bar ── */}
        <div
          className="px-6 py-5"
          style={{ borderTop: '1px solid #1E2D3D', backgroundColor: 'rgba(8,12,20,0.4)' }}
        >
          <div className="text-xs text-center mb-3 font-bold tracking-widest" style={{ color: '#8899AA' }}>
            COACHING EDGE
          </div>

          {/* Tug-of-war bar */}
          <div className="relative h-6 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#080C14' }}>
            <div
              className="absolute top-0 left-0 h-full rounded-l-full transition-all duration-700"
              style={{ width: `${nykBarPct}%`, backgroundColor: NYK_BLUE }}
            />
            <div
              className="absolute top-0 right-0 h-full rounded-r-full transition-all duration-700"
              style={{ width: `${100 - nykBarPct}%`, backgroundColor: oppColor }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-full bg-white/10" />
            </div>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-xs font-bold" style={{ color: NYK_BLUE }}>NYK</span>
            <span className="text-xs font-bold" style={{ color: oppColor }}>{oppTricode}</span>
          </div>

          {/* Edge label */}
          <div className="text-center">
            <span
              className="inline-block px-5 py-1.5 rounded-full text-xs font-bold tracking-widest"
              style={{
                fontFamily: 'var(--font-display)',
                backgroundColor: `${edgeColor}18`,
                color: edgeColor,
                border: `1px solid ${edgeColor}35`,
                letterSpacing: '0.14em',
              }}
            >
              {edgeLabel === 'EVEN' ? 'EVEN MATCHUP' : `${edgeLabel} HAS THE COACHING EDGE`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ApiData = {
  teams: Record<string, TeamStat>;
  knicksGames: GameSummary[];
};

type PlayerData = {
  byTeam: Record<string, PlayerStat[]>;
};

const ALL_TEAMS = [
  { tri: 'ATL', name: 'Atlanta Hawks' },
  { tri: 'BOS', name: 'Boston Celtics' },
  { tri: 'BKN', name: 'Brooklyn Nets' },
  { tri: 'CHA', name: 'Charlotte Hornets' },
  { tri: 'CHI', name: 'Chicago Bulls' },
  { tri: 'CLE', name: 'Cleveland Cavaliers' },
  { tri: 'DAL', name: 'Dallas Mavericks' },
  { tri: 'DEN', name: 'Denver Nuggets' },
  { tri: 'DET', name: 'Detroit Pistons' },
  { tri: 'GSW', name: 'Golden State Warriors' },
  { tri: 'HOU', name: 'Houston Rockets' },
  { tri: 'IND', name: 'Indiana Pacers' },
  { tri: 'LAC', name: 'LA Clippers' },
  { tri: 'LAL', name: 'Los Angeles Lakers' },
  { tri: 'MEM', name: 'Memphis Grizzlies' },
  { tri: 'MIA', name: 'Miami Heat' },
  { tri: 'MIL', name: 'Milwaukee Bucks' },
  { tri: 'MIN', name: 'Minnesota Timberwolves' },
  { tri: 'NOP', name: 'New Orleans Pelicans' },
  { tri: 'OKC', name: 'Oklahoma City Thunder' },
  { tri: 'ORL', name: 'Orlando Magic' },
  { tri: 'PHI', name: 'Philadelphia 76ers' },
  { tri: 'PHX', name: 'Phoenix Suns' },
  { tri: 'POR', name: 'Portland Trail Blazers' },
  { tri: 'SAC', name: 'Sacramento Kings' },
  { tri: 'SAS', name: 'San Antonio Spurs' },
  { tri: 'TOR', name: 'Toronto Raptors' },
  { tri: 'UTA', name: 'Utah Jazz' },
  { tri: 'WAS', name: 'Washington Wizards' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function AnalystPage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    // Fetch team stats and player stats in parallel
    Promise.all([
      fetch('/api/nba-stats').then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
      fetch('/api/player-stats').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([teamStats, players]) => {
        setData(teamStats as ApiData);
        if (players) setPlayerData(players as PlayerData);
        setLoading(false);
      })
      .catch(() => { setFetchError('Could not load stats. Please refresh.'); setLoading(false); });
  }, []);

  const analysis = useMemo(() => {
    if (!data || !selected) return null;
    const nyk = data.teams['NYK'];
    const opp = data.teams[selected];
    if (!nyk || !opp) return null;

    const h2hGames = data.knicksGames.filter(
      g => g.homeTricode === selected || g.awayTricode === selected
    );
    const h2hW = h2hGames.filter(g => {
      const nykHome  = g.homeTricode === 'NYK';
      const nykScore = nykHome ? g.homeScore : g.awayScore;
      const oppScore = nykHome ? g.awayScore : g.homeScore;
      return nykScore > oppScore;
    }).length;

    const grades = computeGrades(nyk, opp, h2hW, h2hGames.length);

    // Tug-of-war bar: based on net rating differential, capped at ±10 pts
    const maxDiff = 10;
    const rawDiff = Math.max(-maxDiff, Math.min(maxDiff, nyk.netRating - opp.netRating));
    const nykPct  = Math.round(50 + (rawDiff / maxDiff) * 30); // 20–80%

    // Who has the overall edge?
    const edgeTeam  = nyk.netRating >= opp.netRating ? 'NYK' : selected;
    const edgeDelta = Math.abs(nyk.netRating - opp.netRating).toFixed(1);

    return { nyk, opp, h2hGames, h2hW, grades, nykPct, edgeTeam, edgeDelta };
  }, [data, selected]);

  const oppColor = selected ? getOpponentColor(selected) : '#888888';

  // ── Player matchup + X-factor computation ──────────────────────────────────
  const playerAnalysis = useMemo(() => {
    if (!playerData || !selected || !analysis) return null;
    const nykPlayers = playerData.byTeam['NYK'] ?? [];
    const oppPlayers = playerData.byTeam[selected] ?? [];
    if (nykPlayers.length === 0 || oppPlayers.length === 0) return null;

    // Sort helpers
    const byPts = (arr: PlayerStat[]) => [...arr].sort((a, b) => b.pts - a.pts);
    const byReb = (arr: PlayerStat[]) => [...arr].sort((a, b) => b.reb - a.reb);
    const by3P  = (arr: PlayerStat[]) => [...arr].sort((a, b) => b.threePct - a.threePct);

    // X-Factor: find which Knicks player best exploits opponent's weakness
    // Weakness = high PAPG → use scoring. Poor 3P defense proxy = NYK 3PT volume player.
    // If opponent's PAPG > 112 (porous), X-factor = 2nd scorer (surprise threat)
    // If opponent PPG > 118 (fast pace), X-factor = best 3P shooter
    // Otherwise, X-factor = best rebounder who tilts pace/possession battle
    let nykXFactor: PlayerStat;
    let nykReason: string;
    const oppPapg = analysis.opp.papg;
    const oppPpg  = analysis.opp.ppg;

    if (oppPapg > 112) {
      // Weak defense — secondary scorer can put up big numbers
      nykXFactor = byPts(nykPlayers)[1] ?? byPts(nykPlayers)[0];
      nykReason = `${nykXFactor.name.split(' ').pop()} can go off against a ${selected} defense that allows ${oppPapg.toFixed(1)} PPG — one of the league's most porous.`;
    } else if (oppPpg > 117) {
      // High-pace opponent — 3PT shooting wins the pace battle
      nykXFactor = by3P(nykPlayers)[0];
      nykReason = `${nykXFactor.name.split(' ').pop()}'s ${nykXFactor.threePct.toFixed(1)}% from three is crucial to keep up with ${selected}'s high-powered ${oppPpg.toFixed(1)} PPG offense.`;
    } else {
      // Grind it out — rebounder and grit player matters most
      nykXFactor = byReb(nykPlayers)[0];
      nykReason = `${nykXFactor.name.split(' ').pop()}'s ${nykXFactor.reb.toFixed(1)} RPG controls the glass against a ${selected} team that limits points — possession battle is the key.`;
    }

    // Opponent X-Factor: their player who most exploits Knicks' weakness
    let oppXFactor: PlayerStat;
    let oppReason: string;
    const nykPapg = analysis.nyk.papg;
    const nykPpg  = analysis.nyk.ppg;

    if (nykPapg > 112) {
      oppXFactor = byPts(oppPlayers)[1] ?? byPts(oppPlayers)[0];
      oppReason = `${oppXFactor.name.split(' ').pop()} can exploit a Knicks defense that gives up ${nykPapg.toFixed(1)} PPG — enough room for a secondary scorer to take over.`;
    } else if (nykPpg > 117) {
      oppXFactor = by3P(oppPlayers)[0];
      oppReason = `${oppXFactor.name.split(' ').pop()}'s ${oppXFactor.threePct.toFixed(1)}% from deep gives ${selected} a weapon if they need to match New York's ${nykPpg.toFixed(1)} PPG firepower.`;
    } else {
      oppXFactor = byReb(oppPlayers)[0];
      oppReason = `${oppXFactor.name.split(' ').pop()}'s ${oppXFactor.reb.toFixed(1)} RPG can tilt the possession battle against a disciplined Knicks defense.`;
    }

    return { nykXFactor, nykReason, oppXFactor, oppReason };
  }, [playerData, selected, analysis]);

  return (
    <div className="space-y-8 fade-in pb-16">

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
            ANALYST MODE
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#8899AA' }}>
            2025–26 Season · Matchup Analysis · New York Knicks
          </p>
        </div>
      </div>

      {/* ── Opponent Selector ── */}
      <div
        className="card rounded-2xl p-6"
      >
        <label
          htmlFor="opp-select"
          className="block mb-3 font-bold tracking-widest text-xs uppercase"
          style={{ color: '#F58426', fontFamily: 'var(--font-body)', letterSpacing: '0.16em' }}
        >
          Select Opponent
        </label>
        <select
          id="opp-select"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 font-semibold text-white appearance-none cursor-pointer focus:outline-none transition"
          style={{
            backgroundColor: 'rgba(8,12,20,0.8)',
            border: `2px solid ${selected ? oppColor : 'rgba(0,107,182,0.4)'}`,
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            letterSpacing: '0.04em',
          }}
        >
          <option value="">
            {loading ? 'Loading teams…' : '— Choose an opponent —'}
          </option>
          {ALL_TEAMS.map(t => (
            <option key={t.tri} value={t.tri}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* ── Error ── */}
      {fetchError && (
        <p className="text-red-400 text-center py-8">{fetchError}</p>
      )}

      {/* ── Placeholder before selection ── */}
      {!selected && !loading && !fetchError && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: '#111d35', border: '1px dashed rgba(0,107,182,0.3)' }}
        >
          <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
            SELECT AN OPPONENT ABOVE
          </p>
          <p style={{ color: 'rgba(147,197,253,0.3)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Head-to-head record, team DNA comparison, and scouting report will appear here.
          </p>
        </div>
      )}

      {/* ── Analysis Sections ── */}
      {analysis && (
        <>
          {/* ══ SECTION 1: MATCHUP OVERVIEW ══ */}
          <section>
            <h2 style={{
              fontFamily: 'Oswald, sans-serif', fontSize: '1.2rem',
              fontWeight: 600, color: '#fff', letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}>
              01 — PLAYOFF MATCHUP SIMULATOR
            </h2>

            {/* Teams header */}
            <div
              className="rounded-2xl p-6 mb-4"
              style={{ backgroundColor: '#111d35', border: '1px solid rgba(0,107,182,0.3)' }}
            >
              <div className="flex items-center justify-between mb-6">
                {/* NYK side */}
                <div className="text-center flex-1">
                  <div
                    className="text-3xl font-black"
                    style={{ fontFamily: 'Oswald, sans-serif', color: NYK_BLUE, letterSpacing: '0.05em' }}
                  >
                    NYK
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(147,197,253,0.6)' }}>
                    New York Knicks
                  </div>
                  <div className="text-lg font-bold mt-1" style={{ color: '#fff', fontFamily: 'Oswald, sans-serif' }}>
                    {analysis.nyk.wins}–{analysis.nyk.losses}
                  </div>
                  <div className="text-xs" style={{ color: NYK_ORANGE }}>
                    #{analysis.nyk.seed} {analysis.nyk.conference}
                  </div>
                </div>

                {/* VS */}
                <div className="px-4 text-center">
                  <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.2rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                    VS
                  </span>
                </div>

                {/* OPP side */}
                <div className="text-center flex-1">
                  <div
                    className="text-3xl font-black"
                    style={{ fontFamily: 'Oswald, sans-serif', color: oppColor, letterSpacing: '0.05em' }}
                  >
                    {selected}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(147,197,253,0.6)' }}>
                    {analysis.opp.city} {analysis.opp.name}
                  </div>
                  <div className="text-lg font-bold mt-1" style={{ color: '#fff', fontFamily: 'Oswald, sans-serif' }}>
                    {analysis.opp.wins}–{analysis.opp.losses}
                  </div>
                  <div className="text-xs" style={{ color: oppColor }}>
                    #{analysis.opp.seed} {analysis.opp.conference}
                  </div>
                </div>
              </div>

              {/* Tug-of-war bar */}
              <div className="mb-3">
                <div className="text-xs text-center mb-2" style={{ color: 'rgba(147,197,253,0.5)', letterSpacing: '0.06em' }}>
                  OVERALL ADVANTAGE — Net Rating Edge
                </div>
                <div className="relative h-7 rounded-full overflow-hidden" style={{ backgroundColor: '#0d1829' }}>
                  {/* NYK fill from left */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-l-full transition-all duration-700"
                    style={{ width: `${analysis.nykPct}%`, backgroundColor: NYK_BLUE }}
                  />
                  {/* OPP fill from right */}
                  <div
                    className="absolute top-0 right-0 h-full rounded-r-full transition-all duration-700"
                    style={{ width: `${100 - analysis.nykPct}%`, backgroundColor: oppColor }}
                  />
                  {/* Center line */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-0.5 h-full bg-white/20" />
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs font-bold" style={{ color: NYK_BLUE }}>NYK</span>
                  <span className="text-xs font-bold" style={{ color: oppColor }}>{selected}</span>
                </div>
              </div>

              {/* Edge label */}
              <div className="text-center mt-3">
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest"
                  style={{
                    backgroundColor: analysis.edgeTeam === 'NYK'
                      ? 'rgba(0,107,182,0.2)' : `${oppColor}20`,
                    color: analysis.edgeTeam === 'NYK' ? NYK_BLUE : oppColor,
                    border: `1px solid ${analysis.edgeTeam === 'NYK' ? NYK_BLUE : oppColor}40`,
                  }}
                >
                  {analysis.edgeTeam} HAS THE EDGE (+{analysis.edgeDelta} net pts)
                </span>
              </div>
            </div>

            {/* Head-to-head season series */}
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: '#111d35', border: '1px solid rgba(0,107,182,0.25)' }}
            >
              <p className="text-xs font-bold tracking-widest mb-4" style={{ color: 'rgba(147,197,253,0.5)' }}>
                2025–26 SEASON SERIES
              </p>
              {analysis.h2hGames.length === 0 ? (
                <p style={{ color: 'rgba(147,197,253,0.4)', fontSize: '0.875rem' }}>
                  No games played yet between these teams this season.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <div
                        className="text-3xl font-black"
                        style={{ fontFamily: 'Oswald, sans-serif', color: NYK_BLUE }}
                      >
                        {analysis.h2hW}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(147,197,253,0.5)' }}>NYK wins</div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1.5rem' }}>–</div>
                    <div className="text-center">
                      <div
                        className="text-3xl font-black"
                        style={{ fontFamily: 'Oswald, sans-serif', color: oppColor }}
                      >
                        {analysis.h2hGames.length - analysis.h2hW}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(147,197,253,0.5)' }}>{selected} wins</div>
                    </div>
                    <div className="ml-4 text-xs" style={{ color: 'rgba(147,197,253,0.4)' }}>
                      {analysis.h2hGames.length} game{analysis.h2hGames.length !== 1 ? 's' : ''} played
                    </div>
                  </div>

                  {/* Game log */}
                  <div className="space-y-1">
                    {analysis.h2hGames.map((g, i) => {
                      const nykHome  = g.homeTricode === 'NYK';
                      const nykScore = nykHome ? g.homeScore : g.awayScore;
                      const oppScore = nykHome ? g.awayScore : g.homeScore;
                      const won = nykScore > oppScore;
                      return (
                        <div key={i} className="flex items-center justify-between text-sm rounded-lg px-3 py-2"
                          style={{ backgroundColor: '#0d1829' }}>
                          <span style={{ color: 'rgba(147,197,253,0.6)' }}>{g.date}</span>
                          <span style={{ color: 'rgba(147,197,253,0.5)' }}>
                            {nykHome ? `NYK vs ${selected}` : `NYK @ ${selected}`}
                          </span>
                          <span>
                            <span
                              className="text-xs font-bold px-1.5 py-0.5 rounded mr-2"
                              style={{
                                backgroundColor: won ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                                color: won ? '#4ade80' : '#f87171',
                              }}
                            >
                              {won ? 'W' : 'L'}
                            </span>
                            <span className="font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                              {nykScore}–{oppScore}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ══ SECTION 2: TEAM DNA ══ */}
          <section>
            <h2 style={{
              fontFamily: 'Oswald, sans-serif', fontSize: '1.2rem',
              fontWeight: 600, color: '#fff', letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}>
              02 — TEAM DNA COMPARISON
            </h2>
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: '#111d35', border: '1px solid rgba(0,107,182,0.3)' }}
            >
              {/* Legend */}
              <div className="flex gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NYK_BLUE }} />
                  <span className="text-xs font-semibold text-white">New York Knicks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: oppColor }} />
                  <span className="text-xs font-semibold text-white">{analysis.opp.city} {analysis.opp.name}</span>
                </div>
              </div>

              <StatBar
                label="POINTS PER GAME (Offensive Output)"
                nykVal={analysis.nyk.ppg}
                oppVal={analysis.opp.ppg}
                oppColor={oppColor}
              />
              <StatBar
                label="POINTS ALLOWED PER GAME (Defensive Strength)"
                nykVal={analysis.nyk.papg}
                oppVal={analysis.opp.papg}
                oppColor={oppColor}
                lowerIsBetter
              />
              <StatBar
                label="NET RATING (PPG Minus PAPG)"
                nykVal={analysis.nyk.netRating}
                oppVal={analysis.opp.netRating}
                oppColor={oppColor}
              />
              <StatBar
                label="WIN PERCENTAGE"
                nykVal={parseFloat((analysis.nyk.winPct * 100).toFixed(1))}
                oppVal={parseFloat((analysis.opp.winPct * 100).toFixed(1))}
                oppColor={oppColor}
              />
              <StatBar
                label="HOME WIN % (Home Court Factor)"
                nykVal={analysis.nyk.homeRecord.w + analysis.nyk.homeRecord.l > 0
                  ? parseFloat((analysis.nyk.homeRecord.w / (analysis.nyk.homeRecord.w + analysis.nyk.homeRecord.l) * 100).toFixed(1))
                  : 0}
                oppVal={analysis.opp.homeRecord.w + analysis.opp.homeRecord.l > 0
                  ? parseFloat((analysis.opp.homeRecord.w / (analysis.opp.homeRecord.w + analysis.opp.homeRecord.l) * 100).toFixed(1))
                  : 0}
                oppColor={oppColor}
              />
              <StatBar
                label="LAST 10 GAMES WIN % (Recent Form)"
                nykVal={analysis.nyk.last10.w * 10}
                oppVal={analysis.opp.last10.w * 10}
                oppColor={oppColor}
              />
            </div>
          </section>

          {/* ══ SECTION 3: SCOUTING REPORT CARD ══ */}
          <section>
            <h2 style={{
              fontFamily: 'Oswald, sans-serif', fontSize: '1.2rem',
              fontWeight: 600, color: '#fff', letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}>
              03 — KNICKS SCOUTING REPORT
            </h2>
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: '#111d35', border: '1px solid rgba(0,107,182,0.3)' }}
            >
              <p className="text-xs mb-5" style={{ color: 'rgba(147,197,253,0.5)', letterSpacing: '0.04em' }}>
                Grades reflect NYK&apos;s advantage or disadvantage in each dimension against {selected}.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <GradeCard
                  label="Offense vs Their D"
                  grade={analysis.grades.offense}
                  detail={`NYK ${analysis.nyk.ppg} PPG vs ${selected} ${analysis.opp.papg} PAPG`}
                />
                <GradeCard
                  label="Defense vs Their O"
                  grade={analysis.grades.defense}
                  detail={`NYK ${analysis.nyk.papg} PAPG vs ${selected} ${analysis.opp.ppg} PPG`}
                />
                <GradeCard
                  label="Net Rating Edge"
                  grade={analysis.grades.netRating}
                  detail={`NYK ${analysis.nyk.netRating > 0 ? '+' : ''}${analysis.nyk.netRating} vs ${selected} ${analysis.opp.netRating > 0 ? '+' : ''}${analysis.opp.netRating}`}
                />
                <GradeCard
                  label="Head-to-Head"
                  grade={analysis.grades.h2h}
                  detail={analysis.h2hGames.length > 0
                    ? `${analysis.h2hW}–${analysis.h2hGames.length - analysis.h2hW} season series`
                    : 'No games played yet'}
                />
                <GradeCard
                  label="Seeding Advantage"
                  grade={analysis.grades.seeding}
                  detail={`NYK #${analysis.nyk.seed} vs ${selected} #${analysis.opp.seed} ${analysis.opp.conference}`}
                />
                <GradeCard
                  label="Recent Form"
                  grade={analysis.grades.form}
                  detail={`NYK ${analysis.nyk.last10.w}–${analysis.nyk.last10.l} vs ${selected} ${analysis.opp.last10.w}–${analysis.opp.last10.l} L10`}
                />
              </div>

              {/* Overall summary */}
              {(() => {
                const gs = Object.values(analysis.grades) as Grade[];
                const pts = gs.reduce((s, g) => s + ({ A: 5, B: 4, C: 3, D: 2, F: 1 }[g] ?? 3), 0);
                const avg = pts / gs.length;
                const overall: Grade = avg >= 4.5 ? 'A' : avg >= 3.5 ? 'B' : avg >= 2.5 ? 'C' : avg >= 1.5 ? 'D' : 'F';
                const verdict = avg >= 4 ? 'Knicks are heavy favorites in this matchup.'
                  : avg >= 3 ? 'This is a competitive matchup — could go either way.'
                  : 'Knicks face a tough test in this matchup.';
                return (
                  <div
                    className="mt-5 rounded-xl p-4 flex items-center gap-4"
                    style={{ backgroundColor: '#0d1829', border: `1px solid ${gradeColor(overall)}30` }}
                  >
                    <div>
                      <div
                        className="text-5xl font-black leading-none"
                        style={{ fontFamily: 'Oswald, sans-serif', color: gradeColor(overall) }}
                      >
                        {overall}
                      </div>
                      <div className="text-xs mt-1 font-bold tracking-widest" style={{ color: 'rgba(147,197,253,0.5)' }}>
                        OVERALL
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{verdict}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(147,197,253,0.5)' }}>
                        Based on 2025–26 regular season stats vs {analysis.opp.city} {analysis.opp.name}.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* ══ SECTION 4: COACHING MATCHUP ══ */}
          <CoachingMatchupSection
            oppTricode={selected}
            oppColor={oppColor}
            oppName={`${analysis.opp.city} ${analysis.opp.name}`}
          />

          {/* ══ SECTION 5: X-FACTORS ══ */}
          {playerAnalysis ? (
            <section>
              <h2 style={{
                fontFamily: 'Oswald, sans-serif', fontSize: '1.2rem',
                fontWeight: 600, color: '#fff', letterSpacing: '0.08em',
                marginBottom: '1rem',
              }}>
                05 — X-FACTORS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <XFactorCard
                  player={playerAnalysis.nykXFactor}
                  reason={playerAnalysis.nykReason}
                  teamColor={NYK_BLUE}
                  teamLabel="New York Knicks"
                />
                <XFactorCard
                  player={playerAnalysis.oppXFactor}
                  reason={playerAnalysis.oppReason}
                  teamColor={oppColor}
                  teamLabel={`${analysis.opp.city} ${analysis.opp.name}`}
                />
              </div>
            </section>
          ) : (
            analysis && (
              <section>
                <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.2rem', fontWeight: 600, color: '#fff', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                  05 — X-FACTORS
                </h2>
                <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#111d35', border: '1px solid rgba(0,107,182,0.25)' }}>
                  <p style={{ color: 'rgba(147,197,253,0.5)' }}>Player data unavailable — please refresh.</p>
                </div>
              </section>
            )
          )}
        </>
      )}
    </div>
  );
}
