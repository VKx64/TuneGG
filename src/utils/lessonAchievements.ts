import { completeAchievement } from '../services/achievements';
import { pocketbase } from '../services/pocketbase';

// Achievement IDs based on the database schema provided
export const LESSON_ACHIEVEMENT_MAP = {
  'Easy': 'cdwcjoeokoy8euf',    // First Chords - Complete all Easy chord lessons (A, C, D, E, G)
  'Medium': '2fejyayowqacjg7',  // Barre Master - Conquer the challenging Medium chord lessons (B, F)
  'Hard': '2grphrjmrndx0t'      // Sharp Shooter - Master all Advanced sharp chord lessons (A#, C#, D#, F#, G#)
} as const;

export type DifficultyLevel = keyof typeof LESSON_ACHIEVEMENT_MAP;

/**
 * Check and award achievement for completing a difficulty level
 */
export async function checkAndAwardLessonAchievement(difficulty: DifficultyLevel): Promise<void> {
  try {
    const user = pocketbase.currentUser;
    if (!user) {
      console.log('No authenticated user, skipping achievement check');
      return;
    }

    const achievementId = LESSON_ACHIEVEMENT_MAP[difficulty];
    if (!achievementId) {
      console.log(`No achievement mapped for difficulty: ${difficulty}`);
      return;
    }

    // Award the achievement
    console.log(`Awarding achievement for ${difficulty} difficulty completion:`, achievementId);
    await completeAchievement(user.id, achievementId);

    console.log(`Successfully awarded achievement: ${achievementId} for difficulty: ${difficulty}`);

    // You could add user experience points here too
    await pocketbase.updateUserExperience(user.id, getExperienceForDifficulty(difficulty));

  } catch (error: any) {
    // Don't fail the lesson completion if achievement fails
    console.error('Error awarding lesson achievement:', error);

    // If it's already completed, that's fine
    if (error.message?.includes('already completed') || error.status === 409) {
      console.log('Achievement already completed, which is fine');
      return;
    }

    // Log other errors but don't throw to avoid breaking lesson flow
    console.error('Unexpected error in achievement system:', error);
  }
}

/**
 * Get experience points based on difficulty level
 */
function getExperienceForDifficulty(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 'Easy': return 50;
    case 'Medium': return 100;
    case 'Hard': return 200;
    default: return 25;
  }
}

/**
 * Get achievement description for UI display
 */
export function getAchievementDescription(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'Easy': return 'Complete all Easy chord lessons (A, C, D, E, G)';
    case 'Medium': return 'Conquer the challenging Medium chord lessons (B, F)';
    case 'Hard': return 'Master all Advanced sharp chord lessons (A#, C#, D#, F#, G#)';
    default: return 'Complete the lesson';
  }
}

/**
 * Get achievement title for UI display
 */
export function getAchievementTitle(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'Easy': return 'First Chords';
    case 'Medium': return 'Barre Master';
    case 'Hard': return 'Sharp Shooter';
    default: return 'Lesson Complete';
  }
}