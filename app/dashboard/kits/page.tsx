'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Laptop, Battery, ShoppingBag, Shirt } from 'lucide-react';
import { learnersAPI, promotionsAPI, Learner, Promotion } from '@/lib/api';
import KitStatusBadge from '@/components/dashboard/KitStatusBadge';
import UpdateKitModal from '@/components/modals/UpdateKitModal';
import Pagination from '@/components/common/Pagination';
import React from 'react';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/skeletons/KitsSkeleton';

const REFERENTIAL_CONFIG = {
  'Développement web/mobile': {
    alias: 'Dev Web',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  'Référent digital': {
    alias: 'Réf Dig',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  },
  'Développement data': {
    alias: 'Dev Data',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800'
  },
  'AWS & DevOps': {
    alias: 'AWS',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  'Assistanat Digital (Hackeuse)': {
    alias: 'Hackeuse',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-800'
  }
};

type KitStats = {
  laptop: { received: number; total: number };
  charger: { received: number; total: number };
  bag: { received: number; total: number };
  polo: { received: number; total: number };
};

const calculateKitStats = (learners: Learner[]): KitStats => {
  const total = learners.length;
  return {
    laptop: {
      received: learners.filter(l => l.kit?.laptop).length,
      total
    },
    charger: {
      received: learners.filter(l => l.kit?.charger).length,
      total
    },
    bag: {
      received: learners.filter(l => l.kit?.bag).length,
      total
    },
    polo: {
      received: learners.filter(l => l.kit?.polo).length,
      total
    }
  };
};

const StatsCard = ({ 
  title, 
  received, 
  total, 
  icon 
}: { 
  title: string; 
  received: number; 
  total: number;
  icon: React.ReactNode;
}) => (
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
        <div className="text-4xl font-bold">
          {received}/{total}
          <span className="text-sm ml-2">
            ({Math.round((received / total) * 100)}%)
          </span>
        </div>
        <div className="text-sm mt-1">{title}</div>
      </div>
      <div className="bg-white rounded-full p-3">
        {React.cloneElement(icon as React.ReactElement, {
          className: "w-6 h-6 text-orange-500"
        })}
      </div>
    </div>
  </div>
);

export default function KitsPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);
  const [filteredLearners, setFilteredLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [referentialFilter, setReferentialFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['ACTIVE', 'REPLACEMENT']);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [learnersData, promotionsData] = await Promise.all([
          learnersAPI.getAllLearners(),
          promotionsAPI.getAllPromotions()
        ]);

        const activePromo = promotionsData.find(p => p.status === 'ACTIVE');
        setActivePromotion(activePromo || null);
        setPromotions(promotionsData);
        setLearners(learnersData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    filterLearners();
  }, [searchQuery, referentialFilter, statusFilter, learners, activePromotion]);

  const filterLearners = () => {
    let filtered = [...learners];

    // Filter by active promotion by default
    if (activePromotion) {
      filtered = filtered.filter(learner => learner.promotionId === activePromotion.id);
    }

    // Filter by status (ACTIVE and REMPLACEMENT by default)
    filtered = filtered.filter(learner => statusFilter.includes(learner.status));

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(learner => 
        `${learner.firstName} ${learner.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        learner.matricule?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by referential
    if (referentialFilter) {
      filtered = filtered.filter(learner => 
        learner.referential?.id === referentialFilter
      );
    }

    setFilteredLearners(filtered);
  };

  const handleUpdateKit = (learnerId: string) => {
    setSelectedLearnerId(learnerId);
    setIsUpdateModalOpen(true);
  };

  const paginatedLearners = filteredLearners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status options for filter
  const statusOptions = [
    { value: 'ACTIVE', label: 'Actif' },
    { value: 'REPLACEMENT', label: 'Remplacement' },
    { value: 'ABANDONED', label: 'Abandon' },
    { value: 'REPLACED', label: 'Remplacé' }
  ];

  // First, add this helper function after your status options
  const getReferentials = () => {
    const uniqueReferentials = Array.from(
      new Set(
        learners
          .filter(l => l.referential)
          .map(l => ({
            id: l.referential?.id,
            name: l.referential?.name
          }))
      )
    ).filter(ref => ref.id && ref.name);

    return uniqueReferentials;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-teal-600">Distribution des Kits</h1>
        <p className="mt-2 text-gray-600">
          Gestion des kits pour la {activePromotion?.name || 'promotion active'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : !error && (
          <>
            <StatsCard
              title="Laptops distribués"
              {...calculateKitStats(filteredLearners).laptop}
              icon={<Laptop />}
            />
            <StatsCard
              title="Chargeurs distribués"
              {...calculateKitStats(filteredLearners).charger}
              icon={<Battery />}
            />
            <StatsCard
              title="Sacs distribués"
              {...calculateKitStats(filteredLearners).bag}
              icon={<ShoppingBag />}
            />
            <StatsCard
              title=" Pack de Polos distribués"
              {...calculateKitStats(filteredLearners).polo}
              icon={<Shirt />}
            />
          </>
        )}
      </div>

      {/* Filters - Only show when data is loaded */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Existing search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un apprenant..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
                value={statusFilter}
                onChange={(e) => {
                  const options = e.target.selectedOptions;
                  const values = Array.from(options).map(option => option.value);
                  setStatusFilter(values);
                }}
                multiple={true}
                size={1}
                style={{ height: '42px' }}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* New referential filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
                value={referentialFilter}
                onChange={(e) => setReferentialFilter(e.target.value)}
              >
                <option value="">Tous les référentiels</option>
                {getReferentials().map((ref) => (
                  <option key={ref.id} value={ref.id}>
                    {ref.name && (REFERENTIAL_CONFIG[ref.name]?.alias || ref.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-orange-500">
                <tr>
                  {/* Same headers as your actual table */}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Apprenant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Référentiel
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Laptop
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Chargeur
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Sac
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Polo
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <TableRowSkeleton key={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="text-orange-500 hover:text-orange-600"
          >
            Réessayer
          </button>
        </div>
      ) : filteredLearners.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun apprenant trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-orange-500 text-white font-bold"> 
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Apprenant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Référentiel
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Laptop
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Chargeur
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Sac
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Polo
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLearners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                          {learner.photoUrl ? (
                            <img
                              src={learner.photoUrl}
                              alt={`${learner.firstName} ${learner.lastName}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500 font-medium">
                              {learner.firstName[0]}
                              {learner.lastName[0]}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {learner.firstName} {learner.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {learner.matricule}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {learner.referential?.name ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${REFERENTIAL_CONFIG[learner.referential.name]?.bgColor || 'bg-gray-100'}
                          ${REFERENTIAL_CONFIG[learner.referential.name]?.textColor || 'text-gray-800'}`}
                        >
                          {REFERENTIAL_CONFIG[learner.referential.name]?.alias || learner.referential.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <KitStatusBadge received={learner.kit?.laptop} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <KitStatusBadge received={learner.kit?.charger} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <KitStatusBadge received={learner.kit?.bag} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <KitStatusBadge received={learner.kit?.polo} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleUpdateKit(learner.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Mettre à jour
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination - Only show when data is loaded */}
      {!loading && !error && filteredLearners.length > 0 && (
        <div className="ml-4">
          <Pagination
            totalItems={filteredLearners.length}
            initialItemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      <UpdateKitModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        learnerId={selectedLearnerId}
        onSuccess={() => {
          const fetchLearners = async () => {
            const data = await learnersAPI.getAllLearners();
            setLearners(data);
          };
          fetchLearners();
          setIsUpdateModalOpen(false);
        }}
      />
    </div>
  );
}