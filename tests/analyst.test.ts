import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getEligibleXFactorPlayers,
  getCurrentSeasonLabel,
  selectXFactor,
  type PlayerStat,
} from '../lib/analyst.ts';

function makePlayer(overrides: Partial<PlayerStat>): PlayerStat {
  return {
    id: '1',
    name: 'Test Player',
    tricode: 'NYK',
    gamesPlayed: 60,
    min: 24,
    pts: 10,
    reb: 4,
    ast: 3,
    fgPct: 47,
    threePct: 36,
    stl: 1,
    blk: 0.4,
    threeAttempts: 4,
    recentGamesPlayed: 8,
    recentMin: 24,
    recentThreePct: 37,
    recentThreeAttempts: 4,
    isOnCurrentRoster: true,
    ...overrides,
  };
}

test('getCurrentSeasonLabel resolves the current NBA season across calendar years', () => {
  assert.equal(getCurrentSeasonLabel(new Date('2026-03-29T12:00:00Z')), '2025-26');
  assert.equal(getCurrentSeasonLabel(new Date('2026-10-01T12:00:00Z')), '2026-27');
});

test('getEligibleXFactorPlayers filters out stale or non-rotation players', () => {
  const eligible = makePlayer({ id: 'eligible', name: 'Rotation Wing' });
  const retired = makePlayer({
    id: 'retired',
    name: 'PJ Tucker',
    isOnCurrentRoster: false,
    recentMin: 0,
    recentGamesPlayed: 0,
  });
  const deepBench = makePlayer({
    id: 'deep-bench',
    name: 'Depth Guard',
    recentMin: 7,
    recentGamesPlayed: 5,
  });

  assert.deepEqual(
    getEligibleXFactorPlayers([eligible, retired, deepBench]).map(player => player.name),
    ['Rotation Wing'],
  );
});

test('selectXFactor prefers a secondary scorer when opponent defense is porous', () => {
  const players = [
    makePlayer({ id: '1', name: 'Primary Star', pts: 27, recentMin: 36 }),
    makePlayer({ id: '2', name: 'Two Way Wing', pts: 19, recentMin: 33 }),
    makePlayer({ id: '3', name: 'Bench Shooter', pts: 12, recentMin: 24 }),
  ];

  const pick = selectXFactor(players, 'NYK', 'ATL', 114.8, 111.2);

  assert.ok(pick);
  assert.equal(pick?.player.name, 'Two Way Wing');
  assert.equal(pick?.role, 'secondary-scorer');
});

test('selectXFactor refuses players who are not in the recent rotation', () => {
  const players = [
    makePlayer({
      id: '1',
      name: 'Inactive Vet',
      pts: 16,
      recentMin: 0,
      recentGamesPlayed: 0,
      isOnCurrentRoster: false,
    }),
    makePlayer({
      id: '2',
      name: 'Low Minute Specialist',
      threePct: 41,
      threeAttempts: 4,
      recentThreePct: 44,
      recentThreeAttempts: 3,
      recentMin: 8,
    }),
  ];

  const pick = selectXFactor(players, 'OKC', 'NYK', 108.4, 119.1);

  assert.equal(pick, null);
});
