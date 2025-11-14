import { useState, useEffect, useRef } from 'react';
import { X, Camera, CheckCircle, XCircle, Clock, User, LogIn, LogOut } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (qrData: string) => Promise<void>;
}

interface ScanResult {
  name: string;
  time: string;
  action: 'checkin' | 'checkout';
  status: 'success' | 'error';
  isLate?: boolean;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (isOpen && !scanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (!processingRef.current) {
            handleScan(decodedText);
          }
        },
        (errorMessage) => {
          // Ignorer les erreurs de scan normales
        }
      );

      setScanning(true);
      setError('');
    } catch (err: any) {
      console.error('Erreur démarrage scanner:', err);
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setScanning(false);
        processingRef.current = false;
      } catch (err) {
        console.error('Erreur arrêt scanner:', err);
      }
    }
  };

  const handleScan = async (qrData: string) => {
    if (processingRef.current) return;
    
    try {
      processingRef.current = true;
      setProcessing(true);
      
      // Parse QR data pour affichage préliminaire
      const data = JSON.parse(qrData);
      
      // Arrêter temporairement le scanner
      await stopScanner();

      // Traiter le scan via l'API
      await onScan(qrData);

      // Afficher le résultat (vous pouvez aussi récupérer le résultat de l'API)
      setLastScan({
        name: `${data.firstName} ${data.lastName}`,
        time: new Date().toLocaleTimeString('fr-FR'),
        action: 'checkin', // Sera mis à jour par le toast
        status: 'success',
      });

      // Redémarrer le scanner après 3 secondes
      setTimeout(() => {
        if (isOpen) {
          processingRef.current = false;
          setProcessing(false);
          startScanner();
        }
      }, 3000);
    } catch (err) {
      console.error('Erreur traitement QR:', err);
      setLastScan({
        name: 'QR Code invalide',
        time: new Date().toLocaleTimeString('fr-FR'),
        action: 'checkin',
        status: 'error',
      });
      setTimeout(() => {
        if (isOpen) {
          processingRef.current = false;
          setProcessing(false);
          startScanner();
        }
      }, 3000);
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
         {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera className="w-6 h-6 text-white" />
                <h3 className="text-lg font-bold text-white">
                  Scanner QR Code Coach
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scanner */}
          <div className="p-6">
            <div className="relative">
              <div
                id="qr-reader"
                className="rounded-lg overflow-hidden border-4 border-purple-500"
                style={{ minHeight: '250px' }}
              />
              
              {/* Processing Overlay */}
              {processing && (
                <div className="absolute inset-0 flex items-center justify-center bg-purple-900 bg-opacity-75 rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-white font-medium">Traitement en cours...</p>
                  </div>
                </div>
              )}

              {/* Error Overlay */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
                  <div className="text-center p-4">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Camera className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Comment scanner ?
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Placez le QR Code du coach devant la caméra</li>
                    <li>• Le scan se fera automatiquement</li>
                    <li>• Premier scan = Pointage d'entrée ✅</li>
                    <li>• Deuxième scan = Pointage de sortie 👋</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Last Scan Result */}
            {lastScan && (
              <div
                className={`mt-4 p-4 rounded-lg border-2 ${
                  lastScan.status === 'success'
                    ? lastScan.action === 'checkin'
                      ? lastScan.isLate
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-green-50 border-green-300'
                      : 'bg-blue-50 border-blue-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {lastScan.status === 'success' ? (
                    lastScan.action === 'checkin' ? (
                      <div className={`p-2 rounded-lg ${
                        lastScan.isLate ? 'bg-orange-200' : 'bg-green-200'
                      }`}>
                        <LogIn className={`w-6 h-6 ${
                          lastScan.isLate ? 'text-orange-700' : 'text-green-700'
                        }`} />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-blue-200">
                        <LogOut className="w-6 h-6 text-blue-700" />
                      </div>
                    )
                  ) : (
                    <div className="p-2 rounded-lg bg-red-200">
                      <XCircle className="w-6 h-6 text-red-700" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className={`font-bold ${
                          lastScan.status === 'success'
                            ? lastScan.action === 'checkin'
                              ? lastScan.isLate
                                ? 'text-orange-900'
                                : 'text-green-900'
                              : 'text-blue-900'
                            : 'text-red-900'
                        }`}
                      >
                        {lastScan.name}
                      </p>
                      {lastScan.status === 'success' && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          lastScan.action === 'checkin'
                            ? lastScan.isLate
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-green-200 text-green-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}>
                          {lastScan.action === 'checkin' 
                            ? lastScan.isLate ? 'RETARD' : 'ENTRÉE'
                            : 'SORTIE'
                          }
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <p className="text-xs text-gray-600">{lastScan.time}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scanning Status */}
            {scanning && !processing && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-purple-600">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium">Scanner actif - En attente de QR Code...</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}