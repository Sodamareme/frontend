import { CalendarDays, Users, Book, Clock } from 'lucide-react';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { Module } from '@/lib/api';

// Ajoutez cette fonction helper en haut du fichier
const getImageUrl = (path: string | undefined) => {
  if (!path) return undefined;
  // Si l'URL est déjà complète (commence par http ou https)
  if (path.startsWith('http')) {
    return path;
  }
  // Sinon, ajoutez l'URL de base
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
};

interface ModuleCardProps {
  module: Module;
  onClick: () => void;
}

export default function ModuleCard({ module, onClick }: ModuleCardProps) {
  return (
    <div 
      className="group bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg border border-gray-100 hover:border-orange-500"
      onClick={onClick}
    >
      {/* Module Image Section */}
      <div className="h-48 relative overflow-hidden bg-gray-100">
        {module.photoUrl ? (
          <img
            src={getImageUrl(module.photoUrl)}
            alt={module.name}
            className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              // Fallback en cas d'erreur de chargement de l'image
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full flex items-center justify-center bg-orange-50';
                fallback.innerHTML = '<svg class="w-16 h-16 text-orange-200" ...></svg>';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-orange-50">
            <Book className="w-16 h-16 text-orange-200" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Module name on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
            {module.name}
          </h3>
          <div className="flex items-center text-xs text-white/80">
            <Users className="w-4 h-4 mr-1" />
            <span>{module.referential?.name}</span>
          </div>
        </div>
      </div>

      {/* Module Content Section */}
      <div className="p-4">
        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {module.description}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center text-gray-500">
            <div className="p-1.5 rounded-lg bg-orange-50 mr-2">
              <CalendarDays className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Début</span>
              <span>{format(new Date(module.startDate), 'dd MMM yyyy', { locale: fr })}</span>
            </div>
          </div>

          <div className="flex items-center text-gray-500">
            <div className="p-1.5 rounded-lg bg-teal-50 mr-2">
              <Clock className="w-4 h-4 text-teal-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Fin</span>
              <span>{format(new Date(module.endDate), 'dd MMM yyyy', { locale: fr })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}