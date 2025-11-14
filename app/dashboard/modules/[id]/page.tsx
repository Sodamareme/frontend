'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { modulesAPI, Module, Learner, Grade, gradesAPI, learnersAPI } from '@/lib/api';
import { CalendarDays, Users, GraduationCap, Book, ArrowLeft, Edit3, Trash2, Save, X, Check, Plus, Search, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { ModuleDetailsSkeleton, GradesTableSkeleton } from '@/components/skeletons/ModuleSkeleton';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/utils/imageUrl';
import { toast } from "sonner";

interface EditingGrade {
  id?: string;
  learnerId: string;
  value: number;
  comment: string;
}

export default function ModuleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedModule, setEditedModule] = useState<Partial<Module>>({});
  const [editingGrades, setEditingGrades] = useState<{[key: string]: EditingGrade}>({});
  const [savingGrades, setSavingGrades] = useState<Set<string>>(new Set());
  
  // États pour le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'ungraded' | 'passed' | 'failed'>('all');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchModuleDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('🔄 Fetching module details for ID:', params.id);
        
        const moduleData = await modulesAPI.getModuleById(params.id as string);
        console.log('✅ Module data:', moduleData);
        setModule(moduleData);
        setEditedModule(moduleData);
        
        try {
          console.log('🔄 Fetching grades for module:', params.id);
          const gradesData = await gradesAPI.getGradesByModule(params.id as string);
          console.log('✅ Grades data received:', gradesData);
          
          if (Array.isArray(gradesData)) {
            setGrades(gradesData);
          } else {
            console.warn('⚠️ Grades data is not an array:', gradesData);
            setGrades([]);
          }
        } catch (gradeError) {
          console.error('❌ Error fetching grades:', gradeError);
          setGrades([]);
          toast.error('Erreur lors du chargement des notes');
        }
        
        if (moduleData.refId) {
          try {
            console.log('🔄 Fetching learners for referential:', moduleData.refId);
            const allLearners = await learnersAPI.getAllLearners();
            
            const relevantLearners = allLearners.filter(learner => 
              learner.referential?.id === moduleData.refId &&
              (learner.status === 'ACTIVE' || learner.status === 'REPLACEMENT')
            );
            
            console.log('✅ Relevant learners:', relevantLearners.length);
            setLearners(relevantLearners);
          } catch (err) {
            console.error('❌ Error fetching learners:', err);
            toast.error('Erreur lors du chargement des apprenants');
            setLearners([]);
          }
        }
        
      } catch (err) {
        console.error('❌ Error fetching module details:', err);
        setError('Erreur lors du chargement des détails du module');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchModuleDetails();
    }
  }, [params.id]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedModule({
      ...module,
      startDate: module?.startDate ? new Date(module.startDate).toISOString().split('T')[0] : '',
      endDate: module?.endDate ? new Date(module.endDate).toISOString().split('T')[0] : ''
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedModule(module || {});
  };

  const handleSaveEdit = async () => {
    try {
      if (!module?.id) {
        toast.error('Erreur: ID du module manquant');
        return;
      }

      if (!editedModule.name?.trim()) {
        toast.error('Le nom du module est requis');
        return;
      }

      if (!editedModule.startDate || !editedModule.endDate) {
        toast.error('Les dates de début et de fin sont requises');
        return;
      }

      const start = new Date(editedModule.startDate);
      const end = new Date(editedModule.endDate);

      if (start >= end) {
        toast.error('La date de début doit être antérieure à la date de fin');
        return;
      }

      setIsSaving(true);

      const updateData = {
        id: module.id,
        name: editedModule.name.trim(),
        description: editedModule.description?.trim() || '',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        refId: module.refId,
        coachId: module.coachId,
        photoUrl: module.photoUrl,
      };

      const updated = await modulesAPI.updateModule(module.id, updateData);
      
      setModule(updated);
      setIsEditing(false);
      toast.success('Module mis à jour avec succès');
      
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du module:', err);
      if (err.response?.data?.message) {
        toast.error(`Erreur: ${err.response.data.message}`);
      } else {
        toast.error('Erreur inattendue lors de la mise à jour du module');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!module?.id) {
      toast.error('Erreur : ID du module manquant');
      return;
    }

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le module "${module.name}" ?\n\nCette action supprimera également toutes les notes associées et est irréversible.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await modulesAPI.deleteModule(module.id);
      toast.success('Module supprimé avec succès');
      router.push('/dashboard/modules');
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      if (err.response?.data?.message) {
        toast.error(`Erreur: ${err.response.data.message}`);
      } else {
        toast.error('Erreur lors de la suppression du module');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (field: keyof Module, value: string) => {
    setEditedModule(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartEditGrade = (learnerId: string, existingGrade?: Grade) => {
    console.log('✏️ Starting edit for learner:', learnerId, 'Existing grade:', existingGrade);
    setEditingGrades(prev => ({
      ...prev,
      [learnerId]: {
        id: existingGrade?.id,
        learnerId,
        value: existingGrade?.value || 0,
        comment: existingGrade?.comment || ''
      }
    }));
  };

  const handleCancelEditGrade = (learnerId: string) => {
    setEditingGrades(prev => {
      const newEditing = { ...prev };
      delete newEditing[learnerId];
      return newEditing;
    });
  };

  const handleGradeChange = (learnerId: string, field: 'value' | 'comment', value: string | number) => {
    setEditingGrades(prev => ({
      ...prev,
      [learnerId]: {
        ...prev[learnerId],
        [field]: value
      }
    }));
  };

  const handleSaveGrade = async (learnerId: string) => {
    const editingGrade = editingGrades[learnerId];
    if (!editingGrade || !module?.id) return;

    if (editingGrade.value < 0 || editingGrade.value > 20) {
      toast.error('La note doit être comprise entre 0 et 20');
      return;
    }

    const learner = learners.find(l => l.id === learnerId);
    if (!learner) {
      toast.error('Apprenant introuvable dans la liste');
      return;
    }

    try {
      setSavingGrades(prev => new Set(prev).add(learnerId));

      const gradeData = {
        moduleId: module.id,
        learnerId,
        value: editingGrade.value,
        comment: editingGrade.comment.trim()
      };

      console.log('💾 Saving grade:', gradeData);

      let savedGrade;
      if (editingGrade.id) {
        savedGrade = await gradesAPI.updateGrade(editingGrade.id, gradeData);
        console.log('✅ Grade updated:', savedGrade);
      } else {
        savedGrade = await gradesAPI.createGrade(gradeData);
        console.log('✅ Grade created:', savedGrade);
      }

      setGrades(prev => {
        const filtered = prev.filter(g => g.learnerId !== learnerId);
        const updated = [...filtered, savedGrade];
        console.log('📝 Updated grades list:', updated);
        return updated;
      });

      handleCancelEditGrade(learnerId);
      
      toast.success('Note sauvegardée avec succès');
    } catch (err: any) {
      console.error('❌ Erreur lors de la sauvegarde de la note:', err);
      
      if (err.response?.status === 404) {
        toast.error('Apprenant ou module introuvable');
      } else if (err.response?.status === 409) {
        toast.error('Une note existe déjà pour cet apprenant');
      } else if (err.response?.data?.message) {
        toast.error(`Erreur: ${err.response.data.message}`);
      } else {
        toast.error('Erreur lors de la sauvegarde de la note');
      }
    } finally {
      setSavingGrades(prev => {
        const newSet = new Set(prev);
        newSet.delete(learnerId);
        return newSet;
      });
    }
  };

  const getGradeForLearner = (learnerId: string) => {
    const grade = grades.find(g => g.learnerId === learnerId);
    return grade;
  };

  const getGradeStatus = (value: number) => {
    if (value >= 10) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Validé
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        Non validé
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
    } catch (err) {
      return 'Date invalide';
    }
  };

  // Fonction de filtrage
  const getFilteredLearners = () => {
    let filtered = [...learners];

    // Filtrage par recherche (nom, prénom, matricule)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(learner => 
        learner.firstName.toLowerCase().includes(search) ||
        learner.lastName.toLowerCase().includes(search) ||
        learner?.matricule?.toLowerCase().includes(search)
      );
    }

    // Filtrage par statut de notation
    if (statusFilter !== 'all') {
      filtered = filtered.filter(learner => {
        const grade = getGradeForLearner(learner.id);
        
        switch (statusFilter) {
          case 'graded':
            return grade !== undefined;
          case 'ungraded':
            return grade === undefined;
          case 'passed':
            return grade && grade.value >= 10;
          case 'failed':
            return grade && grade.value < 10;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Fonction d'export PDF
  const handleExportPDF = async () => {
    if (!module) return;

    try {
      setIsExporting(true);
      
      const filteredLearners = getFilteredLearners();
      
      // Créer le contenu HTML pour le PDF
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Notes - ${module.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #14b8a6;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #14b8a6;
              margin: 0 0 10px 0;
            }
            .header .info {
              color: #666;
              font-size: 14px;
            }
            .stats {
              display: flex;
              justify-content: space-around;
              margin: 20px 0;
              padding: 15px;
              background: #f3f4f6;
              border-radius: 8px;
            }
            .stat {
              text-align: center;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #14b8a6;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #14b8a6;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:hover {
              background: #f9fafb;
            }
            .badge {
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            }
            .badge-success {
              background: #dcfce7;
              color: #166534;
            }
            .badge-danger {
              background: #fee2e2;
              color: #991b1b;
            }
            .badge-gray {
              background: #f3f4f6;
              color: #6b7280;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
            }
            .no-data {
              text-align: center;
              padding: 40px;
              color: #9ca3af;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${module.name}</h1>
            <div class="info">
              <div><strong>Référentiel:</strong> ${module.referential?.name || 'Non défini'}</div>
              <div><strong>Période:</strong> ${formatDate(module.startDate)} - ${formatDate(module.endDate)}</div>
              <div><strong>Coach:</strong> ${module.coach ? `${module.coach.firstName} ${module.coach.lastName}` : 'Non assigné'}</div>
            </div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="stat-value">${filteredLearners.length}</div>
              <div class="stat-label">Apprenants</div>
            </div>
            <div class="stat">
              <div class="stat-value">${filteredLearners.filter(l => getGradeForLearner(l.id)).length}</div>
              <div class="stat-label">Notés</div>
            </div>
            <div class="stat">
              <div class="stat-value">${filteredLearners.filter(l => {
                const g = getGradeForLearner(l.id);
                return g && g.value >= 10;
              }).length}</div>
              <div class="stat-label">Validés</div>
            </div>
            <div class="stat">
              <div class="stat-value">${filteredLearners.filter(l => {
                const g = getGradeForLearner(l.id);
                return g ? (g.value / 20 * 100).toFixed(0) : 0;
              }).reduce((sum, l) => {
                const g = getGradeForLearner(l.id);
                return sum + (g ? g.value : 0);
              }, 0) / Math.max(filteredLearners.filter(l => getGradeForLearner(l.id)).length, 1)}/20</div>
              <div class="stat-label">Moyenne</div>
            </div>
          </div>

          ${filteredLearners.length === 0 ? `
            <div class="no-data">
              Aucun apprenant ne correspond aux critères de filtrage
            </div>
          ` : `
            <table>
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom et Prénom</th>
                  <th>Note</th>
                  <th>Statut</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLearners.map(learner => {
                  const grade = getGradeForLearner(learner.id);
                  return `
                    <tr>
                      <td>${learner.matricule}</td>
                      <td>${learner.firstName} ${learner.lastName}</td>
                      <td><strong>${grade ? `${grade.value}/20` : '-'}</strong></td>
                      <td>
                        ${grade 
                          ? grade.value >= 10 
                            ? '<span class="badge badge-success">Validé</span>'
                            : '<span class="badge badge-danger">Non validé</span>'
                          : '<span class="badge badge-gray">Non noté</span>'
                        }
                      </td>
                      <td>${grade?.comment || '-'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}

          <div class="footer">
            Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
          </div>
        </body>
        </html>
      `;

      // Créer un blob et télécharger
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notes-${module.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Export réussi ! Ouvrez le fichier HTML et imprimez-le en PDF');
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredLearners = getFilteredLearners();
  const gradedCount = filteredLearners.filter(l => getGradeForLearner(l.id)).length;
  const passedCount = filteredLearners.filter(l => {
    const g = getGradeForLearner(l.id);
    return g && g.value >= 10;
  }).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ModuleDetailsSkeleton />
        <GradesTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-orange-500 hover:text-orange-600"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-red-500 mb-4">Module non trouvé</div>
        <button
          onClick={() => router.push('/dashboard/modules')}
          className="text-orange-500 hover:text-orange-600"
        >
          Retour aux modules
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-orange-500 mb-6 transition-colors"
        disabled={isEditing}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Retour aux modules
      </button>

      {/* Module Details Card */}
      <div className="bg-teal-500 rounded-lg shadow-lg p-1">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-start gap-6">
            {/* Module Image */}
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {module?.photoUrl ? (
                <img
                  src={getImageUrl(module.photoUrl)}
                  alt={module.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex items-center justify-center bg-orange-50';
                      fallback.innerHTML = `
                        <svg class="w-12 h-12 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      `;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-50">
                  <Book className="w-12 h-12 text-orange-300" />
                </div>
              )}
            </div>

            <div className="flex-grow">
              {/* Module Name and Description */}
              {isEditing ? (
                <div className="mb-6">
                  <input
                    type="text"
                    value={editedModule.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-2xl font-bold text-gray-800 mb-2 w-full border-b-2 border-gray-300 focus:border-orange-500 outline-none bg-transparent"
                    placeholder="Nom du module"
                    maxLength={255}
                  />
                  <textarea
                    value={editedModule.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="text-gray-600 w-full border border-gray-300 rounded-md p-2 focus:border-orange-500 outline-none resize-none"
                    rows={3}
                    placeholder="Description du module"
                    maxLength={1000}
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{module.name}</h1>
                  <p className="text-gray-600">{module.description || 'Aucune description'}</p>
                </div>
              )}

              {/* Module Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Période */}
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <CalendarDays className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Période</p>
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          type="date"
                          value={editedModule.startDate || ''}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:border-orange-500 outline-none w-full"
                        />
                        <input
                          type="date"
                          value={editedModule.endDate || ''}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:border-orange-500 outline-none w-full"
                        />
                      </div>
                    ) : (
                      <p className="font-medium">
                        {formatDate(module.startDate)} - {formatDate(module.endDate)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Référentiel */}
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-teal-50">
                    <Users className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Référentiel</p>
                    <p className="font-medium">{module.referential?.name || 'Non défini'}</p>
                  </div>
                </div>

                {/* Coach */}
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <GraduationCap className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Coach</p>
                    <p className="font-medium">
                      {module.coach 
                        ? `${module.coach.firstName} ${module.coach.lastName}`
                        : 'Non assigné'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    <span>Annuler</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEdit}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-orange-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Notes des apprenants</h2>
              <p className="text-xs text-orange-100 mt-1">
                Apprenants actifs du référentiel "{module.referential?.name}"
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white bg-orange-600 px-3 py-1 rounded-full">
                {filteredLearners.length} {filteredLearners.length > 1 ? 'apprenants' : 'apprenant'}
              </span>
              <span className="text-sm text-white bg-green-600 px-3 py-1 rounded-full">
                {gradedCount} {gradedCount > 1 ? 'notés' : 'noté'}
              </span>
              <span className="text-sm text-white bg-teal-600 px-3 py-1 rounded-full">
                {passedCount} {passedCount > 1 ? 'validés' : 'validé'}
              </span>
            </div>
          </div>
        </div>

        {/* Filtres et Export */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barre de recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            {/* Filtre par statut */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="graded">Notés</option>
                <option value="ungraded">Non notés</option>
                <option value="passed">Validés (≥10)</option>
                <option value="failed">Non validés (&lt;10)</option>
              </select>
            </div>

            {/* Bouton Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting || filteredLearners.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exporter PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Indicateur de résultats */}
          {searchTerm || statusFilter !== 'all' ? (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">{filteredLearners.length}</span> résultat(s) trouvé(s)
              {searchTerm && <span> pour "{searchTerm}"</span>}
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apprenant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  État
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commentaire
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Aucun apprenant ne correspond aux critères de recherche'
                      : 'Aucun apprenant trouvé pour ce référentiel'
                    }
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner) => {
                  const existingGrade = getGradeForLearner(learner.id);
                  const isEditingThisGrade = editingGrades[learner.id];
                  const isSavingThisGrade = savingGrades.has(learner.id);
                  
                  return (
                    <tr key={learner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* Photo de l'apprenant */}
                          <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-orange-500">
                            {learner.photoUrl ? (
                              <img
                                src={getImageUrl(learner.photoUrl)}
                                alt={`${learner.firstName} ${learner.lastName}`}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/images/default-avatar.png';
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-orange-50 text-orange-500 text-lg font-semibold">
                                {learner.firstName[0]}
                                {learner.lastName[0]}
                              </div>
                            )}
                          </div>
                          {/* Informations de l'apprenant */}
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {learner.firstName} {learner.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {learner.matricule}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditingThisGrade ? (
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            value={isEditingThisGrade.value}
                            onChange={(e) => handleGradeChange(learner.id, 'value', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:border-orange-500 outline-none"
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 font-semibold">
                            {existingGrade ? `${existingGrade.value}/20` : '-'}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditingThisGrade ? (
                          <span className="text-sm text-gray-400">
                            {isEditingThisGrade.value >= 10 ? 'Validé' : 'Non validé'}
                          </span>
                        ) : (
                          existingGrade ? getGradeStatus(existingGrade.value) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                              Non noté
                            </span>
                          )
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditingThisGrade ? (
                          <textarea
                            value={isEditingThisGrade.comment}
                            onChange={(e) => handleGradeChange(learner.id, 'comment', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:border-orange-500 outline-none resize-none"
                            rows={2}
                            placeholder="Commentaire..."
                            maxLength={500}
                          />
                        ) : (
                          <div className="text-sm text-gray-500 max-w-xs">
                            {existingGrade?.comment || '-'}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isEditingThisGrade ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleSaveGrade(learner.id)}
                              disabled={isSavingThisGrade}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSavingThisGrade ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                              ) : (
                                <Check className="w-4 h-4 mr-1" />
                              )}
                              Sauver
                            </button>
                            <button
                              onClick={() => handleCancelEditGrade(learner.id)}
                              disabled={isSavingThisGrade}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditGrade(learner.id, existingGrade)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600"
                          >
                            {existingGrade ? (
                              <>
                                <Edit3 className="w-4 h-4 mr-1" />
                                Modifier
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}