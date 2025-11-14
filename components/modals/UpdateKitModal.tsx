'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Loader2 } from 'lucide-react';
import { learnersAPI } from '@/lib/api';

interface UpdateKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  learnerId: string | null;
  onSuccess: () => void;
}

export default function UpdateKitModal({
  isOpen,
  onClose,
  learnerId,
  onSuccess
}: UpdateKitModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kitData, setKitData] = useState({
    laptop: false,
    charger: false,
    bag: false,
    polo: false
  });

  // Fetch current kit status when modal opens
  useEffect(() => {
    const fetchLearnerKit = async () => {
      if (learnerId && isOpen) {
        try {
          const learner = await learnersAPI.getLearnerById(learnerId);
          if (learner.kit) {
            setKitData({
              laptop: learner.kit.laptop || false,
              charger: learner.kit.charger || false,
              bag: learner.kit.bag || false,
              polo: learner.kit.polo || false
            });
          }
        } catch (err) {
          console.error('Error fetching learner kit:', err);
          setError('Erreur lors du chargement des données du kit');
        }
      }
    };

    fetchLearnerKit();
  }, [learnerId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerId) return;

    setLoading(true);
    setError('');

    try {
      await learnersAPI.updateLearnerKit(learnerId, kitData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du kit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Mise à jour du kit
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.entries({
                laptop: 'Laptop',
                charger: 'Chargeur',
                bag: 'Sac',
                polo: 'Polo'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={kitData[key as keyof typeof kitData]}
                      onChange={(e) => setKitData(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              ))}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Mettre à jour'
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