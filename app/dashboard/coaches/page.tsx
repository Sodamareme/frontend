'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, UserCheck, QrCode, Camera, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddCoachModal from '@/components/coaches/AddCoachModal';
import EditCoachModal from '@/components/coaches/EditCoachModal';
import ViewCoachModal from '@/components/coaches/ViewCoachModal';
import QRCodeModal from '@/components/coaches/QRCodeModal';
import QRScannerModal from '@/components/coaches/QRScannerModal';
import { coachesAPI, referentialsAPI, ReferentialBasic } from '@/lib/api';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils/imageUrl';
import CoachScanHistory from '@/components/coaches/CoachScanHistory';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Coach {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string;
  qrCode?: string;
  refId?: string;
  referential?: { id: string; name: string };
  referentials?: Array<{ id: string; name: string }>;
  
  user: { id: string; email: string; role: string };
  createdAt: string;
  updatedAt: string;
}

interface Referential {
  id: string;
  name: string;
  description?: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function getReferentials(coach: Coach) {
  if (coach.referentials && coach.referentials.length > 0) return coach.referentials;
  if (coach.referential) return [coach.referential];
  return [];
}

// ── ReferentialsCell : 1 badge visible + bouton +N ────────────────────────────

const REF_COLORS = [
  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  dot: 'bg-green-500'  },
  { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300',   dot: 'bg-blue-500'   },
  { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300', dot: 'bg-violet-500' },
  { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300',  dot: 'bg-amber-500'  },
  { bg: 'bg-rose-100',   text: 'text-rose-800',   border: 'border-rose-300',   dot: 'bg-rose-500'   },
];

function ReferentialsCell({ refs }: { refs: Array<{ id: string; name: string }> }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (refs.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
        Non assigné
      </span>
    );
  }

  // Toujours 1 seul badge visible, le reste dans le tooltip
  const first  = refs[0];
  const rest   = refs.slice(1);
  const c      = REF_COLORS[0]; // vert pour le badge principal

  return (
    <div className="flex items-center gap-1.5">
      {/* Badge principal */}
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
        {first.name}
      </span>

      {/* Bouton +N si plusieurs */}
      {rest.length > 0 && (
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-gray-700 text-white text-xs font-bold hover:bg-gray-900 transition-colors shadow-sm"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            +{rest.length}
          </button>

          {showTooltip && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              {/* Flèche */}
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900" />
              <div className="bg-gray-900 rounded-xl px-3 py-3 shadow-2xl min-w-max">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  {refs.length} référentiels au total
                </p>
                <div className="flex flex-col gap-1.5">
                  {refs.map((ref, idx) => {
                    const color = REF_COLORS[idx % REF_COLORS.length];
                    return (
                      <div key={ref.id} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                        <span className="text-xs text-white font-medium">{ref.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
        referentialsAPI.getAllReferentials(),
      ]);
      setCoaches(coachesData);
      setReferentials(referentialsData);
    } catch (error: any) {
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

    const refs = getReferentials(coach);
    const matchesReferential =
      selectedReferential === '' ||
      refs.some(r => r.id === selectedReferential) ||
      (refs.length === 0 && selectedReferential === 'none');

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

      if (data.refIds && data.refIds.length > 0) {
        data.refIds.forEach((refId: string) => {
          if (refId.trim() !== '') formData.append('refIds[]', refId.trim());
        });
      } else if (data.refId && data.refId.trim() !== '') {
        formData.append('refId', data.refId.trim());
      }

      if (data.photoFile) formData.append('photo', data.photoFile);

      const newCoach = await coachesAPI.createCoach(formData);

      // Reconstruire referentials si le backend renvoie seulement referential (singulier)
      const mergedNewCoach: Coach = {
        ...newCoach,
        referentials:
          newCoach.referentials && newCoach.referentials.length > 0
            ? newCoach.referentials
            : data.refIds && data.refIds.length > 0
              ? data.refIds
                  .map((refId: string) => referentials.find(r => r.id === refId))
                  .filter(Boolean)
                  .map((r: any) => ({ id: r.id, name: r.name }))
              : newCoach.referential
                ? [newCoach.referential]
                : [],
      };

      setCoaches(prev => [mergedNewCoach, ...prev]);
      setIsAddModalOpen(false);
      toast.success('Coach créé avec succès');
    } catch (error: any) {
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

      if (data.refIds && data.refIds.length > 0) {
        data.refIds.forEach((refId: string) => {
          formData.append('refIds[]', refId);
        });
      } else {
        formData.append('refIds[]', '');
      }

      if (data.photoFile instanceof File) formData.append('photo', data.photoFile);

      const updatedCoach = await coachesAPI.updateCoach(id, formData);

      // Reconstruire referentials si le backend renvoie seulement referential (singulier)
      const mergedCoach: Coach = {
        ...updatedCoach,
        referentials:
          updatedCoach.referentials && updatedCoach.referentials.length > 0
            ? updatedCoach.referentials
            : data.refIds && data.refIds.length > 0
              ? data.refIds
                  .map((refId: string) => referentials.find(r => r.id === refId))
                  .filter(Boolean)
                  .map((r: any) => ({ id: r.id, name: r.name }))
              : [],
      };

      setCoaches(prev => prev.map(c => (c.id === id ? mergedCoach : c)));
      setIsEditModalOpen(false);
      setSelectedCoach(null);
      toast.success('Coach modifié avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification du coach');
      throw error;
    }
  };

  const handleScanQRCode = async (qrData: string) => {
    try {
      const result = await coachesAPI.scanAttendance(qrData);
      if (result.action === 'checkin') {
        toast.success(`✅ ${result.message}`, {
          description: result.isLate ? "⚠️ Arrivée en retard" : "✅ À l'heure",
          duration: 5000,
        });
      } else {
        toast.info(`👋 ${result.message}`, {
          description: `Dépointé à ${result.time}`,
          duration: 5000,
        });
      }
      await loadInitialData();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Coach non trouvé pour ce QR Code');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erreur lors du traitement du QR Code');
      }
    }
  };

  const handleViewCoach  = (coach: Coach) => { setSelectedCoach(coach); setIsViewModalOpen(true); };
  const handleEditClick  = (coach: Coach) => { setSelectedCoach(coach); setIsEditModalOpen(true); };

  const handleDeleteCoach = async (coachId: string) => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${coach.firstName} ${coach.lastName} ?`)) return;
    try {
      await coachesAPI.deleteCoach(coachId);
      setCoaches(prev => prev.filter(c => c.id !== coachId));
      toast.success('Coach supprimé avec succès');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return 'Date invalide'; }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des coaches</h1>
          <p className="text-gray-600">Gérer les coaches et leurs affectations</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsQRScannerOpen(true)} className="bg-purple-500 hover:bg-purple-600 text-white">
            <Camera className="w-4 h-4 mr-2" /> Scanner QR Code
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> Ajouter un coach
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un coach (nom, prénom, matricule, email...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                <option key={ref.id} value={ref.id}>{ref.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total coaches',      value: coaches.length,                                              color: 'blue'   },
          { label: 'Avec référentiel',   value: coaches.filter(c => getReferentials(c).length > 0).length,  color: 'green'  },
          { label: 'Sans référentiel',   value: coaches.filter(c => getReferentials(c).length === 0).length, color: 'orange' },
          { label: 'Avec QR Code',       value: coaches.filter(c => c.qrCode).length,                       color: 'purple' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-lg p-4 shadow-sm border-l-4 border-${color}-500`}>
            <div className="flex items-center">
              <div className={`bg-${color}-100 p-3 rounded-lg`}>
                <UserCheck className={`w-6 h-6 text-${color}-600`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Liste des coaches ({filteredCoaches.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Chargement des coaches...</p>
          </div>
        ) : filteredCoaches.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">Aucun coach trouvé</p>
            <p className="text-gray-400 text-sm">
              {searchTerm || selectedReferential ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter votre premier coach'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Coach', 'Matricule', 'Contact', 'Référentiel(s)', 'QR Code', 'Date création', 'Actions'].map(h => (
                    <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCoaches.map((coach) => {
                  const refs = getReferentials(coach);
                  return (
                    <tr key={coach.id} className="hover:bg-orange-50 transition-colors">
                      {/* Coach */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-orange-500">
                            {coach.photoUrl ? (
                              <img src={getImageUrl(coach.photoUrl)} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-orange-500 text-white text-lg font-bold">
                                {coach.firstName[0]}{coach.lastName[0]}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{coach.firstName} {coach.lastName}</div>
                            <div className="text-xs text-gray-500">{coach.user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Matricule */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {coach.matricule}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {coach.phone || <span className="text-gray-400 italic">Non renseigné</span>}
                      </td>

                      {/* ✅ Référentiels : 1 badge + bouton +N */}
                      <td className="px-6 py-4">
                        <ReferentialsCell refs={refs} />
                      </td>

                      {/* QR Code */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {coach.qrCode ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <QrCode className="w-3 h-3 mr-1" /> Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            Manquant
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(coach.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewCoach(coach)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Voir">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(coach)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCoach(coach.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedCoach(coach); setShowHistory(true); }} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" title="Historique">
                            <Clock className="w-4 h-4" />
                          </Button>
                          {coach.qrCode && (
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedCoach(coach); setIsQRModalOpen(true); }} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50" title="QR Code">
                              <QrCode className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCoachModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        referentials={referentials as ReferentialBasic[]}
        onSubmit={handleAddCoach}
      />

      {selectedCoach && (
        <ViewCoachModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} coach={selectedCoach} />
      )}

      {selectedCoach && (
        <EditCoachModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setSelectedCoach(null); }}
          coach={selectedCoach}
          referentials={referentials as ReferentialBasic[]}
          onSubmit={handleEditCoach}
        />
      )}

      {selectedCoach && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => { setIsQRModalOpen(false); setSelectedCoach(null); }}
          coach={selectedCoach}
        />
      )}

      <QRScannerModal isOpen={isQRScannerOpen} onClose={() => setIsQRScannerOpen(false)} onScan={handleScanQRCode} />

      {showHistory && selectedCoach && (
        <CoachScanHistory coachId={selectedCoach.id} onBack={() => setShowHistory(false)} />
      )}
    </div>
  );
}
