"use client";

import { useState, useEffect } from 'react';
import { learnersAPI, promotionsAPI, referentialsAPI, attendanceAPI } from '@/lib/api';
import { Users, Book, Award, BarChart2, QrCode, Clock } from 'lucide-react';
import Link from 'next/link';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import CoachDashboard from '@/components/dashboard/CoachDashboard';
import LearnerDashboard from '@/components/dashboard/LearnerDashboard';
import VigilDashboard from '@/components/dashboard/VigilDashboard';
import RestaurateurDashboard from '@/components/dashboard/RestaurateurDashboard';

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Get user role from localStorage
    const getUserRole = () => {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUserRole(parsedUser.role);
          } catch (error) {
            console.error('Failed to parse user data:', error);
          }
        }
      }
      setLoading(false);
    };
    
    getUserRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render different dashboard based on user role
  switch (userRole) {
    case 'ADMIN':
      return <AdminDashboard />;
      
    case 'COACH':
      return <CoachDashboard />;
      
    case 'APPRENANT':
      return <LearnerDashboard />;
      
    case 'VIGIL':
      return <VigilDashboard />;
      
    case 'RESTAURATEUR':
      return <RestaurateurDashboard />;
      
    default:
      return (
        <div className="py-8 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600 mb-6">
            Votre rôle ({userRole || 'Non défini'}) n'a pas accès au dashboard.
          </p>
          <Link 
            href="/"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      );
  }
} 