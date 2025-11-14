'use client';

import Link from 'next/link';
import { Promotion } from '@/lib/api';
import { Calendar, Users } from 'lucide-react';

interface PromotionCardProps {
  promotion: Promotion;
}

export default function PromotionCard({ promotion }: PromotionCardProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'COMPLETED':
        return 'Terminée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return status;
    }
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <Link 
      href={`/dashboard/promotions/${promotion.id}`}
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-gray-800 truncate">{promotion.name}</h3>
        <span 
          className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(promotion.status)}`}
        >
          {formatStatusLabel(promotion.status)}
        </span>
      </div>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400 mr-1.5" />
          <span>
            {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
          </span>
        </div>
        <div className="flex items-center text-gray-600">
          <Users className="h-4 w-4 text-gray-400 mr-1.5" />
          <span>{promotion.learners?.length || 0} apprenants</span>
        </div>
      </div>
      
      {promotion.photoUrl && (
        <div className="mt-3 aspect-video bg-gray-100 rounded-md overflow-hidden">
          <img 
            src={promotion.photoUrl} 
            alt={promotion.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </Link>
  );
} 