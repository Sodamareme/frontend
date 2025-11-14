"use client";

import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, CameraOff, RotateCcw, CheckCircle, AlertCircle, X, User } from 'lucide-react';
import { findbyQRcode } from '../../../../lib/api'
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

// Mock data - remplacez par votre vraie base de données
const MOCK_STUDENTS: { [key: string]: Student } = {
  'STU001': {
    id: 'STU001',
    firstName: 'Amadou',
    lastName: 'Diallo',
    email: 'amadou.diallo@example.com',
    program: 'Développement Web Full Stack',
    year: 2,
    studentNumber: 'WEB2024001',
    status: 'active',
    enrollmentDate: '2023-09-15',
  },
  'STU002': {
    id: 'STU002',
    firstName: 'Fatou',
    lastName: 'Sow',
    email: 'fatou.sow@example.com',
    program: 'Data Science & IA',
    year: 3,
    studentNumber: 'DS2022045',
    status: 'active',
    enrollmentDate: '2022-09-12',
  },
  'STU003': {
    id: 'STU003',
    firstName: 'Ibrahima',
    lastName: 'Ndiaye',
    email: 'ibrahima.ndiaye@example.com',
    program: 'AWS Cloud Computing',
    year: 1,
    studentNumber: 'AWS2024012',
    status: 'active',
    enrollmentDate: '2024-01-08',
  },
  'STU004': {
    id: 'STU004',
    firstName: 'Aissatou',
    lastName: 'Diop',
    email: 'aissatou.diop@example.com',
    program: 'Cybersécurité',
    year: 2,
    studentNumber: 'CYB2023028',
    status: 'active',
    enrollmentDate: '2023-09-20',
  },
  'STU005': {
    id: 'STU005',
    firstName: 'Moussa',
    lastName: 'Gueye',
    email: 'moussa.gueye@example.com',
    program: 'DevOps & Infrastructure',
    year: 3,
    studentNumber: 'DEV2021033',
    status: 'graduated',
    enrollmentDate: '2021-09-10',
  },
};

// Fonction pour chercher un étudiant par ID ou données QR
// Fonction pour chercher un étudiant par ID ou données QR
const findStudentByQRData = async (qrData: string): Promise<StudentType | null> => {
  try {
    // Essayer de parser comme JSON
    const parsedData = JSON.parse(qrData);
    
    // Si c'est un objet avec un ID
    if (parsedData.id) {
      const student = await findbyQRcode(parsedData.id);
      return student;
    }
    
    // Si c'est un objet étudiant complet valide
    if (parsedData.firstName && parsedData.lastName && parsedData.studentNumber) {
      return parsedData as Student;
    }
    
    return null;
  } catch {
    // Si ce n'est pas du JSON, traiter comme ID simple ou numéro étudiant
    try {
      const student = await findbyQRcode(qrData);
      return student;
    } catch (error) {
      console.error('Étudiant non trouvé:', error);
      return null;
    }
  }
};

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [scannedStudent, setScannedStudent] = useState<StudentType | null>(null);
  const [scanTime, setScanTime] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'BREAKFAST' | 'LUNCH'>('BREAKFAST');

  useEffect(() => {
    initCamera();
    return cleanup;
  }, [facingMode]);

  const cleanup = () => {
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
  };

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
          scannerRef.current = new QrScanner(
            videoRef.current,
            (result) => handleScanResult(result.data),
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              maxScansPerSecond: 5,
            }
          );
        } catch (e) {
          console.log('QR Scanner initialization error:', e);
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

  const handleScanResult = async (data: string) => {
  try {
    // Chercher l'étudiant correspondant aux données QR
    console.log(data)
    const student = await findStudentByQRData(data); // Ajout de await
    
    if (!student) {
      setScanStatus('error');
      setError('QR code non reconnu. Étudiant non trouvé dans la base de données.');
      setTimeout(() => {
        setScanStatus('idle');
        setError(null);
      }, 3000);
      return;
    }

    // Vérifier le statut de l'étudiant
    if (student.status === 'inactive') {
      setScanStatus('error');
      setError('Étudiant inactif. Veuillez contacter l\'administration.');
      setTimeout(() => {
        setScanStatus('idle');
        setError(null);
      }, 3000);
      return;
    }

    setScanStatus('success');
    const now = new Date();
    setScannedStudent(student);
    setScanTime(now);
    
    // Arrêter le scanner après un scan réussi
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
      } catch (e) {
        console.log('Scanner stop error:', e);
      }
    }
    
    setTimeout(() => {
      setScanStatus('idle');
      setIsScanning(false);
    }, 2000);
  } catch (error) {
    setScanStatus('error');
    setError('Erreur lors du traitement du QR code');
    setTimeout(() => {
      setScanStatus('idle');
      setError(null);
    }, 3000);
  }
};

  const startScanning = async () => {
    if (!hasCamera) {
      setError('Caméra non disponible');
      return;
    }

    setIsScanning(true);
    setScanStatus('scanning');
    setError(null);

    if (scannerRef.current) {
      try {
        await scannerRef.current.start();
      } catch (e) {
        console.log('Scanner start error:', e);
      }
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    setScanStatus('idle');
    
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
      } catch (e) {
        console.log('Scanner stop error:', e);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const simulateScan = () => {
    // Simuler le scan du premier étudiant pour les tests
    handleScanResult('STU001');
  };

  const getScanStatusIcon = () => {
    switch (scanStatus) {
      case 'scanning':
        return <Camera className="h-8 w-8 text-orange-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Camera className="h-8 w-8 text-gray-400" />;
    }
  };

  const getScanStatusText = () => {
    switch (scanStatus) {
      case 'scanning':
        return 'Scanning en cours...';
      case 'success':
        return 'QR code scanné avec succès!';
      case 'error':
        return 'Erreur de scan';
      default:
        return 'Prêt à scanner';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'graduated':
        return 'Diplômé';
      default:
        return 'Inconnu';
    }
  };

  const validateMeal = () => {
    if (!scannedStudent) return;
    
    // Ici vous pouvez envoyer les données vers votre API
    const mealData = {
      studentId: scannedStudent.id,
      mealType: selectedMealType,
      timestamp: scanTime,
      studentInfo: scannedStudent
    };
    
    console.log('Données du repas à enregistrer:', mealData);
    
    // Simuler l'enregistrement
    alert(`Repas ${selectedMealType === 'BREAKFAST' ? 'petit déjeuner' : 'déjeuner'} validé pour ${scannedStudent.firstName} ${scannedStudent.lastName}!`);
    
    // Réinitialiser
    setScannedStudent(null);
    setScanTime(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Scanner QR Code Étudiant</h1>
          <p className="text-gray-600">Scannez le QR code d'un étudiant pour enregistrer son repas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Scanner QR Code</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de repas
                </label>
                <select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value as 'BREAKFAST' | 'LUNCH')}
                  className="block w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="BREAKFAST">Petit déjeuner</option>
                  <option value="LUNCH">Déjeuner</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {hasCamera ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border-4 border-orange-300 transition-all duration-300">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover bg-gray-100"
                    autoPlay
                    playsInline
                    muted
                  />
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="mb-2">{getScanStatusIcon()}</div>
                        <span className="text-sm font-medium">{getScanStatusText()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-lg"></div>
                </div>

                <div className="flex justify-center space-x-4">
                  {!isScanning ? (
                    <button
                      onClick={startScanning}
                      className="flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Démarrer le scan
                    </button>
                  ) : (
                    <button
                      onClick={stopScanning}
                      className="flex items-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Arrêter le scan
                    </button>
                  )}
                  
                  <button
                    onClick={switchCamera}
                    className="flex items-center px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    title="Changer de caméra"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={simulateScan}
                    className="flex items-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    title="Test avec données d'exemple"
                  >
                    <User className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <CameraOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Caméra non disponible</h3>
                <p className="text-gray-600 mb-4">
                  {error || 'Aucune caméra n\'a été détectée sur cet appareil.'}
                </p>
                <button
                  onClick={simulateScan}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <User className="h-4 w-4 mr-2" />
                  Test avec données d'exemple
                </button>
              </div>
            )}
          </div>

          {/* Student Result Section */}
          {scannedStudent && scanTime && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Étudiant Scanné</h2>

              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    {scannedStudent.photo ? (
                      <img 
                        src={scannedStudent.photo} 
                        alt={`${scannedStudent.firstName} ${scannedStudent.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-white" />
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {scannedStudent.firstName} {scannedStudent.lastName}
                </h3>
                
                <div className="flex items-center justify-center mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(scannedStudent.status)}`}>
                    {getStatusText(scannedStudent.status)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500">
                  Scanné le {scanTime.toLocaleDateString('fr-FR')} à {scanTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm font-medium text-orange-600">
                  {selectedMealType === 'BREAKFAST' ? 'Petit déjeuner' : 'Déjeuner'}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="mr-3">
                    <div className="w-5 h-5 text-gray-400">#</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numéro étudiantt</p>
                    <p className="font-medium text-gray-900">{scannedStudent.matricule}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="mr-3">
                    <div className="w-5 h-5 text-gray-400">@</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{scannedStudent.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="mr-3">
                    <div className="w-5 h-5 text-gray-400">🎓</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Programme</p>
                    <p className="font-medium text-gray-900">{scannedStudent.program}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="mr-3">
                    <div className="w-5 h-5 text-gray-400">📅</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Année & Inscription</p>
                    <p className="font-medium text-gray-900">
                      {scannedStudent.year}ème année • {new Date(scannedStudent.enrollmentDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={validateMeal}
                  className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  Valider le repas
                </button>
                <button 
                  onClick={() => {
                    setScannedStudent(null);
                    setScanTime(null);
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}