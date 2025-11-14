"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Coffee, Clock, Users, CheckCircle, ChevronDown, QrCode, Camera, CameraOff, RotateCcw, X, User, Mail, GraduationCap, Hash, Calendar, AlertCircle, Filter, RefreshCw } from 'lucide-react';
import { findbyQRcode } from '@/lib/api';
import { StudentType } from '@/types/student';

// Types
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  program: string;
  year: number;
  studentNumber: string;
  photo?: string;
  status: 'active' | 'inactive' | 'graduated';
  enrollmentDate: string;
}

interface ScanResult {
  student: Student;
  scanTime: Date;
  mealType: 'BREAKFAST' | 'LUNCH';
}

interface ScanHistoryItem {
  id: string;
  learner: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    photoUrl: string;
    referential?: {
      name: string;
      description: string;
    };
    promotion?: {
      name: string;
    };
  };
  type: 'BREAKFAST' | 'LUNCH';
  timestamp: string;
}

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

// Configuration API
const API_BASE_URL = 'http://localhost:3000';

// Interface pour les référentiels
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

// Fonction pour obtenir le token d'authentification
const getAuthToken = () => {
  return localStorage.getItem('auth_token') || '';
};

// Service API pour les repas
const mealsAPI = {
  // Récupérer les derniers scans
  async getLatestScans(): Promise<ApiMealResponse[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/meals/scans/latest`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    return response.json();
  },

  // Enregistrer un scan de repas
  async recordMeal(matricule: string, mealType: 'petit-dejeuner' | 'repas'): Promise<ApiMealResponse> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/meals/scan/${matricule}/${mealType}`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: ''
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'enregistrement: ${response.status}`);
    }

    return response.json();
  }
};

// Service API pour les référentiels
const referentialsAPI = {
  // Récupérer tous les référentiels
  async getAllReferentials(): Promise<Referential[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/referentials/all`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    return response.json();
  }
};

// Service API pour les apprenants
const learnersAPI = {
  // Récupérer tous les apprenants
  async getAllLearners(): Promise<any[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/learners`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    return response.json();
  }
};

// Convertir la réponse API en format local
const convertApiToLocal = (apiData: ApiMealResponse[]) => {
  return apiData.map(item => ({
    id: item.id,
    learner: {
      id: item.learner.id,
      firstName: item.learner.firstName,
      lastName: item.learner.lastName,
      photoUrl: item.learner.photoUrl,
      referential: { 
        name: item.learner.referential?.name || 'N/A',
        description: item.learner.referential?.description || ''
      },
      promotion: {
        name: item.learner.promotion?.name || 'N/A'
      }
    },
    type: item.type === 'petit-dejeuner' ? 'BREAKFAST' : 'LUNCH',
    timestamp: item.createdAt,
  }));
};

// Constante pour le nombre total d'apprenants (sera remplacé par l'API)
const TOTAL_LEARNERS = 250;

// Fonction pour vérifier si deux dates sont le même jour
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Fonction pour formater une date en string YYYY-MM-DD
const formatDateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Fonction pour parser une date string en Date
const parseDateString = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};

// Fonction pour chercher un étudiant par ID ou données QR
const findStudentByQRData = async (qrData: string): Promise<StudentType | null> => {
  try {
    const parsedData = JSON.parse(qrData);
    
    if (parsedData.id) {
      const student = await findbyQRcode(parsedData.id);
      return student;
    }
    
    return null;
  } catch {
    try {
      const student = await findbyQRcode(qrData);
      return student;
    } catch (error) {
      console.error('Étudiant non trouvé:', error);
      return null;
    }
  }
};

// StatCard Component
const StatCard = ({ title, value, icon, suffix, loading }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value} {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
          </p>
        </div>
        <div className="flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
};

// QR Scanner Modal Component
const QRScannerModal = ({ isOpen, onClose, onScanSuccess, selectedMealType }: {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (student: StudentType, mealType: 'BREAKFAST' | 'LUNCH') => void;
  selectedMealType: 'BREAKFAST' | 'LUNCH';
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  const handleScanResult = useCallback(async (result: any) => {
    const now = Date.now();
    if (now - lastScanTime < 2000) {
      return;
    }
    setLastScanTime(now);

    try {
      setScanStatus('success');
      const qrData = result.data || result;
      console.log('QR Code scanné:', qrData);
      
      const student = await findStudentByQRData(qrData);
      console.log('Étudiant trouvé:', student);
      
      if (!student) {
        setScanStatus('error');
        setError(`QR code non reconnu. Étudiant non trouvé dans la base de données pour: "${qrData}"`);
        setTimeout(() => {
          setScanStatus('scanning');
          setError(null);
        }, 3000);
        return;
      }

      setTimeout(() => {
        onScanSuccess(student, selectedMealType);
        setScanStatus('idle');
        setIsScanning(false);
      }, 1000);

    } catch (error) {
      console.error('Erreur lors du traitement du QR code:', error);
      setScanStatus('error');
      setError('Erreur lors du traitement du QR code');
      setTimeout(() => {
        setScanStatus('scanning');
        setError(null);
      }, 3000);
    }
  }, [onScanSuccess, selectedMealType, lastScanTime]);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scannerRef.current) {
      try {
        scannerRef.current.destroy();
      } catch (e) {
        console.log('Scanner cleanup error:', e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScanStatus('idle');
    setIsInitialized(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    const initCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          setHasCamera(false);
          setError('Aucune caméra trouvée sur cet appareil');
          return;
        }

        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
          setError(null);
          
          try {
            const QrScanner = (await import('qr-scanner')).default;
            
            if (scannerRef.current) {
              scannerRef.current.destroy();
            }

            scannerRef.current = new QrScanner(
              videoRef.current,
              handleScanResult,
              {
                highlightScanRegion: true,
                highlightCodeOutline: true,
                maxScansPerSecond: 2,
                preferredCamera: facingMode,
              }
            );

            setIsInitialized(true);
            console.log('Scanner initialisé avec succès');
          } catch (e) {
            console.log('QR Scanner initialization error:', e);
            setError('Impossible d\'initialiser le scanner QR');
          }
        }
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        setHasCamera(false);
        if (err.name === 'NotAllowedError') {
          setError('Accès à la caméra refusé. Veuillez autoriser l\'accès à la caméra.');
        } else if (err.name === 'NotFoundError') {
          setError('Aucune caméra trouvée sur cet appareil.');
        } else {
          setError('Impossible d\'accéder à la caméra');
        }
      }
    };

    initCamera();

    return cleanup;
  }, [isOpen, facingMode, handleScanResult, cleanup]);

  const startScanning = async () => {
    if (!scannerRef.current || !hasCamera || !isInitialized) {
      setError('Scanner non prêt. Veuillez patienter...');
      return;
    }

    try {
      await scannerRef.current.start();
      setIsScanning(true);
      setScanStatus('scanning');
      setError(null);
      setLastScanTime(0);
    } catch (error) {
      console.error('Error starting scanner:', error);
      setError('Impossible de démarrer la caméra. Vérifiez les permissions.');
      setScanStatus('error');
    }
  };

  const stopScanning = () => {
    if (!scannerRef.current) return;
    try {
      scannerRef.current.stop();
      setIsScanning(false);
      setScanStatus('idle');
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  const switchCamera = async () => {
    if (isScanning) {
      stopScanning();
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const simulateScan = () => {
    handleScanResult('ODC-DSD25307');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Scanner QR Code</h2>
              <p className="text-sm text-gray-600">
                Type: {selectedMealType === 'BREAKFAST' ? 'Petit déjeuner' : 'Déjeuner'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {hasCamera ? (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border-4 border-orange-300">
                <video ref={videoRef} className="w-full h-64 object-cover bg-gray-100" autoPlay playsInline muted />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg"></div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                {!isScanning ? (
                  <button onClick={startScanning} disabled={!isInitialized}
                    className={`flex items-center px-6 py-3 rounded-lg transition-colors font-medium ${
                      isInitialized ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}>
                    <Camera className="mr-2 h-5 w-5" />
                    {isInitialized ? 'Démarrer le scan' : 'Initialisation...'}
                  </button>
                ) : (
                  <button onClick={stopScanning}
                    className="flex items-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                    <X className="mr-2 h-5 w-5" />
                    Arrêter le scan
                  </button>
                )}
                
                <button onClick={switchCamera} disabled={!isInitialized}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isInitialized ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}>
                  <RotateCcw className="h-5 w-5" />
                </button>
                
                {/* <button onClick={simulateScan}
                  className="flex items-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <User className="h-5 w-5" />
                </button> */}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CameraOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Caméra non disponible</h3>
              <button onClick={simulateScan}
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                <User className="h-4 w-4 mr-2" />
                Test avec données réelles
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Student Result Modal Component
const StudentResultModal = ({ isOpen, onClose, student, scanTime, mealType, onValidate }: {
  isOpen: boolean;
  onClose: () => void;
  student: StudentType | null;
  scanTime: Date | null;
  mealType: 'BREAKFAST' | 'LUNCH';
  onValidate: () => void;
}) => {
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen || !student || !scanTime) return null;

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      await onValidate();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Étudiant Scanné</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`}
                    className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-white" />
                )}
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {student.firstName} {student.lastName}
            </h3>
            
            <p className="text-sm text-gray-500">
              Scanné le {scanTime.toLocaleDateString('fr-FR')} à {scanTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm font-medium text-orange-600">
              {mealType === 'BREAKFAST' ? 'Petit déjeuner' : 'Déjeuner'}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Hash className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Numéro étudiant</p>
                <p className="font-medium text-gray-900">{student.matricule}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{student.user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button onClick={handleValidate} disabled={isValidating}
              className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50">
              {isValidating ? 'Validation...' : 'Valider le repas'}
            </button>
            <button onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Scan History Component
const ScanHistory = ({ scanHistory, isLoading }: {
  scanHistory: ScanHistoryItem[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Historique des scans</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (scanHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Historique des scans</h3>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun scan effectué aujourd'hui</p>
        </div>
      </div>
    );
  }

  // Trier par date décroissante (plus récent en premier)
  const sortedHistory = [...scanHistory].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Historique des scans</h3>
        <span className="text-blue-500 text-sm font-medium">
          {scanHistory.length} scan{scanHistory.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedHistory.map((scan) => {
          const scanDate = new Date(scan.timestamp);
          
          return (
            <div key={scan.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                {scan.learner.photoUrl ? (
                  <img 
                    src={scan.learner.photoUrl} 
                    alt={`${scan.learner.firstName} ${scan.learner.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {scan.learner.firstName} {scan.learner.lastName}
                </h4>
                {scan.learner.referential?.name && (
                  <p className="text-xs text-gray-600 truncate">{scan.learner.referential.name}</p>
                )}
                <p className="text-xs text-gray-500">#{scan.learner.matricule}</p>
              </div>
              
              <div className="text-right ml-3 flex-shrink-0">
                <div className="flex items-center justify-end text-xs text-gray-600 mb-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {scanDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  scan.type === 'BREAKFAST'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {scan.type === 'BREAKFAST' ? 'P. déj' : 'Déjeuner'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function RestaurateurDashboard() {
  const [mealStats, setMealStats] = useState({
    totalLearners: TOTAL_LEARNERS,
    breakfast: 0,
    lunch: 0,
  });
  const [recentMeals, setRecentMeals] = useState<any[]>([]);
  const [referentials, setReferentials] = useState<Referential[]>([]);
  const [totalLearners, setTotalLearners] = useState<number>(TOTAL_LEARNERS);
  const [loading, setLoading] = useState({
    stats: true,
    meals: true,
    referentials: true,
    learners: true,
  });
  const [error, setError] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<'BREAKFAST' | 'LUNCH'>('BREAKFAST');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedMealTypeFilter, setSelectedMealTypeFilter] = useState<'ALL' | 'BREAKFAST' | 'LUNCH'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateToString(new Date()));
  const [showScanner, setShowScanner] = useState(false);
  const [showStudentResult, setShowStudentResult] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<StudentType | null>(null);
  const [scanTime, setScanTime] = useState<Date | null>(null);
  const [scanHistoryData, setScanHistoryData] = useState<ScanHistoryItem[]>([]);

  // Charger les données depuis l'API
  const fetchMealsData = async () => {
    setLoading(prev => ({ ...prev, stats: true, meals: true }));
    try {
      const data = await mealsAPI.getLatestScans();
      const converted = convertApiToLocal(data);
      setRecentMeals(converted);
      setScanHistoryData(converted);
      
      // Calculer les statistiques
      const breakfastCount = converted.filter(m => m.type === 'BREAKFAST').length;
      const lunchCount = converted.filter(m => m.type === 'LUNCH').length;
      
      setMealStats({
        totalLearners: TOTAL_LEARNERS,
        breakfast: breakfastCount,
        lunch: lunchCount,
      });
      
      setError('');
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données. Vérifiez votre connexion.');
    } finally {
      setLoading(prev => ({ ...prev, stats: false, meals: false }));
    }
  };

  // Charger les référentiels depuis l'API
  const fetchReferentials = async () => {
    setLoading(prev => ({ ...prev, referentials: true }));
    try {
      const data = await referentialsAPI.getAllReferentials();
      setReferentials(data);
      console.log('Référentiels chargés:', data.length);
    } catch (err) {
      console.error('Erreur lors du chargement des référentiels:', err);
    } finally {
      setLoading(prev => ({ ...prev, referentials: false }));
    }
  };

  // Charger le nombre total d'apprenants depuis l'API
  const fetchTotalLearners = async () => {
    setLoading(prev => ({ ...prev, learners: true }));
    try {
      const data = await learnersAPI.getAllLearners();
      const count = data.length;
      setTotalLearners(count);
      setMealStats(prev => ({ ...prev, totalLearners: count }));
      console.log('Nombre total d\'apprenants:', count);
    } catch (err) {
      console.error('Erreur lors du chargement des apprenants:', err);
      // Garder la valeur par défaut en cas d'erreur
    } finally {
      setLoading(prev => ({ ...prev, learners: false }));
    }
  };

  useEffect(() => {
    fetchMealsData();
    fetchReferentials();
    fetchTotalLearners();
  }, []);

  const handleScanSuccess = (student: StudentType, mealType: 'BREAKFAST' | 'LUNCH') => {
    const now = new Date();
    setScannedStudent(student);
    setScanTime(now);
    setShowScanner(false);
    setShowStudentResult(true);
  };

  const handleValidateMeal = async () => {
    if (!scannedStudent) return;
    
    try {
      const mealType = selectedMealType === 'BREAKFAST' ? 'petit-dejeuner' : 'repas';
      await mealsAPI.recordMeal(scannedStudent.matricule, mealType);
      
      // Recharger les données
      await fetchMealsData();
      
      console.log('Repas enregistré avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du repas:', error);
      setError('Erreur lors de l\'enregistrement du repas');
    }
  };

  // Filtrer par date, programme ET type de repas
  const dateFilteredMeals = recentMeals.filter(meal => {
    const mealDate = new Date(meal.timestamp);
    const dateMatch = isSameDay(mealDate, parseDateString(selectedDate));
    const programMatch = selectedProgram === 'all' || meal.learner.referential?.name === selectedProgram;
    const mealTypeMatch = selectedMealTypeFilter === 'ALL' || meal.type === selectedMealTypeFilter;
    return dateMatch && programMatch && mealTypeMatch;
  });

  const dateBreakfastCount = dateFilteredMeals.filter(m => m.type === 'BREAKFAST').length;
  const dateLunchCount = dateFilteredMeals.filter(m => m.type === 'LUNCH').length;

  const breakfastPercentage = totalLearners > 0 ? Math.round((dateBreakfastCount / totalLearners) * 100) : 0;
  const lunchPercentage = totalLearners > 0 ? Math.round((dateLunchCount / totalLearners) * 100) : 0;

  // Utiliser les référentiels de l'API au lieu de les extraire des repas
  const availablePrograms = referentials.map(ref => ref.name).sort();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Restaurateur</h1>
            <p className="text-gray-600">Gestion des repas étudiants</p>
          </div>
          <button onClick={fetchMealsData} disabled={loading.meals}
            className="flex items-center px-4 py-2 bg-[rgb(19,158,155)] text-white p-4 rounded ansition-colors">
            <RefreshCw className={`mr-2 h-5 w-5 ${loading.meals ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        <div className="mb-6 flex flex-wrap gap-4">
          <button onClick={() => setShowScanner(true)}
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-lg font-medium shadow-lg">
            <QrCode className="mr-2 h-6 w-6" />
            Scanner pour un repas
          </button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date
            </label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              Filtrer par programme
            </label>
            <div className="relative">
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                disabled={loading.referentials}
                className="block w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">Tous les programmes</option>
                {availablePrograms.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                {loading.referentials ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de repas pour le scan
            </label>
            <div className="relative">
              <select value={selectedMealType} onChange={(e) => setSelectedMealType(e.target.value as 'BREAKFAST' | 'LUNCH')}
                className="block w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="BREAKFAST">Petit déjeuner</option>
                <option value="LUNCH">Déjeuner</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard title="Repas du jour" value={dateFilteredMeals.length}
            icon={<Coffee className="h-8 w-8 text-purple-500" />} 
            suffix={`sur ${totalLearners}`} 
            loading={loading.meals || loading.learners} />
          <StatCard title="Petit déjeuner" value={dateBreakfastCount}
            icon={<Coffee className="h-8 w-8 text-orange-500" />} suffix={`${breakfastPercentage}%`} loading={loading.stats} />
          <StatCard title="Déjeuners" value={dateLunchCount}
            icon={<Clock className="h-8 w-8 text-green-500" />} suffix={`${lunchPercentage}%`} loading={loading.stats} />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Repas récents
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              {selectedProgram !== 'all' && (
                <span className="text-sm text-gray-500">
                  Programme: {selectedProgram}
                </span>
              )}
              
              <div className="relative">
                <select
                  value={selectedMealTypeFilter}
                  onChange={(e) => setSelectedMealTypeFilter(e.target.value as 'ALL' | 'BREAKFAST' | 'LUNCH')}
                  className="pl-3 pr-8 py-1.5 text-sm bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ALL">Tous les repas</option>
                  <option value="BREAKFAST">Petit déjeuner</option>
                  <option value="LUNCH">Déjeuner</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>
              
              <span className="text-orange-500 text-sm font-medium">
                {dateFilteredMeals.length} repas
              </span>
            </div>
          </div>
          
          {loading.meals ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : dateFilteredMeals.length === 0 ? (
            <div className="bg-gray-50 text-gray-500 p-4 rounded-lg text-center">
              {selectedProgram === 'all' && selectedMealTypeFilter === 'ALL'
                ? 'Aucun repas trouvé pour cette date'
                : `Aucun repas trouvé avec ces filtres`
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apprenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dateFilteredMeals.map((meal) => (
                    <tr key={meal.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0 overflow-hidden">
                            {meal.learner.photoUrl ? (
                              <img 
                                src={meal.learner.photoUrl} 
                                alt={`${meal.learner.firstName} ${meal.learner.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{meal.learner.firstName?.[0]}{meal.learner.lastName?.[0]}</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {meal.learner.firstName} {meal.learner.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {meal.learner.referential?.name || 'N/A'}
                        </div>
                        {meal.learner.promotion?.name && (
                          <div className="text-xs text-gray-500">
                            Promotion {meal.learner.promotion.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(meal.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(meal.timestamp).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            meal.type === 'BREAKFAST'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {meal.type === 'BREAKFAST' ? 'Petit déjeuner' : 'Déjeuner'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

       

        <QRScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
          selectedMealType={selectedMealType}
        />

        <StudentResultModal
          isOpen={showStudentResult}
          onClose={() => setShowStudentResult(false)}
          student={scannedStudent}
          scanTime={scanTime}
          mealType={selectedMealType}
          onValidate={handleValidateMeal}
        />
      </div>
    </div>
  );
}