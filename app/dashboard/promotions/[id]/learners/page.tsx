'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { learnersAPI } from '@/lib/api';

type Learner = {
  id: string;
  name: string;
  email: string;
};

export default function LearnersPage() {
  const { id } = useParams();
  const router = useRouter();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLearners = async () => {
    try {
      setLoading(true);
      if (typeof id === 'string') {
        const data = await learnersAPI.getLearnersByPromotionId(id);
        setLearners(data);
      } else {
        throw new Error('ID de promotion invalide');
      }
    } catch (err: any) {
      console.error("Erreur de chargement des apprenants :", err);
      setError("Une erreur est survenue lors du chargement des apprenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearners();
  }, [id]);

  // if (loading) return <LearnerDetailsSkeleton />; // Décommente si le composant existe
  if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link
            href={`/dashboard/promotions/${id}`}
            className="inline-flex items-center text-orange-500 hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >                
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-orange-600">Liste des apprenants</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {learners.map((learner) => (
          <div
            key={learner.id}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{learner.name}</h3>
            <p className="text-gray-600 text-sm">Email : {learner.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
