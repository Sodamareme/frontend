"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { learnersAPI } from '@/lib/api';
import { ArrowLeft, Download, Share } from 'lucide-react';

export default function QRCodePage() {
  const [learner, setLearner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchLearnerData = async () => {
      // In a real app, we would get the actual learner ID from session/auth
      // For this demo, we'll use a placeholder and simulate API call
      const learnerId = 'sample-learner-id';
      
      try {
        // Fetch learner details including QR code
        const learnerData = await learnersAPI.getLearnerById(learnerId);
        setLearner(learnerData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching learner details:', err);
        setError('Failed to load your QR code. Please try again later.');
        setLoading(false);
      }
    };

    fetchLearnerData();
  }, []);

  const handleDownload = () => {
    // In a real app, this would download the QR code as an image
    alert('Fonctionnalité téléchargement à implémenter');
  };

  const handleShare = () => {
    // In a real app, this would share the QR code via the Web Share API
    if (navigator.share) {
      navigator.share({
        title: 'Mon QR Code ODC Inside',
        text: 'Voici mon QR Code pour ODC Inside',
        url: window.location.href,
      })
      .catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      alert('Le partage n\'est pas supporté par votre navigateur');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-700 hover:text-orange-500"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour
        </button>
        <div className="text-lg font-semibold">Mon QR Code</div>
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {loading ? (
          <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center max-w-md">
            <div className="text-lg font-semibold mb-2">Erreur</div>
            <p>{error}</p>
            <button 
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retourner au tableau de bord
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {learner?.firstName} {learner?.lastName}
              </h1>
              <p className="text-gray-600">
                {learner?.referential?.name || 'Référentiel non assigné'}
              </p>
            </div>
            
            <div className="bg-white p-6 border-4 border-orange-500 rounded-xl shadow-lg mb-8">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${learner?.qrCode || 'placeholder'}`} 
                alt="QR Code personnel" 
                className="w-64 h-64 md:w-80 md:h-80"
              />
            </div>
            
            <div className="text-center mb-8">
              <p className="text-sm text-gray-500 mb-1">Code ID:</p>
              <p className="text-lg font-mono font-semibold text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
                {learner?.qrCode || 'CODE-PLACEHOLDER'}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button 
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="mr-2 h-5 w-5" />
                Télécharger
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Share className="mr-2 h-5 w-5" />
                Partager
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t text-center text-sm text-gray-500">
        Présentez ce QR code au vigil pour enregistrer votre présence ou au restaurateur pour les repas
      </div>
    </div>
  );
} 