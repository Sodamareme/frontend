import React, { useState, useEffect } from 'react';
import { Download, Printer, Calendar, Clock, TrendingUp } from 'lucide-react';
import { coachesAPI } from '@/lib/api';
import { toast } from 'sonner';

interface CoachAttendance {
  id: string;
  date: Date;
  coach: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
    referential?: string;
  };
  checkIn?: {
    time: Date;
    isLate: boolean;
  };
  checkOut?: {
    time: Date;
  };
  isPresent: boolean;
  isLate: boolean;
}

export default function CoachAttendanceTable() {
  const [attendances, setAttendances] = useState<CoachAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchAttendances();
  }, [selectedPeriod]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const data = await coachesAPI.getTodayAttendance();
      setAttendances(data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (checkIn: Date | string, checkOut?: Date | string) => {
    if (!checkOut) return { hours: 0, minutes: 0, display: '--' };
    
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      hours,
      minutes,
      display: `${hours}h ${String(minutes).padStart(2, '0')}min`
    };
  };

  const exportToCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Référentiel', 'Entrée', 'Sortie', 'Durée', 'Statut'];
    const rows = attendances.map(a => [
      a.coach.matricule,
      a.coach.lastName,
      a.coach.firstName,
      a.coach.referential || 'Non assigné',
      a.checkIn ? formatTime(a.checkIn.time) : '--',
      a.checkOut ? formatTime(a.checkOut.time) : '--',
      a.checkIn ? calculateDuration(a.checkIn.time, a.checkOut?.time).display : '--',
      a.isLate ? 'Retard' : a.checkOut ? 'Terminé' : 'En service'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pointages_coaches_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export CSV réussi');
  };

  const printTable = () => {
    window.print();
    toast.success('Impression lancée');
  };

  const totalHours = attendances.reduce((total, a) => {
    if (a.checkIn && a.checkOut) {
      const duration = calculateDuration(a.checkIn.time, a.checkOut.time);
      return total + duration.hours + (duration.minutes / 60);
    }
    return total;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Rapport des Pointages
            </h1>
            <p className="text-gray-600">
              Détails des heures d'entrée et de sortie
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              Exporter CSV
            </button>
            <button
              onClick={printTable}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <Printer className="w-5 h-5" />
              Imprimer
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Coaches pointés</p>
                <p className="text-2xl font-bold text-gray-800">
                  {attendances.filter(a => a.checkIn).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Journées terminées</p>
                <p className="text-2xl font-bold text-gray-800">
                  {attendances.filter(a => a.checkOut).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total d'heures</p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalHours.toFixed(1)}h
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Moyenne/coach</p>
                <p className="text-2xl font-bold text-gray-800">
                  {attendances.filter(a => a.checkOut).length > 0
                    ? (totalHours / attendances.filter(a => a.checkOut).length).toFixed(1)
                    : '0'
                  }h
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matricule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référentiel
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  🕐 Entrée
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  🕑 Sortie
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ⏱️ Durée
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucun pointage pour aujourd'hui
                  </td>
                </tr>
              ) : (
                attendances.map((attendance) => {
                  const duration = attendance.checkIn 
                    ? calculateDuration(attendance.checkIn.time, attendance.checkOut?.time)
                    : null;

                  return (
                    <tr key={attendance.id} className="hover:bg-gray-50 transition-colors">
                      {/* Coach */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {attendance.coach.photoUrl ? (
                            <img 
                              src={attendance.coach.photoUrl}
                              alt={attendance.coach.firstName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {attendance.coach.firstName[0]}{attendance.coach.lastName[0]}
                              </span>
                            </div>
                          )}
                          <div className="ml-3">
                            <p className="text-sm font-semibold text-gray-900">
                              {attendance.coach.firstName} {attendance.coach.lastName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Matricule */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-700">
                          {attendance.coach.matricule}
                        </span>
                      </td>

                      {/* Référentiel */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {attendance.coach.referential || (
                            <span className="text-gray-400 italic">Non assigné</span>
                          )}
                        </span>
                      </td>

                      {/* Heure d'entrée */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {attendance.checkIn ? (
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-lg font-bold ${
                              attendance.isLate ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {formatTime(attendance.checkIn.time)}
                            </span>
                            {attendance.isLate && (
                              <span className="text-xs text-orange-600 font-medium mt-1">
                                ⚠️ Retard
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-lg font-bold">--:--</span>
                        )}
                      </td>

                      {/* Heure de sortie */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {attendance.checkOut ? (
                          <span className="text-lg font-bold text-blue-600">
                            {formatTime(attendance.checkOut.time)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-lg font-bold">--:--</span>
                        )}
                      </td>

                      {/* Durée */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {duration && attendance.checkOut ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-lg font-bold text-purple-600">
                              {duration.display}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {duration.hours * 60 + duration.minutes} min
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-lg font-bold">--</span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {attendance.checkOut ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                            ✅ Terminé
                          </span>
                        ) : attendance.checkIn ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300 animate-pulse">
                            ⏰ En service
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                            ❌ Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Footer avec totaux */}
            {attendances.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right font-bold text-gray-700">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-purple-700">
                      {totalHours.toFixed(1)}h
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">
                      {attendances.filter(a => a.checkOut).length}/{attendances.length}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white, .bg-white * {
            visibility: visible;
          }
          .bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}