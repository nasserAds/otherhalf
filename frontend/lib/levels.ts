export const XP_PER_LEVEL = 750;

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressXp: number;
  progressPercent: number;
}

/**
 * OtherHalf's level progression is XP-based and intentionally has no DB
 * column: level is always derived from the authoritative User.xp value.
 * This keeps admin XP adjustments and match rewards immediately consistent.
 */
export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const currentLevelXp = (level - 1) * XP_PER_LEVEL;
  const nextLevelXp = level * XP_PER_LEVEL;
  const progressXp = safeXp - currentLevelXp;
  const progressPercent = Math.min(100, Math.round((progressXp / XP_PER_LEVEL) * 100));

  return { level, currentLevelXp, nextLevelXp, progressXp, progressPercent };
}
