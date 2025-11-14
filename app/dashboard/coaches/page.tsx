'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, UserCheck, QrCode, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddCoachModal from '@/components/coaches/AddCoachModal';
import EditCoachModal from '@/components/coaches/EditCoachModal';
import ViewCoachModal from '@/components/coaches/ViewCoachModal';
import QRCodeModal from '@/components/coaches/QRCodeModal';
import QRScannerModal from '@/components/coaches/QRScannerModal';
import { coachesAPI, referentialsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils/imageUrl';
import CoachScanHistory from '@/components/coaches/CoachScanHistory';
import { Clock } from 'lucide-react';
interface Coach {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string;
  qrCode?: string;
  refId?: string;
  referential?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Referential {
  id: string;
  name: string;
  description?: string;
}

export default function CoachesPage() {
  const [referentials, setReferentials] = useState<Referential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferential, setSelectedReferential] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [coachesData, referentialsData] = await Promise.all([
        coachesAPI.getAllCoaches(),
        referentialsAPI.getAllReferentials()
      ]);
      
      setCoaches(coachesData);
      setReferentials(referentialsData);
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = 
      coach.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesReferential = 
      selectedReferential === '' || 
      coach.referential?.id === selectedReferential ||
      (!coach.referential && selectedReferential === 'none');
    
    return matchesSearch && matchesReferential;
  });

  const handleAddCoach = async (data: any) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      
      formData.append('firstName', data.firstName.trim());
      formData.append('lastName', data.lastName.trim());
      formData.append('email', data.email.trim());
      formData.append('phone', data.phone.trim());
      
      if (data.refId && data.refId.trim() !== '') {
        formData.append('refId', data.refId.trim());
      }
      
      if (data.photoFile) {
        formData.append('photo', data.photoFile);
      }

      const newCoach = await coachesAPI.createCoach(formData);
      
      setCoaches(prev => [newCoach, ...prev]);
      setIsAddModalOpen(false);
      toast.success('Coach créé avec succès');
      
    } catch (error: any) {
      console.error('❌ Error creating coach:', error);
      
      if (error.response?.status === 409) {
        toast.error('Un utilisateur avec cet email existe déjà');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || 'Erreur lors de la création du coach');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCoach = async (id: string, data: any) => {
    try {
      const formData = new FormData();
      formData.append('firstName', data.firstName.trim());
      formData.append('lastName', data.lastName.trim());
      formData.append('phone', data.phone.trim());
      
      if (data.refId !== undefined) {
        if (data.refId && data.refId.trim() !== '') {
          formData.append('refId', data.refId.trim());
        } else {
          formData.append('refId', '');
        }
      }
      
      if (data.photoFile) {
        formData.append('photo', data.photoFile);
      }

      const updatedCoach = await coachesAPI.updateCoach(id, formData);
      
      setCoaches(prev => prev.map(c => c.id === id ? updatedCoach : c));
      setIsEditModalOpen(false);
      setSelectedCoach(null);
      toast.success('Coach modifié avec succès');
      
    } catch (error: any) {
      console.error('❌ Error updating coach:', error);
      
      if (error.response?.status === 409) {
        toast.error('Ce numéro de téléphone est déjà utilisé par un autre coach');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || 'Erreur lors de la modification du coach');
      }
      throw error;
    }
  };

  const handleScanQRCode = async (qrData: string) => {
    try {
      console.log('📱 QR Code scanné:', qrData);

      const result = await coachesAPI.scanAttendance(qrData);

      if (result.action === 'checkin') {
        toast.success(`✅ ${result.message}`, {
          description: result.isLate ? '⚠️ Arrivée en retard' : '✅ À l\'heure',
          duration: 5000,
        });
      } else {
        toast.info(`👋 ${result.message}`, {
          description: `Dépointé à ${result.time}`,
          duration: 5000,
        });
      }

      // Rafraîchir la liste
      await loadInitialData();
      
    } catch (error: any) {
      console.error('❌ Erreur scan QR Code:', error);
      
      if (error.response?.status === 404) {
        toast.error('Coach non trouvé pour ce QR Code');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erreur lors du traitement du QR Code');
      }
    }
  };

  const handleViewCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (coach: Coach) => {
    setSelectedCoach(coach);
    setIsEditModalOpen(true);
  };

  const handleDeleteCoach = async (coachId: string) => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${coach.firstName} ${coach.lastName} ?`)) return;
    
    try {
      await coachesAPI.deleteCoach(coachId);
      setCoaches(prev => prev.filter(c => c.id !== coachId));
      toast.success('Coach supprimé avec succès');
    } catch (error) {
      console.error('Error deleting coach:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion des coaches</h1>
            <p className="text-gray-600">Gérer les coaches et leurs affectations</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsQRScannerOpen(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Scanner QR Code
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un coach
            </Button>
{/* <Button
  variant="ghost"
  size="sm"
  onClick={() => {
    setSelectedCoach(coach);
    setShowHistory(true);
  }}
  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
  title="Voir historique des scans"
>
  <Clock className="w-4 h-4" />
</Button> */}


          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un coach (nom, prénom, matricule, email...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-64">
            <select
              value={selectedReferential}
              onChange={(e) => setSelectedReferential(e.target.value)}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Tous les référentiels</option>
              <option value="none">Sans référentiel</option>
              {referentials.map(ref => (
                <option key={ref.id} value={ref.id}>
                  {ref.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total coaches</p>
              <p className="text-2xl font-bold text-gray-900">{coaches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avec référentiel</p>
              <p className="text-2xl font-bold text-gray-900">
                {coaches.filter(c => c.referential).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <UserCheck className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sans référentiel</p>
              <p className="text-2xl font-bold text-gray-900">
                {coaches.filter(c => !c.referential).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avec QR Code</p>
              <p className="text-2xl font-bold text-gray-900">
                {coaches.filter(c => c.qrCode).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coaches Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Liste des coaches ({filteredCoaches.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Chargement des coaches...</p>
          </div>
        ) : filteredCoaches.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">Aucun coach trouvé</p>
            <p className="text-gray-400 text-sm">
              {searchTerm || selectedReferential 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier coach'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référentiel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date création</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCoaches.map((coach) => (
                  <tr key={coach.id} className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-orange-500">
                          {coach.photoUrl ? (
                            <img 
                              src={getImageUrl(coach.photoUrl)}
                              alt={`${coach.firstName} ${coach.lastName}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-orange-500 text-white text-lg font-bold">
                              {coach.firstName[0]}{coach.lastName[0]}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {coach.firstName} {coach.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {coach.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {coach.matricule}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {coach.phone || <span className="text-gray-400 italic">Non renseigné</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coach.referential ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          {coach.referential.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Non assigné
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coach.qrCode ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          <QrCode className="w-3 h-3 mr-1" />
                          Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Manquant
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(coach.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCoach(coach)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(coach)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCoach(coach.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
<Button
  variant="ghost"
  size="sm"
  onClick={() => {
    setSelectedCoach(coach);
    setShowHistory(true);
  }}
  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
  title="Voir historique des scans"
>
  <Clock className="w-4 h-4" />
</Button>


                        {coach.qrCode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCoach(coach);
                              setIsQRModalOpen(true);
                            }}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="Voir le QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCoachModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        referentials={referentials}
        onSubmit={handleAddCoach}
      />

      {selectedCoach && (
        <ViewCoachModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          coach={selectedCoach}
        />
      )}

      {selectedCoach && (
        <EditCoachModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCoach(null);
          }}
          coach={selectedCoach}
          referentials={referentials}
          onSubmit={handleEditCoach}
        />
      )}

      {selectedCoach && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => {
            setIsQRModalOpen(false);
            setSelectedCoach(null);
          }}
          coach={selectedCoach}
        />
      )}

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleScanQRCode}
      />
    {showHistory && selectedCoach && (
  <CoachScanHistory
    coachId={selectedCoach.id}
    onBack={() => setShowHistory(false)}
  />
)}


    </div>
  );
}