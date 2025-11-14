'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { pendingLearnersAPI } from '@/lib/api';

interface PendingLearner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
  photoUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  tutorData: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address: string;
  };
  promotion: {
    id: string;
    name: string;
  };
  referential: {
    id: string;
    name: string;
  };
  createdAt: string;
  rejectionReason?: string;
}

export default function PendingLearnersPage() {
  const [pendingLearners, setPendingLearners] = useState<PendingLearner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [selectedLearner, setSelectedLearner] = useState<PendingLearner | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingLearners();
  }, [filter]);

  const fetchPendingLearners = async () => {
    try {
      setLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const data = await pendingLearnersAPI.getAll(status);
      setPendingLearners(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des demandes', {
        description: error.message || 'Veuillez réessayer',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir approuver cette demande ? Un compte sera créé et l\'apprenant recevra ses identifiants par email.')) {
      return;
    }

    try {
      setProcessingId(id);
      await pendingLearnersAPI.approve(id);
      
      toast.success('✅ Demande approuvée avec succès !', {
        description: 'L\'apprenant a reçu ses identifiants par email.',
        duration: 5000,
      });
      
      fetchPendingLearners();
      setShowModal(false);
    } catch (error: any) {
      toast.error('Erreur lors de l\'approbation', {
        description: error.message || 'Veuillez réessayer',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez indiquer une raison pour le rejet');
      return;
    }

    try {
      setProcessingId(selectedLearner!.id);
      await pendingLearnersAPI.reject(selectedLearner!.id, rejectReason);
      
      toast.success('❌ Demande rejetée', {
        description: 'L\'apprenant a été notifié par email.',
        duration: 5000,
      });
      
      fetchPendingLearners();
      setShowRejectModal(false);
      setShowModal(false);
      setRejectReason('');
    } catch (error: any) {
      toast.error('Erreur lors du rejet', {
        description: error.message || 'Veuillez réessayer',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
    };

    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      APPROVED: <CheckCircle className="w-4 h-4" />,
      REJECTED: <XCircle className="w-4 h-4" />,
    };

    const labels = {
      PENDING: 'En attente',
      APPROVED: 'Approuvée',
      REJECTED: 'Rejetée',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Demandes d'inscription</h1>
              <p className="text-gray-600">Gérez les demandes d'inscription des apprenants</p>
            </div>
            <button
              onClick={fetchPendingLearners}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'PENDING', label: 'En attente' },
              { key: 'APPROVED', label: 'Approuvées' },
              { key: 'REJECTED', label: 'Rejetées' },
              { key: 'ALL', label: 'Toutes' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Chargement des demandes...</p>
            </div>
          </div>
        ) : pendingLearners.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
            <p className="text-gray-500">
              {filter === 'PENDING' 
                ? 'Il n\'y a aucune demande d\'inscription en attente pour le moment.'
                : `Il n\'y a aucune demande ${filter === 'APPROVED' ? 'approuvée' : 'rejetée'}.`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingLearners.map((learner) => (
              <div key={learner.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {learner.photoUrl ? (
                        <img 
                          src={learner.photoUrl} 
                          alt={learner.firstName} 
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                          <User className="w-8 h-8 text-orange-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {learner.firstName} {learner.lastName}
                        </h3>
                        <div className="mt-1">
                          {getStatusBadge(learner.status)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{learner.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        {learner.phone}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{learner.birthPlace}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        {new Date(learner.birthDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {learner.promotion.name}
                      </span>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        {learner.referential.name}
                      </span>
                      <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                        {new Date(learner.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedLearner(learner);
                        setShowModal(true);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4" />
                      Détails
                    </button>
                    
                    {learner.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(learner.id)}
                          disabled={processingId === learner.id}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approuver
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLearner(learner);
                            setShowRejectModal(true);
                          }}
                          disabled={processingId === learner.id}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {learner.status === 'REJECTED' && learner.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Raison du rejet:</p>
                      <p className="text-sm text-red-700 mt-1">{learner.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal des détails */}
      {showModal && selectedLearner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">Détails de la demande</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Photo et infos principales */}
              <div className="flex items-center gap-4">
                {selectedLearner.photoUrl ? (
                  <img 
                    src={selectedLearner.photoUrl} 
                    alt={selectedLearner.firstName}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-12 h-12 text-orange-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedLearner.firstName} {selectedLearner.lastName}
                  </h3>
                  {getStatusBadge(selectedLearner.status)}
                </div>
              </div>

              {/* Informations personnelles */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informations personnelles</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedLearner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedLearner.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Genre</p>
                    <p className="font-medium">{selectedLearner.gender === 'MALE' ? 'Masculin' : 'Féminin'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de naissance</p>
                    <p className="font-medium">{new Date(selectedLearner.birthDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Lieu de naissance</p>
                    <p className="font-medium">{selectedLearner.birthPlace}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium">{selectedLearner.address}</p>
                  </div>
                </div>
              </div>

              {/* Informations du tuteur */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informations du tuteur</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nom complet</p>
                    <p className="font-medium">
                      {selectedLearner.tutorData.firstName} {selectedLearner.tutorData.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedLearner.tutorData.phone}</p>
                  </div>
                  {selectedLearner.tutorData.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedLearner.tutorData.email}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium">{selectedLearner.tutorData.address}</p>
                  </div>
                </div>
              </div>

              {/* Informations académiques */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informations académiques</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Promotion</p>
                    <p className="font-medium">{selectedLearner.promotion.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Référentiel</p>
                    <p className="font-medium">{selectedLearner.referential.name}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedLearner.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedLearner.id)}
                      disabled={processingId === selectedLearner.id}
                      className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approuver cette demande
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectModal(true);
                      }}
                      disabled={processingId === selectedLearner.id}
                      className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      Rejeter cette demande
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className={`${selectedLearner.status === 'PENDING' ? 'flex-1' : 'w-full'} px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rejet */}
      {showRejectModal && selectedLearner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Rejeter la demande
            </h3>
            <p className="text-gray-600 mb-4">
              Veuillez indiquer la raison du rejet. L'apprenant sera notifié par email.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Dossier incomplet, âge minimum non atteint, etc."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={processingId !== null || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processingId ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Confirmer le rejet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}