'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Laptop, Battery, ShoppingBag, Shirt } from 'lucide-react';
import { learnersAPI, promotionsAPI, Learner, Promotion } from '@/lib/api';
import KitStatusBadge from '@/components/dashboard/KitStatusBadge';
import UpdateKitModal from '@/components/modals/UpdateKitModal';
import Pagination from '@/components/common/Pagination';
import React from 'react';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/skeletons/KitsSkeleton';

const REFERENTIAL_CONFIG: Record<string, { alias: string; bgColor: string; textColor: string }> = {
  'Développement web/mobile':      { alias: 'Dev Web',  bgColor: 'bg-green-100',  textColor: 'text-green-800'  },
  'Référent digital':              { alias: 'Réf Dig',  bgColor: 'bg-blue-100',   textColor: 'text-blue-800'   },
  'Développement data':            { alias: 'Dev Data', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  'AWS & DevOps':                  { alias: 'AWS',      bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  'Assistanat Digital (Hackeuse)': { alias: 'Hackeuse', bgColor: 'bg-pink-100',   textColor: 'text-pink-800'   },
};

type KitStats = {
  laptop:  { received: number; total: number };
  charger: { received: number; total: number };
  bag:     { received: number; total: number };
  polo:    { received: number; total: number };
};

const calculateKitStats = (learners: Learner[]): KitStats => {
  const total = learners.length;
  return {
    laptop:  { received: learners.filter(l => l.kit?.laptop).length,  total },
    charger: { received: learners.filter(l => l.kit?.charger).length, total },
    bag:     { received: learners.filter(l => l.kit?.bag).length,     total },
    polo:    { received: learners.filter(l => l.kit?.polo).length,    total },
  };
};

const StatsCard = ({
  title,
  received,
  total,
  icon,
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
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <div className="p-6 flex items-center justify-between">
      <div className="text-white">
        <div className="text-4xl font-bold">
          {received}/{total}
          <span className="text-sm ml-2">
            ({total > 0 ? Math.round((received / total) * 100) : 0}%)
          </span>
        </div>
        <div className="text-sm mt-1">{title}</div>
      </div>
      <div className="bg-white rounded-full p-3">
        {React.cloneElement(icon as React.ReactElement, {
          className: 'w-6 h-6 text-orange-500',
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
  const [currentPage, setCurrentPage] = useState(1);   // ✅ contrôlé ici
  const [itemsPerPage, setItemsPerPage] = useState(10); // ✅ contrôlé ici
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [learnersData, promotionsData] = await Promise.all([
          learnersAPI.getAllLearners(),
          promotionsAPI.getAllPromotions(),
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

  // ── Filtering ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let filtered = [...learners];
    if (activePromotion) {
      filtered = filtered.filter(l => l.promotionId === activePromotion.id);
    }
    filtered = filtered.filter(l => statusFilter.includes(l.status));
    if (searchQuery) {
      filtered = filtered.filter(l =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.matricule?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (referentialFilter) {
      filtered = filtered.filter(l => l.referential?.id === referentialFilter);
    }
    setFilteredLearners(filtered);
    setCurrentPage(1); // ✅ Reset page 1 quand les filtres changent
  }, [searchQuery, referentialFilter, statusFilter, learners, activePromotion]);

  // ── Pagination ─────────────────────────────────────────────────────────────

  // ✅ Découpage calculé ici, pas dans Pagination
  const paginatedLearners = filteredLearners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleUpdateKit = (learnerId: string) => {
    setSelectedLearnerId(learnerId);
    setIsUpdateModalOpen(true);
  };

  const statusOptions = [
    { value: 'ACTIVE',      label: 'Actif' },
    { value: 'REPLACEMENT', label: 'Remplacement' },
    { value: 'ABANDONED',   label: 'Abandon' },
    { value: 'REPLACED',    label: 'Remplacé' },
  ];

  const getReferentials = () => {
    const referentialMap = new Map();
    learners
      .filter(l => l.referential?.id && l.referential?.name)
      .forEach(l => {
        if (!referentialMap.has(l.referential!.id)) {
          referentialMap.set(l.referential!.id, {
            id: l.referential!.id,
            name: l.referential!.name,
          });
        }
      });
    return Array.from(referentialMap.values());
  };

  // ── Render ─────────────────────────────────────────────────────────────────

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
            <StatsCard title="Laptops distribués"       {...calculateKitStats(filteredLearners).laptop}  icon={<Laptop />} />
            <StatsCard title="Chargeurs distribués"     {...calculateKitStats(filteredLearners).charger} icon={<Battery />} />
            <StatsCard title="Sacs distribués"          {...calculateKitStats(filteredLearners).bag}     icon={<ShoppingBag />} />
            <StatsCard title="Pack de Polos distribués" {...calculateKitStats(filteredLearners).polo}    icon={<Shirt />} />
          </>
        )}
      </div>

      {/* Filters */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
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
                onChange={(e) => setStatusFilter(Array.from(e.target.selectedOptions).map(o => o.value))}
                multiple={true}
                size={1}
                style={{ height: '42px' }}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Referential filter */}
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

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-orange-500">
                <tr>
                  {['Apprenant', 'Référentiel', 'Laptop', 'Chargeur', 'Sac', 'Polo', 'Actions'].map(h => (
                    <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">{error}</div>
          <button onClick={() => window.location.reload()} className="text-orange-500 hover:text-orange-600">
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
                  {['Apprenant', 'Référentiel', 'Laptop', 'Chargeur', 'Sac', 'Polo', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-6 py-3 text-xs font-medium text-white uppercase tracking-wider ${
                        i === 6 ? 'text-center' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLearners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-gray-50">
                    {/* Apprenant */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          {learner.photoUrl ? (
                            <img
                              src={learner.photoUrl}
                              alt={`${learner.firstName} ${learner.lastName}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500 font-medium">
                              {learner.firstName[0]}{learner.lastName[0]}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {learner.firstName} {learner.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{learner.matricule}</div>
                        </div>
                      </div>
                    </td>

                    {/* Référentiel */}
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

                    {/* Kit items */}
                    <td className="px-6 py-4 whitespace-nowrap"><KitStatusBadge received={learner.kit?.laptop}  /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><KitStatusBadge received={learner.kit?.charger} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><KitStatusBadge received={learner.kit?.bag}     /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><KitStatusBadge received={learner.kit?.polo}    /></td>

                    {/* Actions */}
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

          {/* ✅ Pagination contrôlée par le parent */}
          <Pagination
            totalItems={filteredLearners.length}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1) }}
          />
        </div>
      )}

      <UpdateKitModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        learnerId={selectedLearnerId}
        onSuccess={() => {
          learnersAPI.getAllLearners().then(data => setLearners(data));
          setIsUpdateModalOpen(false);
        }}
      />
    </div>
  );
}