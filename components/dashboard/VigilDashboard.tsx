'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, Clock, Users, CheckCircle, XCircle, Camera, History, UserCircle } from 'lucide-react';
import { attendanceAPI, coachesAPI } from '@/lib/api';
import { toast } from 'sonner';
import StatCard from '@/components/dashboard/StatCard';
import QRScannerModal from '@/components/coaches/QRScannerModal';
import CoachAttendanceHistory from '@/components/dashboard/CoachAttendanceHistory';

interface Scan {
  id: string;
  scanTime: string;
  isLate: boolean;
  learner?: {
    firstName: string;
    lastName: string;
    photoUrl?: string;
    matricule: string;
    referential?: {
      name: string;
    }
  };
  coach?: {
    firstName: string;
    lastName: string;
    photoUrl?: string;
    matricule: string;
  }
}

export default function VigilDashboard() {
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalLearners: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
  });
  const [coachStats, setCoachStats] = useState({
    totalCoaches: 0,
    presentToday: 0,
    lateToday: 0,
  });
  const [loading, setLoading] = useState({
    stats: true,
    scans: true,
  });
  const [error, setError] = useState({
    stats: '',
    scans: '',
  });
  
  // États pour les modals
  const [isCoachScannerOpen, setIsCoachScannerOpen] = useState(false);
  const [showCoachHistory, setShowCoachHistory] = useState(false);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch stats et scans
      const [statsResponse, scansResponse, coachAttendance] = await Promise.all([
        attendanceAPI.getDailyStats(today),
        attendanceAPI.getLatestScans(),
        coachesAPI.getTodayAttendance().catch(() => [])
      ]);

      // Update learner stats
      setAttendanceStats({
        totalLearners: statsResponse.total || 0,
        presentToday: statsResponse.present || 0,
        lateToday: statsResponse.late || 0,
        absentToday: statsResponse.absent || 0,
      });

      // Update coach stats
      setCoachStats({
        totalCoaches: coachAttendance.length || 0,
        presentToday: coachAttendance.filter((a: any) => a.checkIn).length || 0,
        lateToday: coachAttendance.filter((a: any) => a.isLate).length || 0,
      });

      // Update scans
      if (Array.isArray(scansResponse?.learnerScans) || Array.isArray(scansResponse?.coachScans)) {
        const allScans = [
          ...(scansResponse.learnerScans || []),
          ...(scansResponse.coachScans || [])
        ].sort((a, b) => 
          new Date(b.scanTime).getTime() - new Date(a.scanTime).getTime()
        );
        setRecentScans(allScans);
      } else {
        setRecentScans([]);
      }

      setError({ stats: '', scans: '' });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError({
        stats: 'Failed to load attendance statistics',
        scans: 'Failed to load recent scans'
      });
    } finally {
      setLoading({ stats: false, scans: false });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCoachScan = async (qrData: string) => {
    try {
      console.log('📱 QR Code coach scanné:', qrData);

      const result = await coachesAPI.scanAttendance(qrData);

      if (result.action === 'checkin') {
        toast.success(`✅ ${result.message}`, {
          description: result.isLate ? '⚠️ Arrivée en retard' : '✅ À l\'heure',
          duration: 5000,
        });
      } else {
        toast.info(`👋 ${result.message}`, {
          description: `Dépointé à ${result.time}`,
          duration: 5000,
        });
      }

      // Rafraîchir les données
      await fetchData();
      
    } catch (error: any) {
      console.error('❌ Erreur scan QR Code:', error);
      
      if (error.response?.status === 404) {
        toast.error('Coach non trouvé pour ce QR Code');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erreur lors du traitement du QR Code');
      }
    }
  };

  const presentPercentage = attendanceStats.totalLearners > 0
    ? Math.round((attendanceStats.presentToday / attendanceStats.totalLearners) * 100)
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Vigil</h1>
        <p className="text-gray-600">Système de gestion de présence</p>
      </div>
      
      {/* Quick Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        {/* Scanner Apprenant */}
        <Link 
          href="/dashboard/attendance/scan" 
          className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-lg font-medium"
        >
          <QrCode className="mr-2 h-6 w-6" />
          Scanner Apprenant
        </Link>

        {/* Scanner Coach */}
        <button
          onClick={() => setIsCoachScannerOpen(true)}
          className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-lg font-medium"
        >
          <QrCode className="mr-2 h-6 w-6" />
          Scanner Coach
        </button>

        {/* Historique Coaches */}
        {/* <button
          onClick={() => setShowCoachHistory(true)}
          className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-lg font-medium"
        >
          <History className="mr-2 h-6 w-6" />
          Historique Coaches
        </button> */}
      </div>
      
      {/* Stats Cards - Apprenants */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <Users className="w-5 h-5 mr-2 text-orange-500" />
          Statistiques Apprenants
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Apprenants" 
            value={attendanceStats.totalLearners} 
            icon={<Users className="h-8 w-8 text-blue-500" />} 
            loading={loading.stats}
          />
          <StatCard 
            title="Présents aujourd'hui" 
            value={attendanceStats.presentToday} 
            icon={<CheckCircle className="h-8 w-8 text-green-500" />} 
            suffix={`${presentPercentage}%`}
            loading={loading.stats}
          />
          <StatCard 
            title="En retard aujourd'hui" 
            value={attendanceStats.lateToday} 
            icon={<Clock className="h-8 w-8 text-orange-500" />} 
            loading={loading.stats}
          />
          <StatCard 
            title="Absents aujourd'hui" 
            value={attendanceStats.absentToday} 
            icon={<XCircle className="h-8 w-8 text-red-500" />} 
            loading={loading.stats}
          />
        </div>
      </div>

      {/* Stats Cards - Coaches */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <UserCircle className="w-5 h-5 mr-2 text-purple-500" />
          Statistiques Coaches
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Coaches présents" 
            value={coachStats.presentToday} 
            icon={<UserCircle className="h-8 w-8 text-purple-500" />} 
            suffix={`/${coachStats.totalCoaches}`}
            loading={loading.stats}
          />
          <StatCard 
            title="Coaches en retard" 
            value={coachStats.lateToday} 
            icon={<Clock className="h-8 w-8 text-orange-500" />} 
            loading={loading.stats}
          />
          <StatCard 
            title="Total Coaches" 
            value={coachStats.totalCoaches} 
            icon={<Users className="h-8 w-8 text-indigo-500" />} 
            loading={loading.stats}
          />
        </div>
      </div>
      
      {/* Recent Scans */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Scans Récents (Apprenants & Coaches)</h2>
          <Link 
            href="/dashboard/attendance/history" 
            className="text-orange-500 hover:text-orange-700 text-sm font-medium"
          >
            Voir tout l'historique
          </Link>
        </div>
        
        {loading.scans ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={`loading-skeleton-${i}`} 
                className="h-16 bg-gray-100 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : error.scans ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg">
            {error.scans}
          </div>
        ) : recentScans.length === 0 ? (
          <div className="bg-gray-50 text-gray-500 p-4 rounded-lg text-center">
            Aucun scan récent
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure de scan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentScans.map((scan) => (
                  <tr key={`scan-${scan.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {scan.learner ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Users className="w-3 h-3 mr-1" />
                          Apprenant
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <UserCircle className="w-3 h-3 mr-1" />
                          Coach
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                          {scan.learner?.photoUrl || scan.coach?.photoUrl ? (
                            <img 
                              src={scan.learner?.photoUrl || scan.coach?.photoUrl} 
                              alt={`${scan.learner?.firstName || scan.coach?.firstName} ${scan.learner?.lastName || scan.coach?.lastName}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className={`h-full w-full flex items-center justify-center text-white text-sm font-medium ${
                              scan.learner ? 'bg-orange-500' : 'bg-purple-500'
                            }`}>
                              {(scan.learner?.firstName?.[0] || scan.coach?.firstName?.[0] || '') + 
                               (scan.learner?.lastName?.[0] || scan.coach?.lastName?.[0] || '')}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {scan.learner?.firstName || scan.coach?.firstName} {scan.learner?.lastName || scan.coach?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {scan.learner?.referential?.name || 'Coach'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scan.learner?.matricule || scan.coach?.matricule}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(scan.scanTime).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(scan.scanTime).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${scan.isLate 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-green-100 text-green-800'
                          }`}
                      >
                        {scan.isLate ? 'En retard' : 'À l\'heure'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Scan Counts by Hour */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Statistiques de scan</h2>
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="flex-1 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-medium text-gray-700 mb-2">Horaires de pointe</h3>
            <p className="text-gray-600 text-sm">
              Les heures les plus occupées pour les scans sont généralement entre 8h00 et 9h00 du matin.
            </p>
          </div>
          <div className="flex-1 bg-gray-50 p-4 rounded-lg mt-4 md:mt-0">
            <h3 className="text-md font-medium text-gray-700 mb-2">Tendance des retards</h3>
            <p className="text-gray-600 text-sm">
              En moyenne, 15% des personnes arrivent en retard, principalement les lundis.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QRScannerModal
        isOpen={isCoachScannerOpen}
        onClose={() => setIsCoachScannerOpen(false)}
        onScan={handleCoachScan}
      />

      {showCoachHistory && (
        <CoachAttendanceHistory
          onClose={() => setShowCoachHistory(false)}
        />
      )}
    </div>
  );
}