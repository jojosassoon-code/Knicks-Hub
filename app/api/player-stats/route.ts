import { NextResponse } from 'next/server';
import { fetchAnalystPlayerData } from '@/lib/analystData';
import type { PlayerStat } from '@/lib/analyst';

export type { PlayerStat } from '@/lib/analyst';

export type PlayerStatsResponse = {
  byTeam: Record<string, PlayerStat[]>;
  integrity: {
    ok: boolean;
    season: string;
    notes: string[];
  };
  error?: boolean;
  reason?: string;
};

export async function GET() {
  try {
    const data = await fetchAnalystPlayerData();

    return NextResponse.json({
      byTeam: data.byTeam,
      integrity: {
        ok: data.notes.length === 0,
        season: data.season,
        notes: data.notes.length > 0 ? data.notes : [
          'Current rosters are sourced from NBA Stats team rosters.',
          'X-factor eligibility requires recent rotation minutes in the last 10 games.',
        ],
      },
    } satisfies PlayerStatsResponse);
  } catch (err) {
    console.error('player-stats error:', err);

    return NextResponse.json(
      {
        byTeam: {},
        integrity: {
          ok: false,
          season: 'unknown',
          notes: [
            'Current roster or recent-minute data could not be verified.',
            'Analyst Mode is using a safe fallback and will withhold X-factor picks instead of showing stale players.',
          ],
        },
        error: true,
        reason: 'NBA Stats API unavailable',
      } satisfies PlayerStatsResponse,
    );
  }
}
