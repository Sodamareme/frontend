'use client';

import { useState, useEffect } from 'react';
import { referentialsAPI, Referential } from '@/lib/api';
import { Plus, Search, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ReferentialCard from '@/components/dashboard/ReferentialCard';
import CreateReferentialModal from '@/components/modals/CreateReferentialModal';
import SimpleReferentialCard from '@/components/dashboard/SimpleReferentialCard';

export default function AllReferentialsPage() {
  const [referentials, setReferentials] = useState<Referential[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchReferentials();
  }, []);

  const fetchReferentials = async () => {
    try {
      setLoading(true);
      const data = await referentialsAPI.getAllReferentials();
      setReferentials(data);
    } catch (err) {
      console.error('Error fetching referentials:', err);
      setError('Une erreur est survenue lors du chargement des référentiels');
    } finally {
      setLoading(false);
    }
  };

  const filteredReferentials = referentials.filter(referential =>
    searchQuery === '' ||
    referential.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    referential.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          {/* Back button */}
          <Link
            href="/dashboard/referentials"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Retour aux référentiels actifs
          </Link>
          <h1 className="text-2xl font-bold text-teal-600">Tous les Référentiels</h1>
          <p className="text-gray-600">Liste complète des référentiels de formation</p>
        </div>
      </div>

      {/* Search and Create Button */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
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

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" />
            Créer un référentiel
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => fetchReferentials()}
            className="text-teal-600 hover:text-teal-700"
          >
            Réessayer
          </button>
        </div>
      ) : filteredReferentials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? "Aucun référentiel ne correspond à votre recherche"
              : "Aucun référentiel n'a été créé"}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Créer un référentiel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredReferentials.map((referential) => (
            <SimpleReferentialCard
              key={referential.id}
              referential={referential}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateReferentialModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchReferentials();
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}