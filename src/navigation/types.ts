import { StaticParamList } from '@react-navigation/native';

// Root stack parameter list for authenticated users
export type RootStackParamList = {
  AuthenticatedApp: undefined;
  Settings: undefined;
  Achievements: undefined;
  GameChord: undefined;
  GameMemory: undefined;
  GameSpeed: undefined;
  LessonFlow: {
    difficulty: 'Easy' | 'Medium' | 'Hard';
    notes: string[];
    title: string;
  };
  LessonNote: {
    note: string;
  };
  NotFound: undefined;
};

// Authentication stack parameter list
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Home bottom tabs parameter list
export type HomeTabsParamList = {
  Home: undefined;
  Games: undefined;
  Lesson: undefined;
  Profile: undefined;
};

// Global navigation types declaration
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList, AuthStackParamList {}
  }
}