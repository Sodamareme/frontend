import { useEffect, useState } from 'react';
import { Calendar, Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { coachesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils/imageUrl';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;  // ✅ Changé
  checkOut: string | null; // ✅ Changé
  isPresent: boolean;
  isLate: boolean;
  coachId: string;
  createdAt: string;
  updatedAt: string;
}

interface CoachData {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string;
  user: {
    email: string;
  };
}

interface CoachScanHistoryProps {
  coachId: string;
  onBack?: () => void;
}

export default function CoachScanHistory({ coachId, onBack }: CoachScanHistoryProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, [coachId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const coachData = await coachesAPI.getCoachById(coachId);
      setCoach(coachData);
      
      try {
        const attendanceData = await coachesAPI.getAttendanceHistory(coachId);
        
        if (Array.isArray(attendanceData)) {
          setAttendance(attendanceData);
        } else {
          setAttendance([]);
        }
      } catch (attendanceError: any) {
        if (attendanceError.response?.status === 404) {
          toast.info('Aucun historique de présence pour ce coach');
        }
        setAttendance([]);
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement coach:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    if (!startDate || !endDate) {
      toast.error('Veuillez sélectionner une période');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('La date de début doit être antérieure à la date de fin');
      return;
    }

    try {
      setLoading(true);
      const attendanceData = await coachesAPI.getAttendanceHistory(coachId, startDate, endDate);
      setAttendance(attendanceData);
      toast.success('Données filtrées avec succès');
    } catch (error) {
      toast.error('Erreur lors du filtrage des données');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setStartDate('');
    setEndDate('');
    await loadData();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Heure invalide';
    }
  };

  const calculateWorkDuration = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return null;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}min`;
  };

  const calculateStats = () => {
    const total = attendance.length;
    const present = attendance.filter(a => a.checkIn).length;
    const late = attendance.filter(a => a.isLate).length;
    const onTime = present - late;
    const completed = attendance.filter(a => a.checkIn && a.checkOut).length;
    
    return { total, present, late, onTime, completed };
  };

  const stats = calculateStats();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-orange-500  from-indigo-600 to-indigo-700 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                <h2 className="text-xl font-bold text-white">
                  Historique de présence
                </h2>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            {/* Coach Info */}
            {coach && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6 border border-indigo-200">
                <div className="flex items-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {coach.photoUrl ? (
                      <img
                        src={getImageUrl(coach.photoUrl)}
                        alt="Coach"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white text-2xl font-bold">
                        {coach.firstName[0]}{coach.lastName[0]}
                      </div>
                    )}
                  </div>
                  <div className="ml-6 flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {coach.firstName} {coach.lastName}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        {coach.matricule}
                      </span>
                      <span className="text-sm text-gray-600">
                        {coach.user.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total jours</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pointages</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <LogOut className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Complets</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-orange-100">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">En retard</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-teal-100">
                    <CheckCircle className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">À l'heure</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.onTime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Filtrer par période</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={handleFilter}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-orange-500 transition-colors font-medium"
                  >
                    Filtrer
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement...</p>
                </div>
              ) : attendance.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">
                    Aucun enregistrement trouvé
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrivée</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Départ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendance.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {formatDate(record.date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <LogIn className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {formatTime(record.checkIn)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <LogOut className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {formatTime(record.checkOut)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {calculateWorkDuration(record.checkIn, record.checkOut) ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Clock className="w-3 h-3 mr-1" />
                                {calculateWorkDuration(record.checkIn, record.checkOut)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {record.checkIn ? (
                                record.isLate ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    En retard
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    À l'heure
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Absent
                                </span>
                              )}
                              {record.checkIn && !record.checkOut && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  En cours
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end sticky bottom-0">
            {onBack && (
              <button
                onClick={onBack}
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