'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { projectsAPI } from '@/lib/api';

export default function ProjectsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      if (typeof id === 'string') {
        const data = await projectsAPI.getProjectsByPromotionId(id);
        setProjects(data);
      } else {
        throw new Error('Invalid id');
      }
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [id]);

  if (loading) return <div className="p-6">Chargement des projets...</div>;

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
          <h1 className="text-2xl font-bold text-blue-600">Projets de la promotion</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{project.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-3">{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}