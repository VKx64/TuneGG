import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image } from "react-native";
import bell from "../../assets/bell.png";
import newspaper from "../../assets/newspaper.png";
import { Home } from "../screens/main/Home";
import { Profile } from "../screens/main/Profile";
import { Games } from "../screens/games/Games";
import { Lesson } from "../screens/lessons/Lesson";
import { HomeTabsParamList } from '../types';

export const HomeTabsStack = createBottomTabNavigator<HomeTabsParamList>({
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