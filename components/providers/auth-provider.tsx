"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
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
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          // Decode the token to check if it's expired
          const decodedToken = jwtDecode<{ exp: number }>(token);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp > currentTime) {
            setUser(JSON.parse(storedUser));
          } else {
            // Token is expired, clear storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        // If there's any issue with the token, clear it
        localStorage.removeItem('accessToken');
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
      
      try {
        // Attempt to login with the API
        const response = await authAPI.login(email, password);
        
        // Save the token and user in localStorage
        localStorage.setItem('accessToken', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Set the user in state
        setUser(response.user);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } catch (apiError) {
        console.error('API login failed, using test account:', apiError);
        
        // For testing purposes - fallback to a test user if API fails
        // This allows testing the UI without a working backend
        if (email === 'test@example.com' && password === 'password') {
          const testUser = {
            id: '1',
            email: 'test@example.com',
            role: 'ADMIN'
          };
          
          localStorage.setItem('accessToken', 'test-token');
          localStorage.setItem('user', JSON.stringify(testUser));
          
          setUser(testUser);
          router.push('/dashboard');
          return;
        }
        
        // Re-throw the error if not using test credentials
        throw apiError;
      }
    } catch (error: any) {
      // Handle login errors
      setError(error.response?.data?.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear the token and user from localStorage
    localStorage.removeItem('accessToken');
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