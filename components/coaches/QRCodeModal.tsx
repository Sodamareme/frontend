'use client';

import { X, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Coach {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  qrCode?: string;
  photoUrl?: string;
}

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coach: Coach;
}

export default function QRCodeModal({ isOpen, onClose, coach }: QRCodeModalProps) {
  if (!isOpen || !coach.qrCode) return null;

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = coach.qrCode!;
    link.download = `qr-code-${coach.matricule}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${coach.firstName} ${coach.lastName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #333;
              padding: 30px;
              border-radius: 10px;
            }
            h1 {
              color: #333;
              margin-bottom: 10px;
            }
            .matricule {
              color: #666;
              font-size: 18px;
              margin-bottom: 20px;
            }
            img {
              max-width: 300px;
              height: auto;
              border: 2px solid #FF6B35;
              border-radius: 10px;
              padding: 10px;
              background: white;
            }
            .footer {
              margin-top: 20px;
              color: #999;
              font-size: 12px;
            }
            @media print {
              .container {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${coach.firstName} ${coach.lastName}</h1>
            <div class="matricule">Matricule: ${coach.matricule}</div>
            <img src="${coach.qrCode}" alt="QR Code" />
            <div class="footer">
              Sonatel Academy - Code de pointage
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white">QR Code de Pointage</h2>
            <p className="text-purple-100 mt-1">
              {coach.firstName} {coach.lastName}
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-8">
            <div className="text-center">
              {/* Matricule */}
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  Matricule: {coach.matricule}
                </span>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-white border-4 border-purple-500 rounded-2xl shadow-lg">
                  <img
                    src={coach.qrCode}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  Comment utiliser ce QR Code ?
                </p>
                <ol className="text-sm text-blue-700 text-left space-y-1">
                  <li>1. Présentez ce QR Code devant le scanner</li>
                  <li>2. Choisissez "Pointer" ou "Dépointer"</li>
                  <li>3. Votre présence sera automatiquement enregistrée</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button
                  onClick={downloadQRCode}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
                <Button
                  onClick={printQRCode}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Ce QR Code est personnel et ne doit pas être partagé
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}