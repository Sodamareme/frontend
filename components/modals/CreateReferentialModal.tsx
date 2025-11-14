'use client';

import { useState, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { referentialsAPI } from '@/lib/api';
import Image from 'next/image';

interface CreateReferentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateReferentialModal({
  isOpen,
  onClose,
  onSuccess
}: CreateReferentialModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 30,
    numberOfSessions: 1,
    sessionLength: 4,
    photoUrl: ''
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const validateField = (name: string, value: any) => {
    switch (name) {
      case 'name':
        return value.length < 3 ? 'Le nom doit contenir au moins 3 caractères' : '';
      case 'description':
        return value.length > 500 ? 'La description ne doit pas dépasser 500 caractères' : '';
      case 'capacity':
        return value < 1 ? 'La capacité doit être d\'au moins 1 apprenant' : '';
      case 'sessionLength':
        return value < 1 ? 'La durée de session doit être d\'au moins 1 mois' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Le fichier doit être une image');
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const hasErrors = () => {
    return Object.keys(formData).some(key => validateField(key, formData[key as keyof typeof formData]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (hasErrors()) {
      setError('Veuillez corriger les erreurs avant de soumettre');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData object
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('capacity', formData.capacity.toString());
      formDataToSend.append('numberOfSessions', formData.numberOfSessions.toString());
      
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      
      if (formData.numberOfSessions > 1 && formData.sessionLength) {
        formDataToSend.append('sessionLength', formData.sessionLength.toString());
      }
      
      // Append the photo file if it exists
      if (photoFile) {
        formDataToSend.append('photoUrl', photoFile);
      }

      await referentialsAPI.createReferential({
        ...formData,
        photo: photoFile || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating referential:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du référentiel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Créer un nouveau référentiel
              </Dialog.Title>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo upload section */}
              <div className="flex justify-center">
                <div className="relative w-40 h-40 group">
                  {photoPreview ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={photoPreview}
                        alt="Preview"
                        fill
                        className="object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setPhotoFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Cliquez pour ajouter une photo</p>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>

              {/* Name field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom*
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                {touched.name && validateField('name', formData.name) && (
                  <p className="mt-1 text-sm text-red-600">{validateField('name', formData.name)}</p>
                )}
              </div>

              {/* Description field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                {touched.description && validateField('description', formData.description) && (
                  <p className="mt-1 text-sm text-red-600">{validateField('description', formData.description)}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Capacity field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacité*
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    required
                    min={1}
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                {/* Number of sessions field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de sessions*
                  </label>
                  <select
                    name="numberOfSessions"
                    value={formData.numberOfSessions}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value={1}>1 session</option>
                    <option value={2}>2 sessions</option>
                  </select>
                </div>
              </div>

              {formData.numberOfSessions > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée de session (mois)*
                  </label>
                  <input
                    type="number"
                    name="sessionLength"
                    required
                    min={1}
                    value={formData.sessionLength}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || hasErrors()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    'Créer'
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