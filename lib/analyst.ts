export type PlayerStat = {
  id: string;
  name: string;
  tricode: string;
  gamesPlayed: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  fgPct: number;
  threePct: number;
  stl: number;
  blk: number;
  threeAttempts: number;
  recentGamesPlayed: number;
  recentMin: number;
  recentThreePct: number;
  recentThreeAttempts: number;
  isOnCurrentRoster: boolean;
};

export type XFactorRole =
  | 'secondary-scorer'
  | 'volume-shooter'
  | 'glass-tilter';

export type XFactorPick = {
  player: PlayerStat;
  reason: string;
  role: XFactorRole;
};

const MIN_RECENT_GAMES = 3;
const MIN_RECENT_MINUTES = 12;
const MIN_SEASON_MINUTES = 10;
const MIN_SEASON_GAMES = 5;
const MIN_THREE_ATTEMPTS = 2;
const MIN_RECENT_THREE_ATTEMPTS = 1.5;
const MIN_THREE_PCT = 30;

function byNumberDesc<T>(items: T[], selector: (item: T) => number) {
  return [...items].sort((a, b) => {
    const diff = selector(b) - selector(a);
    if (diff !== 0) return diff;
    return 0;
  });
}

function getDisplayLastName(name: string): string {
  return name.trim().split(/\s+/).pop() ?? name;
}

export function getCurrentSeasonLabel(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const startYear = month >= 7 ? year : year - 1;
  const endYear = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}-${endYear}`;
}

export function isMeaningfulRotationPlayer(player: PlayerStat): boolean {
  return (
    player.isOnCurrentRoster &&
    player.gamesPlayed >= MIN_SEASON_GAMES &&
    player.min >= MIN_SEASON_MINUTES &&
    player.recentGamesPlayed >= MIN_RECENT_GAMES &&
    player.recentMin >= MIN_RECENT_MINUTES
  );
}

export function getEligibleXFactorPlayers(players: PlayerStat[]): PlayerStat[] {
  return players.filter(isMeaningfulRotationPlayer);
}

function pickSecondaryScorer(players: PlayerStat[]): PlayerStat | null {
  const ranked = byNumberDesc(players, player => player.pts * 100 + player.recentMin);
  if (ranked.length === 0) return null;
  return ranked[1] ?? ranked[0];
}

function pickVolumeShooter(players: PlayerStat[]): PlayerStat | null {
  const shooters = players.filter(
    player =>
      player.threeAttempts >= MIN_THREE_ATTEMPTS &&
      player.recentThreeAttempts >= MIN_RECENT_THREE_ATTEMPTS &&
      player.threePct >= MIN_THREE_PCT,
  );

  const ranked = byNumberDesc(
    shooters.length > 0 ? shooters : players,
    player =>
      player.recentThreePct * 1000 +
      player.recentThreeAttempts * 100 +
      player.threePct * 10 +
      player.recentMin,
  );

  return ranked[0] ?? null;
}

function pickGlassTilter(players: PlayerStat[]): PlayerStat | null {
  const ranked = byNumberDesc(
    players,
    player => player.reb * 100 + player.recentMin * 10 + player.pts,
  );
  return ranked[0] ?? null;
}

export function selectXFactor(
  players: PlayerStat[],
  teamTricode: string,
  opponentTricode: string,
  opponentPapg: number,
  opponentPpg: number,
): XFactorPick | null {
  const eligible = getEligibleXFactorPlayers(players);
  if (eligible.length === 0) return null;

  let role: XFactorRole;
  let player: PlayerStat | null;

  if (opponentPapg > 112) {
    role = 'secondary-scorer';
    player = pickSecondaryScorer(eligible);
  } else if (opponentPpg > 117) {
    role = 'volume-shooter';
    player = pickVolumeShooter(eligible);
  } else {
    role = 'glass-tilter';
    player = pickGlassTilter(eligible);
  }

  if (!player) return null;

  const lastName = getDisplayLastName(player.name);
  const minutesNote = `${player.recentMin.toFixed(1)} MPG over the last ${player.recentGamesPlayed} games`;

  if (role === 'secondary-scorer') {
    return {
      player,
      role,
      reason: `${lastName} is on the current ${teamTricode} roster and has played real rotation minutes (${minutesNote}). Against a defense allowing ${opponentPapg.toFixed(1)} PPG, he profiles as the secondary scorer most likely to swing the matchup.`,
    };
  }

  if (role === 'volume-shooter') {
    return {
      player,
      role,
      reason: `${lastName} clears the rotation guardrails (${minutesNote}) and gives ${teamTricode} a live floor-spacing threat with ${player.threePct.toFixed(1)}% from three on ${player.threeAttempts.toFixed(1)} attempts per game. That matters against ${opponentTricode}'s ${opponentPpg.toFixed(1)} PPG pace.`,
    };
  }

  return {
    player,
    role,
    reason: `${lastName} is a current-rotation presence (${minutesNote}) and gives ${teamTricode} the strongest rebounding counter with ${player.reb.toFixed(1)} RPG. Against ${opponentTricode}, the possession battle is the cleanest X-factor angle.`,
  };
}
