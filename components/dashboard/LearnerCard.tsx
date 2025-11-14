'use client';

import Link from 'next/link';
import { Learner } from '@/lib/api';
import { Book, Calendar, Phone } from 'lucide-react';

interface LearnerCardProps {
  learner: Learner;
}

export default function LearnerCard({ learner }: LearnerCardProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'WAITING':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ABANDONED':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'REPLACEMENT':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'REPLACED':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Actif';
      case 'WAITING':
        return 'En attente';
      case 'ABANDONED':
        return 'Abandonné';
      case 'REPLACEMENT':
        return 'Remplacement';
      case 'REPLACED':
        return 'Remplacé';
      default:
        return status;
    }
  };

  // Format birth date to DD/MM/YYYY
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <Link 
      href={`/dashboard/learners/${learner.id}`}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {/* Header with gradient background */}
      <div className="h-16 bg-gradient-to-r from-orange-500 to-orange-600 relative">
        <div className="absolute -bottom-8 left-4 flex items-end">
          {learner.photoUrl ? (
            <div className="ring-4 ring-white rounded-xl overflow-hidden">
              <img 
                src={learner.photoUrl} 
                alt={`${learner.firstName} ${learner.lastName}`}
                className="h-16 w-16 object-cover"
              />
            </div>
          ) : (
            <div className="h-16 w-16 bg-orange-500 rounded-xl ring-4 ring-white flex items-center justify-center text-white font-medium text-xl">
              {learner.firstName?.[0]}{learner.lastName?.[0]}
            </div>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="px-4 pt-10 pb-4">
        {/* Name and status */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
              {learner.firstName} {learner.lastName}
            </h3>
            <span 
              className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(learner.status)}`}
            >
              {formatStatusLabel(learner.status)}
            </span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid gap-3">
          <div className="flex items-center p-2 rounded-lg bg-gray-50 group-hover:bg-orange-50 transition-colors">
            <Book className="h-4 w-4 text-orange-500 mr-2" />
            <span className="text-sm text-gray-600 truncate">
              {learner.referential?.name || 'Pas de référentiel'}
            </span>
          </div>

          <div className="flex items-center p-2 rounded-lg bg-gray-50 group-hover:bg-orange-50 transition-colors">
            <Calendar className="h-4 w-4 text-orange-500 mr-2" />
            <span className="text-sm text-gray-600">
              Né(e) le {formatDate(learner.birthDate)}
            </span>
          </div>

          <div className="flex items-center p-2 rounded-lg bg-gray-50 group-hover:bg-orange-50 transition-colors">
            <Phone className="h-4 w-4 text-orange-500 mr-2" />
            <span className="text-sm text-gray-600">
              {learner.phone || 'No phone'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 group-hover:bg-orange-50 transition-colors">
        <div className="text-xs text-orange-600 font-medium flex items-center justify-end">
          Voir détails
          <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}