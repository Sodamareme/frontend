import React, { useEffect, useState } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Edit2, Save, X } from 'lucide-react';

const normalizeGender = (gender) => {
  if (gender === 'Masculin') return 'MALE';
  if (gender === 'Féminin') return 'FEMALE';
  return gender || '';
};

const getGenderLabel = (gender) => {
  if (gender === 'MALE') return 'Masculin';
  if (gender === 'FEMALE') return 'Féminin';
  return gender || '';
};

const EditablePersonalInfo = ({ learner, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: learner.firstName || '',
    lastName: learner.lastName || '',
    gender: normalizeGender(learner.gender),
    email: learner.user?.email || '',
    phone: learner.phone || '',
    address: learner.address || '',
    birthDate: learner.birthDate ? new Date(learner.birthDate).toISOString().split('T')[0] : '',
    birthPlace: learner.birthPlace || ''
  });

  useEffect(() => {
    setFormData({
      firstName: learner.firstName || '',
      lastName: learner.lastName || '',
      gender: normalizeGender(learner.gender),
      phone: learner.phone || '',
      email: learner.user?.email || '',
      address: learner.address || '',
      birthDate: learner.birthDate ? new Date(learner.birthDate).toISOString().split('T')[0] : '',
      birthPlace: learner.birthPlace || ''
    });
  }, [learner]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

 const handleSave = async () => {
    try {
      // Vérifier si onSave est fourni
      if (onSave && typeof onSave === 'function') {
        await onSave(formData);
        setIsEditing(false);
      } else {
        console.error('Fonction onSave non fournie');
        // Simuler une sauvegarde pour test
        console.log('Données à sauvegarder:', formData);
        setIsEditing(false);
        alert('Fonction de sauvegarde non configurée');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
  
    }
  };

  const handleCancel = () => {
    // Réinitialiser les données du formulaire
    setFormData({
      firstName: learner.firstName || '',
      lastName: learner.lastName || '',
      gender: normalizeGender(learner.gender),
      phone: learner.phone || '',
      email: learner.user?.email || '',
      address: learner.address || '',
      birthDate: learner.birthDate ? new Date(learner.birthDate).toISOString().split('T')[0] : '',
      birthPlace: learner.birthPlace || ''
    });
    setIsEditing(false);
  };

  const InfoItem = ({ icon, label, value, field, type = 'text' }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {React.cloneElement(icon, { className: "h-4 w-4 text-teal-600" })}
        {label}
      </label>
      {isEditing ? (
        <div>
          {type === 'select' && field === 'gender' ? (
            <select 
              value={formData[field]} 
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Sélectionner le genre</option>
              <option value="MALE">Masculin</option>
              <option value="FEMALE">Féminin</option>
            </select>
          ) : field === 'email' ? (
            <input
              type="email"
              value={formData[field]}
              disabled
              className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500"
              placeholder={label}
            />
          ) : (
            <input
              type={type}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder={label}
            />
          )}
        </div>
      ) : (
        <p className="text-gray-800 bg-gray-50 px-3 py-2 rounded-md">
          {field === 'gender' ? getGenderLabel(value) || 'Non renseigné' : value || 'Non renseigné'}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl flex items-center gap-2 text-teal-800 font-semibold">
            <User className="h-5 w-5" />
            Informations Personnelles
          </h2>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Sauvegarder
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-md transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-1.5 border border-teal-300 text-teal-700 hover:bg-teal-50 text-sm font-medium rounded-md transition-colors"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Modifier
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <InfoItem 
            icon={<User />} 
            label="Prénom" 
            value={formData.firstName} 
            field="firstName"
          />
          <InfoItem 
            icon={<User />} 
            label="Nom" 
            value={formData.lastName} 
            field="lastName"
          />
          <InfoItem 
            icon={<User />} 
            label="Genre" 
            value={formData.gender} 
            field="gender"
            type="select"
          />
          <InfoItem 
            icon={<Phone />} 
            label="Téléphone" 
            value={formData.phone} 
            field="phone"
            type="tel"
          />
          <InfoItem 
            icon={<Mail />} 
            label="Email" 
            value={formData.email} 
            field="email"
            type="email"
          />
          <InfoItem 
            icon={<MapPin />} 
            label="Adresse" 
            value={formData.address} 
            field="address"
          />
          <InfoItem 
            icon={<Calendar />} 
            label="Date de naissance" 
            value={formData.birthDate ? new Date(formData.birthDate).toLocaleDateString("fr-FR") : ''} 
            field="birthDate"
            type="date"
          />
          <InfoItem 
            icon={<MapPin />} 
            label="Lieu de naissance" 
            value={formData.birthPlace} 
            field="birthPlace"
          />
        </div>
      </div>
    </div>
  );
};

export default EditablePersonalInfo;
