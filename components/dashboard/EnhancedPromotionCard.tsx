import { PowerIcon, Calendar, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

interface EnhancedPromotionCardProps {
  promotion: {
    id: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    startDate: string;
    endDate: string;
    photoUrl?: string;
    learnerCount: number;
  };
  onToggleStatus: (id: string, status: string) => void;
}

const EnhancedPromotionCard = ({ promotion, onToggleStatus }: EnhancedPromotionCardProps) => {
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPromotionYear = (date: string) => {
    return new Date(date).getFullYear().toString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
      <div className="relative p-6">
        {/* Status Badge and Toggle Button */}
        <div className="absolute top-4 right-4 flex items-center">
          <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-100 p-1">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mr-2 ${getStatusColor(promotion.status)}`}>
              {getStatusLabel(promotion.status)}
            </span>
            <button
              onClick={() => onToggleStatus(promotion.id, promotion.status)}
              className={`p-2 rounded-full transition-colors duration-200 ${
                promotion.status === 'ACTIVE' 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700'
              }`}
              title={promotion.status === 'ACTIVE' ? 'Désactiver la promotion' : 'Activer la promotion'}
            >
              <PowerIcon size={16} />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="mt-12">
          {/* Header with Image/Year */}
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
              {promotion.photoUrl ? (
                <img 
                  src={promotion.photoUrl} 
                  alt={promotion.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-orange-600 font-bold">
                  {getPromotionYear(promotion.startDate)}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{promotion.name}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Calendar size={14} className="mr-1" />
                <span>{formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mb-4 px-4 py-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-600">
              <Users size={16} className="mr-2" />
              <span className="text-sm font-medium">{promotion.learnerCount} apprenants</span>
            </div>
          </div>

          {/* Footer with Link */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Link 
              href={`/dashboard/promotions/${promotion.id}`}
              className="inline-flex items-center text-orange-500 hover:text-orange-600 font-medium text-sm transition-colors"
            >
              Voir détails
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPromotionCard;