'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceAPI } from '@/lib/api';
import { CheckCircle, Clock, Camera, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScanResponse } from '@/types/attendance';

interface ScanResult {
  type: 'LEARNER' | 'COACH';
  scanTime: string;
  isLate: boolean;
  isPresent: boolean;
  learner?: {
    firstName: string;
    lastName: string;
    matricule: string;
    photoUrl?: string | null;
    referential?: {
      name: string;
    } | null;
    promotion?: {
      name: string;
    };
  };
  coach?: {
    firstName: string;
    lastName: string;
    matricule: string;
    photoUrl?: string | null;
    referential?: {
      name: string;
    } | null;
  };
}

const mapApiResponseToScanResult = (data: ScanResponse): ScanResult => {
  return {
    type: data.type,
    scanTime: new Date(data.scanTime).toISOString(),
    isLate: data.attendanceStatus === 'LATE',
    isPresent: data.attendanceStatus === 'PRESENT',
    ...(data.type === 'LEARNER' ? {
      learner: {
        firstName: data.learner.firstName,
        lastName: data.learner.lastName,
        matricule: data.learner.matricule,
        photoUrl: data.learner.photoUrl,
        referential: data.learner.referential,
        promotion: data.learner.promotion
      }
    } : {
      coach: {
        firstName: data.coach.firstName,
        lastName: data.coach.lastName,
        matricule: data.coach.matricule,
        photoUrl: data.coach.photoUrl,
        referential: data.coach.referential
      }
    })
  };
};

export default function QRScanner() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMounted = useRef(true);
  const shouldRestartScanner = useRef(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup function
  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;

        // Clean up the reader element
        const readerElement = document.getElementById('reader');
        if (readerElement) {
          readerElement.innerHTML = '';
        }
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      cleanupScanner();
    };
  }, []);

  const startScanning = async () => {
    try {
      await cleanupScanner();

      const container = document.getElementById('scanner-container');
      if (!container) {
        throw new Error('Scanner container not found');
      }

      let readerElement = document.getElementById('reader');
      if (!readerElement) {
        readerElement = document.createElement('div');
        readerElement.id = 'reader';
        container.appendChild(readerElement);
      }
      readerElement.innerHTML = '';

      scannerRef.current = new Html5Qrcode("reader");
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { 
            width: Math.min(250, window.innerWidth - 40),
            height: Math.min(250, window.innerWidth - 40)
          },
          aspectRatio: 1.0,
        },
        handleScanSuccess,
        undefined
      );
      
      setIsScanning(true);
      setError('');
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Erreur d\'accès à la caméra. Veuillez vérifier vos permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    await cleanupScanner();
    if (isMounted.current) {
      setIsScanning(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    try {
      if (!scannerRef.current) return;
      
      await scannerRef.current.stop();
      
      // Try learner scan
      const learnerResponse = await attendanceAPI.scanLearnerQR(decodedText);
      
      if (learnerResponse.success && learnerResponse.data) {
        setScanResult(mapApiResponseToScanResult(learnerResponse.data));
        return;
      }

      // Try coach scan if not an already scanned learner
      if (!learnerResponse.message.includes('déjà été scanné')) {
        const coachResponse = await attendanceAPI.scanCoachQR(decodedText);
        
        if (coachResponse.success && coachResponse.data) {
          setScanResult(mapApiResponseToScanResult(coachResponse.data));
          return;
        }
      }

      // Show error message with delay before restarting
      setError(learnerResponse.message);
      
      // Clear any existing timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      
      // Set new timeout for error message
      errorTimeoutRef.current = setTimeout(async () => {
        setError('');
        await startScanning();
      }, 2000); // Show error for 3 seconds

    } catch (err) {
      console.error('Scan processing error:', err);
      setError('Erreur lors du traitement du scan');
      
      // Set timeout for error message
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(async () => {
        setError('');
        await startScanning();
      }, 2000);
    }
  };

  const handleValidate = async () => {
    // Just reset states and restart scanner
    setScanResult(null);
    setError('');
    await startScanning();
  };

  const handleReturn = async () => {
    await stopScanning();
    router.push('/dashboard');
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <button
            onClick={handleReturn}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au tableau de bord
          </button>
        </div>

        <div className="relative bg-black">
          <div 
            id="scanner-container" 
            className="aspect-square   relative"
            style={{ maxHeight: '400px' }}
          >
            {!isScanning && !scanResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <button
                  onClick={startScanning}
                  className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Activer le scanner
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        {/* Scan result modal */}
        {scanResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center">
                {/* Status Icon */}
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                  {scanResult.isLate ? (
                    <Clock className="h-6 w-6 text-orange-600" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>

                {/* Profile Image */}
                <div className="mb-4">
                  <div className="h-24 w-24 mx-auto rounded-full overflow-hidden border-2 border-gray-200">
                    {(scanResult.learner?.photoUrl || scanResult.coach?.photoUrl) ? (
                      <img 
                        src={scanResult.learner?.photoUrl || scanResult.coach?.photoUrl || ''}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-500 text-xl font-medium">
                        {(scanResult.learner?.firstName[0] || scanResult.coach?.firstName[0]) +
                         (scanResult.learner?.lastName[0] || scanResult.coach?.lastName[0])}
                      </div>
                    )}
                  </div>
                </div>

                {/* User Details */}
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {scanResult.learner?.firstName || scanResult.coach?.firstName}{' '}
                  {scanResult.learner?.lastName || scanResult.coach?.lastName}
                </h3>
                
                <p className="text-sm text-gray-500 mb-4">
                  {scanResult.learner?.matricule || scanResult.coach?.matricule}
                </p>

                {/* Additional Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600">
                    {scanResult.type === 'LEARNER' ? (
                      <>
                        <p>Référentiel: {scanResult.learner?.referential?.name || 'N/A'}</p>
                        <p className="mt-1">Promotion: {scanResult.learner?.promotion?.name || 'N/A'}</p>
                      </>
                    ) : (
                      <p>Coach{scanResult.coach?.referential ? ` - ${scanResult.coach.referential.name}` : ''}</p>
                    )}
                    <p className="mt-1">
                      Scan effectué à {new Date(scanResult.scanTime).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`inline-flex rounded-full px-4 py-1 text-sm font-medium ${
                  scanResult.isLate 
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {scanResult.isLate ? 'En retard' : 'À l\'heure'}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={handleValidate}
                    className="inline-flex justify-center rounded-md border border-transparent bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600"
                  >
                    Valider
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}