'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { getAuthToken, getStoredUser, removeAuthToken, removeStoredUser } from '@/lib/api';
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
    // Check if user is authenticated
    const checkAuth = () => {
      if (typeof window === 'undefined') return;
      
      const token = getAuthToken();
      const userData = getStoredUser();
      
      if (!token || !userData) {
        router.push('/');
        return;
      }
      
      try {
        setUser(userData);
      } catch (error) {
        removeAuthToken();
        removeStoredUser();
        router.push('/');
        return;
      }
      
      setLoading(false);
    };
    
    checkAuth();
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
