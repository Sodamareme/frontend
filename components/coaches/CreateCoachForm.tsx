import React, { useState } from 'react';
import { coachesAPI } from '../../lib/api'; // Votre fichier API
import { getUserFriendlyErrorMessage } from '@/lib/error';

interface CoachFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  refId?: string;
}

export const CreateCoachForm = () => {
  const [formData, setFormData] = useState<CoachFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    refId: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      console.log('📸 Fichier sélectionné:', e.target.files[0].name);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('=== PRÉPARATION FORMDATA ===');
      console.log('Données du formulaire:', formData);
      console.log('Fichier photo:', photoFile);

      // Validation côté client
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        throw new Error('Tous les champs obligatoires doivent être remplis');
      }

      // Création du FormData
      const submitFormData = new FormData();
      submitFormData.append('firstName', formData.firstName.trim());
      submitFormData.append('lastName', formData.lastName.trim());
      submitFormData.append('email', formData.email.trim());
      submitFormData.append('phone', formData.phone.trim());
      
      if (formData.refId && formData.refId.trim() !== '') {
        submitFormData.append('refId', formData.refId.trim());
      }
      
      if (photoFile) {
        submitFormData.append('photoFile', photoFile);
      }

      // Vérifier le contenu du FormData
      console.log('FormData entries:');
      for (let [key, value] of submitFormData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, {
            name: value.name,
            size: value.size,
            type: value.type
          });
        } else {
          console.log(`${key}:`, value);
        }
      }

      console.log('🚀 Envoi de la requête...');
      const result = await coachesAPI.createCoach(submitFormData);
      
      console.log('✅ Coach créé avec succès:', result);
      alert('Coach créé avec succès !');
      
      // Réinitialiser le formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        refId: ''
      });
      setPhotoFile(null);
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la création:', error);
      console.error('Détails de l\'erreur:', {
        message: getUserFriendlyErrorMessage(error, 'Erreur inconnue'),
        response: error.response
      });
      
      setError(getUserFriendlyErrorMessage(error, 'Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Créer un nouveau coach</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="John"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="john.doe@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="+221771234567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            ID Référentiel (optionnel)
          </label>
          <input
            type="text"
            name="refId"
            value={formData.refId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="UUID du référentiel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Photo (optionnel)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border rounded-md"
          />
          {photoFile && (
            <p className="text-sm text-gray-600 mt-1">
              Fichier sélectionné: {photoFile.name} ({(photoFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Création en cours...' : 'Créer le coach'}
        </button>
      </form>
    </div>
  );
};
