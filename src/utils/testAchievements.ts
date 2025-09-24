/**
 * Test script for lesson achievement functionality
 * This can be used to verify that the achievement system works correctly
 */

import { pocketbase } from '../services/pocketbase';
import { checkAndAwardLessonAchievement, LESSON_ACHIEVEMENT_MAP } from '../utils/lessonAchievements';
import { getAchievementsWithStatus } from '../services/achievements';

export async function testLessonAchievements() {
  console.log('🧪 Testing lesson achievement system...');

  try {
    // Check if user is authenticated
    if (!pocketbase.isAuthenticated) {
      console.log('❌ User not authenticated. Please log in first.');
      return;
    }

    const user = pocketbase.currentUser;
    if (!user) {
      console.log('❌ No current user found.');
      return;
    }

    console.log(`👤 Testing with user: ${user.email}`);

    // Test each difficulty level
    const difficulties: Array<keyof typeof LESSON_ACHIEVEMENT_MAP> = ['Easy', 'Medium', 'Hard'];

    for (const difficulty of difficulties) {
      console.log(`\n🎯 Testing ${difficulty} difficulty achievement...`);

      try {
        await checkAndAwardLessonAchievement(difficulty);
        console.log(`✅ Successfully processed ${difficulty} achievement`);
      } catch (error) {
        console.log(`❌ Error with ${difficulty} achievement:`, error);
      }
    }

    // Fetch and display current user achievements
    console.log('\n📊 Current user achievements:');
    const achievements = await getAchievementsWithStatus(user.id);

    const lessonAchievements = achievements.filter(a =>
      Object.values(LESSON_ACHIEVEMENT_MAP).includes(a.id as any)
    );

    lessonAchievements.forEach(achievement => {
      const status = achievement.status === 'completed' ? '✅' : '⏳';
      console.log(`${status} ${achievement.title}: ${achievement.description}`);
    });

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Usage: Call this function after user is authenticated
// testLessonAchievements();