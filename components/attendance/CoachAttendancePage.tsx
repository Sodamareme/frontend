import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, Calendar, Users, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
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

export default function CoachAttendancePage() {
  const [attendances, setAttendances] = useState<CoachAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTodayAttendances();
  }, []);

  const fetchTodayAttendances = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching today\'s attendances...');
      const data = await coachesAPI.getTodayAttendance();
      console.log('✅ Attendances received:', data);
      setAttendances(data);
    } catch (error: any) {
      console.error('❌ Error fetching attendances:', error);
      toast.error('Erreur lors du chargement des pointages');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchTodayAttendances();
      toast.success('Données rafraîchies');
    } catch (error) {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (checkIn: Date | string, checkOut?: Date | string) => {
    if (!checkOut) return null;
    
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}min`;
  };

  const stats = {
    total: attendances.length,
    present: attendances.filter(a => a.checkIn).length,
    late: attendances.filter(a => a.isLate).length,
    checkedOut: attendances.filter(a => a.checkOut).length,
    inService: attendances.filter(a => a.checkIn && !a.checkOut).length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Pointage des Coaches
            </h1>
            <p className="text-gray-600">
              Suivi des entrées et sorties en temps réel
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pointés</p>
              <p className="text-3xl font-bold text-gray-800">{stats.present}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">En Retard</p>
              <p className="text-3xl font-bold text-gray-800">{stats.late}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">En Service</p>
              <p className="text-3xl font-bold text-gray-800">{stats.inService}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Sortis</p>
              <p className="text-3xl font-bold text-gray-800">{stats.checkedOut}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <LogOut className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Pointages du jour ({attendances.length})
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Chargement des pointages...</p>
          </div>
        ) : attendances.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">Aucun pointage pour aujourd'hui</p>
            <p className="text-gray-400 text-sm">
              Les pointages apparaîtront ici au fur et à mesure
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {attendances.map((attendance) => (
              <div key={attendance.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  {/* Coach Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {attendance.coach.photoUrl ? (
                      <img 
                        src={attendance.coach.photoUrl}
                        alt={`${attendance.coach.firstName} ${attendance.coach.lastName}`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-white text-xl font-bold">
                          {attendance.coach.firstName[0]}{attendance.coach.lastName[0]}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {attendance.coach.firstName} {attendance.coach.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{attendance.coach.matricule}</p>
                      {attendance.coach.referential && (
                        <p className="text-xs text-gray-400 mt-1">
                          📚 {attendance.coach.referential}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Time Details */}
                  <div className="flex items-center gap-6">
                    {/* Check In */}
                    {attendance.checkIn && (
                      <div className="text-center">
                        <div className={`inline-flex flex-col items-center gap-1 px-6 py-3 rounded-lg ${
                          attendance.isLate 
                            ? 'bg-orange-100 border-2 border-orange-300'
                            : 'bg-green-100 border-2 border-green-300'
                        }`}>
                          <LogIn className={`w-6 h-6 ${
                            attendance.isLate ? 'text-orange-700' : 'text-green-700'
                          }`} />
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">Entrée</p>
                            <p className={`text-2xl font-bold ${
                              attendance.isLate ? 'text-orange-700' : 'text-green-700'
                            }`}>
                              {formatTime(attendance.checkIn.time)}
                            </p>
                          </div>
                        </div>
                        {attendance.isLate && (
                          <p className="text-xs text-orange-600 font-medium mt-2 flex items-center justify-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            En retard
                          </p>
                        )}
                      </div>
                    )}

                    {/* Arrow or Status */}
                    <div className="px-4">
                      {attendance.checkOut ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-0.5 bg-gray-300"></div>
                          <CheckCircle className="w-5 h-5 text-gray-400" />
                          <div className="w-12 h-0.5 bg-gray-300"></div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Clock className="w-6 h-6 text-purple-500 animate-pulse" />
                          <span className="text-xs font-medium text-purple-600">En service</span>
                        </div>
                      )}
                    </div>

                    {/* Check Out */}
                    <div className="text-center min-w-[140px]">
                      {attendance.checkOut ? (
                        <div className="inline-flex flex-col items-center gap-1 px-6 py-3 rounded-lg bg-blue-100 border-2 border-blue-300">
                          <LogOut className="w-6 h-6 text-blue-700" />
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">Sortie</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {formatTime(attendance.checkOut.time)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center gap-1 px-6 py-3 rounded-lg bg-gray-100 border-2 border-gray-300">
                          <LogOut className="w-6 h-6 text-gray-400" />
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-500 mb-1">Sortie</p>
                            <p className="text-2xl font-bold text-gray-400">
                              --:--
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    {attendance.checkIn && (
                      <div className="text-center min-w-[120px] ml-4">
                        <div className={`inline-flex flex-col items-center gap-1 px-4 py-3 rounded-lg ${
                          attendance.checkOut 
                            ? 'bg-purple-100 border-2 border-purple-300'
                            : 'bg-gray-100 border-2 border-gray-300'
                        }`}>
                          <Clock className={`w-5 h-5 ${
                            attendance.checkOut ? 'text-purple-700' : 'text-gray-400'
                          }`} />
                          <p className="text-xs font-medium text-gray-600 mb-1">Durée</p>
                          <p className={`text-lg font-bold ${
                            attendance.checkOut ? 'text-purple-700' : 'text-gray-400'
                          }`}>
                            {attendance.checkOut 
                              ? formatDuration(attendance.checkIn.time, attendance.checkOut.time)
                              : '-- h --'
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}