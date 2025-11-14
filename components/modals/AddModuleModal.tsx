import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Upload } from 'lucide-react';
import { modulesAPI, referentialsAPI } from '@/lib/api';

// Add interface for Coach
interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

interface AddModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  refId: string;
  onSuccess: () => void;
}

export default function AddModuleModal({ isOpen, onClose, refId, onSuccess }: AddModuleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    coachId: '',
    photoFile: null as File | null,
  });

  // Fetch coaches when modal opens
  useEffect(() => {
    const fetchCoaches = async () => {
      if (isOpen && refId) {
        try {
          const referential = await referentialsAPI.getReferentialById(refId);
          if (referential.coaches) {
            setCoaches(referential.coaches);
          }
        } catch (err) {
          console.error('Error fetching coaches:', err);
          setError('Erreur lors du chargement des coachs');
        }
      }
    };

    fetchCoaches();
  }, [isOpen, refId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('description', formData.description);
      form.append('startDate', formData.startDate);
      form.append('endDate', formData.endDate);
      form.append('coachId', formData.coachId);
      form.append('refId', refId);
      if (formData.photoFile) {
        form.append('photoFile', formData.photoFile);
      }

      await modulesAPI.createModule(form);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white shadow-lg">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Ajouter un nouveau module
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Module Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du module
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Coach Select - Add this before the Photo Upload section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coach responsable
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={formData.coachId}
                  onChange={(e) => setFormData(prev => ({ ...prev, coachId: e.target.value }))}
                >
                  <option value="">Sélectionner un coach</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.firstName} {coach.lastName}
                    </option>
                  ))}
                </select>
                {coaches.length === 0 && (
                  <p className="mt-1 text-sm text-orange-500">
                    Aucun coach n'est assigné à ce référentiel
                  </p>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo du module
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-orange-500 hover:text-orange-400">
                        <span>Télécharger une photo</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData(prev => ({ ...prev, photoFile: file }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">
                {error}
              </div>
            )}

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
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? 'Création en cours...' : 'Créer le module'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}