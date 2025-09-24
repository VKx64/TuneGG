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
import { GAME_ACHIEVEMENT_MAP } from '../../../utils/gameAchievements';

const { width } = Dimensions.get('window');

// Define game mode types
interface GameMode {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  color: string;
  icon: string;
}

// Available game modes
const GAME_MODES: GameMode[] = [
  {
    id: '1',
    title: 'Pitch Matching',
    description: 'Hit 5 random notes consecutively to win!',
    difficulty: 'Beginner',
    color: '#4ECDC4',
    icon: '🎯',
  },
  {
    id: '2',
    title: 'Melody Memory',
    description: 'Memorize a sequence of notes and sing them back!',
    difficulty: 'Intermediate',
    color: '#FFD93D',
    icon: '🧠',
  },
  {
    id: '3',
    title: 'Note Speed Test',
    description: 'Play 20 different notes as fast as you can!',
    difficulty: 'Advanced',
    color: '#FF6B6B',
    icon: '⚡',
  },
];

interface GameAchievementProgress {
  pitchPerfect: boolean;
  allegroArtist: boolean;
  risingStar: boolean;
  totalAchievements: number;
  completedAchievements: number;
  totalPoints: number;
}

export function Games() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [achievementProgress, setAchievementProgress] = useState<GameAchievementProgress>({
    pitchPerfect: false,
    allegroArtist: false,
    risingStar: false,
    totalAchievements: 0,
    completedAchievements: 0,
    totalPoints: 0,
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Fetch achievement progress
  const loadAchievementProgress = async () => {
    if (!user) {
      console.log('No user available for loading achievement progress');
      return;
    }

    setIsLoadingProgress(true);
    try {
      // Get general achievement stats
      const stats = await getAchievementStats(user.id);

      // Get detailed achievements to check game-specific ones
      const achievements = await getAchievementsWithStatus(user.id);

      // Check which game achievements are completed
      const pitchPerfect = achievements.some(a => a.id === GAME_ACHIEVEMENT_MAP.PITCH_PERFECT && a.status === 'completed');
      const allegroArtist = achievements.some(a => a.id === GAME_ACHIEVEMENT_MAP.ALLEGRO_ARTIST && a.status === 'completed');
      const risingStar = achievements.some(a => a.id === GAME_ACHIEVEMENT_MAP.RISING_STAR && a.status === 'completed');

      setAchievementProgress({
        pitchPerfect,
        allegroArtist,
        risingStar,
        totalAchievements: stats.totalAchievements,
        completedAchievements: stats.completedAchievements,
        totalPoints: stats.totalPoints,
      });
    } catch (error) {
      console.error('Error loading game achievement progress:', error);
      // Use default values if everything fails
      setAchievementProgress({
        pitchPerfect: false,
        allegroArtist: false,
        risingStar: false,
        totalAchievements: 0,
        completedAchievements: 0,
        totalPoints: 0,
      });
    } finally {
      setIsLoadingProgress(false);
    }
  };

  // Load progress when component mounts or when user changes
  useEffect(() => {
    loadAchievementProgress();
  }, [user]);

  // Reload progress when screen comes into focus (after completing a game)
  useFocusEffect(
    useCallback(() => {
      loadAchievementProgress();
    }, [user])
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return '#4CAF50';
      case 'Intermediate':
        return '#FFC107';
      case 'Advanced':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const isGameLocked = (difficulty: 'Beginner' | 'Intermediate' | 'Advanced') => {
    switch (difficulty) {
      case 'Beginner':
        return false; // Beginner is always unlocked
      case 'Intermediate':
        return !achievementProgress.pitchPerfect; // Unlock after completing Pitch Perfect (Beginner)
      case 'Advanced':
        return !achievementProgress.pitchPerfect; // For now, unlock Advanced after Beginner since Memory game doesn't have specific achievement
      default:
        return false;
    }
  };

  const handleGameSelect = (gameId: string) => {
    const selectedMode = GAME_MODES.find(mode => mode.id === gameId);
    if (selectedMode) {
      if (isGameLocked(selectedMode.difficulty)) {
        // Show locked message
        return;
      }

      if (selectedMode.id === '1') {
        navigation.navigate('GamePitch' as never);
      } else if (selectedMode.id === '2') {
        navigation.navigate('GameMemory' as never);
      } else if (selectedMode.id === '3') {
        navigation.navigate('GameSpeed' as never);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Game Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Your Game Progress</Text>
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
                {isLoadingProgress ? '...' : `${Math.round((achievementProgress.completedAchievements / Math.max(achievementProgress.totalAchievements, 1)) * 100)}%`}
              </Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
          </View>

          {/* Game Achievement Progress */}
          <View style={styles.achievementBadges}>
            <View style={[styles.achievementBadge, achievementProgress.pitchPerfect && styles.completedBadge]}>
              <Text style={[styles.badgeIcon, achievementProgress.pitchPerfect && styles.completedIcon]}>🎯</Text>
              <Text style={[styles.badgeText, achievementProgress.pitchPerfect && styles.completedText]}>
                Pitch Perfect{achievementProgress.pitchPerfect ? ' ✓' : ''}
              </Text>
            </View>
            <View style={[styles.achievementBadge, achievementProgress.allegroArtist && styles.completedBadge]}>
              <Text style={[styles.badgeIcon, achievementProgress.allegroArtist && styles.completedIcon]}>⚡</Text>
              <Text style={[styles.badgeText, achievementProgress.allegroArtist && styles.completedText]}>
                Allegro Artist{achievementProgress.allegroArtist ? ' ✓' : ''}
              </Text>
            </View>
            <View style={[styles.achievementBadge, achievementProgress.risingStar && styles.completedBadge]}>
              <Text style={[styles.badgeIcon, achievementProgress.risingStar && styles.completedIcon]}>🌟</Text>
              <Text style={[styles.badgeText, achievementProgress.risingStar && styles.completedText]}>
                Rising Star{achievementProgress.risingStar ? ' ✓' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Games Grid */}
        <View style={styles.section}>
          <View style={styles.gamesGrid}>
            {GAME_MODES.map((game) => {
              const isLocked = isGameLocked(game.difficulty);
              return (
                <TouchableOpacity
                  key={game.id}
                  style={[
                    styles.gameCard,
                    { backgroundColor: isLocked ? '#cccccc' : game.color },
                    isLocked && styles.lockedCard
                  ]}
                  onPress={() => handleGameSelect(game.id)}
                  activeOpacity={isLocked ? 1 : 0.7}
                  disabled={isLocked}
                >
                  {isLocked && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}
                  <Text style={[styles.gameIcon, isLocked && styles.lockedIcon]}>{game.icon}</Text>
                  <Text style={[styles.gameTitle, isLocked && styles.lockedText]}>{game.title}</Text>
                  <Text style={[styles.gameDescription, isLocked && styles.lockedText]}>
                    {isLocked
                      ? (game.difficulty === 'Intermediate'
                          ? 'Complete Pitch Matching game first'
                          : 'Complete Beginner games first')
                      : game.description
                    }
                  </Text>
                  <View style={styles.difficultyContainer}>
                    <View
                      style={[
                        styles.difficultyBadge,
                        { backgroundColor: isLocked ? '#999999' : getDifficultyColor(game.difficulty) }
                      ]}
                    >
                      <Text style={styles.difficultyText}>{game.difficulty}</Text>
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
  gamesGrid: {
    gap: 16,
  },
  gameCard: {
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
  gameIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
  },
  gameDescription: {
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
  bottomPadding: {
    height: 20,
  },
});