import React from 'react';
import { LogIn, LogOut, Clock, AlertCircle, CheckCircle, User } from 'lucide-react';

interface CoachAttendanceCardProps {
  attendance: {
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
  };
}

export default function CoachAttendanceCard({ attendance }: CoachAttendanceCardProps) {
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (checkIn: Date | string, checkOut?: Date | string) => {
    if (!checkOut) return null;
    
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, total: `${hours}h ${minutes}min` };
  };

  const duration = attendance.checkIn && attendance.checkOut 
    ? formatDuration(attendance.checkIn.time, attendance.checkOut.time)
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 hover:shadow-xl transition-all">
      {/* Header avec photo et infos coach */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
        <div className="flex items-center gap-4">
          {attendance.coach.photoUrl ? (
            <img 
              src={attendance.coach.photoUrl}
              alt={`${attendance.coach.firstName} ${attendance.coach.lastName}`}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-blue-600 text-2xl font-bold">
                {attendance.coach.firstName[0]}{attendance.coach.lastName[0]}
              </span>
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-1">
              {attendance.coach.firstName} {attendance.coach.lastName}
            </h3>
            <p className="text-blue-100 text-sm font-medium">
              {attendance.coach.matricule}
            </p>
            {attendance.coach.referential && (
              <p className="text-blue-100 text-xs mt-1">
                📚 {attendance.coach.referential}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <div>
            {attendance.checkOut ? (
              <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Terminé
              </div>
            ) : attendance.checkIn ? (
              <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse">
                <Clock className="w-4 h-4" />
                En service
              </div>
            ) : (
              <div className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-bold">
                Absent
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Corps avec les heures */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Heure d'entrée */}
          <div className={`p-6 rounded-xl border-2 ${
            attendance.isLate 
              ? 'bg-orange-50 border-orange-300'
              : 'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-lg ${
                attendance.isLate ? 'bg-orange-200' : 'bg-green-200'
              }`}>
                <LogIn className={`w-6 h-6 ${
                  attendance.isLate ? 'text-orange-700' : 'text-green-700'
                }`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Heure d'entrée
                </p>
                {attendance.isLate && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 text-orange-600" />
                    <span className="text-xs font-bold text-orange-600">En retard</span>
                  </div>
                )}
              </div>
            </div>
            
            {attendance.checkIn ? (
              <div>
                <p className={`text-4xl font-bold ${
                  attendance.isLate ? 'text-orange-700' : 'text-green-700'
                }`}>
                  {formatTime(attendance.checkIn.time).split(':').slice(0, 2).join(':')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatTime(attendance.checkIn.time).split(':')[2]} sec
                </p>
              </div>
            ) : (
              <p className="text-4xl font-bold text-gray-400">--:--</p>
            )}
          </div>

          {/* Heure de sortie */}
          <div className={`p-6 rounded-xl border-2 ${
            attendance.checkOut
              ? 'bg-blue-50 border-blue-300'
              : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-lg ${
                attendance.checkOut ? 'bg-blue-200' : 'bg-gray-200'
              }`}>
                <LogOut className={`w-6 h-6 ${
                  attendance.checkOut ? 'text-blue-700' : 'text-gray-500'
                }`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Heure de sortie
                </p>
                {!attendance.checkOut && attendance.checkIn && (
                  <span className="text-xs font-bold text-purple-600 mt-1 block">
                    En attente...
                  </span>
                )}
              </div>
            </div>
            
            {attendance.checkOut ? (
              <div>
                <p className="text-4xl font-bold text-blue-700">
                  {formatTime(attendance.checkOut.time).split(':').slice(0, 2).join(':')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatTime(attendance.checkOut.time).split(':')[2]} sec
                </p>
              </div>
            ) : (
              <p className="text-4xl font-bold text-gray-400">--:--</p>
            )}
          </div>
        </div>

        {/* Durée totale */}
        {duration && (
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-200 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Durée totale de présence
                  </p>
                  <p className="text-3xl font-bold text-purple-700">
                    {duration.total}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{duration.hours}</p>
                    <p className="text-xs text-gray-600 font-medium">heures</p>
                  </div>
                  <span className="text-2xl text-purple-400">:</span>
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{duration.minutes}</p>
                    <p className="text-xs text-gray-600 font-medium">minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info complémentaire */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              📅 {new Date(attendance.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="font-mono text-xs">
              ID: {attendance.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}