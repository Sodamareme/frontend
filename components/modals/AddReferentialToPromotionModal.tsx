'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Loader2, X } from 'lucide-react';
import { promotionsAPI, Referential, referentialsAPI } from '@/lib/api';

interface AddReferentialToPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionId: string;
  onSuccess: () => void;
}

export default function AddReferentialToPromotionModal({
  isOpen,
  onClose,
  promotionId,
  onSuccess
}: AddReferentialToPromotionModalProps) {
  const [selectedReferentials, setSelectedReferentials] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableReferentials, setAvailableReferentials] = useState<Referential[]>([]);
  const [currentPromotionReferentials, setCurrentPromotionReferentials] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all available referentials
        const allReferentials = await referentialsAPI.getAllReferentials();
        
        // Get current promotion details to know which referentials are already added
        const promotionDetails = await promotionsAPI.getPromotionById(promotionId);
        const existingRefIds = promotionDetails.referentials.map(ref => ref.id);
        setCurrentPromotionReferentials(existingRefIds);
        
        // Filter out referentials that are already in the promotion
        const availableRefs = allReferentials.filter(ref => !existingRefIds.includes(ref.id));
        setAvailableReferentials(availableRefs);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erreur lors du chargement des données');
      }
    };

    if (isOpen && promotionId) {
      fetchData();
    }
  }, [isOpen, promotionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!promotionId) {
        throw new Error('ID de promotion manquant');
      }

      if (selectedReferentials.length === 0) {
        throw new Error('Veuillez sélectionner au moins un référentiel');
      }

      await referentialsAPI.addReferentialsToPromotion(promotionId, selectedReferentials);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout des référentiels');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                Ajouter des référentiels à la promotion
              </Dialog.Title>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionnez les référentiels à ajouter
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableReferentials.map((ref) => (
                    <label key={ref.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedReferentials.includes(ref.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReferentials(prev => [...prev, ref.id]);
                          } else {
                            setSelectedReferentials(prev => prev.filter(id => id !== ref.id));
                          }
                        }}
                        className="h-4 w-4 text-teal-600 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-900">{ref.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedReferentials.length === 0}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    'Ajouter'
                  )}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}