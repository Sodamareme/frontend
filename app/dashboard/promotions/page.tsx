'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { promotionsAPI } from '@/lib/api';
import { Plus, Search, Calendar, Users, Clock, Check, Bookmark, ChevronLeft, ChevronRight, MoreVertical, Filter, PowerIcon, Folder, Book } from 'lucide-react';
import { toast } from "sonner";
import EnhancedPromotionCard from '@/components/dashboard/EnhancedPromotionCard';
import CreatePromotionModal from '@/components/dashboard/CreatePromotionModal';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [classFilter, setClassFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('grid'); // 'grid' ou 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Liste des référentiels possibles
  const referentials = [
    { id: 'DEV_WEB', label: 'DEV WEB/MOBILE', color: 'bg-green-100 text-green-700' },
    { id: 'REF_DIG', label: 'REF DIG', color: 'bg-blue-100 text-blue-700' },
    { id: 'DEV_DATA', label: 'DEV DATA', color: 'bg-purple-100 text-purple-700' },
    { id: 'AWS', label: 'AWS', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'HACKEUSE', label: 'HACKEUSE', color: 'bg-pink-100 text-pink-700' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const promotionsData = await promotionsAPI.getAllPromotions();
      setPromotions(promotionsData); // No more mock data enhancement
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError('Une erreur est survenue lors du chargement des promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update the calculateStats function
  const calculateStats = (promotions) => {
    const activePromotion = promotions.find(p => p.status === 'ACTIVE');
    
    return {
      totalLearners: activePromotion?.learnerCount || 0,
      activePromotions: promotions.filter(p => p.status === 'ACTIVE').length,
      uniqueReferentialsCount: activePromotion?.referentials?.length || 0,
      totalPromotions: promotions.length
    };
  };

  // Filtrage des promotions selon les critères de recherche
  const filteredPromotions = promotions
    .filter(promotion => {
      return searchQuery === '' || 
        promotion.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .filter(promotion => {
      return statusFilter === null || promotion.status === statusFilter;
    })
    .filter(promotion => {
      return classFilter === null || 
        (promotion.referentials && promotion.referentials.includes(classFilter));
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPromotions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);

  // Options de statut pour le filtre
  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'inactive' },
   
  ];

  async function handleStatusToggle(promotionId: string, currentStatus: 'ACTIVE' | 'INACTIVE') {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const statusText = newStatus === 'ACTIVE' ? 'activée' : 'désactivée';
      
      await promotionsAPI.updatePromotionStatus(promotionId, newStatus);
      
      toast.success(`Promotion ${statusText}`, {
        description: `La promotion a été ${statusText} avec succès`,
        action: {
          label: "Rafraîchir",
          onClick: () => fetchData()
        }
      });
      
      await fetchData();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour", {
        description: error.response?.data?.message || "Impossible de modifier le statut de la promotion",
      });
    }
  }

  async function handleCreatePromotion(data: PromotionFormData) {
    try {
      const response = await promotionsAPI.createPromotion(data);
      
      toast.success("Promotion créée", {
        description: `La promotion ${data.name} a été créée avec succès`,
      });
      
      await fetchData();
      setShowAddModal(false);
    } catch (error: any) {
      toast.error("Erreur lors de la création", {
        description: error.response?.data?.message || "Impossible de créer la promotion",
      });
    }
  }

  // Update the stats section in your render:
  const stats = calculateStats(filteredPromotions);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-teal-600">Promotion</h1>
          <p className="text-gray-600 mt-1"> Gérer les promotions de l'école</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors shadow-sm font-medium"
          >
            <Plus size={18} className="mr-2" />
            Ajouter une promotion
          </button>
        </div>
      </div>
      
      {/* Updated Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Learners Card */}
        <div 
          className="bg-orange-500 rounded-lg shadow-lg overflow-hidden"
          style={{
            backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="p-6 flex items-center justify-between">
            <div className="text-white">
              <div className="text-4xl font-bold">{stats.totalLearners}</div>
              <div className="text-sm mt-1">Apprenants</div>
            </div>
            <div className="bg-white rounded-full p-3">
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Referentials Card */}
        <div 
          className="bg-orange-500 rounded-lg shadow-lg overflow-hidden"
          style={{
            backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="p-6 flex items-center justify-between">
            <div className="text-white">
              <div className="text-4xl font-bold">{stats.uniqueReferentialsCount}</div>
              <div className="text-sm mt-1">Référentiels</div>
            </div>
            <div className="bg-white rounded-full p-3">
              <Book className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Active Promotions Card */}
        <div 
          className="bg-orange-500 rounded-lg shadow-lg overflow-hidden"
          style={{
            backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="p-6 flex items-center justify-between">
            <div className="text-white">
              <div className="text-4xl font-bold">{stats.activePromotions}</div>
              <div className="text-sm mt-1">Promotions actives</div>
            </div>
            <div className="bg-white rounded-full p-3">
              <Check className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Total Promotions Card */}
        <div 
          className="bg-orange-500 rounded-lg shadow-lg overflow-hidden"
          style={{
            backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="p-6 flex items-center justify-between">
            <div className="text-white">
              <div className="text-4xl font-bold">{stats.totalPromotions}</div>
              <div className="text-sm mt-1">Total promotions</div>
            </div>
            <div className="bg-white rounded-full p-3">
              <Folder className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Recherche et filtres */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Filtres */}
        <div className="flex gap-4">
          {/* <div className="w-48">
            <select
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={classFilter || ''}
              onChange={(e) => setClassFilter(e.target.value || null)}
            >
              <option value="">Filtre par classe</option>
              {referentials.map(ref => (
                <option key={ref.id} value={ref.label}>
                  {ref.label}
                </option>
              ))}
            </select>
          </div> */}
          
          <div className="w-48">
            <select
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
            >
              <option value="">Tous</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Basculer entre vue grille et liste */}
          <button
            className={`px-3 py-2 border border-gray-300 rounded-l-lg ${view === 'grid' ? 'bg-orange-500 text-white' : 'bg-white'}`}
            onClick={() => setView('grid')}
          >
            Grille
          </button>
          <button
            className={`px-3 py-2 border border-gray-300 rounded-r-lg ${view === 'list' ? 'bg-orange-500 text-white' : 'bg-white'}`}
            onClick={() => setView('list')}
          >
            Liste
          </button>
        </div>
      </div>
      
      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 h-48 animate-pulse border border-gray-100">
              <div className="flex mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-6"></div>
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 shadow-sm">
          <h3 className="font-medium mb-2">Erreur de chargement</h3>
          <p>{error}</p>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="mx-auto w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
            <Calendar size={40} className="text-orange-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-3">Aucune promotion trouvée</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {searchQuery || statusFilter || classFilter
              ? 'Aucune promotion ne correspond à vos critères de recherche. Veuillez modifier vos filtres.'
              : 'Il n\'y a actuellement aucune promotion dans la base de données. Commencez par en créer une.'}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-medium"
          >
            <Plus size={18} className="mr-2" />
            Ajouter une promotion
          </button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentItems.map(promotion => (
            <EnhancedPromotionCard 
              key={promotion.id} 
              promotion={promotion}
              onToggleStatus={handleStatusToggle}
            />
          ))}
        </div>
      ) : (
        // Vue en liste (tableau)
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-orange-500">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-14">
                  Photo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Promotion
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Période
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Apprenants
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                      {promotion.photoUrl ? (
                        <img 
                          src={promotion.photoUrl} 
                          alt={promotion.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-orange-600 font-medium">
                          {new Date(promotion.startDate).getFullYear().toString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-800">{promotion.name}</div>
                      <div className="text-sm text-gray-500">{promotion.learnerCount} apprenants</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col text-sm">
                      <div className="text-gray-900">
                        {new Date(promotion.startDate).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-gray-500">
                        {new Date(promotion.endDate).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{promotion.learnerCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        promotion.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {promotion.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleStatusToggle(promotion.id, promotion.status)}
                        className={`p-1.5 rounded-full transition-colors duration-200 ${
                          promotion.status === 'ACTIVE' 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                        title={promotion.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                      >
                        <PowerIcon size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link 
                      href={`/dashboard/promotions/${promotion.id}`}
                      className="text-orange-500 hover:text-orange-600 font-medium text-sm"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {filteredPromotions.length > itemsPerPage && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            1 à {Math.min(indexOfLastItem, filteredPromotions.length)} promotion(s) pour {filteredPromotions.length}
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md ${
                    currentPage === pageNum ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 3 && (
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Promotions/page</span>
            <select
              className="block px-2 py-1 border border-gray-300 rounded-md text-sm"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      )}
      
      <CreatePromotionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePromotion}
      />
      
      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Orange Digital Center - Sonatel © 2025 Tous droits réservés.
      </div>
    </div>
  );
}

