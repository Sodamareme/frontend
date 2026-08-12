"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';
import { authUtils, SESSION_EXPIRED_EVENT } from '@/lib/auth';
import { getUserFriendlyErrorMessage } from '@/lib/error';

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
    if (typeof window === 'undefined') {
      return;
    }

    let expiryTimer: ReturnType<typeof window.setTimeout> | null = null;

    const sessionExpiredMessage = 'Votre session a expiré. Veuillez vous reconnecter.';

    const clearExpiryTimer = () => {
      if (expiryTimer) {
        window.clearTimeout(expiryTimer);
        expiryTimer = null;
      }
    };

    const expireAndRedirect = () => {
      authUtils.expireSession();
      clearExpiryTimer();
      setUser(null);
      setError(sessionExpiredMessage);
      setIsLoading(false);
      router.replace('/');
    };

    const scheduleExpiry = (token: string) => {
      clearExpiryTimer();

      try {
        const decodedToken = jwtDecode<{ exp?: number }>(token);
        if (!decodedToken.exp) {
          return;
        }

        const remainingMs = decodedToken.exp * 1000 - Date.now();
        if (remainingMs <= 0) {
          expireAndRedirect();
          return;
        }

        expiryTimer = window.setTimeout(expireAndRedirect, remainingMs + 250);
      } catch {
        expireAndRedirect();
      }
    };

    const syncAuthState = () => {
      try {
        setIsLoading(true);
        const token = authUtils.getToken();
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
          clearExpiryTimer();
          setUser(null);
          setError(null);
          setIsLoading(false);
          return;
        }

        if (authUtils.isTokenExpired(token)) {
          expireAndRedirect();
          return;
        }

        setUser(JSON.parse(storedUser));
        setError(null);
        scheduleExpiry(token);
      } catch {
        authUtils.clearSession();
        clearExpiryTimer();
        setUser(null);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSessionExpired = () => {
      clearExpiryTimer();
      setUser(null);
      setError(sessionExpiredMessage);
      setIsLoading(false);
      router.replace('/');
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'accessToken' || event.key === 'user' || event.key === null) {
        syncAuthState();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAuthState();
      }
    };

    const handleFocus = () => {
      syncAuthState();
    };

    syncAuthState();

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired as EventListener);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearExpiryTimer();
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      try {
        // Attempt to login with the API
        const response = await authAPI.login(email, password);
        
        // Save the token and user in localStorage
        authUtils.setToken(response.access_token);
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
          
          authUtils.setToken('test-token');
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
      setError(getUserFriendlyErrorMessage(error, 'Échec de la connexion. Veuillez vérifier vos identifiants.'));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear the token and user from localStorage
    authUtils.logout();
    setUser(null);
    setError(null);
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
