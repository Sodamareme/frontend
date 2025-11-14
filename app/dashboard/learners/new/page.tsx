'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { learnersAPI, promotionsAPI, referentialsAPI, Promotion, Referential } from '@/lib/api';
import { ChevronLeft } from 'lucide-react';

export default function NewLearnerPage() {
  const router = useRouter();
  const [referentials, setReferentials] = useState<Referential[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    address: '',
    phone: '',
    status: 'ACTIVE',
    refId: '',
    promotionId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch referentials and promotions in parallel
        const [referentialsData, promotionsData] = await Promise.all([
          referentialsAPI.getAllReferentials(),
          promotionsAPI.getAllPromotions()
        ]);
        
        setReferentials(referentialsData);
        setPromotions(promotionsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Prepare the learner data
      const learnerData = {
        ...formData,
        // Generate placeholder values for the demo
        userId: formData.email, // In a real app, this would be set by the backend
        qrCode: `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      };
      
      // In a real app, this would call the API to create a new learner
      // For the demo, we'll simulate an API call with a timeout
      // const response = await learnersAPI.createLearner(learnerData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to learners list
      router.push('/dashboard/learners');
    } catch (err: any) {
      console.error('Error creating learner:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création de l\'apprenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Back button */}
      <Link 
        href="/dashboard/learners" 
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft size={16} className="mr-1" />
        Retour à la liste
      </Link>
      
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ajouter un nouvel apprenant</h1>
        <p className="text-gray-600">Saisissez les informations du nouvel apprenant</p>
      </div>
      
      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations personnelles</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Genre <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="MALE">Homme</option>
                    <option value="FEMALE">Femme</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu de naissance
                  </label>
                  <input
                    type="text"
                    id="birthPlace"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Contact and Academic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact et informations académiques</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                    <option value="WAITING">Liste d'attente</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="refId" className="block text-sm font-medium text-gray-700 mb-1">
                    Référentiel
                  </label>
                  <select
                    id="refId"
                    name="refId"
                    value={formData.refId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Sélectionner un référentiel</option>
                    {referentials.map(ref => (
                      <option key={ref.id} value={ref.id}>
                        {ref.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="promotionId" className="block text-sm font-medium text-gray-700 mb-1">
                    Promotion
                  </label>
                  <select
                    id="promotionId"
                    name="promotionId"
                    value={formData.promotionId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Sélectionner une promotion</option>
                    {promotions.map(promo => (
                      <option key={promo.id} value={promo.id}>
                        {promo.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Link
              href="/dashboard/learners"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 mr-2 hover:bg-gray-50"
            >
              Annuler
            </Link>
            
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-70"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 