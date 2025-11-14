'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Book, User, Award, TrendingUp, TrendingDown, Minus, GraduationCap } from 'lucide-react';
import { referentialsAPI, modulesAPI, gradesAPI, learnersAPI, Referential, Module, Learner, Grade } from '@/lib/api';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { toast } from "sonner";
import { getImageUrl } from '@/lib/utils/imageUrl';

interface GradeWithLearner extends Grade {
  learner?: Learner;
  module?: Module;
}

export default function GradesFilterPage() {
  // États pour les données
  const [referentials, setReferentials] = useState<Referential[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [grades, setGrades] = useState<GradeWithLearner[]>([]);
  
  // États de sélection
  const [selectedReferential, setSelectedReferential] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  
  // États de chargement
  const [loading, setLoading] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState('');
  
  // États de filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'grade-asc' | 'grade-desc'>('name');
  const [isExporting, setIsExporting] = useState(false);

  // Charger les référentiels au démarrage
  useEffect(() => {
    const fetchReferentials = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching referentials...');
        const refsData = await referentialsAPI.getAllReferentials();
        console.log('✅ Referentials loaded:', refsData);
        setReferentials(refsData);
      } catch (err) {
        console.error('❌ Error fetching referentials:', err);
        setError('Erreur lors du chargement des référentiels');
        toast.error('Erreur lors du chargement des référentiels');
      } finally {
        setLoading(false);
      }
    };

    fetchReferentials();
  }, []);

  // Charger les modules quand un référentiel est sélectionné
  useEffect(() => {
    const fetchModules = async () => {
      if (!selectedReferential) {
        setModules([]);
        setSelectedModule('all');
        setGrades([]);
        return;
      }

      try {
        setLoadingModules(true);
        console.log('🔄 Fetching modules for referential:', selectedReferential);
        
        const allModules = await modulesAPI.getAllModules();
        const filteredModules = allModules.filter(m => m.refId === selectedReferential);
        
        console.log('✅ Modules filtered:', filteredModules.length);
        setModules(filteredModules);
        
        setSelectedModule('all');
      } catch (err) {
        console.error('❌ Error fetching modules:', err);
        toast.error('Erreur lors du chargement des modules');
        setModules([]);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, [selectedReferential]);

  // Charger les notes quand un module est sélectionné
  useEffect(() => {
    const fetchGrades = async () => {
      if (!selectedReferential) {
        setGrades([]);
        return;
      }

      try {
        setLoadingGrades(true);
        console.log('🔄 Fetching grades...');
        
        let gradesData: Grade[] = [];
        
        if (selectedModule === 'all') {
          console.log('📊 Loading grades for all modules');
          const gradesPromises = modules.map(module => 
            gradesAPI.getGradesByModule(module.id)
          );
          const allGradesArrays = await Promise.all(gradesPromises);
          gradesData = allGradesArrays.flat();
        } else {
          console.log('📊 Loading grades for module:', selectedModule);
          gradesData = await gradesAPI.getGradesByModule(selectedModule);
        }

        console.log('✅ Grades received:', gradesData);

        const allLearners = await learnersAPI.getAllLearners();
        
        const enrichedGrades: GradeWithLearner[] = gradesData.map(grade => {
          const module = modules.find(m => m.id === grade.moduleId);
          return {
            ...grade,
            learner: allLearners.find(l => l.id === grade.learnerId),
            module: module
          };
        });

        console.log('✅ Enriched grades:', enrichedGrades);
        setGrades(enrichedGrades);
      } catch (err) {
        console.error('❌ Error fetching grades:', err);
        toast.error('Erreur lors du chargement des notes');
        setGrades([]);
      } finally {
        setLoadingGrades(false);
      }
    };

    fetchGrades();
  }, [selectedModule, selectedReferential, modules]);

  // Filtrer et trier les notes
  const getFilteredAndSortedGrades = () => {
    let filtered = [...grades];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(grade => {
        if (!grade.learner) return false;
        return (
          grade.learner.firstName.toLowerCase().includes(search) ||
          grade.learner.lastName.toLowerCase().includes(search) ||
          grade.learner.matricule.toLowerCase().includes(search)
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(grade => {
        if (statusFilter === 'passed') return grade.value >= 10;
        if (statusFilter === 'failed') return grade.value < 10;
        return true;
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = `${a.learner?.firstName || ''} ${a.learner?.lastName || ''}`;
          const nameB = `${b.learner?.firstName || ''} ${b.learner?.lastName || ''}`;
          return nameA.localeCompare(nameB);
        case 'grade-asc':
          return a.value - b.value;
        case 'grade-desc':
          return b.value - a.value;
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Calculer les statistiques
  const getStatistics = () => {
    const filteredGrades = getFilteredAndSortedGrades();
    const total = filteredGrades.length;
    const passed = filteredGrades.filter(g => g.value >= 10).length;
    const failed = filteredGrades.filter(g => g.value < 10).length;
    const average = total > 0 
      ? (filteredGrades.reduce((sum, g) => sum + g.value, 0) / total).toFixed(2)
      : '0';

    return { total, passed, failed, average };
  };

  // Fonction pour obtenir l'appréciation selon la note
  const getAppreciation = (value: number): string => {
    if (value >= 16) return 'TRES BIEN';
    if (value >= 14) return 'BIEN';
    if (value >= 12) return 'ASSEZ BIEN';
    if (value >= 10) return 'PASSABLE';
    return 'INSUFFISANT';
  };

  // Export PDF au format relevé de notes
  const handleExportPDF = async () => {
    const selectedRef = referentials.find(r => r.id === selectedReferential);
    
    if (!selectedRef || !selectedModule) {
      toast.error('Référentiel ou module non sélectionné');
      return;
    }

    // Si un seul module est sélectionné, on doit avoir un apprenant unique
    // if (selectedModule !== 'all') {
    //   toast.info('Pour un relevé de notes individuel, veuillez sélectionner un apprenant spécifique');
    //   return;
    // }

    try {
      setIsExporting(true);
      
      const filteredGrades = getFilteredAndSortedGrades();
      
      // Grouper les notes par apprenant
      const gradesByLearner = filteredGrades.reduce((acc, grade) => {
        const learnerId = grade.learnerId;
        if (!acc[learnerId]) {
          acc[learnerId] = [];
        }
        acc[learnerId].push(grade);
        return acc;
      }, {} as Record<string, GradeWithLearner[]>);

      // Générer un relevé pour chaque apprenant
      for (const [learnerId, learnerGrades] of Object.entries(gradesByLearner)) {
        const learner = learnerGrades[0]?.learner;
        if (!learner) continue;

        // Charger les détails complets de l'apprenant
        let learnerDetails = learner;
        try {
          const fullDetails = await learnersAPI.getLearnerById(learnerId);
          learnerDetails = { ...learner, ...fullDetails };
        } catch (err) {
          console.error('Erreur chargement apprenant:', err);
          // Continuer avec les données de base
        }

        const average = (learnerGrades.reduce((sum, g) => sum + g.value, 0) / learnerGrades.length).toFixed(2);
        
        // Trier les modules par ordre alphabétique
        learnerGrades.sort((a, b) => {
          const nameA = a.module?.name || '';
          const nameB = b.module?.name || '';
          return nameA.localeCompare(nameB);
        });
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="color-scheme" content="light">
            <title>Relevé de notes - ${learner.firstName} ${learner.lastName}</title>
            <style>
              @page { 
                size: A4; 
                margin: 20mm 15mm;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body { 
                font-family: 'Arial', sans-serif;
                color: #000;
                background: white;
                padding: 0;
                line-height: 1.3;
                font-size: 11pt;
              }
              
              /* En-tête avec logos */
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 15px;
                padding-bottom: 10px;
              }
              .logo-left, .logo-right {
                width: 120px;
              }
              .logo-left img, .logo-right img {
                width: 100%;
                height: auto;
              }
              .center-info {
                flex: 1;
                text-align: center;
                padding: 0 20px;
              }
              .center-info h2 {
                font-size: 13pt;
                margin-bottom: 3px;
                font-weight: bold;
              }
              .center-info p {
                font-size: 9pt;
                color: #333;
                margin: 2px 0;
              }
              
              /* Titre et informations */
            .info-block {
    margin: 15px 0;
    font-size: 10pt;
    line-height: 1.6;
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* 2 colonnes */
    gap: 5px 20px; /* espace réduit entre les lignes et colonnes */
  }

  .info-block div {
    display: flex;
    align-items: center;
  }

  .info-label {
    font-weight: bold;
    margin-right: 4px; /* petit espace entre label et valeur */
    width: auto; /* enlève la largeur fixe */
    display: inline;
  }
              
              /* Titre du relevé */
              .main-title {
                text-align: center;
                margin: 20px 0 15px 0;
                font-size: 14pt;
                font-weight: bold;
                text-decoration: underline;
              }
              
              /* Tableau des notes */
              .grades-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 10pt;
              }
              .grades-table thead {
                background-color: #FFD700 !important;
                font-weight: bold;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .grades-table th {
                padding: 8px;
                text-align: center;
                border: 1px solid #000;
                font-size: 10pt;
                background-color: #FFD700 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .grades-table td {
                padding: 6px 8px;
                border: 1px solid #000;
                text-align: center;
                background-color: #c4ee98cd !important;
              }
              .grades-table td.module-name {
                text-align: left;
                padding-left: 10px;
              }
              .grades-table tfoot {
                background-color: #FFD700 !important;
                font-weight: bold;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .grades-table tfoot td {
                padding: 8px;
                background-color: #FFD700 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Pied de page */
              .footer {
                margin-top: 30px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .signature-block {
                text-align: center;
                font-size: 9pt;
              }
              .signature-block div {
                margin: 3px 0;
              }
              .blue-text {
                color: #0000 !important;
                font-weight: bold;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Bas de page avec logos */
            .bottom-banner {
    position: fixed; /* reste collée en bas */
    bottom: 0;
    left: 0;
    width: 100%;
    background: white; /* facultatif */
    border-top: 2px solid white;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 100; /* pour qu’elle reste au-dessus du contenu */
  }

  .bottom-banner img {
    width: 100%;
    max-height: 180px; /* ajuste la hauteur */
    object-fit: cover;
  }
              .bottom-left {
                width: 100px;
              }
              .bottom-center {
                flex: 1;
                text-align: center;
                font-size: 9pt;
              }
              .bottom-center div {
                margin: 2px 0;
              }
              .bottom-right {
                width: 100px;
                text-align: right;
              }
              
              .footer-logo {
                width: 80px;
              }
              
              .footer-text {
                text-align: center;
                flex: 1;
              }
              
              .footer-title {
                font-size: 14px;
                font-weight: bold;
                color: #000;
                margin-bottom: 5px;
              }
              
              .footer-subtitle {
                font-size: 10px;
                color: #666;
                font-style: italic;
              }
              
              .footer-right {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
              }
              
              .footer-school {
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 3px;
              }
              
              .footer-orange {
                width: 50px;
              }
              
              /* Impression */
              @media print {
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                body { 
                  padding: 0;
                  background: white !important;
                }
                .grades-table { 
                  page-break-inside: avoid;
                }
                .grades-table thead,
                .grades-table tfoot {
                  background-color: #FFD700 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .blue-text {
                  color: #0066CC !important;
                }
              }
            </style>
          </head>
          <body>
            <!-- En-tête -->
            <div class="header">
                <div class="logo-left">
                <img src="https://www.afrikatech.com/wp-content/uploads/2017/09/Logo-Sonatel-Academy-480_1-1.png"/>
              </div>
             
              <div class="logo-right">
                <img src="https://th.bing.com/th/id/OIP.LfRns_Ut41KuR94L5IQjTwHaE8?w=253&h=180&c=7&r=0&o=7&cb=ucfimgc2&dpr=1.3&pid=1.7&rm=3"/>
              </div>
            </div>
            </div>

            <!-- Informations personnelles -->
<div class="info-block">
  <div><span class="info-label">Spécialité:</span>DEVELOPPEMENT D'APPLICATION</div>
  <div><span class="info-label">Référentiel:</span>${selectedRef.name}</div>
  <div><span class="info-label">Prénom & Nom:</span>${learner.firstName} ${learner.lastName}</div>
  <div><span class="info-label">Promotion:</span>${learnerDetails.promotion?.name || 'Cohorte 4 - 2022'}</div>
  <div><span class="info-label">Date de naissance:</span>${learnerDetails.birthDate ? format(new Date(learnerDetails.birthDate), 'dd/MM/yyyy') : 'N/A'}</div>
  <div><span class="info-label">Lieu de Naissance:</span>${learnerDetails.birthPlace || 'N/A'}</div>
</div>

            <!-- Titre -->
            <div class="main-title">Relevé de notes</div>

            <!-- Tableau des notes -->
            <table class="grades-table">
              <thead>
                <tr>
                  <th style="width: 50%;">MODULES</th>
                  <th style="width: 12%;">NOTES</th>
                  <th style="width: 15%;">STATUT</th>
                  <th style="width: 23%;">APPRECIATIONS</th>
                </tr>
              </thead>
              <tbody>
                ${learnerGrades.map(grade => {
                  const appreciation = getAppreciation(grade.value);
                  return `
                    <tr>
                      <td class="module-name">${grade.module?.name || '-'}</td>
                      <td>${grade.value}</td>
                      <td>${grade.value >= 10 ? 'VALIDE' : 'VALIDE'}</td>
                      <td>${appreciation}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td  style="text-align: left; padding-right: 15px;">MOYENNE GENERALE</td>
                  <td colspan="3" style="font-size: 12pt;">${average}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Signatures -->
            <div class="footer ">
              <div class="signature-block">
                
                
              </div>
              <div class="signature-block">
                <div class="blue-text"></div>
                <div class="blue-text"></div>
                <div style="margin-top: 10px;"><strong></strong></div>
                <div style="margin-top: 40px;"></div>
              </div>
            </div>
              
            <!-- Bannière du bas -->
            <div class="bottom-banner">
           
                <img src="https://res.cloudinary.com/dvogvsvzz/image/upload/v1762767224/Capture_d_%C3%A9cran_2025-11-09_132921_jzjf1p.png"/>
             
             </div>
          </body>
          </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Releve-de-notes-${learner.firstName}-${learner.lastName}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success('Relevé(s) de notes généré(s) ! Ouvrez le(s) fichier(s) HTML et imprimez en PDF');
    } catch (err) {
      console.error('❌ Error exporting:', err);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredGrades = getFilteredAndSortedGrades();
  const stats = getStatistics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="text-orange-500 hover:text-orange-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal-600 mb-2">Consultation des Notes</h1>
          <p className="text-gray-600">Sélectionnez un référentiel puis un ou tous les modules pour consulter les notes</p>
        </div>

        {/* Étape 1: Sélection du référentiel */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-teal-500 p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-white font-bold mr-3">
              1
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Choisir un référentiel</h2>
          </div>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedReferential}
              onChange={(e) => {
                setSelectedReferential(e.target.value);
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none text-gray-700 bg-white"
            >
              <option value="">-- Sélectionner un référentiel --</option>
              {referentials.map((ref) => (
                <option key={ref.id} value={ref.id}>
                  {ref.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Étape 2: Sélection du module */}
        {selectedReferential && (
          <div className={`bg-white rounded-lg shadow-sm border-2 ${selectedModule ? 'border-teal-500' : 'border-gray-200'} p-6 mb-6 transition-all`}>
            <div className="flex items-center mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${selectedModule ? 'bg-teal-500' : 'bg-gray-300'} text-white font-bold mr-3`}>
                2
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Choisir un module</h2>
            </div>
            {loadingModules ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                <span className="ml-3 text-gray-600">Chargement des modules...</span>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun module disponible pour ce référentiel
              </div>
            ) : (
              <div className="relative">
                <Book className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedModule}
                  onChange={(e) => {
                    setSelectedModule(e.target.value);
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none text-gray-700 bg-white"
                >
                  <option value="all">🔖 Tous les modules ({modules.length})</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Étape 3: Notes */}
        {selectedModule && (
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total notes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-teal-50 rounded-lg">
                    <Award className="w-6 h-6 text-teal-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Validés</p>
                    <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Non validés</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Moyenne</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.average}/20</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Minus className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Recherche */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou matricule..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                {/* Filtre statut */}
                <div className="w-full md:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  >
                    <option value="all">Tous</option>
                    <option value="passed">Validés (≥10)</option>
                    <option value="failed">Non validés (&lt;10)</option>
                  </select>
                </div>

                {/* Tri */}
                <div className="w-full md:w-48">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  >
                    <option value="name">Trier par nom</option>
                    <option value="grade-asc">Note croissante</option>
                    <option value="grade-desc">Note décroissante</option>
                  </select>
                </div>

                {/* Export */}
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting || filteredGrades.length === 0}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Export...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export PDF</span>
                    </>
                  )}
                </button>
              </div>

              {/* Indicateur résultats */}
              {(searchTerm || statusFilter !== 'all') && (
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">{filteredGrades.length}</span> résultat(s) trouvé(s)
                </div>
              )}
            </div>

            {/* Tableau des notes */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                {loadingGrades ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Chargement des notes...</p>
                  </div>
                ) : filteredGrades.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    {grades.length === 0 
                      ? 'Aucune note pour ce module'
                      : 'Aucune note ne correspond aux critères de recherche'
                    }
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-teal-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">N°</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Apprenant</th>
                        {selectedModule === 'all' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Module</th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Note</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredGrades.map((grade, index) => (
                        <tr key={grade.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-teal-500">
                                {grade.learner?.photoUrl ? (
                                  <img
                                    src={getImageUrl(grade.learner.photoUrl)}
                                    alt={`${grade.learner.firstName} ${grade.learner.lastName}`}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.src = '/images/default-avatar.png';
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-teal-50 text-teal-600 text-sm font-semibold">
                                    {grade.learner?.firstName[0]}{grade.learner?.lastName[0]}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {grade.learner?.firstName} {grade.learner?.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {grade.learner?.matricule}
                                </div>
                              </div>
                            </div>
                          </td>
                          {selectedModule === 'all' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {grade.module?.name || '-'}
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              {grade.value}/20
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {grade.value >= 10 ? (
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Validé
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Non validé
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {grade.comment || '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message initial */}
        {!selectedReferential && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Sélectionnez un référentiel pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}