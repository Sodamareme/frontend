'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { promotionsAPI } from '@/lib/api';

import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Clock, 
  PowerIcon,
  Edit,
  Trash2,
  Book,
  MapPin,
  Phone,
  Mail,
  User,
  UserCheck,
  GraduationCap,
  Building,
  AlertCircle
} from 'lucide-react';
import { toast } from "sonner";
import Image from "next/image";

interface Promotion {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  startDate: string;
  endDate: string;
  photoUrl?: string;
  learnerCount: number;
  referentials?: string[];
  description?: string;
  location?: string;
  coordinator?: {
    name: string;
    email: string;
    phone?: string;
  };
  stats?: {
    completedProjects: number;
    averageGrade: number;
    attendanceRate: number;
  };
}

export default function PromotionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const promotionId = params.id as string;
  
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchPromotionDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const promotionData = await promotionsAPI.getPromotionById(promotionId);
      setPromotion(promotionData);
    } catch (err) {
      console.error('Error fetching promotion details:', err);
      setError('Une erreur est survenue lors du chargement des détails de la promotion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (promotionId) {
      fetchPromotionDetails();
    }
  }, [promotionId]);

  const handleStatusToggle = async () => {
    if (!promotion) return;
    
    try {
      setIsUpdating(true);
      const newStatus = promotion.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const statusText = newStatus === 'ACTIVE' ? 'activée' : 'désactivée';
      
      await promotionsAPI.updatePromotionStatus(promotion.id, newStatus);
      
      toast.success(`Promotion ${statusText}`, {
        description: `La promotion a été ${statusText} avec succès`,
      });
      
      setPromotion(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour", {
        description: error.response?.data?.message || "Impossible de modifier le statut de la promotion",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = () => {
    // Navigation vers la page d'édition
    router.push(`/dashboard/promotions/edit/${promotionId}`);
  };

  const handleDelete = async () => {
    if (!promotion) return;
    
    try {
      await promotionsAPI.deletePromotion(promotion.id);
      
      toast.success("Promotion supprimée", {
        description: "La promotion a été supprimée avec succès",
      });
      
      router.push('/dashboard/promotions');
    } catch (error: any) {
      toast.error("Erreur lors de la suppression", {
        description: error.response?.data?.message || "Impossible de supprimer la promotion",
      });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleViewLearners = () => {
    router.push(`/dashboard/promotions/${promotionId}/learners`);
  };

  const handleViewProjects = () => {
    router.push(`/dashboard/promotions/${promotionId}/projects`);
  };

  const handleViewSchedule = () => {
    router.push(`/dashboard/promotions/${promotionId}/schedule`);
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-red-100 text-red-700 border-red-200';
  };

  const getStatusLabel = (status: string) => {
    return status === 'ACTIVE' ? 'Active' : 'Inactive';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    
    if (months > 0) {
      return `${months} mois${days > 0 ? ` et ${days} jours` : ''}`;
    }
    return `${days} jours`;
  };

  const getPromotionYear = (date: string) => {
    return new Date(date).getFullYear().toString();
  };

  // Modal de confirmation de suppression
  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertCircle className="text-red-500 mr-3" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer la promotion "{promotion?.name}" ? 
          Cette action est irréversible et supprimera toutes les données associées.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 bg-gray-200 rounded mr-4"></div>
              <div className="h-8 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          
          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 shadow-sm">
            <div className="flex items-center mb-4">
              <AlertCircle size={24} className="mr-3" />
              <h3 className="font-medium text-lg">Erreur de chargement</h3>
            </div>
            <p className="mb-4">{error || 'Promotion non trouvée'}</p>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/dashboard/promotions')}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 mr-4 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Retour
              </button>
              <div>
                <h1 className="text-3xl font-bold text-teal-600">{promotion.name}</h1>
                <p className="text-gray-600 mt-1">Détails de la promotion</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(promotion.status)}`}>
                {getStatusLabel(promotion.status)}
              </span>
              
              <button
                onClick={handleStatusToggle}
                disabled={isUpdating}
                className={`p-2.5 rounded-full transition-colors duration-200 ${
                  promotion.status === 'ACTIVE' 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={promotion.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
              >
                <PowerIcon size={18} />
              </button>
              
              <button 
                onClick={handleEdit}
                className="p-2.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title="Modifier"
              >
                <Edit size={18} />
              </button>
              
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="p-2.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mr-4 relative overflow-hidden">
                  {promotion.photoUrl ? (
                    <Image 
                      src={promotion.photoUrl} 
                      alt={promotion.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-orange-600 font-bold text-lg">
                      {getPromotionYear(promotion.startDate)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">{promotion.name}</h2>
                  <p className="text-gray-600 mt-1">Promotion {getPromotionYear(promotion.startDate)}</p>
                </div>
              </div>

              {promotion.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{promotion.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Date de début</p>
                    <p className="text-sm text-gray-600">{formatDate(promotion.startDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Date de fin</p>
                    <p className="text-sm text-gray-600">{formatDate(promotion.endDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Durée</p>
                    <p className="text-sm text-gray-600">{calculateDuration(promotion.startDate, promotion.endDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Apprenants</p>
                    <p className="text-sm text-gray-600">{promotion.learnerCount} inscrits</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Referentials */}
            {promotion.referentials && Array.isArray(promotion.referentials) && promotion.referentials.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Book className="w-5 h-5 text-orange-500 mr-2" />
                  Référentiels
                </h3>
                <div className="flex flex-wrap gap-2">
                  {promotion.referentials.map((referential, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                    >
                      {typeof referential === 'string' ? referential : (referential?.name || referential?.label || 'Référentiel')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Statistics */}
            {promotion.stats && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Statistiques</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{promotion.stats.completedProjects}</div>
                    <div className="text-sm text-blue-700">Projets terminés</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{promotion.stats.averageGrade}/20</div>
                    <div className="text-sm text-green-700">Note moyenne</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{promotion.stats.attendanceRate}%</div>
                    <div className="text-sm text-purple-700">Taux de présence</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {/* <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleViewLearners}
                  className="w-full flex items-center justify-start px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <Users className="w-4 h-4 mr-3" />
                  Voir les apprenants
                </button>
                <button 
                  onClick={handleViewProjects}
                  className="w-full flex items-center justify-start px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <GraduationCap className="w-4 h-4 mr-3" />
                  Voir les projets
                </button>
                <button 
                  onClick={handleViewSchedule}
                  className="w-full flex items-center justify-start px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-3" />
                  Planning
                </button>
              </div>
            </div> */}

            {/* Coordinator Info */}
            {promotion.coordinator && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <UserCheck className="w-5 h-5 text-orange-500 mr-2" />
                  Coordinateur
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-700">{promotion.coordinator.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                    <a 
                      href={`mailto:${promotion.coordinator.email}`} 
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {promotion.coordinator.email}
                    </a>
                  </div>
                  {promotion.coordinator.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-3" />
                      <a 
                        href={`tel:${promotion.coordinator.phone}`} 
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {promotion.coordinator.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {promotion.location && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Building className="w-5 h-5 text-orange-500 mr-2" />
                  Localisation
                </h3>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{promotion.location}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && <DeleteConfirmationModal />}
      </div>
    </div>
  );
}