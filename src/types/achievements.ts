// Database record interfaces matching PocketBase schema

export interface AchievementRecord {
  id: string;
  name: string;
  description: string;
  icon: string; // Will be a file field URL from PocketBase
  created: string;
  updated: string;
}

export interface UserAchievementRecord {
  id: string;
  user_id: string;
  achievement_id: string;
  created: string;
  updated: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  experience?: number;
  created: string;
  updated: string;
}

// Frontend interfaces for component usage
export type AchievementStatus = 'locked' | 'unlocked' | 'completed';
export type AchievementCategory = 'tuning' | 'chords' | 'scales' | 'rhythm' | 'practice' | 'lessons';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  status: AchievementStatus;
  points: number;
  icon: string;
  unlockedDate?: Date;
  progress?: number;
  maxProgress?: number;
}

// Achievement definitions for mapping static data to database
export const ACHIEVEMENT_DEFINITIONS: Record<string, Omit<Achievement, 'id' | 'status' | 'unlockedDate'>> = {
  'first_tune': {
    title: 'First String Tuned',
    description: 'Successfully tune your first guitar string',
    category: 'tuning',
    points: 10,
    icon: '🎯',
    progress: 1,
    maxProgress: 1,
  },
  'perfect_tuner': {
    title: 'Perfect Tuner',
    description: 'Tune all 6 strings within ±5 cents accuracy',
    category: 'tuning',
    points: 50,
    icon: '🎵',
    progress: 0,
    maxProgress: 6,
  },
  'speed_tuner': {
    title: 'Speed Tuner',
    description: 'Tune your guitar in under 30 seconds',
    category: 'tuning',
    points: 25,
    icon: '⚡',
    progress: 0,
    maxProgress: 1,
  },
  'first_chord': {
    title: 'First Chord Master',
    description: 'Learn your first guitar chord',
    category: 'chords',
    points: 15,
    icon: '🎸',
    progress: 1,
    maxProgress: 1,
  },
  'basic_chords': {
    title: 'Basic Chord Master',
    description: 'Master 5 basic chords (G, C, D, Em, Am)',
    category: 'chords',
    points: 75,
    icon: '🏆',
    progress: 0,
    maxProgress: 5,
  },
  'barre_beginner': {
    title: 'Barre Chord Beginner',
    description: 'Successfully play your first barre chord',
    category: 'chords',
    points: 100,
    icon: '💪',
    progress: 0,
    maxProgress: 1,
  },
  'pentatonic_minor': {
    title: 'Pentatonic Explorer',
    description: 'Learn the minor pentatonic scale',
    category: 'scales',
    points: 40,
    icon: '🎼',
    progress: 0,
    maxProgress: 5,
  },
  'major_scale': {
    title: 'Major Scale Master',
    description: 'Master the major scale across the fretboard',
    category: 'scales',
    points: 120,
    icon: '🌟',
    progress: 0,
    maxProgress: 7,
  },
  'metronome_friend': {
    title: 'Metronome Friend',
    description: 'Practice with metronome for 10 sessions',
    category: 'rhythm',
    points: 30,
    icon: '⏱️',
    progress: 0,
    maxProgress: 10,
  },
  'rhythm_master': {
    title: 'Rhythm Master',
    description: 'Play complex rhythmic patterns accurately',
    category: 'rhythm',
    points: 80,
    icon: '🥁',
    progress: 0,
    maxProgress: 1,
  },
  'daily_practice': {
    title: 'Daily Practitioner',
    description: 'Practice guitar for 7 consecutive days',
    category: 'practice',
    points: 50,
    icon: '📅',
    progress: 0,
    maxProgress: 7,
  },
  'practice_marathon': {
    title: 'Practice Marathon',
    description: 'Practice for 2 hours in a single session',
    category: 'practice',
    points: 60,
    icon: '🏃',
    progress: 0,
    maxProgress: 120,
  },
  'total_hours': {
    title: 'Dedicated Student',
    description: 'Accumulate 50 hours of total practice time',
    category: 'practice',
    points: 150,
    icon: '⏰',
    progress: 0,
    maxProgress: 50,
  },
  'lesson_complete': {
    title: 'Lesson Learner',
    description: 'Complete your first guitar lesson',
    category: 'lessons',
    points: 20,
    icon: '📚',
    progress: 1,
    maxProgress: 1,
  },
  'beginner_course': {
    title: 'Beginner Graduate',
    description: 'Complete the entire beginner course',
    category: 'lessons',
    points: 200,
    icon: '🎓',
    progress: 0,
    maxProgress: 12,
  },
};

export const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  tuning: '#4CAF50',
  chords: '#2196F3',
  scales: '#FF9800',
  rhythm: '#9C27B0',
  practice: '#F44336',
  lessons: '#795548',
};

export const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  tuning: 'Tuning',
  chords: 'Chords',
  scales: 'Scales',
  rhythm: 'Rhythm',
  practice: 'Practice',
  lessons: 'Lessons',
};