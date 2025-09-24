import { Button, Text } from '@react-navigation/elements';
import { StyleSheet, View, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export function Home() {
  const { user } = useAuth();
  const navigation = useNavigation();

  // Mock data for demonstration - in real app this would come from your state/API
  const dailyStreak = 5;
  const todaysProgress = 3; // lessons/games completed today
  const weeklyGoal = 7; // lessons per week

  const quickActions = [
    {
      id: 'games',
      title: 'Play Games',
      subtitle: 'Improve your skills',
      icon: '🎮',
      color: '#FF6B6B',
      screen: 'Games' as const,
    },
    {
      id: 'lessons',
      title: 'Learn',
      subtitle: 'Master new concepts',
      icon: '📚',
      color: '#4ECDC4',
      screen: 'Lesson' as const,
    },
    {
      id: 'achievements',
      title: 'Achievements',
      subtitle: 'Track your progress',
      icon: '🏆',
      color: '#45B7D1',
      screen: 'Achievements' as const,
    },
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'View your stats',
      icon: '👤',
      color: '#96CEB4',
      screen: 'Profile' as const,
    },
  ];

  const recentActivities = [
    { id: 1, type: 'game', title: 'Pitch Perfect', score: 'High Score: 850', time: '2h ago' },
    { id: 2, type: 'lesson', title: 'Note Recognition', progress: 'Completed', time: '1 day ago' },
    { id: 3, type: 'achievement', title: 'Week Warrior', description: 'Played 7 days straight!', time: '2 days ago' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>





        {/* Daily Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Daily Progress</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{dailyStreak}</Text>
              <Text style={styles.progressLabel}>Day Streak</Text>
              <Text style={styles.streakEmoji}>🔥</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{todaysProgress}</Text>
              <Text style={styles.progressLabel}>Today's Sessions</Text>
              <Text style={styles.streakEmoji}>🎯</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{Math.round((todaysProgress/weeklyGoal) * 100)}%</Text>
              <Text style={styles.progressLabel}>Weekly Goal</Text>
              <Text style={styles.streakEmoji}>📈</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What would you like to do?</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: action.color }]}
                onPress={() => navigation.navigate(action.screen as never)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivities.map((activity) => (
              <TouchableOpacity key={activity.id} style={styles.activityItem} activeOpacity={0.6}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>
                    {activity.type === 'game' ? '🎮' : activity.type === 'lesson' ? '📚' : '🏆'}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>
                    {activity.score || activity.progress || activity.description}
                  </Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Continue Learning CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Games' as never)}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaIcon}>🚀</Text>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Ready to Play?</Text>
            <Text style={styles.ctaSubtitle}>Continue your musical journey</Text>
          </View>
        </TouchableOpacity>

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
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  progressCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 10,
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  streakEmoji: {
    fontSize: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 56) / 2, // Account for margins and gap
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  ctaButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bottomPadding: {
    height: 20,
  },
});
