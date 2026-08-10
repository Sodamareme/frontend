'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { authUtils, SESSION_EXPIRED_EVENT } from '@/lib/auth';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof window.setTimeout> | null = null;

    const clearTimeoutId = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const redirectToLogin = () => {
      clearTimeoutId();
      authUtils.expireSession();
      setUser(null);
      setLoading(false);
      router.replace('/');
    };

    const syncAuth = () => {
      try {
        const token = authUtils.getToken();
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
          clearTimeoutId();
          setUser(null);
          setLoading(false);
          router.replace('/');
          return;
        }

        if (authUtils.isTokenExpired(token)) {
          redirectToLogin();
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        const decoded = authUtils.getToken();
        if (decoded) {
          const tokenPayload = authUtils.isTokenExpired(decoded);
          if (tokenPayload) {
            redirectToLogin();
            return;
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        authUtils.clearSession();
        router.replace('/');
      }
    };

    const handleSessionExpired = () => {
      clearTimeoutId();
      setUser(null);
      setLoading(false);
      router.replace('/');
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'accessToken' || event.key === 'user' || event.key === null) {
        syncAuth();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAuth();
      }
    };

    const handleFocus = () => {
      syncAuth();
    };

    syncAuth();

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired as EventListener);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeoutId();
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        userRole={user?.role}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          user={user}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 
