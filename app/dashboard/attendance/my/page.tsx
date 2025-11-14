"use client"

import { useState, useEffect } from 'react'
import { learnersAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Clock, Calendar, CheckCircle2, XCircle, Search, Upload, AlertCircle, TrendingUp, FileText, Filter } from "lucide-react"
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Pagination from '@/components/common/Pagination'
import { toast } from "sonner"
import { attendanceAPI } from "@/lib/api"
import { AbsenceStatus } from '@/types/attendance'

// Helper function for status badges
function getStatusBadge(status: AbsenceStatus | undefined) {
  switch (status) {
    case 'TO_JUSTIFY':
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-medium">
          <AlertCircle className="w-3 h-3 mr-1" />
          À justifier
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-medium">
          <Clock className="w-3 h-3 mr-1" />
          En attente
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs font-medium">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Justifié
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs font-medium">
          <XCircle className="w-3 h-3 mr-1" />
          Rejeté
        </Badge>
      );
    default:
      return null;
  }
}

export default function MyAttendancePage() {
  const [attendances, setAttendances] = useState<{ 
    id: string, 
    date: string; 
    isPresent: boolean, 
    isLate: boolean; 
    scanTime: string | null; 
    justification?: string; 
    status: "TO_JUSTIFY" | "PENDING" | "REJECTED" | "APPROVED"; 
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showJustifyModal, setShowJustifyModal] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState<{
    id: string;
    date: string;
    isPresent: boolean;
    isLate: boolean;
    scanTime: string | null;
    justification?: string;
    status: "TO_JUSTIFY" | "PENDING" | "REJECTED" | "APPROVED";
  } | null>(null)
  const [justification, setJustification] = useState("")
  const [file, setFile] = useState<File | undefined>(undefined)
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 })
  const [searchDate, setSearchDate] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [submitting, setSubmitting] = useState(false)

  const filteredAttendances = attendances
    .filter(attendance => {
      const matchesDate = !searchDate || format(new Date(attendance.date), 'yyyy-MM-dd') === searchDate
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "present" && attendance.isPresent && !attendance.isLate) ||
        (statusFilter === "late" && attendance.isLate) ||
        (statusFilter === "absent" && !attendance.isPresent) ||
        (statusFilter === "to_justify" && attendance.status === "TO_JUSTIFY")
      
      return matchesDate && matchesStatus
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const paginatedAttendances = filteredAttendances
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const userStr = localStorage.getItem('user')
        if (!userStr) throw new Error('User not found')
        
        const user = JSON.parse(userStr)
        const learnerDetails = await learnersAPI.getLearnerByEmail(user.email)
        const attendanceData = learnerDetails.attendances || []
        
        setAttendances(attendanceData)
        
        // Calculate stats
        const stats = learnersAPI.calculateAttendanceStats(attendanceData)
        const updatedStats = {
          ...stats,
          total: stats.present + stats.absent + stats.late,
        }
        setStats(updatedStats)
      } catch (err) {
        console.error('Error fetching attendance:', err)
        setError('Failed to load attendance data')
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [])

  useEffect(() => {
    const unjustifiedCount = attendances.filter(
      att => att.status === 'TO_JUSTIFY'
    ).length;
  
    if (unjustifiedCount > 0) {
      toast.warning(`Vous avez ${unjustifiedCount} absence(s)/retard(s) à justifier`, {
        duration: 5000,
      });
    }
  }, [attendances]);

  const handleJustify = (attendance) => {
    setSelectedAttendance(attendance)
    setJustification(attendance.justification || "")
    setShowJustifyModal(true)
  }

  const submitJustification = async () => {
    try {
      if (!selectedAttendance || !justification.trim()) {
        toast.error("Veuillez saisir une justification");
        return;
      }

      setSubmitting(true);

      await attendanceAPI.submitJustification(
        selectedAttendance.id,
        justification,
        file || undefined
      );

      // Refresh attendance data after submission
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');
      
      const user = JSON.parse(userStr);
      const learnerDetails = await learnersAPI.getLearnerByEmail(user.email);
      setAttendances(learnerDetails.attendances || []);

      setShowJustifyModal(false);
      setJustification("");
      setFile(undefined);
      
      toast.success("Justification soumise avec succès");
    } catch (err) {
      console.error('Error submitting justification:', err);
      toast.error("Erreur lors de la soumission de la justification");
    } finally {
      setSubmitting(false);
    }
  };

  const getAttendanceRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.present / stats.total) * 100);
  };

  const clearFilters = () => {
    setSearchDate("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Chargement de vos données d'assiduité...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mon Assiduité</h1>
              <p className="text-gray-600 mt-2">Suivez votre présence et gérez vos justifications</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <TrendingUp className="w-4 h-4" />
              <span>Taux de présence: {getAttendanceRate()}%</span>
            </div>
          </div>
          <Separator className="bg-gray-200" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">Présences</p>
                  <p className="text-3xl font-bold text-green-900">{stats.present}</p>
                  <p className="text-xs text-green-600">
                    {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% du total
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-700">Retards</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.late}</p>
                  <p className="text-xs text-orange-600">
                    {stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}% du total
                  </p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <Clock className="w-8 h-8 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-700">Absences</p>
                  <p className="text-3xl font-bold text-red-900">{stats.absent}</p>
                  <p className="text-xs text-red-600">
                    {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}% du total
                  </p>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <XCircle className="w-8 h-8 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-purple-700">Total jours</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.total}</p>
                  <p className="text-xs text-purple-600">Jours comptabilisés</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Calendar className="w-8 h-8 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtres :</span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full sm:w-auto"
                    placeholder="Rechercher par date..."
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full sm:w-auto"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="present">Présent</option>
                  <option value="late">En retard</option>
                  <option value="absent">Absent</option>
                  <option value="to_justify">À justifier</option>
                </select>
                
                {(searchDate || statusFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Effacer
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card className="shadow-sm">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-orange-500" />
                Historique des présences
              </CardTitle>
              <Badge variant="outline" className="text-sm">
                {filteredAttendances.length} résultat(s)
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Heure d'arrivée
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Justification
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedAttendances.length > 0 ? (
                    paginatedAttendances.map((attendance) => (
                      <tr key={attendance.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {format(new Date(attendance.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {attendance.scanTime 
                            ? format(new Date(attendance.scanTime), 'HH:mm')
                            : <span className="text-gray-400 italic">Non enregistré</span>
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attendance.isPresent && !attendance.isLate ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Présent
                            </Badge>
                          ) : attendance.isLate ? (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              <Clock className="w-3 h-3 mr-1" />
                              En retard
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Absent
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {attendance.isPresent && !attendance.isLate ? (
                            <span className="text-gray-400 italic">-</span>
                          ) : (
                            getStatusBadge(attendance.status)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {(attendance.isLate || !attendance.isPresent) && (
                            attendance.status === 'TO_JUSTIFY' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleJustify(attendance)}
                                className="text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Justifier
                              </Button>
                            ) : attendance.status === 'REJECTED' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleJustify(attendance)}
                                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                              >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Rejustifier
                              </Button>
                            ) : attendance.status === 'PENDING' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="text-yellow-600 border-yellow-200 cursor-not-allowed"
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                En cours
                              </Button>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-3">
                          <Calendar className="w-12 h-12 text-gray-300" />
                          <p className="text-lg font-medium">Aucune donnée trouvée</p>
                          <p className="text-sm">Aucun enregistrement ne correspond à vos critères de recherche</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredAttendances.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <Pagination
                  totalItems={filteredAttendances.length}
                  initialItemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Justification Modal */}
        <Dialog open={showJustifyModal} onOpenChange={setShowJustifyModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Justifier votre {selectedAttendance?.isLate ? 'retard' : 'absence'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {selectedAttendance?.status === 'TO_JUSTIFY' 
                  ? "Veuillez fournir une justification pour votre absence/retard du " + 
                    (selectedAttendance ? format(new Date(selectedAttendance.date), 'dd MMMM yyyy', { locale: fr }) : '')
                  : "Veuillez soumettre une nouvelle justification."}
              </DialogDescription>
            </DialogHeader>
            
            {submitting ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600">Envoi de la justification en cours...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Justification <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Expliquez les raisons de votre absence ou retard..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="min-h-[120px] resize-none"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Document justificatif (optionnel)
                  </label>
                  <div className="flex items-center space-x-2">
    <Input
      type="file"
      onChange={(e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
          // Vérifier si c'est une image
          if (!selectedFile.type.startsWith('image/')) {
            toast.error("Veuillez sélectionner une image uniquement");
            e.target.value = ''; // Réinitialiser l'input
            return;
          }
          // Vérifier la taille (max 10MB)
          if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error("La taille de l'image ne doit pas dépasser 10MB");
            e.target.value = '';
            return;
          }
          setFile(selectedFile);
        }
      }}
      accept="image/*"
      className="cursor-pointer"
    />
    <Upload className="w-4 h-4 text-gray-400" />
  </div>
  {file && (
    <div className="flex items-center justify-between space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
      <div className="flex items-center space-x-2">
        <FileText className="w-4 h-4" />
        <span>Image sélectionnée : {file.name}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setFile(undefined)}
        className="h-6 w-6 p-0 hover:bg-gray-200"
      >
        <XCircle className="w-4 h-4 text-gray-500" />
      </Button>
    </div>
  )}
  <p className="text-xs text-gray-500">
    Formats acceptés : JPG, JPEG, PNG, GIF, WebP (Max 10MB)
  </p>
</div>
              </div>
            )}
            
            <DialogFooter className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowJustifyModal(false);
                  setJustification("");
                  setFile(undefined);
                }}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button 
                onClick={submitJustification}
                disabled={!justification.trim() || submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Envoyer la justification
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}