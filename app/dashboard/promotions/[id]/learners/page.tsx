'use client'

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, BookOpen, Hash, Mail, Phone, Search } from 'lucide-react';
import Link from 'next/link';
import { learnersAPI, promotionsAPI } from '@/lib/api';
import Pagination from '@/components/common/Pagination';

type PromotionLearner = {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  status?: string;
  matricule?: string;
  phone?: string;
  referentialName?: string;
  promotionName?: string;
  sessionName?: string;
};

const statusLabel: Record<string, string> = {
  ACTIVE: 'Actif',
  REPLACEMENT: 'Remplaçant',
  WAITING: 'En attente',
  INACTIVE: 'Inactif',
  GRADUATED: 'Gradué',
  DROPPED_OUT: 'Abandonné',
  REPLACED: 'Remplacé',
};

export default function LearnersPage() {
  const params = useParams();
  const router = useRouter();
  const promotionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [learners, setLearners] = useState<PromotionLearner[]>([]);
  const [promotionName, setPromotionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLearners = async () => {
    if (!promotionId || typeof promotionId !== 'string') {
      setError('ID de promotion invalide');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const promotionData = await promotionsAPI.getPromotionById(promotionId);
      setPromotionName(promotionData?.name || 'Promotion');

      const data = await learnersAPI.getLearnersByPromotionId(promotionId);
      setLearners(data);
    } catch (err: any) {
      console.error('Erreur de chargement des apprenants :', err);
      setError('Une erreur est survenue lors du chargement des apprenants de cette promotion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearners();
  }, [promotionId]);

  const filteredLearners = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return learners.filter((learner) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          learner.name,
          learner.email,
          learner.matricule,
          learner.phone,
          learner.referentialName,
          learner.promotionName,
          learner.sessionName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesStatus = statusFilter === 'all' || learner.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [learners, searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  const totalItems = filteredLearners.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (safeCurrentPage !== currentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [safeCurrentPage, currentPage]);

  const currentLearners = filteredLearners.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Chargement des apprenants...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link
            href={`/dashboard/promotions/${promotionId}`}
            className="inline-flex items-center text-orange-500 hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la promotion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-orange-600">
                {promotionName ? `Apprenants de ${promotionName}` : 'Liste des apprenants'}
              </h1>
              <p className="text-gray-600 mt-1">
                {totalItems} apprenant{totalItems > 1 ? 's' : ''} trouvé{totalItems > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <Search className="h-4 w-4 text-orange-500 shrink-0" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher un apprenant"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="REPLACEMENT">Remplaçant</option>
              <option value="WAITING">En attente</option>
              <option value="INACTIVE">Inactif</option>
              <option value="GRADUATED">Gradué</option>
              <option value="DROPPED_OUT">Abandonné</option>
              <option value="REPLACED">Remplacé</option>
            </select>

            <select
              value={itemsPerPage}
              onChange={(event) => setItemsPerPage(Number(event.target.value))}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
            >
              <option value={6}>6 par page</option>
              <option value={12}>12 par page</option>
              <option value={24}>24 par page</option>
            </select>
          </div>
        </div>

        {totalItems === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            Aucun apprenant ne correspond à votre recherche.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentLearners.map((learner) => {
              const initials = learner.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('');

              const statusText = learner.status ? statusLabel[learner.status] || learner.status : 'Non défini';

              return (
                <div
                  key={learner.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold overflow-hidden shrink-0">
                      {learner.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={learner.photoUrl}
                          alt={learner.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{initials || 'A'}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {learner.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {learner.promotionName || promotionName || 'Promotion'}
                      </p>
                    </div>

                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-orange-50 text-orange-700">
                      {statusText}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-500" />
                      <span className="truncate">{learner.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-orange-500" />
                      <span>{learner.matricule || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-orange-500" />
                      <span>{learner.referentialName || '—'}</span>
                    </div>
                    {learner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-orange-500" />
                        <span>{learner.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
              <Pagination
                totalItems={totalItems}
                currentPage={safeCurrentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
