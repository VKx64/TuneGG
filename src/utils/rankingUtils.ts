// Ranking system utilities for TuneEgg

export interface RankInfo {
  title: string;
  minExp: number;
  maxExp: number;
  color: string;
  bgColor: string;
}

export interface UserRankData {
  current: RankInfo;
  next?: RankInfo;
  progress: number;
}

export const RANKS: RankInfo[] = [
  { title: 'Tone-Deaf Beginner', minExp: 0, maxExp: 99, color: '#8B4513', bgColor: '#F5DEB3' },
  { title: 'Note Novice', minExp: 100, maxExp: 249, color: '#696969', bgColor: '#D3D3D3' },
  { title: 'Rhythm Rookie', minExp: 250, maxExp: 499, color: '#CD7F32', bgColor: '#F4A460' },
  { title: 'Melody Maker', minExp: 500, maxExp: 999, color: '#C0C0C0', bgColor: '#F5F5F5' },
  { title: 'Harmony Hero', minExp: 1000, maxExp: 1999, color: '#FFD700', bgColor: '#FFF8DC' },
  { title: 'Pitch Perfect', minExp: 2000, maxExp: 3999, color: '#00CED1', bgColor: '#E0FFFF' },
  { title: 'Tempo Master', minExp: 4000, maxExp: 7999, color: '#9370DB', bgColor: '#E6E6FA' },
  { title: 'Scale Sage', minExp: 8000, maxExp: 15999, color: '#FF6347', bgColor: '#FFE4E1' },
  { title: 'Chord Champion', minExp: 16000, maxExp: 31999, color: '#FF1493', bgColor: '#FFB6C1' },
  { title: 'Symphony Virtuoso', minExp: 32000, maxExp: 63999, color: '#DC143C', bgColor: '#FFE4E1' },
  { title: 'Musical Maestro', minExp: 64000, maxExp: 127999, color: '#4169E1', bgColor: '#E6E6FA' },
  { title: 'Legendary Composer', minExp: 128000, maxExp: Infinity, color: '#FF8C00', bgColor: '#FFF8DC' },
];

/**
 * Get the user's current rank and progression information based on experience points
 * @param experience - The user's current experience points
 * @returns UserRankData containing current rank, next rank, and progress percentage
 */
export const getTitleAndRank = (experience: number): UserRankData => {
  const currentRank = RANKS.find(rank => experience >= rank.minExp && experience <= rank.maxExp) || RANKS[0];
  const nextRank = RANKS.find(rank => rank.minExp > experience);

  const progress = nextRank
    ? ((experience - currentRank.minExp) / (nextRank.minExp - currentRank.minExp)) * 100
    : 100;

  return {
    current: currentRank,
    next: nextRank,
    progress: Math.max(0, Math.min(100, progress))
  };
};

/**
 * Calculate experience needed to reach the next rank
 * @param experience - Current experience points
 * @returns Number of experience points needed for next rank, or 0 if at max rank
 */
export const getExpToNextRank = (experience: number): number => {
  const rankData = getTitleAndRank(experience);
  return rankData.next ? rankData.next.minExp - experience : 0;
};

/**
 * Get rank by index (useful for displaying all ranks)
 * @param index - The rank index (0-based)
 * @returns RankInfo or undefined if index is out of bounds
 */
export const getRankByIndex = (index: number): RankInfo | undefined => {
  return RANKS[index];
};

/**
 * Get all available ranks
 * @returns Array of all rank information
 */
export const getAllRanks = (): RankInfo[] => {
  return [...RANKS];
};

/**
 * Check if experience value would result in a rank up
 * @param currentExp - Current experience
 * @param newExp - New experience value
 * @returns true if the new experience results in a higher rank
 */
export const isRankUp = (currentExp: number, newExp: number): boolean => {
  const currentRank = getTitleAndRank(currentExp);
  const newRank = getTitleAndRank(newExp);

  const currentRankIndex = RANKS.findIndex(rank => rank.title === currentRank.current.title);
  const newRankIndex = RANKS.findIndex(rank => rank.title === newRank.current.title);

  return newRankIndex > currentRankIndex;
};

/**
 * Format experience points for display
 * @param experience - Experience points to format
 * @returns Formatted string (e.g., "1.2K XP", "15 XP")
 */
export const formatExperience = (experience: number): string => {
  if (experience >= 1000000) {
    return `${(experience / 1000000).toFixed(1)}M XP`;
  } else if (experience >= 1000) {
    return `${(experience / 1000).toFixed(1)}K XP`;
  } else {
    return `${experience} XP`;
  }
};
