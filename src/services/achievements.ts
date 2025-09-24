import { pocketbase } from './pocketbase';
import {
  AchievementRecord,
  UserAchievementRecord,
  Achievement,
  ACHIEVEMENT_DEFINITIONS,
  AchievementStatus
} from '../types/achievements';

const pb = pocketbase.client;

/**
 * Test PocketBase connection and collections
 */
export async function testPocketBaseConnection() {
  try {
    console.log('Testing PocketBase connection...');
    console.log('PocketBase URL being used:', pb.baseUrl);
    console.log('Auth token present:', !!pb.authStore.token);
    console.log('Current user:', pb.authStore.record?.email || 'Not logged in');

    // Test basic connection
    const health = await pb.health.check();
    console.log('PocketBase health:', health);

    // Test collections existence and try a simple query
    try {
      const collections = await pb.collections.getFullList();
      console.log('Available collections:', collections.map(c => c.name));

      const hasAchievements = collections.some(c => c.name === 'achievements');
      const hasUserAchievements = collections.some(c => c.name === 'user_achievements');

      console.log('Achievements collection exists:', hasAchievements);
      console.log('User_achievements collection exists:', hasUserAchievements);

      // Try to actually query the achievements collection to test permissions
      if (hasAchievements) {
        try {
          const testQuery = await pb.collection('achievements').getList(1, 1, { requestKey: null });
          console.log('Achievements collection accessible, sample count:', testQuery.totalItems);
        } catch (queryError: any) {
          console.log('Achievements collection exists but query failed:', queryError.message, 'Status:', queryError.status);
        }
      }

      return {
        connected: true,
        hasAchievements,
        hasUserAchievements,
        collections: collections.map(c => c.name),
      };
    } catch (collectionError: any) {
      console.log('Could not fetch collections:', collectionError.message, 'Status:', collectionError.status);

      // Even if we can't list collections, try to query achievements directly
      try {
        console.log('Trying direct achievements query...');
        const testQuery = await pb.collection('achievements').getList(1, 1, { requestKey: null });
        console.log('Direct query successful, achievements exist with', testQuery.totalItems, 'items');
        return {
          connected: true,
          hasAchievements: true,
          hasUserAchievements: true, // Assume it exists if achievements exist
          collections: [],
          note: 'Collections list not accessible but direct query works',
        };
      } catch (directError: any) {
        console.log('Direct achievements query also failed:', directError.message, 'Status:', directError.status);
        return {
          connected: true,
          hasAchievements: false,
          hasUserAchievements: false,
          collections: [],
          note: 'Collections check requires admin access or authentication issue',
          error: directError.message,
        };
      }
    }
  } catch (error: any) {
    console.error('PocketBase connection test failed:', {
      message: error.message,
      status: error.status,
      url: error.url,
    });
    return {
      connected: false,
      error: error.message,
    };
  }
}

/**
 * Fetch all achievements from database
 */
export async function fetchAchievements(): Promise<AchievementRecord[]> {
  try {
    // Ensure user is authenticated
    if (!pb.authStore.isValid) {
      throw new Error('Authentication required to fetch achievements');
    }

    console.log('Attempting to fetch achievements from:', pb.baseUrl + '/api/collections/achievements/records');
    console.log('Auth state - is valid:', pb.authStore.isValid, 'user:', pb.authStore.record?.email);
    console.log('Auth token:', pb.authStore.token ? 'Present' : 'Missing');

    const result = await pb.collection('achievements').getFullList<AchievementRecord>({
      sort: 'created',
      requestKey: null, // Disable request cancellation
    });

    console.log('Successfully fetched achievements:', result.length, 'items');
    return result;
  } catch (error: any) {
    console.error('Error fetching achievements:', {
      message: error.message,
      status: error.status,
      data: error.data,
      url: error.url,
      isAbort: error.isAbort,
      originalError: error.originalError?.name,
      baseUrl: pb.baseUrl,
      authValid: pb.authStore.isValid,
      userEmail: pb.authStore.record?.email,
    });

    // Handle authentication errors
    if (error.status === 401 || error.status === 403) {
      throw new Error('Authentication failed. Please log in again.');
    }

    // Handle AbortError (network timeout/connectivity issues)
    if (error.isAbort || error.originalError?.name === 'AbortError' || error.status === 0) {
      throw new Error('Network connection timeout. Please check your connection and try again.');
    }

    throw error;
  }
}

/**
 * Fetch user's completed achievements
 */
export async function fetchUserAchievements(userId: string): Promise<UserAchievementRecord[]> {
  try {
    // Ensure user is authenticated
    if (!pb.authStore.isValid) {
      throw new Error('Authentication required to fetch user achievements');
    }

    console.log('Fetching user achievements for:', userId);
    console.log('Current authenticated user:', pb.authStore.record?.id);

    // Ensure user can only access their own achievements
    if (pb.authStore.record?.id !== userId) {
      throw new Error('Unauthorized: Can only access your own achievements');
    }

    return await pb.collection('user_achievements').getFullList<UserAchievementRecord>({
      filter: pb.filter('user_id = {:userId}', { userId }),
      sort: 'created',
      requestKey: null,
    });
  } catch (error: any) {
    // If it's a 404 or the user simply has no achievements, return empty array
    if (error.status === 404 || error.message?.includes('no records found')) {
      console.log('No achievements found for user, returning empty array');
      return [];
    }

    // Handle authentication errors
    if (error.status === 401 || error.status === 403) {
      throw new Error('Authentication failed. Please log in again.');
    }

    console.error('Error fetching user achievements:', {
      message: error.message,
      status: error.status,
      data: error.data,
      url: error.url,
      isAbort: error.isAbort,
      originalError: error.originalError?.name,
      userId: userId,
      authValid: pb.authStore.isValid,
    });
    throw error;
  }
}

/**
 * Get achievements with user completion status
 */
export async function getAchievementsWithStatus(userId: string): Promise<Achievement[]> {
  try {
    // Check if user is authenticated
    if (!pb.authStore.isValid) {
      console.error('User not authenticated, cannot fetch achievements');
      throw new Error('Authentication required to access achievements');
    }

    console.log('Authenticated user:', pb.authStore.record?.email, 'Token valid:', pb.authStore.isValid);

    // Fetch all achievements from database
    const achievements = await fetchAchievements();

    // Fetch user's completed achievements (this might return empty array if user has no achievements)
    let userAchievements: UserAchievementRecord[] = [];
    try {
      userAchievements = await fetchUserAchievements(userId);
    } catch (userAchError: any) {
      // If user has no achievements yet, that's fine - just continue with empty array
      console.log('User has no achievements yet or error fetching user achievements:', userAchError.message);
      userAchievements = [];
    }

    // Create a set of completed achievement IDs for quick lookup
    const completedIds = new Set(userAchievements.map(ua => ua.achievement_id));

    // Map ALL database achievements to frontend format
    const achievementsWithStatus: Achievement[] = achievements.map(achievement => {
      // Get static definition for additional metadata (category, points, etc.)
      const definition = ACHIEVEMENT_DEFINITIONS[achievement.id];

      // Determine status: completed if user has it, unlocked otherwise
      const isCompleted = completedIds.has(achievement.id);
      const status: AchievementStatus = isCompleted ? 'completed' : 'unlocked';

      const completedUserAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);

      return {
        id: achievement.id,
        title: achievement.name, // Use database name as primary
        description: achievement.description, // Use database description as primary
        category: definition?.category || 'practice', // Use static definition category
        status,
        points: definition?.points || 10, // Use static definition points
        icon: definition?.icon || '🏆', // Use static definition icon
        progress: definition?.progress || (isCompleted ? (definition?.maxProgress || 1) : 0),
        maxProgress: definition?.maxProgress || 1,
        unlockedDate: completedUserAchievement ? new Date(completedUserAchievement.created) : undefined,
      };
    });

    return achievementsWithStatus;
  } catch (error: any) {
    console.error('Error getting achievements with status:', error);

    // If we can't fetch from database at all, use static definitions as fallback
    if (error.status === 404 || error.status === 0 || error.message.includes('Something went wrong')) {
      console.log('Using static achievement definitions as fallback');
      return Object.entries(ACHIEVEMENT_DEFINITIONS).map(([key, definition]) => ({
        id: key,
        ...definition,
        status: 'unlocked' as AchievementStatus, // Show all as unlocked in offline mode
        unlockedDate: undefined,
      }));
    }

    throw error;
  }
}

/**
 * Mark an achievement as completed for a user
 */
export async function completeAchievement(userId: string, achievementId: string): Promise<UserAchievementRecord> {
  try {
    // Check if already completed
    const existing = await pb.collection('user_achievements').getFullList<UserAchievementRecord>({
      filter: pb.filter('user_id = {:userId} && achievement_id = {:achievementId}', {
        userId,
        achievementId
      }),
    });

    if (existing.length > 0) {
      return existing[0]; // Already completed
    }

    // Create new completion record
    return await pb.collection('user_achievements').create<UserAchievementRecord>({
      user_id: userId,
      achievement_id: achievementId,
    });
  } catch (error) {
    console.error('Error completing achievement:', error);
    throw error;
  }
}

/**
 * Calculate achievement statistics for a user
 */
export async function getAchievementStats(userId: string) {
  try {
    const achievements = await getAchievementsWithStatus(userId);

    const totalAchievements = achievements.length;
    const completedAchievements = achievements.filter(a => a.status === 'completed').length;
    const totalPoints = achievements
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + a.points, 0);

    return {
      totalAchievements,
      completedAchievements,
      totalPoints,
      completionPercentage: totalAchievements > 0 ? Math.round((completedAchievements / totalAchievements) * 100) : 0,
    };
  } catch (error) {
    console.error('Error calculating achievement stats:', error);
    // Return default stats if calculation fails
    return {
      totalAchievements: 0,
      completedAchievements: 0,
      totalPoints: 0,
      completionPercentage: 0,
    };
  }
}