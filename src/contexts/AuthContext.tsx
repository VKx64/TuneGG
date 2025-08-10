import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { pocketbase, User } from '../services/pocketbase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, passwordConfirm: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app start
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        if (pocketbase.isAuthenticated) {
          setUser(pocketbase.currentUser);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const unsubscribe = pocketbase.onAuthChange((token, record) => {
      setUser(record);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const authResponse = await pocketbase.login(email, password);
    setUser(authResponse.record as unknown as User);
  };

  const register = async (email: string, password: string, passwordConfirm: string, name?: string) => {
    const record = await pocketbase.register(email, password, passwordConfirm, name);
    // After registration, automatically log the user in
    const authResponse = await pocketbase.login(email, password);
    setUser(authResponse.record as unknown as User);
  };

  const logout = async () => {
    await pocketbase.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: pocketbase.isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
