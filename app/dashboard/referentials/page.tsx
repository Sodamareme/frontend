'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { referentialsAPI, promotionsAPI, Referential } from '@/lib/api';
import { Plus, Search, Book, Users, GraduationCap, Briefcase, Filter, Edit3, Save, X, Trash2 } from 'lucide-react';
import ReferentialCard from '@/components/dashboard/ReferentialCard';
import AddReferentialToPromotionModal from '@/components/modals/AddReferentialToPromotionModal';
import { toast } from "sonner";

interface EditingReferential {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function ReferentialsPage() {
  const [referentials, setReferentials] = useState<Referential[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activePromotionId, setActivePromotionId] = useState<string>('');
  const [editingReferential, setEditingReferential] = useState<EditingReferential | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [removingReferential, setRemovingReferential] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get the active promotion
      const promotions = await promotionsAPI.getAllPromotions();
      const activePromotion = promotions.find(p => p.status === 'ACTIVE');
      
      if (!activePromotion) {
        setError('Aucune promotion active trouvée');
        return;
      }

      setActivePromotionId(activePromotion.id);

      // Get detailed data for each referential in the active promotion
      const referentialPromises = activePromotion.referentials.map(async (ref) => {
        try {
          // Fetch complete referential data including learners and modules
          const detailedRef = await referentialsAPI.getReferentialById(ref.id);
          return {
            ...detailedRef,
            learners: detailedRef.learners?.filter(learner => 
              learner.promotionId === activePromotion.id
            ),
            modules: detailedRef.modules || []
          };
        } catch (error) {
          console.error(`Error fetching details for referential ${ref.id}:`, error);
          return ref; // Fallback to basic referential data if fetch fails
        }
      });

      // Wait for all referential data to be fetched
      const detailedReferentials = await Promise.all(referentialPromises);
      
      if (detailedReferentials.length > 0) {
        setReferentials(detailedReferentials);
      } else {
        setError('Aucun référentiel trouvé pour la promotion active');
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Une erreur est survenue lors du chargement des référentiels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartEdit = (referential: Referential) => {
    setEditingReferential({
      id: referential.id,
      name: referential.name,
      description: referential.description || '',
      category: referential.category || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingReferential(null);
  };

  const handleInputChange = (field: keyof EditingReferential, value: string) => {
    if (!editingReferential) return;
    
    setEditingReferential(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingReferential) return;

    // Validation
    if (!editingReferential.name.trim()) {
      toast.error('Le nom du référentiel est requis');
      return;
    }

    try {
      setIsSaving(true);

      const updateData = {
        name: editingReferential.name.trim(),
        description: editingReferential.description.trim(),
        category: editingReferential.category.trim() || undefined
      };

      const updatedReferential = await referentialsAPI.updateReferential(editingReferential.id, updateData);
      
      // Update the referentials list
      setReferentials(prev => 
        prev.map(ref => 
          ref.id === editingReferential.id 
            ? { ...ref, ...updatedReferential }
            : ref
        )
      );

      setEditingReferential(null);
      toast.success('Référentiel mis à jour avec succès');

    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du référentiel:', err);
      if (err.response?.data?.message) {
        toast.error(`Erreur: ${err.response.data.message}`);
      } else {
        toast.error('Erreur lors de la mise à jour du référentiel');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveReferential = async (referentialId: string, referentialName: string) => {
    // Confirmation avant suppression
    if (!confirm(`Êtes-vous sûr de vouloir retirer le référentiel "${referentialName}" de cette promotion ?`)) {
      return;
    }

    try {
      setRemovingReferential(referentialId);

      // Appel API pour retirer le référentiel de la promotion
      await promotionsAPI.removeReferentialFromPromotion(activePromotionId, referentialId);
      
      // Mettre à jour la liste locale
      setReferentials(prev => prev.filter(ref => ref.id !== referentialId));
      
      toast.success(`Référentiel "${referentialName}" retiré de la promotion`);

    } catch (err: any) {
      console.error('Erreur lors de la suppression du référentiel:', err);
      if (err.response?.data?.message) {
        toast.error(`Erreur: ${err.response.data.message}`);
      } else {
        toast.error('Erreur lors de la suppression du référentiel');
      }
    } finally {
      setRemovingReferential(null);
    }
  };

  // Update the filtering logic to work with the full referential objects
  const filteredReferentials = referentials.filter(referential => {
    const matchesSearch = searchQuery === '' || 
      referential.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referential.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || referential.category === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-teal-600">Référentiels</h1>
          <p className="text-gray-600">Gérer les référentiels de la promotion</p>
        </div>
      </div>

      {/* Search and Buttons */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un référentiel..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Link 
              href="/dashboard/referentials/all" 
              className="inline-flex items-center px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-400 transition-colors shadow-sm whitespace-nowrap"
            >
              <Book size={18} className="mr-2" />
              Tous les référentiels
            </Link>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus size={18} className="mr-2" />
              Ajouter à la promotion
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 h-40 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      ) : filteredReferentials.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Book size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun référentiel trouvé</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? 'Aucun référentiel ne correspond à votre recherche'
              : 'Aucun référentiel n\'est associé à la promotion active'}
          </p>
          <Link 
            href="/dashboard/referentials/new" 
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Ajouter un référentiel
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredReferentials.map(referential => (
            <div key={referential.id} className="relative group bg-white h-80">
              {editingReferential?.id === referential.id ? (
                // Mode édition
                <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-4 h-fit">
                  <div className="space-y-3">
                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du référentiel
                      </label>
                      <input
                        type="text"
                        value={editingReferential.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        placeholder="Nom du référentiel"
                        maxLength={255}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editingReferential.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
                        rows={3}
                        placeholder="Description du référentiel"
                        maxLength={1000}
                      />
                    </div>

                    {/* Catégorie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie
                      </label>
                      <input
                        type="text"
                        value={editingReferential.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        placeholder="Catégorie (optionnel)"
                        maxLength={100}
                      />
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Mode affichage normal
                <>
                  <ReferentialCard referential={referential} />
                  
                  {/* Boutons d'action */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Bouton d'édition */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStartEdit(referential);
                      }}
                      className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 z-10"
                      title="Modifier ce référentiel"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    {/* Bouton de suppression */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveReferential(referential.id, referential.name);
                      }}
                      disabled={removingReferential === referential.id}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Retirer de la promotion"
                    >
                      {removingReferential === referential.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddReferentialToPromotionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        promotionId={activePromotionId}
        onSuccess={() => {
          // Refresh data after adding referentials
          fetchData();
        }}
      />
    </div>
  );
}