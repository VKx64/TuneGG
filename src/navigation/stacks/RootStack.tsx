import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HeaderButton, Text } from '@react-navigation/elements';
import { HomeTabsStack } from './HomeTabsStack';
import { Settings } from '../screens/main/Settings';
import { Achievements } from '../screens/shared/Achievements';
import { GamePitch } from '../screens/games/GamePitch';
import { GameMemory } from '../screens/games/GameMemory';
import { GameSpeed } from '../screens/games/GameSpeed';
import { NotFound } from '../screens/shared/NotFound';
import { RootStackParamList } from '../types';

export const RootStack = createNativeStackNavigator<RootStackParamList>({
  screens: {
    AuthenticatedApp: {
      screen: HomeTabsStack,
      options: {
        title: "Home",
        headerShown: false,
      },
    },
    Settings: {
      screen: Settings,
      options: ({ navigation }) => ({
        presentation: "modal",
        headerRight: () => (
          <HeaderButton onPress={navigation.goBack}>
            <Text>Close</Text>
          </HeaderButton>
        ),
      }),
    },
    Achievements: {
      screen: Achievements,
      options: ({ navigation }) => ({
        presentation: "modal",
        headerRight: () => (
          <HeaderButton onPress={navigation.goBack}>
            <Text>Close</Text>
          </HeaderButton>
        ),
      }),
    },
    GamePitch: {
      screen: GamePitch,
      options: {
        title: "Pitch Matching Game",
        headerShown: true,
      },
    },
    GameMemory: {
      screen: GameMemory,
      options: {
        title: "Melody Memory Game",
        headerShown: true,
      },
    },
    GameSpeed: {
      screen: GameSpeed,
      options: {
        title: "Note Speed Test",
        headerShown: true,
      },
    },
    NotFound: {
      screen: NotFound,
      options: {
        title: "404",
      },
      linking: {
        path: "*",
      },
    },
  },
});