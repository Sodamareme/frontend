"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { learnersAPI, promotionsAPI, type Learner, type Promotion } from "@/lib/api"
import { Plus, Search, DownloadIcon, Users,Upload } from "lucide-react"
import LearnerCard from "@/components/dashboard/LearnerCard"
import Pagination from "@/components/common/Pagination"
import AddLearnerModal from "@/components/modals/AddLearnerModal"
import { toast } from "sonner"
import { Button } from "@headlessui/react"
import { LearnerFormSubmitData } from "@/lib/types"
import BulkImportModal from "../../../components/modals/BulkImportModal";

export default function LearnersPage() {
  const [learners, setLearners] = useState<Learner[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [view, setView] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>(["ACTIVE", "REPLACEMENT"])
  const [promotionFilter, setPromotionFilter] = useState<string>("")
  const [referentialFilter, setReferentialFilter] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")

      // Fetch learners and promotions in parallel
      const [learnersData, promotionsData] = await Promise.all([
        learnersAPI.getAllLearners(),
        promotionsAPI.getAllPromotions(),
      ])

      setLearners(learnersData)
      setPromotions(promotionsData)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Une erreur est survenue lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const setActivePromotionAsDefault = async () => {
      try {
        const activePromotion = promotions.find((p) => p.status === "ACTIVE")
        if (activePromotion) {
          setPromotionFilter(activePromotion.id)
        }
      } catch (error) {
        console.error("Error setting active promotion:", error)
      }
    }

    if (promotions.length > 0) {
      setActivePromotionAsDefault()
    }
  }, [promotions])

  // Filter learners based on search query, status filter, and promotion filter
  const filteredLearners = learners
    .filter((learner) => {
      const fullName = `${learner.firstName} ${learner.lastName}`.toLowerCase()
      return searchQuery === "" || fullName.includes(searchQuery.toLowerCase())
    })
    .filter((learner) => {
      return statusFilter.length === 0 || statusFilter.includes(learner.status)
    })
    .filter((learner) => {
      return !promotionFilter || learner.promotionId === promotionFilter
    })
    .filter((learner) => {
      return !referentialFilter || learner.referential?.id === referentialFilter
    })

  // Status options for filter
  const statusOptions = [
    { value: "ACTIVE", label: "Actif" },
    { value: "WAITING", label: "En attente" },
    { value: "ABANDONED", label: "Abandon" },
    { value: "REPLACEMENT", label: "Remplacement" },
    { value: "REPLACED", label: "Remplacé" },
  ]

  // Helper functions
  const getReferentialBadgeClass = (referentialName: string) => {
    switch (referentialName) {
      case "AWS & DevOps":
        return "bg-orange-100 text-orange-800 px-3 py-1 w-fit rounded-lg"
      case "Développement web/mobile":
        return "bg-green-100 text-green-800 px-3 py-1 rounded-lg"
      case "Assistanat Digital (Hackeuse)":
        return "bg-pink-100 text-pink-800 px-3 py-1 rounded-lg"
      case "Développement data":
        return "bg-purple-100 text-purple-800 px-3 py-1 rounded-lg"
      case "Référent digital":
        return "bg-blue-100 text-blue-800 px-3 py-1 rounded-lg"
      default:
        return "bg-gray-100 text-gray-800 px-3 py-1 rounded-lg"
    }
  }

  const getReferentialAlias = (referentialName: string) => {
    switch (referentialName) {
      case "AWS & DevOps":
        return "AWS"
      case "Développement web/mobile":
        return "DEV WEB/MOBILE"
      case "Assistanat Digital (Hackeuse)":
        return "HACKEUSE"
      case "Développement data":
        return "DEV DATA"
      case "Référent digital":
        return "REF DIG"
      default:
        return referentialName
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border border-green-200"
      case "WAITING":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "ABANDONED":
        return "bg-red-100 text-red-800 border border-red-200"
      case "REPLACEMENT":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      case "REPLACED":
        return "bg-orange-100 text-orange-800 border border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Actif"
      case "WAITING":
        return "En attente"
      case "ABANDONED":
        return "Abandon"
      case "REPLACEMENT":
        return "Remplacement"
      case "REPLACED":
        return "Remplacé"
      default:
        return "Inconnu"
    }
  }

  const getPromotionYear = (promotionName: string | undefined) => {
    if (!promotionName) return "N/A"
    const match = promotionName.match(/\d{4}/)
    return match ? match[0] : "N/A"
  }

  // Fonction utilitaire pour convertir les données en CSV
  const convertToCSV = (data: Record<string, any>[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Échapper les guillemets et entourer de guillemets si nécessaire
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  // Fonction d'export CSV
  const exportToCSV = () => {
    try {
      // Préparer les données pour l'export
      const exportData = filteredLearners.map(learner => {
        const promotion = promotions.find(p => p.id === learner.promotionId);
        
        return {
          'Prénom': learner.firstName,
          'Nom': learner.lastName,
          'Email': learner.email,
          'Téléphone': learner.phone,
          'Adresse': learner.address,
          'Genre': learner.gender === 'MALE' ? 'Homme' : 'Femme',
          'Date de naissance': learner.birthDate ? new Date(learner.birthDate).toLocaleDateString('fr-FR') : 'N/A',
          'Lieu de naissance': learner.birthPlace || 'N/A',
          'Matricule': learner.matricule || 'Non assigné',
          'Statut': formatStatusLabel(learner.status),
          'Référentiel': learner.referential?.name || 'Non assigné',
          'Promotion': promotion?.name || 'Non assigné',
          'Année promotion': getPromotionYear(promotion?.name),
          'Tuteur - Prénom': learner.tutor?.firstName || 'N/A',
          'Tuteur - Nom': learner.tutor?.lastName || 'N/A',
          'Tuteur - Téléphone': learner.tutor?.phone || 'N/A',
          'Tuteur - Email': learner.tutor?.email || 'N/A',
          'Tuteur - Adresse': learner.tutor?.address || 'N/A'
        };
      });

      // Convertir en CSV
      const csvContent = convertToCSV(exportData);
      
      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Générer le nom du fichier avec la date
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const fileName = `apprenants_${dateString}.csv`;
        
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Nettoyer l'URL
        URL.revokeObjectURL(url);
        
        // Afficher un message de succès
        toast.success('Export réussi', {
          description: `${filteredLearners.length} apprenants exportés avec succès`,
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export', {
        description: 'Une erreur est survenue lors de l\'export des données',
      });
    }
  };

  const uniqueReferentials = useMemo(() => {
    const referentials = learners
      .map((l) => l.referential)
      .filter(Boolean)
      .reduce((unique: any[], ref) => {
        if (!unique.find((r) => r.id === ref?.id)) {
          unique.push(ref)
        }
        return unique
      }, [])

    return referentials.sort((a, b) => a.name.localeCompare(b.name))
  }, [learners])

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredLearners.slice(indexOfFirstItem, indexOfLastItem)

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
  }

  async function handleAddLearner(data: LearnerFormSubmitData) {
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      
      // Format de la date de naissance
      const birthDate = new Date(data.birthDate);
      const formattedBirthDate = birthDate.toISOString();

      // Ajouter la photo
      if (data.photoFile && data.photoFile instanceof File) {
        formData.append('photoFile', data.photoFile);
      }

      // Ajouter les champs de base de l'apprenant
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('address', data.address);
      formData.append('gender', data.gender);
      formData.append('birthDate', formattedBirthDate);
      formData.append('birthPlace', data.birthPlace);
      formData.append('promotionId', data.promotionId);
      formData.append('refId', data.refId);
      formData.append('status', data.status);

      // Ajouter les champs du tuteur
      formData.append('tutor[firstName]', data.tutor.firstName);
      formData.append('tutor[lastName]', data.tutor.lastName);
      formData.append('tutor[phone]', data.tutor.phone);
      formData.append('tutor[email]', data.tutor.email || '');
      formData.append('tutor[address]', data.tutor.address);

      console.log('Données envoyées:', {
        formData: Object.fromEntries(formData.entries()),
        photoFile: data.photoFile ? data.photoFile.name : 'Pas de photo'
      });

      const response = await learnersAPI.createLearner(formData);
      
      if (response) {
        toast.success("Apprenant ajouté avec succès", {
          description: `${data.firstName} ${data.lastName} a été ajouté à la promotion`,
        });
        setShowAddModal(false);
        await fetchData();
      }
    } catch (error: any) {
      console.error('Error details:', error);
      toast.error("Erreur lors de l'ajout de l'apprenant", {
        description: error.response?.data?.message || "Veuillez réessayer",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusUpdate(id: string, status: string, reason?: string) {
    try {
      // Code pour mise à jour du statut
      toast.success("Statut mis à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-800">Apprenants</h1>
    <p className="text-gray-600">Gérer les apprenants de l'académie</p>
  </div>

  <div className="mt-4 md:mt-0 flex gap-2">
    {/* <Button
      onClick={() => setShowBulkImportModal(true)}
      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      <Upload size={18} className="mr-2" />
      Import en masse
    </Button> */}
    
    <Button
      onClick={() => setShowAddModal(true)}
      className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
    >
      <Plus size={18} className="mr-2" />
      Ajouter un apprenant
    </Button>
  </div>
</div>

      {/* Search and filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="md:w-1/4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Referential filter */}
          <div className="w-full md:w-48">
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={referentialFilter}
              onChange={(e) => setReferentialFilter(e.target.value)}
            >
              <option value="">Tous les référentiels</option>
              {uniqueReferentials.map((ref) => (
                <option key={ref?.id} value={ref?.id}>
                  {getReferentialAlias(ref?.name || "")}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="w-full md:w-48">
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={statusFilter}
              onChange={(e) => {
                const options = e.target.selectedOptions
                const values = Array.from(options).map((option) => option.value)
                setStatusFilter(values)
              }}
              multiple={true}
              size={1}
              style={{ height: "42px" }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Promotion filter */}
          <div className="w-full md:w-48">
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={promotionFilter}
              onChange={(e) => setPromotionFilter(e.target.value)}
            >
              <option value="">Toutes les promotions</option>
              {promotions
                .sort((a, b) => (b.status === "ACTIVE" ? 1 : -1))
                .map((promotion) => (
                  <option key={promotion.id} value={promotion.id}>
                    {promotion.name} {promotion.status === "ACTIVE" ? "(Active)" : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* View options */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={`px-3 py-2 ${view === "grid" ? "bg-orange-500 text-white" : "bg-white text-gray-700"}`}
              onClick={() => setView("grid")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-layout-grid"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </button>
            <button
              className={`px-3 py-2 ${view === "list" ? "bg-orange-500 text-white" : "bg-white text-gray-700"}`}
              onClick={() => setView("list")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-list"
              >
                <line x1="8" x2="21" y1="6" y2="6" />
                <line x1="8" x2="21" y1="12" y2="12" />
                <line x1="8" x2="21" y1="18" y2="18" />
                <line x1="3" x2="3.01" y1="6" y2="6" />
                <line x1="3" x2="3.01" y1="12" y2="12" />
                <line x1="3" x2="3.01" y1="18" y2="18" />
              </svg>
            </button>
          </div>
          
          {/* Export button */}
          <button 
            onClick={exportToCSV}
            className={`flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors ${
              filteredLearners.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={filteredLearners.length === 0}
          >
            <DownloadIcon size={18} className="mr-2" />
            Exporter ({filteredLearners.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 h-32 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : filteredLearners.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun apprenant trouvé</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter || promotionFilter
              ? "Essayez d'ajuster vos filtres pour trouver des apprenants"
              : "Il n'y a actuellement aucun apprenant dans la base de données"}
          </p>
          <Link
            href="/dashboard/learners/new"
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Ajouter un apprenant
          </Link>
        </div>
      ) : view === "grid" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentItems.map((learner) => (
              <LearnerCard key={learner.id} learner={learner} />
            ))}
          </div>
          <Pagination
            totalItems={filteredLearners.length}
            initialItemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-orange-500 text-white">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Apprenant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Genre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Matricule
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Référentiel
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((learner) => {
                  const promotion = promotions.find((p) => p.id === learner.promotionId)
                  
                  return (
                    <tr key={learner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/dashboard/learners/${learner.id}`} className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium">
                            {learner.photoUrl ? (
                              <img
                                src={learner.photoUrl || "/placeholder.svg"}
                                alt={`${learner.firstName} ${learner.lastName}`}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              `${learner.firstName.charAt(0)}${learner.lastName.charAt(0)}`
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {learner.firstName} {learner.lastName}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          <span
                            className={`px-2 py-1 inline-flex text-xs font-medium rounded-full ${
                              learner.gender === "MALE" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                            }`}
                          >
                            {learner.gender === "MALE" ? "Homme" : "Femme"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{learner.matricule || "Non assigné"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{learner.phone}</div>
                        <div className="text-sm text-gray-500">{learner.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${getReferentialBadgeClass(learner.referential?.name || "Non assigné")}`}>
                          {getReferentialAlias(learner.referential?.name || "Non assigné")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-lg ${getStatusBadgeClass(learner.status)}`}>
                          {formatStatusLabel(learner.status)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            totalItems={filteredLearners.length}
            initialItemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      )}
      
      <AddLearnerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        promotions={promotions}
        referentials={uniqueReferentials}
        onSubmit={handleAddLearner}
        isSubmitting={isSubmitting}
      />
      <AddLearnerModal
  isOpen={showAddModal}
  onClose={() => setShowAddModal(false)}
  promotions={promotions}
  referentials={uniqueReferentials}
  onSubmit={handleAddLearner}
  isSubmitting={isSubmitting}
/>

<BulkImportModal
  isOpen={showBulkImportModal}
  onClose={() => setShowBulkImportModal(false)}
  onSuccess={() => {
    setShowBulkImportModal(false);
    fetchData(); // Recharger les données après import
  }}
/>
    </div>
  )
  
}