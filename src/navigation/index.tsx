import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HeaderButton, Text } from "@react-navigation/elements";
import {
  createStaticNavigation,
  StaticParamList,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, ActivityIndicator, View } from "react-native";
import React from "react";
import bell from "../assets/bell.png";
import newspaper from "../assets/newspaper.png";
import { Home } from "./screens/Home";
import { Profile } from "./screens/Profile";
import { Settings } from "./screens/Settings";
import { Games } from "./screens/Games";
import { GamePitch } from "./screens/GamePitch";
import { GameMemory } from "./screens/GameMemory";
import { GameSpeed } from "./screens/GameSpeed";
import { NotFound } from "./screens/NotFound";
import { Login } from "./screens/Login";
import { Register } from "./screens/Register";
import { Lesson } from "./screens/Lesson";
import { Achievements } from "./screens/Achievements";
import { useAuth } from "../contexts/AuthContext";

const HomeTabs = createBottomTabNavigator({
  screens: {
    Home: {
      screen: Home,
      options: {
        title: "Feed",
        tabBarIcon: ({ color, size }) => (
          <Image
            source={newspaper}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        ),
      },
    },
    Games: {
      screen: Games,
      options: {
        title: "Game Modes",
        tabBarIcon: ({ color, size }) => (
          <Image
            source={bell}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        ),
      },
    },
    Lesson: {
      screen: Lesson,
      options: {
        title: "Lesson",
        tabBarIcon: ({ color, size }) => (
          <Image
            source={newspaper}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        ),
      },
    },
    Profile: {
      screen: Profile,
      options: {
        title: "Profile",
        tabBarIcon: ({ color, size }) => (
          <Image
            source={newspaper} // You can replace this with a profile icon if you have one
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        ),
      },
    },
  },
});

const RootStack = createNativeStackNavigator({
  screens: {
    AuthenticatedApp: {
      screen: HomeTabs,
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

const AuthStack = createNativeStackNavigator({
  screens: {
    Login: {
      screen: Login,
      options: {
        title: "Login",
        headerShown: false,
      },
    },
    Register: {
      screen: Register,
      options: {
        title: "Register",
        headerShown: false,
      },
    },
  },
});

// Authentication-aware navigation component
function AuthNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    const AuthenticatedNavigation = createStaticNavigation(RootStack);
    return <AuthenticatedNavigation />;
  } else {
    const UnauthenticatedNavigation = createStaticNavigation(AuthStack);
    return <UnauthenticatedNavigation />;
  }
}

export const Navigation = AuthNavigator;

type RootStackParamList = StaticParamList<typeof RootStack>;
type AuthStackParamList = StaticParamList<typeof AuthStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList, AuthStackParamList {}
  }
}
