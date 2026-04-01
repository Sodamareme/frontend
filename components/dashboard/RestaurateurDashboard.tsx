"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Coffee, Clock, ChevronDown, QrCode, Camera, CameraOff,
  RotateCcw, X, User, Calendar, Filter, RefreshCw, CheckCircle, AlertCircle
} from 'lucide-react';
import { findbyQRcode } from '@/lib/api';
import { StudentType } from '@/types/student';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiMealResponse {
  id: string;
  date: string;
  type: string;
  learnerId: string;
  createdAt: string;
  updatedAt: string;
  learner: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    address: string;
    gender: string;
    birthDate: string;
    birthPlace: string;
    phone: string;
    photoUrl: string;
    status: string;
    qrCode: string;
    userId: string;
    refId: string;
    promotionId: string;
    createdAt: string;
    updatedAt: string;
    sessionId: string | null;
    referential?: {
      id: string;
      name: string;
      description: string;
      photoUrl: string | null;
      capacity: number;
      numberOfSessions: number;
      sessionLength: number | null;
      createdAt: string;
      updatedAt: string;
    };
    promotion?: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      photoUrl: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

interface Referential {
  id: string;
  name: string;
  description: string;
  photoUrl: string | null;
  capacity: number;
  numberOfSessions: number;
  sessionLength: number | null;
  createdAt: string;
  updatedAt: string;
}

interface LocalMeal {
  id: string;
  learner: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    photoUrl: string;
    referential?: { name: string; description: string };
    promotion?: { name: string };
  };
  type: 'BREAKFAST' | 'LUNCH';
  timestamp: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TOTAL_LEARNERS = 250;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAuthToken = () => localStorage.getItem('auth_token') || '';

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const formatDateToString = (d: Date) => d.toISOString().split('T')[0];
const parseDateString = (s: string) => new Date(s + 'T00:00:00');

const convertApiToLocal = (apiData: ApiMealResponse[]): LocalMeal[] =>
  apiData.map(item => ({
    id: item.id,
    learner: {
      id: item.learner.id,
      firstName: item.learner.firstName,
      lastName: item.learner.lastName,
      matricule: item.learner.matricule,
      photoUrl: item.learner.photoUrl,
      referential: {
        name: item.learner.referential?.name || 'N/A',
        description: item.learner.referential?.description || '',
      },
      promotion: { name: item.learner.promotion?.name || 'N/A' },
    },
    type: item.type === 'petit-dejeuner' ? 'BREAKFAST' : 'LUNCH',
    timestamp: item.createdAt,
  }));

const findStudentByQRData = async (qrData: string): Promise<StudentType | null> => {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.id) return await findbyQRcode(parsed.id);
    return null;
  } catch {
    try {
      return await findbyQRcode(qrData);
    } catch {
      return null;
    }
  }
};

// ─── API Services ─────────────────────────────────────────────────────────────

const mealsAPI = {
  async getLatestScans(): Promise<ApiMealResponse[]> {
    const res = await fetch(`${API_BASE_URL}/meals/scans/latest`, {
      headers: { accept: '*/*', Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
    return res.json();
  },

  async recordMeal(matricule: string, mealType: 'petit-dejeuner' | 'repas'): Promise<ApiMealResponse> {
    const res = await fetch(`${API_BASE_URL}/meals/scan/${matricule}/${mealType}`, {
      method: 'POST',
      headers: {
        accept: '*/*',
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: '',
    });
    if (!res.ok) throw new Error(`Erreur enregistrement: ${res.status}`);
    return res.json();
  },
};

const referentialsAPI = {
  async getAllReferentials(): Promise<Referential[]> {
    const res = await fetch(`${API_BASE_URL}/referentials/all`, {
      headers: { accept: '*/*', Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
    return res.json();
  },
};

const learnersAPI = {
  async getAllLearners(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/learners`, {
      headers: { accept: '*/*', Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
    return res.json();
  },
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

const StatCard = ({
  title, value, icon, suffix, loading,
}: {
  title: string; value: number; icon: React.ReactNode; suffix?: string; loading?: boolean;
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}{suffix && <span className="text-sm text-gray-500 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className="flex-shrink-0">{icon}</div>
      </div>
    </div>
  );
};

// ─── QR Scanner Modal (scan continu, sans modal de confirmation) ───────────────

const QRScannerModal = ({
  isOpen, onClose, selectedMealType, onMealRecorded,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedMealType: 'BREAKFAST' | 'LUNCH';
  onMealRecorded: (optimistic: LocalMeal, promise: Promise<ApiMealResponse>) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  // Dernier scan — affiché dans le bandeau
  const [lastScanned, setLastScanned] = useState<{
    student: StudentType;
    status: 'pending' | 'ok' | 'error';
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Ref pour accéder aux valeurs fraîches dans le callback
  const selectedMealTypeRef = useRef(selectedMealType);
  useEffect(() => { selectedMealTypeRef.current = selectedMealType; }, [selectedMealType]);

  const handleScanResult = useCallback(async (result: any) => {
    const now = Date.now();
    if (now - lastScanTime < 2000) return;
    setLastScanTime(now);
    setError(null);

    const qrData = result?.data ?? result;

    let student: StudentType | null = null;
    try {
      student = await findStudentByQRData(qrData);
    } catch {
      setError('Erreur réseau lors de la recherche de l\'étudiant');
      return;
    }

    if (!student) {
      setError(`Étudiant non trouvé pour: "${qrData}"`);
      return;
    }

    const currentMealType = selectedMealTypeRef.current;
    const apiMealType = currentMealType === 'BREAKFAST' ? 'petit-dejeuner' : 'repas';

    // Feedback visuel immédiat
    setLastScanned({ student, status: 'pending' });

    // Entrée optimiste
    const optimisticMeal: LocalMeal = {
      id: `temp-${Date.now()}`,
      learner: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        matricule: student.matricule,
        photoUrl: student.photoUrl || '',
        referential: { name: student.referential?.name || 'N/A', description: '' },
        promotion: { name: student.promotion?.name || 'N/A' },
      },
      type: currentMealType,
      timestamp: new Date().toISOString(),
    };

    const promise = mealsAPI.recordMeal(student.matricule, apiMealType);

    // Notifier le parent
    onMealRecorded(optimisticMeal, promise);

    // Mettre à jour le statut du bandeau selon la réponse API
    promise
      .then(() => setLastScanned(prev => prev ? { ...prev, status: 'ok' } : null))
      .catch(() => {
        setLastScanned(prev => prev ? { ...prev, status: 'error' } : null);
        setError(`Échec d'enregistrement pour ${student!.firstName} ${student!.lastName}`);
      });

  }, [lastScanTime, onMealRecorded]);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    try { scannerRef.current?.destroy(); } catch {}
    scannerRef.current = null;
    setIsScanning(false);
    setIsInitialized(false);
    setLastScanned(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) { cleanup(); return; }

    const initCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!devices.some(d => d.kind === 'videoinput')) {
          setHasCamera(false);
          setError('Aucune caméra détectée');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        setHasCamera(true);

        const QrScanner = (await import('qr-scanner')).default;
        scannerRef.current?.destroy();
        scannerRef.current = new QrScanner(videoRef.current, handleScanResult, {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 2,
          preferredCamera: facingMode,
        });
        setIsInitialized(true);
      } catch (err: any) {
        setHasCamera(false);
        setError(
          err.name === 'NotAllowedError' ? 'Accès caméra refusé' :
          err.name === 'NotFoundError' ? 'Aucune caméra trouvée' :
          'Impossible d\'accéder à la caméra'
        );
      }
    };

    initCamera();
    return cleanup;
  }, [isOpen, facingMode, handleScanResult, cleanup]);

  const startScanning = async () => {
    if (!scannerRef.current || !isInitialized) return;
    try {
      await scannerRef.current.start();
      setIsScanning(true);
      setLastScanTime(0);
      setError(null);
    } catch {
      setError('Impossible de démarrer le scanner');
    }
  };

  const stopScanning = () => {
    try { scannerRef.current?.stop(); } catch {}
    setIsScanning(false);
  };

  if (!isOpen) return null;

  const bandeauColor =
    !lastScanned ? '' :
    lastScanned.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
    lastScanned.status === 'ok' ? 'bg-green-50 border-green-200' :
    'bg-red-50 border-red-200';

  const bandeauIcon =
    !lastScanned ? null :
    lastScanned.status === 'pending' ? <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin flex-shrink-0" /> :
    lastScanned.status === 'ok' ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> :
    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Scanner QR Code</h2>
              <p className="text-sm text-gray-500">
                {selectedMealType === 'BREAKFAST' ? '☕ Petit déjeuner' : '🍽 Déjeuner'} — scan continu
              </p>
            </div>
            <button onClick={() => { cleanup(); onClose(); }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {hasCamera ? (
            <div className="space-y-3">
              {/* Vidéo */}
              <div className="relative rounded-xl overflow-hidden border-4 border-orange-300">
                <video ref={videoRef}
                  className="w-full h-60 object-cover bg-gray-900"
                  autoPlay playsInline muted />
                {/* Viseur */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-44 h-44 border-2 border-dashed rounded-lg transition-colors duration-300 ${
                    isScanning ? 'border-orange-300' : 'border-white/60'
                  }`} />
                </div>
                {/* Indicateur scan actif */}
                {isScanning && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    En cours
                  </div>
                )}
              </div>

              {/* Bandeau dernier scan */}
              {lastScanned && (
                <div className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-300 ${bandeauColor}`}>
                  {bandeauIcon}
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                    {lastScanned.student.photoUrl ? (
                      <img src={lastScanned.student.photoUrl}
                        alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {lastScanned.student.firstName} {lastScanned.student.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lastScanned.status === 'pending' && 'Enregistrement…'}
                      {lastScanned.status === 'ok' && '✓ Repas enregistré'}
                      {lastScanned.status === 'error' && '✗ Échec enregistrement'}
                    </p>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3">
                {!isScanning ? (
                  <button onClick={startScanning} disabled={!isInitialized}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
                      isInitialized
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}>
                    <Camera className="h-4 w-4" />
                    {isInitialized ? 'Démarrer' : 'Initialisation…'}
                  </button>
                ) : (
                  <button onClick={stopScanning}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors">
                    <X className="h-4 w-4" />
                    Arrêter
                  </button>
                )}
                <button onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')}
                  disabled={!isInitialized}
                  className={`px-4 py-2.5 rounded-lg transition-colors ${
                    isInitialized
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}>
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <CameraOff className="h-14 w-14 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{error || 'Caméra non disponible'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard Principal ───────────────────────────────────────────────────────

export default function RestaurateurDashboard() {
  const [recentMeals, setRecentMeals] = useState<LocalMeal[]>([]);
  const [referentials, setReferentials] = useState<Referential[]>([]);
  const [totalLearners, setTotalLearners] = useState<number>(TOTAL_LEARNERS);
  const [mealStats, setMealStats] = useState({ breakfast: 0, lunch: 0 });

  const [loading, setLoading] = useState({
    meals: true, referentials: true, learners: true,
  });
  const [error, setError] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'BREAKFAST' | 'LUNCH'>('BREAKFAST');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedMealTypeFilter, setSelectedMealTypeFilter] = useState<'ALL' | 'BREAKFAST' | 'LUNCH'>('ALL');
  const [selectedDate, setSelectedDate] = useState(formatDateToString(new Date()));
  const [showScanner, setShowScanner] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchMealsData = async () => {
    setLoading(prev => ({ ...prev, meals: true }));
    try {
      const data = await mealsAPI.getLatestScans();
      const converted = convertApiToLocal(data);
      setRecentMeals(converted);
      setMealStats({
        breakfast: converted.filter(m => m.type === 'BREAKFAST').length,
        lunch: converted.filter(m => m.type === 'LUNCH').length,
      });
      setError('');
    } catch {
      setError('Impossible de charger les données.');
    } finally {
      setLoading(prev => ({ ...prev, meals: false }));
    }
  };

  const fetchReferentials = async () => {
    setLoading(prev => ({ ...prev, referentials: true }));
    try {
      setReferentials(await referentialsAPI.getAllReferentials());
    } catch {}
    finally { setLoading(prev => ({ ...prev, referentials: false })); }
  };

  const fetchTotalLearners = async () => {
    setLoading(prev => ({ ...prev, learners: true }));
    try {
      const data = await learnersAPI.getAllLearners();
      setTotalLearners(data.length);
    } catch {}
    finally { setLoading(prev => ({ ...prev, learners: false })); }
  };

  useEffect(() => {
    fetchMealsData();
    fetchReferentials();
    fetchTotalLearners();
  }, []);

  // ── Callback appelé par le scanner ────────────────────────────────────────

  const handleMealRecorded = useCallback(
    (optimistic: LocalMeal, promise: Promise<ApiMealResponse>) => {
      // Ajout optimiste immédiat
      setRecentMeals(prev => [optimistic, ...prev]);
      setMealStats(prev => ({
        breakfast: optimistic.type === 'BREAKFAST' ? prev.breakfast + 1 : prev.breakfast,
        lunch: optimistic.type === 'LUNCH' ? prev.lunch + 1 : prev.lunch,
      }));

      promise
        .then(realMeal => {
          const [converted] = convertApiToLocal([realMeal]);
          setRecentMeals(prev =>
            prev.map(m => m.id === optimistic.id ? converted : m)
          );
        })
        .catch(() => {
          // Rollback
          setRecentMeals(prev => prev.filter(m => m.id !== optimistic.id));
          setMealStats(prev => ({
            breakfast: optimistic.type === 'BREAKFAST' ? prev.breakfast - 1 : prev.breakfast,
            lunch: optimistic.type === 'LUNCH' ? prev.lunch - 1 : prev.lunch,
          }));
          setError(`Échec d'enregistrement pour ${optimistic.learner.firstName}`);
        });
    },
    []
  );

  // ── Filtres ───────────────────────────────────────────────────────────────

  const dateFilteredMeals = recentMeals.filter(meal => {
    const dateMatch = isSameDay(new Date(meal.timestamp), parseDateString(selectedDate));
    const programMatch = selectedProgram === 'all' || meal.learner.referential?.name === selectedProgram;
    const typeMatch = selectedMealTypeFilter === 'ALL' || meal.type === selectedMealTypeFilter;
    return dateMatch && programMatch && typeMatch;
  });

  const dateBreakfastCount = dateFilteredMeals.filter(m => m.type === 'BREAKFAST').length;
  const dateLunchCount = dateFilteredMeals.filter(m => m.type === 'LUNCH').length;
  const breakfastPct = totalLearners > 0 ? Math.round((dateBreakfastCount / totalLearners) * 100) : 0;
  const lunchPct = totalLearners > 0 ? Math.round((dateLunchCount / totalLearners) * 100) : 0;

  const availablePrograms = referentials.map(r => r.name).sort();

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Restaurateur</h1>
            <p className="text-gray-500 text-sm">Gestion des repas étudiants</p>
          </div>
          <button onClick={fetchMealsData} disabled={loading.meals}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading.meals ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Erreur globale */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Bouton scanner */}
        <div className="mb-6">
          <button onClick={() => setShowScanner(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-lg font-semibold shadow-md">
            <QrCode className="h-6 w-6" />
            Scanner un repas
          </button>
        </div>

        {/* Filtres */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />Date
            </label>
            <input type="date" value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="inline h-4 w-4 mr-1" />Programme
            </label>
            <div className="relative">
              <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}
                disabled={loading.referentials}
                className="block w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100">
                <option value="all">Tous les programmes</option>
                {availablePrograms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                {loading.referentials
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de repas (scan)
            </label>
            <div className="relative">
              <select value={selectedMealType}
                onChange={e => setSelectedMealType(e.target.value as 'BREAKFAST' | 'LUNCH')}
                className="block w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="BREAKFAST">Petit déjeuner</option>
                <option value="LUNCH">Déjeuner</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard title="Repas du jour" value={dateFilteredMeals.length}
            icon={<Coffee className="h-8 w-8 text-purple-500" />}
            suffix={`sur ${totalLearners}`}
            loading={loading.meals || loading.learners} />
          <StatCard title="Petit déjeuner" value={dateBreakfastCount}
            icon={<Coffee className="h-8 w-8 text-orange-500" />}
            suffix={`${breakfastPct}%`} loading={loading.meals} />
          <StatCard title="Déjeuners" value={dateLunchCount}
            icon={<Clock className="h-8 w-8 text-green-500" />}
            suffix={`${lunchPct}%`} loading={loading.meals} />
        </div>

        {/* Tableau repas */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Repas récents</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <select value={selectedMealTypeFilter}
                  onChange={e => setSelectedMealTypeFilter(e.target.value as 'ALL' | 'BREAKFAST' | 'LUNCH')}
                  className="pl-3 pr-8 py-1.5 text-sm bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="ALL">Tous les repas</option>
                  <option value="BREAKFAST">Petit déjeuner</option>
                  <option value="LUNCH">Déjeuner</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2 h-3 w-3 text-gray-500" />
              </div>
              <span className="text-orange-500 text-sm font-medium">
                {dateFilteredMeals.length} repas
              </span>
            </div>
          </div>

          {loading.meals ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : dateFilteredMeals.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun repas pour cette sélection</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Apprenant', 'Programme', 'Heure', 'Type'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dateFilteredMeals.map(meal => (
                    <tr key={meal.id}
                      className={meal.id.startsWith('temp-') ? 'opacity-60' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {meal.learner.photoUrl ? (
                              <img src={meal.learner.photoUrl}
                                alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-orange-600 text-xs font-bold">
                                {meal.learner.firstName?.[0]}{meal.learner.lastName?.[0]}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {meal.learner.firstName} {meal.learner.lastName}
                          </span>
                          {meal.id.startsWith('temp-') && (
                            <RefreshCw className="h-3 w-3 text-gray-400 animate-spin" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{meal.learner.referential?.name || 'N/A'}</div>
                        {meal.learner.promotion?.name && (
                          <div className="text-xs text-gray-400">Promotion {meal.learner.promotion.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-800">
                          {new Date(meal.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(meal.timestamp).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          meal.type === 'BREAKFAST'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {meal.type === 'BREAKFAST' ? 'Petit déj.' : 'Déjeuner'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Scanner Modal */}
        <QRScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          selectedMealType={selectedMealType}
          onMealRecorded={handleMealRecorded}
        />
      </div>
    </div>
  );
}
