'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, LogIn, LogOut, Download, ArrowLeft, Filter, X } from 'lucide-react';
import { coachesAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function CoachPersonalAttendance() {
  const [attendances, setAttendances] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [coachProfile, setCoachProfile] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    status: 'all', // all, complete, in-service, absent
    lateOnly: false,
    searchDate: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des données du coach...');
      
      const [profileData, attendanceData, statsData, todayData] = await Promise.all([
        coachesAPI.getMyProfile().catch(err => {
          console.error('❌ Erreur profile:', err);
          return null;
        }),
        coachesAPI.getMyAttendance().catch(err => {
          console.error('❌ Erreur attendance:', err);
          return [];
        }),
        coachesAPI.getMyAttendanceStats(selectedMonth, selectedYear).catch(err => {
          console.error('❌ Erreur stats:', err);
          return null;
        }),
        coachesAPI.getMyTodayAttendance().catch(err => {
          console.error('❌ Erreur today:', err);
          return null;
        })
      ]);

      console.log('✅ Données chargées:', { 
        profile: profileData ? `${profileData.firstName} ${profileData.lastName}` : 'null',
        attendances: attendanceData?.length || 0,
        hasStats: !!statsData,
        hasToday: !!todayData 
      });
      
      setCoachProfile(profileData);
      setAttendances(attendanceData || []);
      setStats(statsData);
      setTodayAttendance(todayData);
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      toast.error(`Erreur lors du chargement des données: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Fonction de filtrage
  const getFilteredAttendances = () => {
    let filtered = [...attendances];

    // Filtre par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(a => {
        if (filters.status === 'complete') return a.checkOut;
        if (filters.status === 'in-service') return a.checkIn && !a.checkOut;
        if (filters.status === 'absent') return !a.checkIn;
        return true;
      });
    }

    // Filtre retards uniquement
    if (filters.lateOnly) {
      filtered = filtered.filter(a => a.isLate);
    }

    // Recherche par date
    if (filters.searchDate) {
      filtered = filtered.filter(a => {
        const dateStr = formatDate(a.date).toLowerCase();
        return dateStr.includes(filters.searchDate.toLowerCase());
      });
    }

    return filtered;
  };

  const filteredAttendances = getFilteredAttendances();

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      status: 'all',
      lateOnly: false,
      searchDate: ''
    });
  };

  const hasActiveFilters = filters.status !== 'all' || filters.lateOnly || filters.searchDate;

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mon Historique de Présence</h1>
              {coachProfile && (
                <p className="text-gray-600">
                  {coachProfile.firstName} {coachProfile.lastName} - {coachProfile.matricule}
                </p>
              )}
            </div>
          </div>
          {coachProfile?.qrCode && (
            <button
              onClick={() => setShowQRCode(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Mon QR Code
            </button>
          )}
        </div>
        <p className="text-gray-600">Consultez vos pointages et statistiques</p>
      </div>

      {/* Modal QR Code */}
      {showQRCode && coachProfile?.qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowQRCode(false)}>
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Mon QR Code</h3>
              <p className="text-gray-600 mb-6">Scannez ce code pour pointer</p>
              <div className="bg-white p-6 rounded-lg border-4 border-purple-500 inline-block">
                <img 
                  src={coachProfile.qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Matricule</p>
                <p className="text-lg font-bold text-gray-900">{coachProfile.matricule}</p>
              </div>
              <button
                onClick={() => setShowQRCode(false)}
                className="mt-6 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Présence d'aujourd'hui */}
      {todayAttendance && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Aujourd'hui - {formatDate(new Date().toISOString())}</p>
              <h2 className="text-2xl font-bold mb-3">Statut du jour</h2>
              <div className="flex items-center gap-6">
                {todayAttendance.checkIn && (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    <div>
                      <p className="text-xs opacity-75">Arrivée</p>
                      <p className="text-lg font-bold">{formatTime(todayAttendance.checkIn)}</p>
                    </div>
                  </div>
                )}
                {todayAttendance.checkOut && (
                  <div className="flex items-center gap-2">
                    <LogOut className="w-5 h-5" />
                    <div>
                      <p className="text-xs opacity-75">Départ</p>
                      <p className="text-lg font-bold">{formatTime(todayAttendance.checkOut)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              {todayAttendance.checkOut ? (
                <span className="bg-white text-green-600 px-4 py-2 rounded-full font-bold">
                  ✅ Journée complète
                </span>
              ) : todayAttendance.checkIn ? (
                <span className="bg-white text-yellow-600 px-4 py-2 rounded-full font-bold animate-pulse">
                  ⏰ En service
                </span>
              ) : (
                <span className="bg-white text-gray-600 px-4 py-2 rounded-full font-bold">
                  ⏳ Pas encore pointé
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistiques du mois */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border-2 border-green-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-1">Taux de présence</p>
            <p className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.attendanceRate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-purple-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-1">Journées complètes</p>
            <p className="text-3xl font-bold text-purple-600">{stats.completedDays}</p>
            <p className="text-xs text-gray-500 mt-1">jour</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-orange-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-1">Retards</p>
            <p className="text-3xl font-bold text-orange-600">{stats.lateDays}</p>
            <p className="text-xs text-gray-500 mt-1">après 8h15</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-indigo-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-1">Heures moyennes/jour</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.averageHoursPerDay}h</p>
            <p className="text-xs text-gray-500 mt-1">{stats.totalHoursWorked}h total</p>
          </div>
        </div>
      )}

      {/* Sélecteur de mois/année */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Panneau de filtres */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                Actifs
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtre par statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="complete">✅ Journées complètes</option>
              <option value="in-service">⏰ En service</option>
              <option value="absent">❌ Absences</option>
            </select>
          </div>

          {/* Filtre retards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Retards</label>
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filters.lateOnly}
                onChange={(e) => setFilters({...filters, lateOnly: e.target.checked})}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Afficher uniquement les retards</span>
            </label>
          </div>

          {/* Recherche par date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher une date</label>
            <input
              type="text"
              placeholder="Ex: lundi, 15 janvier..."
              value={filters.searchDate}
              onChange={(e) => setFilters({...filters, searchDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Résumé des résultats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{filteredAttendances.length}</span> résultat(s) 
            {attendances.length !== filteredAttendances.length && (
              <span> sur {attendances.length} total</span>
            )}
          </p>
        </div>
      </div>

      {/* Table des pointages */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Arrivée</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Départ</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durée</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      {hasActiveFilters 
                        ? 'Aucun résultat pour ces filtres' 
                        : 'Aucun pointage pour cette période'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 text-orange-600 hover:text-orange-700 font-medium text-sm"
                      >
                        Réinitialiser les filtres
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{formatDate(attendance.date)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {attendance.checkIn ? (
                        <div className="inline-flex flex-col items-center">
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                            attendance.isLate ? 'bg-orange-100' : 'bg-green-100'
                          }`}>
                            <LogIn className={`w-4 h-4 ${
                              attendance.isLate ? 'text-orange-600' : 'text-green-600'
                            }`} />
                            <span className={`text-sm font-bold ${
                              attendance.isLate ? 'text-orange-700' : 'text-green-700'
                            }`}>
                              {formatTime(attendance.checkIn.time)}
                            </span>
                          </div>
                          {attendance.isLate && (
                            <span className="text-xs text-orange-600 font-medium mt-1">
                              Retard
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">--:--</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {attendance.checkOut ? (
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-100">
                          <LogOut className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-bold text-blue-700">
                            {formatTime(attendance.checkOut.time)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">--:--</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {attendance.duration ? (
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-100">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-bold text-purple-700">
                            {attendance.duration}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {attendance.checkOut ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ✅ Complet
                        </span>
                      ) : attendance.checkIn ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          ⏰ En service
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          ❌ Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}