import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { getAchievementStats, getAchievementsWithStatus } from '../../../services/achievements';
import { LESSON_ACHIEVEMENT_MAP } from '../../../utils/lessonAchievements';

const { width } = Dimensions.get('window');

// Define difficulty levels and their notes
interface DifficultyLevel {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  notes: string[];
  color: string;
  icon: string;
}

// Available difficulty levels
const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    id: '1',
    title: 'Easy Chords',
    description: 'Learn the basic notes: A, C, D, E, G',
    difficulty: 'Easy',
    notes: ['A', 'C', 'D', 'E', 'G'],
    color: '#4CAF50',
    icon: '🎵',
  },
  {
    id: '2',
    title: 'Medium Chords',
    description: 'Practice intermediate notes: B, F',
    difficulty: 'Medium',
    notes: ['B', 'F'],
    color: '#FFC107',
    icon: '🎶',
  },
  {
    id: '3',
    title: 'Hard Chords',
    description: 'Master advanced sharp notes: A#, C#, D#, F#, G#',
    difficulty: 'Hard',
    notes: ['A#', 'C#', 'D#', 'F#', 'G#'],
    color: '#F44336',
    icon: '🎼',
  },
];

interface AchievementProgress {
  totalAchievements: number;
  completedAchievements: number;
  totalPoints: number;
  completionPercentage: number;
  lessonAchievements: {
    Easy: boolean;
    Medium: boolean;
    Hard: boolean;
  };
}

export function Lessons() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress>({
    totalAchievements: 0,
    completedAchievements: 0,
    totalPoints: 0,
    completionPercentage: 0,
    lessonAchievements: {
      Easy: false,
      Medium: false,
      Hard: false,
    }
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Fetch achievement progress
  const loadAchievementProgress = async () => {
    if (!user) return;

    setIsLoadingProgress(true);
    try {
      // Get general achievement stats
      const stats = await getAchievementStats(user.id);

      // Get detailed achievements to check lesson-specific ones
      const achievements = await getAchievementsWithStatus(user.id);

      // Check which lesson achievements are completed
      const lessonAchievements = {
        Easy: achievements.some(a => a.id === LESSON_ACHIEVEMENT_MAP.Easy && a.status === 'completed'),
        Medium: achievements.some(a => a.id === LESSON_ACHIEVEMENT_MAP.Medium && a.status === 'completed'),
        Hard: achievements.some(a => a.id === LESSON_ACHIEVEMENT_MAP.Hard && a.status === 'completed'),
      };

      setAchievementProgress({
        ...stats,
        lessonAchievements,
      });
    } catch (error) {
      console.error('Error loading achievement progress:', error);
      // Don't show error to user, just use default values
    } finally {
      setIsLoadingProgress(false);
    }
  };

  // Load progress when component mounts or when user changes
  useEffect(() => {
    loadAchievementProgress();
  }, [user]);

  // Reload progress when screen comes into focus (after completing a lesson)
  useFocusEffect(
    useCallback(() => {
      loadAchievementProgress();
    }, [user])
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return '#4CAF50';
      case 'Medium':
        return '#FFC107';
      case 'Hard':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const isLevelLocked = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    switch (difficulty) {
      case 'Easy':
        return false; // Easy is always unlocked
      case 'Medium':
        return !achievementProgress.lessonAchievements.Easy;
      case 'Hard':
        return !achievementProgress.lessonAchievements.Medium;
      default:
        return false;
    }
  };

  const handleDifficultySelect = (difficultyId: string) => {
    const selectedLevel = DIFFICULTY_LEVELS.find(level => level.id === difficultyId);
    if (selectedLevel) {
      if (isLevelLocked(selectedLevel.difficulty)) {
        // Show locked message
        return;
      }
      
      (navigation as any).navigate('LessonFlow', {
        difficulty: selectedLevel.difficulty,
        notes: selectedLevel.notes,
        title: selectedLevel.title
      });
    }
  };

  const handleNoteSelect = (note: string) => {
    // For quick practice, create a single-note lesson
    (navigation as any).navigate('LessonFlow', {
      difficulty: 'Easy',
      notes: [note],
      title: `Practice Note ${note}`
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Progress Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {isLoadingProgress ? '...' : achievementProgress.completedAchievements}
              </Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {isLoadingProgress ? '...' : achievementProgress.totalPoints}
              </Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {isLoadingProgress ? '...' : `${achievementProgress.completionPercentage}%`}
              </Text>
              <Text style={styles.statLabel}>Achievement Rate</Text>
            </View>
          </View>

          {/* Lesson Achievement Progress */}
          <View style={styles.achievementBadges}>
            <View style={[styles.achievementBadge, achievementProgress.lessonAchievements.Easy && styles.completedBadge]}>
              <Text style={[styles.badgeIcon, achievementProgress.lessonAchievements.Easy && styles.completedIcon]}>🎵</Text>
              <Text style={[styles.badgeText, achievementProgress.lessonAchievements.Easy && styles.completedText]}>
                First Chords{achievementProgress.lessonAchievements.Easy ? ' ✓' : ''}
              </Text>
            </View>
            <View style={[styles.achievementBadge, achievementProgress.lessonAchievements.Medium && styles.completedBadge]}>
              <Text style={[styles.badgeIcon, achievementProgress.lessonAchievements.Medium && styles.completedIcon]}>🎶</Text>
              <Text style={[styles.badgeText, achievementProgress.lessonAchievements.Medium && styles.completedText]}>
                Barre Master{achievementProgress.lessonAchievements.Medium ? ' ✓' : ''}
              </Text>
            </View>
            <View style={[styles.achievementBadge, achievementProgress.lessonAchievements.Hard && styles.completedBadge]}>
              <Text style={[styles.badgeIcon, achievementProgress.lessonAchievements.Hard && styles.completedIcon]}>🎼</Text>
              <Text style={[styles.badgeText, achievementProgress.lessonAchievements.Hard && styles.completedText]}>
                Sharp Shooter{achievementProgress.lessonAchievements.Hard ? ' ✓' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Difficulty Levels */}
        <View style={styles.section}>
          <View style={styles.levelsGrid}>
            {DIFFICULTY_LEVELS.map((level) => {
              const isLocked = isLevelLocked(level.difficulty);
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelCard, 
                    { backgroundColor: isLocked ? '#cccccc' : level.color },
                    isLocked && styles.lockedCard
                  ]}
                  onPress={() => handleDifficultySelect(level.id)}
                  activeOpacity={isLocked ? 1 : 0.7}
                  disabled={isLocked}
                >
                  {isLocked && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}
                  <Text style={[styles.levelIcon, isLocked && styles.lockedIcon]}>{level.icon}</Text>
                  <Text style={[styles.levelTitle, isLocked && styles.lockedText]}>{level.title}</Text>
                  <Text style={[styles.levelDescription, isLocked && styles.lockedText]}>
                    {isLocked 
                      ? (level.difficulty === 'Medium' 
                          ? 'Complete Easy lessons first' 
                          : 'Complete Medium lessons first')
                      : level.description
                    }
                  </Text>
                  <View style={styles.difficultyContainer}>
                    <View
                      style={[
                        styles.difficultyBadge,
                        { backgroundColor: isLocked ? '#999999' : getDifficultyColor(level.difficulty) }
                      ]}
                    >
                      <Text style={styles.difficultyText}>{level.difficulty}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    marginBottom: 8,
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
  levelsGrid: {
    gap: 16,
  },
  levelCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  levelIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
  },
  levelDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  difficultyContainer: {
    alignSelf: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
  achievementBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  achievementBadge: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 80,
    opacity: 0.6,
  },
  completedBadge: {
    backgroundColor: '#e8f5e8',
    opacity: 1,
  },
  badgeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  completedIcon: {
    opacity: 1,
  },
  badgeText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  completedText: {
    color: '#4CAF50',
  },
  lockedCard: {
    opacity: 0.6,
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  lockIcon: {
    fontSize: 20,
    color: '#666',
  },
  lockedIcon: {
    opacity: 0.5,
  },
  lockedText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});