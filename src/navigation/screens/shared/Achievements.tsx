import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

// Achievement types
type AchievementStatus = 'locked' | 'unlocked' | 'completed';
type AchievementCategory = 'tuning' | 'chords' | 'scales' | 'rhythm' | 'practice' | 'lessons';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  status: AchievementStatus;
  progress: number; // 0-100
  maxProgress: number;
  points: number;
  icon: string; // Emoji icon for now
  unlockedDate?: Date;
}

// Dummy achievements data
const ACHIEVEMENTS: Achievement[] = [
  // Tuning achievements
  {
    id: 'first_tune',
    title: 'First String Tuned',
    description: 'Successfully tune your first guitar string',
    category: 'tuning',
    status: 'completed',
    progress: 1,
    maxProgress: 1,
    points: 10,
    icon: '🎯',
    unlockedDate: new Date('2025-01-15'),
  },
  {
    id: 'perfect_tuner',
    title: 'Perfect Tuner',
    description: 'Tune all 6 strings within ±5 cents accuracy',
    category: 'tuning',
    status: 'unlocked',
    progress: 4,
    maxProgress: 6,
    points: 50,
    icon: '🎵',
  },
  {
    id: 'speed_tuner',
    title: 'Speed Tuner',
    description: 'Tune your guitar in under 30 seconds',
    category: 'tuning',
    status: 'locked',
    progress: 0,
    maxProgress: 1,
    points: 25,
    icon: '⚡',
  },

  // Chord achievements
  {
    id: 'first_chord',
    title: 'First Chord Master',
    description: 'Learn your first guitar chord',
    category: 'chords',
    status: 'completed',
    progress: 1,
    maxProgress: 1,
    points: 15,
    icon: '🎸',
    unlockedDate: new Date('2025-01-20'),
  },
  {
    id: 'basic_chords',
    title: 'Basic Chord Master',
    description: 'Master 5 basic chords (G, C, D, Em, Am)',
    category: 'chords',
    status: 'unlocked',
    progress: 3,
    maxProgress: 5,
    points: 75,
    icon: '🏆',
  },
  {
    id: 'barre_beginner',
    title: 'Barre Chord Beginner',
    description: 'Successfully play your first barre chord',
    category: 'chords',
    status: 'locked',
    progress: 0,
    maxProgress: 1,
    points: 100,
    icon: '💪',
  },

  // Scale achievements
  {
    id: 'pentatonic_minor',
    title: 'Pentatonic Explorer',
    description: 'Learn the minor pentatonic scale',
    category: 'scales',
    status: 'unlocked',
    progress: 2,
    maxProgress: 5,
    points: 40,
    icon: '🎼',
  },
  {
    id: 'major_scale',
    title: 'Major Scale Master',
    description: 'Master the major scale across the fretboard',
    category: 'scales',
    status: 'locked',
    progress: 0,
    maxProgress: 7,
    points: 120,
    icon: '🌟',
  },

  // Rhythm achievements
  {
    id: 'metronome_friend',
    title: 'Metronome Friend',
    description: 'Practice with metronome for 10 sessions',
    category: 'rhythm',
    status: 'unlocked',
    progress: 7,
    maxProgress: 10,
    points: 30,
    icon: '⏱️',
  },
  {
    id: 'rhythm_master',
    title: 'Rhythm Master',
    description: 'Play complex rhythmic patterns accurately',
    category: 'rhythm',
    status: 'locked',
    progress: 0,
    maxProgress: 1,
    points: 80,
    icon: '🥁',
  },

  // Practice achievements
  {
    id: 'daily_practice',
    title: 'Daily Practitioner',
    description: 'Practice guitar for 7 consecutive days',
    category: 'practice',
    status: 'unlocked',
    progress: 5,
    maxProgress: 7,
    points: 50,
    icon: '📅',
  },
  {
    id: 'practice_marathon',
    title: 'Practice Marathon',
    description: 'Practice for 2 hours in a single session',
    category: 'practice',
    status: 'locked',
    progress: 45,
    maxProgress: 120,
    points: 60,
    icon: '🏃',
  },
  {
    id: 'total_hours',
    title: 'Dedicated Student',
    description: 'Accumulate 50 hours of total practice time',
    category: 'practice',
    status: 'unlocked',
    progress: 23,
    maxProgress: 50,
    points: 150,
    icon: '⏰',
  },

  // Lesson achievements
  {
    id: 'lesson_complete',
    title: 'Lesson Learner',
    description: 'Complete your first guitar lesson',
    category: 'lessons',
    status: 'completed',
    progress: 1,
    maxProgress: 1,
    points: 20,
    icon: '📚',
    unlockedDate: new Date('2025-01-18'),
  },
  {
    id: 'beginner_course',
    title: 'Beginner Graduate',
    description: 'Complete the entire beginner course',
    category: 'lessons',
    status: 'unlocked',
    progress: 8,
    maxProgress: 12,
    points: 200,
    icon: '🎓',
  },
];

const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  tuning: '#4CAF50',
  chords: '#2196F3',
  scales: '#FF9800',
  rhythm: '#9C27B0',
  practice: '#F44336',
  lessons: '#795548',
};

const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  tuning: 'Tuning',
  chords: 'Chords',
  scales: 'Scales',
  rhythm: 'Rhythm',
  practice: 'Practice',
  lessons: 'Lessons',
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

export function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  // Calculate stats
  const totalAchievements = ACHIEVEMENTS.length;
  const completedAchievements = ACHIEVEMENTS.filter(a => a.status === 'completed').length;
  const totalPoints = ACHIEVEMENTS.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.points, 0);

  // Filter achievements based on selected category
  const filteredAchievements = selectedCategory === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const renderProgressBar = (achievement: Achievement) => {
    const percentage = (achievement.progress / achievement.maxProgress) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: achievement.status === 'completed'
                  ? '#4CAF50'
                  : achievement.status === 'unlocked'
                  ? CATEGORY_COLORS[achievement.category]
                  : '#ccc'
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {achievement.progress}/{achievement.maxProgress}
        </Text>
      </View>
    );
  };

  const renderAchievementCard = (achievement: Achievement) => {
    const isCompleted = achievement.status === 'completed';
    const isUnlocked = achievement.status === 'unlocked';
    const isLocked = achievement.status === 'locked';

    return (
      <View
        key={achievement.id}
        style={[
          styles.achievementCard,
          isCompleted && styles.completedCard,
          isLocked && styles.lockedCard,
        ]}
      >
        <View style={styles.achievementHeader}>
          <Text style={[styles.achievementIcon, isLocked && styles.lockedIcon]}>
            {isLocked ? '🔒' : achievement.icon}
          </Text>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, isLocked && styles.lockedText]}>
              {achievement.title}
            </Text>
            <Text style={[styles.achievementDescription, isLocked && styles.lockedText]}>
              {achievement.description}
            </Text>
          </View>
          <View style={styles.achievementPoints}>
            <Text style={[styles.pointsText, isLocked && styles.lockedText]}>
              {achievement.points}
            </Text>
            <Text style={[styles.pointsLabel, isLocked && styles.lockedText]}>
              pts
            </Text>
          </View>
        </View>

        <View style={styles.achievementFooter}>
          <View style={[
            styles.categoryBadge,
            { backgroundColor: isLocked ? '#ccc' : CATEGORY_COLORS[achievement.category] }
          ]}>
            <Text style={styles.categoryText}>
              {CATEGORY_NAMES[achievement.category]}
            </Text>
          </View>

          {!isCompleted && (
            <View style={styles.progressSection}>
              {renderProgressBar(achievement)}
            </View>
          )}

          {isCompleted && achievement.unlockedDate && (
            <Text style={styles.unlockedDate}>
              Completed {achievement.unlockedDate.toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderCategoryFilter = () => {
    const categories: (AchievementCategory | 'all')[] = ['all', ...Object.keys(CATEGORY_NAMES) as AchievementCategory[]];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
              category !== 'all' && { backgroundColor: CATEGORY_COLORS[category] }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.selectedCategoryButtonText
            ]}>
              {category === 'all' ? 'All' : CATEGORY_NAMES[category]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.screenTitle}>Achievements</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{completedAchievements}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalAchievements}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Achievement List */}
      <ScrollView
        style={styles.achievementsList}
        contentContainerStyle={styles.achievementsListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredAchievements.map(renderAchievementCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categoryFilter: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#007AFF',
  },
  selectedCategoryButton: {
    backgroundColor: '#333',
  },
  categoryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  achievementsList: {
    flex: 1,
  },
  achievementsListContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completedCard: {
    backgroundColor: '#f8fff8',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  lockedCard: {
    backgroundColor: '#f8f8f8',
    opacity: 0.7,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  achievementInfo: {
    flex: 1,
    marginRight: 12,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  lockedText: {
    color: '#999',
  },
  achievementPoints: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#666',
  },
  achievementFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    flex: 1,
    marginLeft: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 30,
  },
  unlockedDate: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
});