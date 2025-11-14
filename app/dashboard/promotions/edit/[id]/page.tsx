'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { promotionsAPI } from '@/lib/api';

import { 
  ArrowLeft, 
  Save,
  Calendar,
  Users,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  Book,
  AlertCircle,
  Upload,
  X
} from 'lucide-react';
import { toast } from "sonner";
import Image from "next/image";

interface PromotionFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  photoUrl?: string;
  referentials: string[];
  coordinator: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function EditPromotionPage() {
  const params = useParams();
  const router = useRouter();
  const promotionId = params.id as string;
  
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    photoUrl: '',
    referentials: [],
    coordinator: {
      name: '',
      email: '',
      phone: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newReferential, setNewReferential] = useState('');

  // Charger les données de la promotion
  const fetchPromotionData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const promotionData = await promotionsAPI.getPromotionById(promotionId);
      
      // Formater les dates pour les inputs
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
      };
      
      setFormData({
        name: promotionData.name || '',
        description: promotionData.description || '',
        startDate: formatDateForInput(promotionData.startDate),
        endDate: formatDateForInput(promotionData.endDate),
        location: promotionData.location || '',
        photoUrl: promotionData.photoUrl || '',
        // FIX: S'assurer que referentials est toujours un tableau de strings
        referentials: Array.isArray(promotionData.referentials) 
          ? promotionData.referentials.map(ref => typeof ref === 'string' ? ref : ref.name || ref.label || String(ref))
          : [],
        coordinator: {
          name: promotionData.coordinator?.name || '',
          email: promotionData.coordinator?.email || '',
          phone: promotionData.coordinator?.phone || ''
        }
      });
    } catch (err) {
      console.error('Error fetching promotion data:', err);
      setError('Erreur lors du chargement des données de la promotion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (promotionId) {
      fetchPromotionData();
    }
  }, [promotionId]);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('coordinator.')) {
      const coordinatorField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        coordinator: {
          ...prev.coordinator,
          [coordinatorField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddReferential = () => {
    if (newReferential.trim() && !formData.referentials.includes(newReferential.trim())) {
      setFormData(prev => ({
        ...prev,
        referentials: [...prev.referentials, newReferential.trim()]
      }));
      setNewReferential('');
    }
  };

  const handleRemoveReferential = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referentials: prev.referentials.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Le nom de la promotion est requis');
    if (!formData.startDate) errors.push('La date de début est requise');
    if (!formData.endDate) errors.push('La date de fin est requise');
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.push('La date de fin doit être après la date de début');
    }
    if (formData.coordinator.email && !/\S+@\S+\.\S+/.test(formData.coordinator.email)) {
      errors.push('Format d\'email invalide pour le coordinateur');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error('Erreurs de validation', {
        description: errors.join(', ')
      });
      return;
    }
    
    try {
      setSaving(true);
      
      await promotionsAPI.updatePromotion(promotionId, formData);
      
      toast.success('Promotion mise à jour', {
        description: 'Les modifications ont été enregistrées avec succès'
      });
      
      router.push(`/dashboard/promotions/${promotionId}`);
    } catch (error: any) {
      console.error('Error updating promotion:', error);
      toast.error('Erreur lors de la mise à jour', {
        description: error.response?.data?.message || 'Impossible de mettre à jour la promotion'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100">
            <div className="flex items-center mb-4">
              <AlertCircle size={24} className="mr-3" />
              <h3 className="font-medium text-lg">Erreur de chargement</h3>
            </div>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => router.push('/dashboard/promotions')}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Retour aux promotions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => router.push(`/dashboard/promotions/${promotionId}`)}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 mr-4 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Retour
              </button>
              <div>
                <h1 className="text-3xl font-bold text-teal-600">Modifier la promotion</h1>
                <p className="text-gray-600 mt-1">Mettre à jour les informations de la promotion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Informations générales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la promotion *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ex: Développement Web Full Stack 2024"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de début *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Localisation
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ex: Dakar, Sénégal"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Description détaillée de la promotion..."
                />
              </div>
            </div>
          </div>

          {/* Referentials */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Book className="w-5 h-5 mr-2 text-teal-500" />
              Référentiels
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newReferential}
                  onChange={(e) => setNewReferential(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddReferential())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ajouter un référentiel"
                />
                <button
                  type="button"
                  onClick={handleAddReferential}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Ajouter
                </button>
              </div>
              
              {formData.referentials.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.referentials.map((referential, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm"
                    >
                      {/* FIX: S'assurer que referential est une string */}
                      {String(referential)}
                      <button
                        type="button"
                        onClick={() => handleRemoveReferential(index)}
                        className="ml-2 text-teal-500 hover:text-teal-700"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coordinator Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-teal-500" />
              Coordinateur
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.coordinator.name}
                  onChange={(e) => handleInputChange('coordinator.name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Nom du coordinateur"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.coordinator.email}
                  onChange={(e) => handleInputChange('coordinator.email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.coordinator.phone}
                  onChange={(e) => handleInputChange('coordinator.phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="+221 XX XXX XX XX"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/promotions/${promotionId}`)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}