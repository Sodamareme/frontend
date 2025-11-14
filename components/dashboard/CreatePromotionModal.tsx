import { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { referentialsAPI } from '@/lib/api';
import { FormError } from "@/components/ui/form-error";
import { cn } from '@/lib/utils';

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (promotionData: any) => Promise<void>;
}

interface FieldErrors {
  name?: string;
  startDate?: string;
  endDate?: string;
  referentials?: string;
  photo?: string;
}

const validateForm = (
  formData: { name: string; startDate: string; endDate: string },
  selectedReferentials: any[],
  photoFile: File | null
): { isValid: boolean; error: string } => {
  if (!formData.name.trim()) {
    return { isValid: false, error: 'Le nom de la promotion est requis' };
  }

  if (!formData.startDate) {
    return { isValid: false, error: 'La date de début est requise' };
  }

  if (!formData.endDate) {
    return { isValid: false, error: 'La date de fin est requise' };
  }

  const nameRegex = /^[a-zA-Z0-9\s-]{3,50}$/;
  if (!nameRegex.test(formData.name.trim())) {
    return { 
      isValid: false, 
      error: 'Le nom de la promotion doit contenir entre 3 et 50 caractères et ne peut contenir que des lettres, chiffres, espaces et tirets' 
    };
  }

  const startDate = new Date(formData.startDate);
  const endDate = new Date(formData.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    return { 
      isValid: false, 
      error: 'La date de début ne peut pas être dans le passé' 
    };
  }

  if (endDate <= startDate) {
    return { 
      isValid: false, 
      error: 'La date de fin doit être postérieure à la date de début' 
    };
  }

  const minDuration = new Date(startDate);
  minDuration.setMonth(minDuration.getMonth() + 1);
  if (endDate < minDuration) {
    return { 
      isValid: false, 
      error: 'La durée minimale d\'une promotion est d\'un mois' 
    };
  }

  const maxDuration = new Date(startDate);
  maxDuration.setFullYear(maxDuration.getFullYear() + 2);
  if (endDate > maxDuration) {
    return { 
      isValid: false, 
      error: 'La durée maximale d\'une promotion est de 2 ans' 
    };
  }

  if (selectedReferentials.length === 0) {
    return { 
      isValid: false, 
      error: 'Sélectionnez au moins un référentiel' 
    };
  }

  if (selectedReferentials.length > 5) {
    return { 
      isValid: false, 
      error: 'Une promotion ne peut pas avoir plus de 5 référentiels' 
    };
  }

  if (photoFile) {
    const maxSize = 2 * 1024 * 1024; 
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(photoFile.type)) {
      return { 
        isValid: false, 
        error: 'Le format de l\'image doit être JPG ou PNG' 
      };
    }

    if (photoFile.size > maxSize) {
      return { 
        isValid: false, 
        error: 'L\'image ne doit pas dépasser 2MB' 
      };
    }
  }

  return { isValid: true, error: '' };
};

export default function CreatePromotionModal({ isOpen, onClose, onSubmit }: CreatePromotionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });
  
  const [referentials, setReferentials] = useState([]);
  const [selectedReferentials, setSelectedReferentials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const fetchReferentials = async () => {
      try {
        setIsLoading(true);
        const data = await referentialsAPI.getAllReferentials();
        setReferentials(data);
      } catch (err) {
        setError('Erreur lors du chargement des référentiels');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchReferentials();
    }
  }, [isOpen]);

  const filteredReferentials = referentials.filter(ref => 
    ref.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedReferentials.find(selected => selected.id === ref.id)
  );

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Le fichier doit être une image');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 2MB');
        return;
      }

      setPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      setError('');
    }
  };

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    
    const validation = validateForm(formData, selectedReferentials, photoFile);
    if (!validation.isValid) {
      if (validation.error.includes('nom')) {
        setFieldErrors(prev => ({ ...prev, name: validation.error }));
      }
      if (validation.error.includes('début')) {
        setFieldErrors(prev => ({ ...prev, startDate: validation.error }));
      }
      if (validation.error.includes('fin')) {
        setFieldErrors(prev => ({ ...prev, endDate: validation.error }));
      }
      if (validation.error.includes('référentiel')) {
        setFieldErrors(prev => ({ ...prev, referentials: validation.error }));
      }
      if (validation.error.includes('image')) {
        setFieldErrors(prev => ({ ...prev, photo: validation.error }));
      }
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      
      const referentialIds = selectedReferentials.map(ref => ref.id);
      formDataToSend.append('referentialIds', referentialIds.join(','));
      
      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }

      await onSubmit(formDataToSend);
      onClose();
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('Erreur lors de la création de la promotion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Créer une nouvelle promotion
          </DialogTitle>
          <DialogDescription id="dialog-description" className="text-gray-500">
            Remplissez les informations ci-dessous pour créer une nouvelle promotion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de la promotion
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Promotion 2025"
                className={cn("mt-1", fieldErrors.name && "border-red-500 focus-visible:ring-red-500")}
              />
              <FormError message={fieldErrors.name} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date de début
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className={cn("mt-1", fieldErrors.startDate && "border-red-500 focus-visible:ring-red-500")}
                />
                <FormError message={fieldErrors.startDate} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date de fin
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className={cn("mt-1", fieldErrors.endDate && "border-red-500 focus-visible:ring-red-500")}
                />
                <FormError message={fieldErrors.endDate} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Photo de la promotion
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {photoPreview ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setPhotoFile(null);
                        }}
                        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <label className="cursor-pointer text-center p-2">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePhotoChange}
                        />
                        <div className="text-gray-500">
                          <span className="block text-sm font-medium text-orange-600">
                            Ajouter
                          </span>
                          <span className="text-xs">ou glisser</span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Format JPG, PNG. Taille max 2MB
                </div>
              </div>
              <FormError message={fieldErrors.photo} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Référentiels
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Rechercher un référentiel..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedReferentials.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedReferentials.map(ref => (
                    <span
                      key={ref.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                    >
                      {ref.name}
                      <button
                        type="button"
                        onClick={() => setSelectedReferentials(selected => 
                          selected.filter(r => r.id !== ref.id)
                        )}
                        className="ml-2 inline-flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {searchQuery && filteredReferentials.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                  <ul className="py-1">
                    {filteredReferentials.map(ref => (
                      <li
                        key={ref.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedReferentials(prev => [...prev, ref]);
                          setSearchQuery('');
                        }}
                      >
                        {ref.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <FormError message={fieldErrors.referentials} />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer la promotion'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}