"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { learnersAPI, modulesAPI, referentialsAPI } from '@/lib/api';
import { QrCode, Calendar, FileText, Clock, CheckCircle, XCircle, Book, X, User, GraduationCap, Target, Award } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { LearnerDetails, AttendanceStats, Module } from '@/lib/api';
import ModuleCard from '@/components/modules/ModuleCard';

export default function LearnerDashboard() {
  const [learnerDetails, setLearnerDetails] = useState<LearnerDetails | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [activeModules, setActiveModules] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    learner: true,
    stats: true,
    modules: true,
  });
  const [error, setError] = useState({
    learner: '',
    stats: '',
    modules: '',
  });
  const [showQRCode, setShowQRCode] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user email from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          throw new Error('User data not found');
        }

        const user = JSON.parse(userStr);
        if (!user?.email) {
          throw new Error('User email not found');
        }

        // Get learner details directly by email
        const details = await learnersAPI.getLearnerByEmail(user.email);
        if (details) {
          setLearnerDetails(details);
          
          // Calculate attendance stats
          const stats = learnersAPI.calculateAttendanceStats(details.attendances);
          setAttendanceStats(stats);
          
          // Récupérer les modules directement depuis le referential du learner
          if (details.referential?.id) {
            const referentialData = await referentialsAPI.getReferentialById(details.referential.id);
            setModules(referentialData.modules || []);
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError({
          learner: err.response?.data?.message || 'Failed to load learner data',
          stats: 'Failed to load attendance statistics',
          modules: 'Failed to load modules'
        });
      } finally {
        setLoading({
          learner: false,
          stats: false,
          modules: false
        });
      }
    };

    fetchData();
  }, []);

  if (loading.learner) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gradient-to-r from-teal-500 to-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin animate-reverse m-2"></div>
        </div>
      </div>
    );
  }

  const calculateAttendanceRate = () => {
    if (!attendanceStats) return 0;
    const total = attendanceStats.present + attendanceStats.late + attendanceStats.absent;
    return total > 0 ? Math.round((attendanceStats.present / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Header Section avec gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-teal-500 to-orange-600 rounded-3xl shadow-2xl">
  <div className="absolute inset-0 bg-black/10"></div>
  <div className="relative px-8 py-12">
    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
      <div className="text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">
              Bienvenue, {learnerDetails?.firstName || 'Apprenant'}
            </h1>
            <p className="text-orange-100 text-lg mt-1">
              Votre espace personnel ODC Inside
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <GraduationCap className="h-5 w-5 text-white" />
            <span className="text-white font-medium">
              {learnerDetails?.referential?.name || 'Formation'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <Target className="h-5 w-5 text-white" />
            <span className="text-white font-medium">
              Matricule: {learnerDetails?.matricule}
            </span>
          </div>
        </div>
      </div>

      {/* Taux de présence circulaire */}
      <div className="relative">
        <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {calculateAttendanceRate()}%
            </div>
            <div className="text-sm text-orange-100">
              Présence
            </div>
          </div>
        </div>
        <div className="absolute -top-2 -right-2 bg-orange-400 rounded-full p-2">
          <Award className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  </div>
</div>

       {/* QR Code Section - Design amélioré */}
<div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <div className="bg-gradient-to-r from-teal-50 to-orange-50 px-8 py-6">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-teal-100 rounded-xl">
        <QrCode className="h-8 w-8 text-teal-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Votre QR Code Personnel
        </h2>
        <p className="text-gray-600 mt-1">
          Scannez pour pointer votre présence et accéder aux services
        </p>
      </div>
    </div>
  </div>
  
  <div className="px-8 py-6 flex flex-col lg:flex-row items-center justify-between gap-8">
    <div className="flex-1 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-teal-600" />
            <div>
              <div className="text-sm text-teal-700">Accès rapide</div>
              <div className="font-semibold text-teal-800">Services ODC</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-orange-600" />
            <div>
              <div className="text-sm text-orange-700">Pointage</div>
              <div className="font-semibold text-orange-800">Présence</div>
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => setShowQRCode(true)}
        className="w-full md:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-teal-600 to-orange-600 text-white rounded-xl hover:from-teal-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        <QrCode className="mr-3 h-6 w-6" />
        Afficher en plein écran
      </button>
    </div>
    
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-orange-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
      <div className="relative h-36 w-36 lg:h-48 lg:w-48 bg-white p-4 rounded-xl border-2 border-teal-100 shadow-lg">
        <img
          src={learnerDetails?.qrCode}
          alt="QR Code"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  </div>
</div>

     {/* Stats Grid - Design amélioré */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-teal-100 text-sm font-medium">Présences</p>
        <p className="text-3xl font-bold">{attendanceStats?.present || 0}</p>
      </div>
      <div className="p-3 bg-white/20 rounded-full">
        <CheckCircle className="h-8 w-8" />
      </div>
    </div>
  </div>
  
  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-orange-100 text-sm font-medium">Retards</p>
        <p className="text-3xl font-bold">{attendanceStats?.late || 0}</p>
      </div>
      <div className="p-3 bg-white/20 rounded-full">
        <Clock className="h-8 w-8" />
      </div>
    </div>
  </div>
  
  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-red-100 text-sm font-medium">Absences</p>
        <p className="text-3xl font-bold">{attendanceStats?.absent || 0}</p>
      </div>
      <div className="p-3 bg-white/20 rounded-full">
        <XCircle className="h-8 w-8" />
      </div>
    </div>
  </div>
  
  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-purple-100 text-sm font-medium">Modules</p>
        <p className="text-3xl font-bold">{modules.length}</p>
      </div>
      <div className="p-3 bg-white/20 rounded-full">
        <Book className="h-8 w-8" />
      </div>
    </div>
  </div>
</div>

        {/* Modules Section - Design amélioré */}
<div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  <div className="bg-gradient-to-r from-teal-50 to-purple-50 px-8 py-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-teal-100 rounded-xl">
          <Book className="h-8 w-8 text-teal-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Modules du référentiel
          </h2>
          <p className="text-gray-600 mt-1">
            {learnerDetails?.referential?.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">
          {modules.length} modules
        </span>
      </div>
    </div>
  </div>
  
  <div className="p-8">
    {modules.length === 0 ? (
      <div className="text-center py-16">
        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
          <Book className="h-8 w-8 text-gray-400 mx-auto" />
        </div>
        <p className="text-gray-500 text-lg">
          Aucun module trouvé pour ce référentiel
        </p>
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module, index) => (
          <div
            key={module.id}
            className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:border-teal-300 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            <ModuleCard
              module={module}
              onClick={() => console.log(`Module clicked: ${module.name}`)}
            />
          </div>
        ))}
      </div>
    )}
  </div>
</div>

{/* QR Code Modal - Design amélioré */}
<Dialog open={showQRCode} onOpenChange={setShowQRCode}>
  <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl border-0 shadow-2xl">
    <div className="text-center p-8 bg-gradient-to-br from-teal-50 via-white to-purple-50 rounded-2xl">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-teal-100 rounded-full mb-4">
          <QrCode className="h-8 w-8 text-teal-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Votre QR Code</h2>
        <p className="text-gray-600">Scannez ce code pour accéder aux services</p>
      </div>
      
      <div className="relative inline-block mb-8">
        <div className="absolute -inset-2 bg-gradient-to-r from-teal-600 to-purple-600 rounded-2xl blur opacity-20"></div>
        <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <img
            src={learnerDetails?.qrCode}
            alt="QR Code"
            className="w-full h-auto"
            style={{
              minWidth: '200px',
              maxWidth: '400px',
              width: '100%',
              objectFit: 'contain'
            }}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
          <p className="text-2xl font-bold text-gray-800 mb-2">
            {learnerDetails?.firstName} {learnerDetails?.lastName}
          </p>
          <p className="text-lg text-gray-600 mb-2">
            Matricule: {learnerDetails?.matricule}
          </p>
          <p className="text-base text-gray-500">
            {learnerDetails?.referential?.name}
          </p>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
      </div>
    </div>
  );
}