import { completeAchievement } from '../services/achievements';
import { pocketbase } from '../services/pocketbase';

// Achievement IDs based on the database schema provided
export const GAME_ACHIEVEMENT_MAP = {
  'PITCH_PERFECT': 'a6l6furdelgay2y',    // Pitch Perfect - Win your first round of the Pitch Matching game
  'ALLEGRO_ARTIST': 'irg0eeat2ddv83n',   // Allegro Artist - Complete the Note Speed Test in under 60 seconds
  'RISING_STAR': 'g6g3xj6wqxfm4gf'       // Rising Star - Advance your rank for the first time, moving up from "Tone-Deaf Beginner"
} as const;

export type GameAchievementType = keyof typeof GAME_ACHIEVEMENT_MAP;

/**
 * Check and award achievement for completing Pitch Perfect game for first time
 */
export async function checkAndAwardPitchPerfectAchievement(): Promise<void> {
  try {
    const user = pocketbase.client.authStore.record;
    if (!user) {
      console.log('No authenticated user, skipping Pitch Perfect achievement check');
      return;
    }

    const achievementId = GAME_ACHIEVEMENT_MAP.PITCH_PERFECT;

    // Award the achievement
    console.log('Awarding Pitch Perfect achievement for first game completion:', achievementId);
    await completeAchievement(user.id, achievementId);

    console.log('Successfully awarded Pitch Perfect achievement:', achievementId);

    // Add experience points for the achievement
    await pocketbase.updateUserExperience(user.id, 75); // Bonus XP for achievement

  } catch (error: any) {
    // Don't fail the game completion if achievement fails
    console.error('Error awarding Pitch Perfect achievement:', error);

    // If it's already completed, that's fine
    if (error.message?.includes('already completed') || error.status === 409) {
      console.log('Pitch Perfect achievement already completed, which is fine');
      return;
    }

    // Log other errors but don't throw to avoid breaking game flow
    console.error('Unexpected error in Pitch Perfect achievement system:', error);
  }
}

/**
 * Check and award achievement for completing Note Speed Test in under 60 seconds
 */
export async function checkAndAwardAllegroArtistAchievement(totalTimeMs: number): Promise<void> {
  try {
    const user = pocketbase.client.authStore.record;
    if (!user) {
      console.log('No authenticated user, skipping Allegro Artist achievement check');
      return;
    }

    // Check if game was completed in under 60 seconds (60000 ms)
    if (totalTimeMs >= 60000) {
      console.log(`Game completed in ${(totalTimeMs / 1000).toFixed(2)}s, not fast enough for Allegro Artist achievement (need <60s)`);
      return;
    }

    const achievementId = GAME_ACHIEVEMENT_MAP.ALLEGRO_ARTIST;

    // Award the achievement
    console.log(`Awarding Allegro Artist achievement for completing speed test in ${(totalTimeMs / 1000).toFixed(2)}s:`, achievementId);
    await completeAchievement(user.id, achievementId);

    console.log('Successfully awarded Allegro Artist achievement:', achievementId);

    // Add experience points for the achievement
    await pocketbase.updateUserExperience(user.id, 100); // Bonus XP for speed achievement

  } catch (error: any) {
    // Don't fail the game completion if achievement fails
    console.error('Error awarding Allegro Artist achievement:', error);

    // If it's already completed, that's fine
    if (error.message?.includes('already completed') || error.status === 409) {
      console.log('Allegro Artist achievement already completed, which is fine');
      return;
    }

    // Log other errors but don't throw to avoid breaking game flow
    console.error('Unexpected error in Allegro Artist achievement system:', error);
  }
}

/**
 * Get achievement description for UI display
 */
export function getGameAchievementDescription(achievement: GameAchievementType): string {
  switch (achievement) {
    case 'PITCH_PERFECT': return 'Win your first round of the Pitch Matching game';
    case 'ALLEGRO_ARTIST': return 'Complete the Note Speed Test in under 60 seconds';
    case 'RISING_STAR': return 'Advance your rank for the first time, moving up from "Tone-Deaf Beginner"';
    default: return 'Complete the game achievement';
  }
}

/**
 * Get achievement title for UI display
 */
export function getGameAchievementTitle(achievement: GameAchievementType): string {
  switch (achievement) {
    case 'PITCH_PERFECT': return 'Pitch Perfect';
    case 'ALLEGRO_ARTIST': return 'Allegro Artist';
    case 'RISING_STAR': return 'Rising Star';
    default: return 'Game Achievement';
  }
}

/**
 * Check if user has completed a specific game achievement
 */
export async function hasGameAchievement(achievementType: GameAchievementType): Promise<boolean> {
  try {
    const user = pocketbase.client.authStore.record;
    if (!user) {
      console.log('No authenticated user, cannot check achievement');
      return false;
    }

    const achievementId = GAME_ACHIEVEMENT_MAP[achievementType];
    if (!achievementId) {
      console.error('Invalid achievement type:', achievementType);
      return false;
    }

    // Use the existing achievements service which has better error handling
    const { getAchievementsWithStatus } = await import('../services/achievements');
    const achievements = await getAchievementsWithStatus(user.id);

    // Check if the specific achievement is completed
    const targetAchievement = achievements.find(a => a.id === achievementId);
    return targetAchievement?.status === 'completed';

  } catch (error: any) {
    console.error(`Error checking game achievement ${achievementType}:`, error);

    // Log more details about the error
    if (error.status) {
      console.error('Error status:', error.status);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }

    return false;
  }
}