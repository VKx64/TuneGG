import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Login } from '../screens/auth/Login';
import { Register } from '../screens/auth/Register';
import { AuthStackParamList } from '../types';

export const AuthStack = createNativeStackNavigator<AuthStackParamList>({
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