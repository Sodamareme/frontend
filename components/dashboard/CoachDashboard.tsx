"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { learnersAPI, modulesAPI, referentialsAPI, attendanceAPI } from '@/lib/api';
import { Book, Users, CheckCircle, XCircle, Clock, ChevronDown, Calendar, TrendingUp, Award, Activity } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

export default function CoachDashboard() {
  const [activeModules, setActiveModules] = useState<any[]>([]);
  const [learners, setLearners] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  });
  const [selectedReferential, setSelectedReferential] = useState<string | null>(null);
  const [referentials, setReferentials] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    modules: true,
    learners: true,
    stats: true,
    referentials: true,
  });
  const [error, setError] = useState({
    modules: '',
    learners: '',
    stats: '',
    referentials: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const modulesData = await modulesAPI.getAllModules();
        setActiveModules(modulesData.filter((m: any) => 
          new Date(m.endDate) >= new Date()
        ));
        setLoading(prev => ({ ...prev, modules: false }));
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError(prev => ({ ...prev, modules: 'Failed to load modules' }));
        setLoading(prev => ({ ...prev, modules: false }));
      }

      try {
        const referentialsData = await referentialsAPI.getAllReferentials();
        setReferentials(referentialsData);
        if (referentialsData.length > 0) {
          setSelectedReferential(referentialsData[0].id);
        }
        setLoading(prev => ({ ...prev, referentials: false }));
      } catch (err) {
        console.error('Error fetching referentials:', err);
        setError(prev => ({ ...prev, referentials: 'Failed to load referentials' }));
        setLoading(prev => ({ ...prev, referentials: false }));
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedReferential) return;

    const fetchLearnersAndAttendance = async () => {
      try {
        setLoading(prev => ({ ...prev, learners: true, stats: true }));
        
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch le référentiel avec tous ses apprenants
        const referentialData = await referentialsAPI.getReferentialById(selectedReferential);
        const allLearnersData = referentialData.learners || [];
        
        setLearners(allLearnersData);
        
        // Fetch les absents du référentiel sélectionné pour aujourd'hui
        const absentsData = await attendanceAPI.getAbsentsByReferential(today, selectedReferential);
        
        console.log('Absents data for referential:', selectedReferential, absentsData);
        
        // Calculer les statistiques uniquement pour ce référentiel
        const totalLearners = allLearnersData.length;
        const absentCount = absentsData.totalAbsents || 0;
        
        // Calculer présents et retards à partir des données locales
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        
        let presentCount = 0;
        let lateCount = 0;
        
        allLearnersData.forEach((learner: any) => {
          const todayAttendance = learner.attendances?.find((att: any) => {
            const attDate = new Date(att.date);
            attDate.setHours(0, 0, 0, 0);
            return attDate.getTime() === todayDate.getTime();
          });
          
          if (todayAttendance && todayAttendance.isPresent) {
            if (todayAttendance.isLate) {
              lateCount++;
            } else {
              presentCount++;
            }
          }
        });
        
        // Vérification de cohérence
        const calculatedAbsent = totalLearners - presentCount - lateCount;
        
        console.log('Stats calculation:', {
          total: totalLearners,
          present: presentCount,
          late: lateCount,
          absentFromAPI: absentCount,
          calculatedAbsent: calculatedAbsent
        });
        
        setAttendanceStats({
          present: presentCount,
          late: lateCount,
          absent: absentCount, // Utiliser les données de l'API
          total: totalLearners,
        });
        
        setLoading(prev => ({ ...prev, learners: false, stats: false }));
      } catch (err) {
        console.error('Error fetching learners and attendance:', err);
        setError(prev => ({ 
          ...prev, 
          learners: 'Failed to load learners',
          stats: 'Failed to load stats'
        }));
        setLoading(prev => ({ ...prev, learners: false, stats: false }));
      }
    };

    fetchLearnersAndAttendance();
  }, [selectedReferential]);

  const presentPercentage = attendanceStats.total > 0 
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header avec animation */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              Dashboard Coach
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500 animate-pulse" />
              Gestion des modules et suivi des apprenants
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>
      
      {/* Action Buttons avec animation hover */}
      <div className="flex flex-wrap gap-3 mb-8 animate-slide-up">
        <Link 
          href="/dashboard/coaches/my-attendance" 
          className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <Calendar className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
          Mon historique de présence
        </Link>
      </div>
      
      {/* Referential Selection avec style amélioré */}
      {!loading.referentials && referentials.length > 0 && (
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-500" />
              Sélectionner un référentiel
            </label>
            <div className="relative group">
              <select
                value={selectedReferential || ''}
                onChange={(e) => setSelectedReferential(e.target.value)}
                className="block w-full pl-4 pr-10 py-3 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 cursor-pointer hover:border-orange-300"
              >
                {referentials.map(ref => (
                  <option key={ref.id} value={ref.id}>
                    {ref.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-orange-500 transition-colors">
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards avec animations */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            Présences du jour
          </h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-100 to-teal-50 rounded-full">
            <div className="h-2 w-2 bg-teal-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-teal-700">En direct</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="transform hover:scale-105 transition-all duration-300">
            <StatCard 
              title="Total Apprenants" 
              value={attendanceStats.total} 
              icon={<Users className="h-8 w-8 text-blue-500" />} 
              loading={loading.stats}
            />
          </div>
          <div className="transform hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.1s' }}>
            <StatCard 
              title="Présents" 
              value={attendanceStats.present} 
              icon={<CheckCircle className="h-8 w-8 text-teal-500" />} 
              suffix={`${presentPercentage}%`}
              loading={loading.stats}
            />
          </div>
          <div className="transform hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.2s' }}>
            <StatCard 
              title="En retard" 
              value={attendanceStats.late} 
              icon={<Clock className="h-8 w-8 text-orange-500" />} 
              suffix={attendanceStats.total > 0 ? `${Math.round((attendanceStats.late / attendanceStats.total) * 100)}%` : '0%'}
              loading={loading.stats}
            />
          </div>
          <div className="transform hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.3s' }}>
            <StatCard 
              title="Absents" 
              value={attendanceStats.absent} 
              icon={<XCircle className="h-8 w-8 text-red-500" />} 
              suffix={attendanceStats.total > 0 ? `${Math.round((attendanceStats.absent / attendanceStats.total) * 100)}%` : '0%'}
              loading={loading.stats}
            />
          </div>
        </div>
      </div>
      
      {/* Active Modules avec design moderne */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 animate-slide-up hover:shadow-2xl transition-shadow duration-300" style={{ animationDelay: '0.3s' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Book className="h-6 w-6 text-orange-500" />
            Modules actifs
          </h2>
          <Link 
            href="/dashboard/modules" 
            className="group text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Voir tous
            <ChevronDown className="h-4 w-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {loading.modules ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gradient-to-r from-gray-100 to-gray-50 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : error.modules ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            {error.modules}
          </div>
        ) : activeModules.length === 0 ? (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500 p-8 rounded-xl text-center">
            <Book className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Aucun module actif en ce moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeModules.map((module, index) => (
              <div 
                key={module.id} 
                className="group border-2 border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{module.name}</h3>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-teal-100 to-teal-50 px-4 py-2 rounded-full">
                    <div className="h-2 w-2 bg-teal-500 rounded-full animate-pulse"></div>
                    <span className="text-teal-800 text-sm font-semibold">En cours</span>
                  </div>
                </div>
                <div className="p-6 bg-white group-hover:bg-gray-50 transition-colors">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{module.description || 'Aucune description disponible'}</p>
                  <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4">
                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                      <Book className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{module.referential?.name || 'Non assigné'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">
                        {new Date(module.startDate).toLocaleDateString('fr-FR')} - {new Date(module.endDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link 
                      href={`/dashboard/modules/${module.id}`}
                      className="group/link inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-semibold hover:gap-3 transition-all"
                    >
                      Voir les détails
                      <ChevronDown className="h-4 w-4 rotate-[-90deg] group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Learners Table avec design moderne */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-slide-up hover:shadow-2xl transition-shadow duration-300" style={{ animationDelay: '0.4s' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-500" />
            Apprenants du référentiel
          </h2>
        </div>
        
        {loading.learners ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gradient-to-r from-gray-100 to-gray-50 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : error.learners ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            {error.learners}
          </div>
        ) : !selectedReferential ? (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500 p-8 rounded-xl text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Veuillez sélectionner un référentiel</p>
          </div>
        ) : learners.length === 0 ? (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500 p-8 rounded-xl text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Aucun apprenant dans ce référentiel</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Apprenant</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Statut du jour</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Taux de présence</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {learners.slice(0, 5).map((learner, index) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayAttendance = learner.attendances?.find((att: any) => {
                    const attDate = new Date(att.date);
                    attDate.setHours(0, 0, 0, 0);
                    return attDate.getTime() === today.getTime();
                  });

                  const totalAttendances = learner.attendances?.length || 0;
                  const presentCount = learner.attendances?.filter((a: any) => a.isPresent).length || 0;
                  const attendanceRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0;

                  let statusBadge;
                  if (todayAttendance) {
                    if (todayAttendance.isPresent) {
                      if (todayAttendance.isLate) {
                        statusBadge = (
                          <span className="px-3 py-1.5 inline-flex items-center text-xs font-bold rounded-full bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-200">
                            <Clock className="h-3 w-3 mr-1" />
                            En retard
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="px-3 py-1.5 inline-flex items-center text-xs font-bold rounded-full bg-gradient-to-r from-teal-100 to-teal-50 text-teal-700 border border-teal-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Présent
                          </span>
                        );
                      }
                    } else {
                      statusBadge = (
                        <span className="px-3 py-1.5 inline-flex items-center text-xs font-bold rounded-full bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          Absent
                        </span>
                      );
                    }
                  } else {
                    statusBadge = (
                      <span className="px-3 py-1.5 inline-flex items-center text-xs font-bold rounded-full bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 border border-gray-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Non scanné
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={learner.id} 
                      className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 overflow-hidden ring-2 ring-orange-200 hover:ring-4 transition-all">
                            {learner.photoUrl ? (
                              <img 
                                src={learner.photoUrl} 
                                alt={`${learner.firstName} ${learner.lastName}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-white text-sm font-bold">
                                {learner.firstName?.[0]}{learner.lastName?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">
                              {learner.firstName} {learner.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {learner.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusBadge}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                attendanceRate >= 80 ? 'bg-gradient-to-r from-teal-400 to-teal-600' : 
                                attendanceRate >= 50 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 
                                'bg-gradient-to-r from-red-400 to-red-600'
                              }`}
                              style={{ width: `${attendanceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700 font-bold min-w-[40px]">{attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        {/* <Link 
                          href={`/dashboard/learners/${learner.id}/grades`}
                          className="text-orange-600 hover:text-orange-700 mr-4 hover:underline transition-all"
                        >
                          Notes
                        </Link> */}
                        <Link 
                          href={`/dashboard/learners/${learner.id}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline transition-all"
                        >
                          Détails
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}