import { useEffect, useState } from 'react';
import { Calendar, Clock, ArrowLeft, LogIn, LogOut, X, Download } from 'lucide-react';
import { coachesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils/imageUrl';

interface CoachAttendance {
  id: string;
  date: string;
  coach: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
    referential?: string;
  };
  checkIn?: {
    time: string;
    isLate: boolean;
  };
  checkOut?: {
    time: string;
  };
  isPresent: boolean;
  isLate: boolean;
}

interface CoachAttendanceHistoryProps {
  onClose?: () => void;
}

export default function CoachAttendanceHistory({ onClose }: CoachAttendanceHistoryProps) {
  const [attendances, setAttendances] = useState<CoachAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadTodayAttendances();
  }, []);

  const loadTodayAttendances = async () => {
    try {
      setLoading(true);
      const data = await coachesAPI.getTodayAttendance();
      setAttendances(data);
    } catch (error) {
      console.error('❌ Error loading attendances:', error);
      toast.error('Erreur lors du chargement des pointages');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateDuration = (checkIn?: { time: string }, checkOut?: { time: string }) => {
    if (!checkIn || !checkOut) return null;
    
    const diff = new Date(checkOut.time).getTime() - new Date(checkIn.time).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}min`;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Coach', 'Matricule', 'Arrivée', 'Départ', 'Durée', 'Statut'];
    const rows = attendances.map(a => [
      formatDate(a.date),
      `${a.coach.firstName} ${a.coach.lastName}`,
      a.coach.matricule,
      a.checkIn ? formatTime(a.checkIn.time) : '-',
      a.checkOut ? formatTime(a.checkOut.time) : '-',
      calculateDuration(a.checkIn, a.checkOut) || '-',
      a.isLate ? 'Retard' : a.checkOut ? 'Complet' : 'En service'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pointages_coaches_${selectedDate}.csv`;
    link.click();
    toast.success('Export CSV réussi');
  };

  const stats = {
    total: attendances.length,
    present: attendances.filter(a => a.checkIn).length,
    late: attendances.filter(a => a.isLate).length,
    completed: attendances.filter(a => a.checkIn && a.checkOut).length,
    inService: attendances.filter(a => a.checkIn && !a.checkOut).length,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white">
                  Historique des Pointages Coaches
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Date Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                  <div>
                    <p className="text-sm text-gray-600">Date sélectionnée</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatDate(selectedDate)}
                    </p>
                  </div>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-green-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500">Pointés</p>
                <p className="text-3xl font-bold text-green-600">{stats.present}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-purple-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500">Complets</p>
                <p className="text-3xl font-bold text-purple-600">{stats.completed}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-yellow-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500">En service</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.inService}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-orange-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500">Retards</p>
                <p className="text-3xl font-bold text-orange-600">{stats.late}</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement...</p>
                </div>
              ) : attendances.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">
                    Aucun pointage pour aujourd'hui
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coach</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Arrivée</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Départ</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durée</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendances.map((attendance) => (
                        <tr key={attendance.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                {attendance.coach.photoUrl ? (
                                  <img 
                                    src={getImageUrl(attendance.coach.photoUrl)}
                                    alt={attendance.coach.firstName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-purple-500 text-white text-sm font-medium">
                                    {attendance.coach.firstName[0]}{attendance.coach.lastName[0]}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {attendance.coach.firstName} {attendance.coach.lastName}
                                </div>
                                {attendance.coach.referential && (
                                  <div className="text-sm text-gray-500">
                                    {attendance.coach.referential}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm font-mono text-gray-700">
                              {attendance.coach.matricule}
                            </span>
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
                              <span className="text-gray-400 text-lg">--:--</span>
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
                              <span className="text-gray-400 text-lg">--:--</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-center">
                            {calculateDuration(attendance.checkIn, attendance.checkOut) ? (
                              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-100">
                                <Clock className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-bold text-purple-700">
                                  {calculateDuration(attendance.checkIn, attendance.checkOut)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-center">
                            {attendance.checkOut ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                                ✅ Complet
                              </span>
                            ) : attendance.checkIn ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse">
                                ⏰ En service
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                                ❌ Absent
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Footer avec totaux */}
                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-right font-bold text-gray-700">
                          TOTAL POINTAGES
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-purple-700">
                            {stats.completed} / {stats.total}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-600">
                            {stats.present} présents
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center sticky bottom-0">
            <div className="text-sm text-gray-600">
              {attendances.length} pointage(s) affiché(s)
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}