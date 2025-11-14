'use client';

import { X, Mail, Phone, Calendar, QrCode, User, BookOpen } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/imageUrl';

interface Coach {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string;
  qrCode?: string;
  referential?: {
    id: string;
    name: string;
    description?: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ViewCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  coach: Coach;
}

export default function ViewCoachModal({ isOpen, onClose, coach }: ViewCoachModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ✅ Obtenir l'URL complète de la photo
  const photoUrl = coach.photoUrl ? getImageUrl(coach.photoUrl) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header avec gradient */}
          <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-6">
              {/* Photo du coach */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={`${coach.firstName} ${coach.lastName}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-orange-500 text-white text-2xl font-bold">
                              ${coach.firstName[0]}${coach.lastName[0]}
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-orange-500 text-white text-2xl font-bold">
                      {coach.firstName[0]}{coach.lastName[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Informations principales */}
              <div className="flex-1 text-white">
                <h2 className="text-2xl font-bold">
                  {coach.firstName} {coach.lastName}
                </h2>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 backdrop-blur-sm">
                    {coach.matricule}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 backdrop-blur-sm">
                    {coach.user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Corps du modal */}
          <div className="px-6 py-6 space-y-6">
            {/* Informations de contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-orange-500" />
                Informations de contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 truncate">{coach.user.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">Téléphone</p>
                    <p className="text-sm text-gray-900">
                      {coach.phone || (
                        <span className="text-gray-400 italic">Non renseigné</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Référentiel */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-orange-500" />
                Référentiel
              </h3>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                {coach.referential ? (
                  <div>
                    <p className="font-semibold text-green-900">
                      {coach.referential.name}
                    </p>
                    {coach.referential.description && (
                      <p className="text-sm text-green-700 mt-1">
                        {coach.referential.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-gray-500 italic">
                      Aucun référentiel assigné
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code */}
            {coach.qrCode && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <QrCode className="w-5 h-5 mr-2 text-orange-500" />
                  QR Code
                </h3>
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <img
                    src={coach.qrCode}
                    alt="QR Code"
                    className="w-48 h-48 border-4 border-white shadow-lg rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Dates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">Créé le</p>
                    <p className="text-sm text-gray-900">{formatDate(coach.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">Modifié le</p>
                    <p className="text-sm text-gray-900">{formatDate(coach.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}