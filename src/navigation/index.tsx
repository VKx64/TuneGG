import React from "react";
import { createStaticNavigation } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { RootStack } from "./stacks/RootStack";
import { AuthStack } from "./stacks/AuthStack";
import "./types"; // Import types for global declaration

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
