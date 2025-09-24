import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { getAchievementsWithStatus, getAchievementStats } from '../../../services/achievements';
import {
  Achievement,
  AchievementStatus,
  AchievementCategory
} from '../../../types/achievements';



const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

export function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({
    totalAchievements: 0,
    completedAchievements: 0,
    totalPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load achievements and stats
  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Test connection first
        const connectionTest = await import('../../../services/achievements').then(m => m.testPocketBaseConnection());
        console.log('Connection test result:', connectionTest);

        // Add a small delay to see if it helps with the abort error
        await new Promise(resolve => setTimeout(resolve, 1000));

        const [achievementsData, statsData] = await Promise.all([
          getAchievementsWithStatus(user.id),
          getAchievementStats(user.id),
        ]);

        setAchievements(achievementsData);
        setStats(statsData);
      } catch (err: any) {
        console.error('Error loading achievements:', err);

        // Provide more specific error messages
        let errorMessage = 'Failed to load achievements.';
        if (err.message?.includes('Authentication required')) {
          errorMessage = 'Please log in to view achievements.';
        } else if (err.message?.includes('Authentication failed')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (err.message?.includes('Network connection timeout')) {
          errorMessage = 'Connection timeout. Please check your network and try again.';
        } else if (err.message?.includes('Something went wrong')) {
          errorMessage = 'Database connection issue. Using offline data.';
        }

        setError(errorMessage);

        // Use static data as fallback
        const staticAchievements = Object.entries(await import('../../../types/achievements').then(m => m.ACHIEVEMENT_DEFINITIONS))
          .map(([key, definition]) => ({
            id: key,
            ...definition,
            status: 'unlocked' as const,
            unlockedDate: undefined,
          }));

        setAchievements(staticAchievements);
        setStats({
          totalAchievements: staticAchievements.length,
          completedAchievements: 0,
          totalPoints: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id]);




  const renderAchievementCard = (achievement: Achievement) => {
    const isCompleted = achievement.status === 'completed';
    const isLocked = achievement.status === 'locked';

    return (
      <View
        key={achievement.id}
        style={[
          styles.achievementCard,
          isCompleted && styles.achievementCardCompleted,
          isLocked && styles.achievementCardLocked,
        ]}
      >
        <View
          style={[
            styles.achievementIcon,
            isCompleted && styles.achievementIconCompleted,
            isLocked && styles.achievementIconLocked
          ]}
        >
          <Text style={styles.achievementEmoji}>
            {isLocked ? '🔒' : achievement.icon}
          </Text>
        </View>

        <View style={styles.achievementContent}>
          <Text style={[
            styles.achievementTitle,
            isCompleted && styles.achievementTitleCompleted,
            isLocked && styles.achievementTitleLocked
          ]}>
            {achievement.title}
          </Text>
          <Text style={[
            styles.achievementDescription,
            isLocked && styles.achievementDescriptionLocked
          ]}>
            {achievement.description}
          </Text>
          {isCompleted && (
            <View style={styles.achievementFooter}>
              <Text style={styles.achievementProgressCompleted}>
                Completed!
              </Text>
              {achievement.unlockedDate && (
                <Text style={styles.completionDate}>
                  {achievement.unlockedDate.toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
          {isLocked && (
            <View style={styles.achievementFooter}>
              <Text style={styles.achievementProgressLocked}>
                Locked
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };



  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>Please log in to view achievements</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              // Trigger reload by updating a dependency
              setLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completedAchievements}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalAchievements}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Achievement List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements
              .sort((a, b) => {
                // Sort by status: completed first, then unlocked, then locked
                const statusOrder = { completed: 0, unlocked: 1, locked: 2 };
                const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                if (statusDiff !== 0) return statusDiff;

                // If same status, sort by title alphabetically
                return a.title.localeCompare(b.title);
              })
              .map(renderAchievementCard)
            }
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  achievementsGrid: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementCardCompleted: {
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#28a745',
  },
  achievementCardLocked: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIconCompleted: {
    backgroundColor: '#28a745',
  },
  achievementIconLocked: {
    backgroundColor: '#e0e0e0',
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  achievementTitleCompleted: {
    color: '#28a745',
  },
  achievementTitleLocked: {
    color: '#999',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  achievementDescriptionLocked: {
    color: '#999',
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementProgress: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  achievementProgressCompleted: {
    color: '#28a745',
  },
  achievementProgressLocked: {
    color: '#999',
  },
  completionDate: {
    fontSize: 10,
    color: '#28a745',
    fontStyle: 'italic',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});