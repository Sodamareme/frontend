"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, getAuthToken, removeAuthToken, setAuthToken } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

// Define the user type
type User = {
  id: string;
  email: string;
  role: string;
};

// Define the auth context type
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is already logged in
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = getAuthToken();
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          // Decode the token to check if it's expired
          const decodedToken = jwtDecode<{ exp: number }>(token);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp > currentTime) {
            setUser(JSON.parse(storedUser));
          } else {
            // Token is expired, clear storage
            removeAuthToken();
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        removeAuthToken();
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authAPI.login(email, password);
      const token = response?.access_token || response?.accessToken || response?.token;
      if (token) {
        setAuthToken(token);
      }
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear the token and user from localStorage
    removeAuthToken();
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create a hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
