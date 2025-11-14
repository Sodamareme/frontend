'use client';

import { useState, useEffect } from 'react';
import { attendanceAPI, learnersAPI, promotionsAPI, referentialsAPI } from '@/lib/api';
import { Calendar, Users, Book, Award, ChevronDown } from 'lucide-react';

export default function StatisticsPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalLearners: 0,
    activeLearners: 0,
    attendanceRate: 0,
    lateRate: 0,
    totalReferentials: 0,
    totalPromotions: 0,
    activePromotions: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch data from multiple endpoints in parallel
        const [learners, promotions, referentials, dailyStats] = await Promise.all([
          learnersAPI.getAllLearners(),
          promotionsAPI.getAllPromotions(),
          referentialsAPI.getAllReferentials(),
          attendanceAPI.getDailyStats(today),
        ]);
        
        // Calculate statistics
        const activeLearners = learners.filter(l => l.status === 'ACTIVE').length;
        const activePromotions = promotions.filter(p => p.status === 'ACTIVE').length;
        
        // In a real app, you would calculate attendance rates over the selected period
        // Here we're using the daily stats as a placeholder
        const presentCount = dailyStats.present || 0;
        const lateCount = dailyStats.late || 0;
        const totalCount = learners.length;
        
        const attendanceRate = totalCount > 0 
          ? Math.round(((presentCount + lateCount) / totalCount) * 100) 
          : 0;
          
        const lateRate = totalCount > 0 
          ? Math.round((lateCount / totalCount) * 100) 
          : 0;
        
        setStats({
          totalLearners: learners.length,
          activeLearners,
          attendanceRate,
          lateRate,
          totalReferentials: referentials.length,
          totalPromotions: promotions.length,
          activePromotions,
        });
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Une erreur est survenue lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period]);

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Statistiques</h1>
          <p className="text-gray-600">Visualisation des données de la plateforme</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="relative w-full md:w-48">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
              className="block w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="day">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Métriques clés</h2>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <div className="text-sm font-medium text-blue-700">Apprenants</div>
              </div>
              <div className="text-2xl font-bold text-blue-800">{stats.totalLearners}</div>
              <div className="text-xs text-blue-600 mt-1">
                {stats.activeLearners} actifs ({Math.round((stats.activeLearners / stats.totalLearners) * 100) || 0}%)
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-green-500 mr-2" />
                <div className="text-sm font-medium text-green-700">Taux de présence</div>
              </div>
              <div className="text-2xl font-bold text-green-800">{stats.attendanceRate}%</div>
              <div className="text-xs text-green-600 mt-1">
                Retards: {stats.lateRate}%
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Book className="h-5 w-5 text-purple-500 mr-2" />
                <div className="text-sm font-medium text-purple-700">Référentiels</div>
              </div>
              <div className="text-2xl font-bold text-purple-800">{stats.totalReferentials}</div>
              <div className="text-xs text-purple-600 mt-1">
                Total des référentiels
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Award className="h-5 w-5 text-yellow-500 mr-2" />
                <div className="text-sm font-medium text-yellow-700">Promotions</div>
              </div>
              <div className="text-2xl font-bold text-orange-800">{stats.totalPromotions}</div>
              <div className="text-xs text-orange-600 mt-1">
                {stats.activePromotions} actives ({Math.round((stats.activePromotions / stats.totalPromotions) * 100) || 0}%)
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Attendance Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Évolution de la présence</h2>
        
        {loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg">
            <div className="text-center text-gray-500">
              <p className="mb-2">Graphique de présence à intégrer</p>
              <p className="text-sm">Utilisez une bibliothèque comme Chart.js ou Recharts</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Learners by Referential */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Apprenants par référentiel</h2>
          
          {loading ? (
            <div className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center border border-gray-200 rounded-lg">
              <div className="text-center text-gray-500">
                <p className="mb-2">Graphique de répartition à intégrer</p>
                <p className="text-sm">Utilisez une bibliothèque comme Chart.js ou Recharts</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Learners by Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Apprenants par statut</h2>
          
          {loading ? (
            <div className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center border border-gray-200 rounded-lg">
              <div className="text-center text-gray-500">
                <p className="mb-2">Graphique de répartition à intégrer</p>
                <p className="text-sm">Utilisez une bibliothèque comme Chart.js ou Recharts</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 