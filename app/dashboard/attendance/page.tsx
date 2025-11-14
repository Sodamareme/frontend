"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { attendanceAPI, learnersAPI, type Learner, type LearnerAttendance } from "@/lib/api"
import { Search, Download, MoreVertical, Users, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Pagination from '@/components/common/Pagination'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { 
  DateFilterType, 
  AttendanceStats, 
  DATE_FILTER_OPTIONS,
  AttendanceFilters,
  JustificationStatus
} from "./types"
import { toast } from "sonner"
import JustificationReviewModal from "@/components/modals/JustificationReviewModal"
import { useRouter, useSearchParams } from 'next/navigation'

// First, define the status options constant at the top of the file
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'present', label: 'Présent' },
  { value: 'late', label: 'En retard' },
  { value: 'absent', label: 'Absent' }
] as const;

// Add this helper function at the top of your component
const formatDateForInput = (date: string, filterType: DateFilterType): string => {
  const d = new Date(date);
  
  switch (filterType) {
    case 'week': {
      // Get the first day of the week (Monday)
      const day = d.getUTCDate() - d.getUTCDay() + (d.getUTCDay() === 0 ? -6 : 1);
      const week = new Date(d.setUTCDate(day));
      
      // Format as YYYY-Www
      const year = week.getUTCFullYear();
      const weekNum = Math.ceil((((week.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7);
      return `${year}-W${weekNum.toString().padStart(2, '0')}`;
    }
    case 'month':
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    case 'year':
      return `${d.getFullYear()}`;
    default:
      return date;
  }
};

// Premièrement, définissez correctement le type AttendanceRecord
interface AttendanceRecord {
  id: string;
  date: string;
  isLate: boolean;
  isPresent: boolean;
  scanTime?: string;
  status?: 'TO_JUSTIFY' | 'PENDING' | 'APPROVED' | 'REJECTED';
  justification?: string;
  documentUrl?: string;
  learner: {
    firstName: string;
    lastName: string;
    matricule: string;
    photoUrl?: string;
    referential?: {
      name: string;
    };
  };
}

export default function AttendancePage() {
  // Add this near the top of your component
  const router = useRouter();
  const searchParams = useSearchParams();

  // États pour les filtres
  const [dateFilter, setDateFilter] = useState<DateFilterType>('day')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // États pour les données
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    late: 0,
    absent: 0,
    total: 0
  })
  const [attendanceRecords, setAttendanceRecords] = useState<LearnerAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Add this near your other state declarations
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  // Ajoutez l'état pour le modal
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null)
  const [showJustificationModal, setShowJustificationModal] = useState(false)

  const handleCloseModal = useCallback(() => {
    // Nettoyer les attributs
   
    
    setShowJustificationModal(false)
    // Attendre que l'animation de fermeture soit terminée
    setTimeout(() => {
      setSelectedAttendance(null)
    }, 300)
  }, [])

  const handleJustificationClick = useCallback((attendance: AttendanceRecord) => {
    setSelectedAttendance(attendance)
    setShowJustificationModal(true)
  }, [])

const handleStatusUpdate = async (attendanceId: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    try {
      console.log('📤 Updating attendance status:', {
        attendanceId,
        newStatus: status,
        comment: comment || 'No comment',
        currentStatus: attendanceRecords.find(r => r.id === attendanceId)?.status
      });
      
      await attendanceAPI.updateJustificationStatus(attendanceId, status, comment);
      
      // Recharger TOUTES les données
      setIsLoadingRecords(true);
      await fetchStats();
      
      toast.success(
        status === 'APPROVED' 
          ? 'Justification approuvée avec succès' 
          : 'Justification rejetée'
      );
      
      // Forcer la fermeture du modal et le rafraîchissement
      handleCloseModal();
    } catch (error: any) {
      console.error('Error updating status:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setIsLoadingRecords(false);
    }
  };
  // Add this function to handle different date input types
  const getDateInputType = () => {
    switch (dateFilter) {
      case 'day':
        return 'date';
      case 'week':
        return 'week';
      case 'month':
        return 'month';
      case 'year':
        return 'month'; // HTML doesn't have a year input, so we'll use month
      default:
        return 'date';
    }
  };

  // Fonction pour charger les statistiques selon le filtre de date
  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      console.log('Fetching stats for:', { dateFilter, selectedDate });
      
      let data;
      
      switch (dateFilter) {
        case 'day':
          data = await attendanceAPI.getDailyStats(selectedDate);
          break;
        
        case 'week': {
          const weekDate = formatDateForInput(selectedDate, 'week');
          data = await attendanceAPI.getWeeklyStats(weekDate);
          break;
        }
        
        case 'month': {
          const [year, month] = selectedDate.split('-');
          data = await attendanceAPI.getMonthlyStats(parseInt(year), parseInt(month));
          break;
        }
        
        case 'year': {
          const year = selectedDate.split('-')[0];
          data = await attendanceAPI.getYearlyStats(parseInt(year));
          break;
        }
        
        default:
          data = await attendanceAPI.getDailyStats(selectedDate);
      }
      
      // Ensure we have all required stats properties
      const processedStats = {
        present: data.present || 0,
        late: data.late || 0,
        absent: data.absent || 0,
        total: data.total || (data.present + data.late + data.absent) || 0,
        attendance: data.attendance || []
      };
      
      console.log('Received stats:', data);
      console.log('Processed stats:', processedStats);
      
      setStats(processedStats);
      setAttendanceRecords(processedStats.attendance);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Effet pour charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // First fetch stats
        await fetchStats();

        try {
          const records = await attendanceAPI.getDailyStats(selectedDate);
          // Convert the stats response to the expected format
          const formattedRecords = records.attendance || [];
          if (Array.isArray(formattedRecords)) {
            setAttendanceRecords(formattedRecords);
          } else {
            console.error('Unexpected response format:', records);
            setError('Format de réponse invalide');
          }
        } catch (err: any) {
          console.error('Error fetching attendance records:', err);
          setError('Erreur lors du chargement des présences');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter, selectedDate]);

  useEffect(() => {
    const justifyId = searchParams?.get('justify');
    if (justifyId) {
      // Find the attendance record with this ID
      const attendance = attendanceRecords.find(record => record.id === justifyId);
      if (attendance) {
        console.log('Found attendance to justify:', attendance); // Debug log
        
        // Show the justification modal with this attendance
        setSelectedAttendance({
          id: attendance.id,
          date: attendance.date,
          isLate: attendance.isLate,
          isPresent: attendance.isPresent,
          status: attendance.status,
          justification: attendance.justification || "",
          documentUrl: attendance.documentUrl,
          learner: {
            firstName: attendance.learner.firstName,
            lastName: attendance.learner.lastName,
            matricule: attendance.learner.matricule || "",
            photoUrl: attendance.learner.photoUrl,
            referential: attendance.learner.referential
          }
        });
        setShowJustificationModal(true);
      } else {
        console.log('Attendance record not found for ID:', justifyId); // Debug log
        // Optionally show an error message
        toast.error('Justification introuvable');
      }
    }
  }, [searchParams, attendanceRecords]);

  useEffect(() => {
    // Listen for custom event
    const handleJustificationRequest = (event: CustomEvent) => {
      const justifyId = event.detail.attendanceId;
      const attendance = attendanceRecords.find(record => record.id === justifyId);
      
      if (attendance) {
        setSelectedAttendance({
          id: attendance.id,
          date: attendance.date,
          isLate: attendance.isLate,
          isPresent: attendance.isPresent,
          status: attendance.status,
          justification: attendance.justification || "",
          documentUrl: attendance.documentUrl,
          learner: {
            firstName: attendance.learner.firstName,
            lastName: attendance.learner.lastName,
            matricule: attendance.learner.matricule || "",
            photoUrl: attendance.learner.photoUrl,
            referential: attendance.learner.referential
          }
        });
        setShowJustificationModal(true);
      }
    };
  
    window.addEventListener('justificationRequest', handleJustificationRequest as EventListener);
    
    // Check URL params on mount
    const justifyId = new URLSearchParams(window.location.search).get('justify');
    if (justifyId) {
      const attendance = attendanceRecords.find(record => record.id === justifyId);
      if (attendance) {
        setSelectedAttendance({
          id: attendance.id,
          date: attendance.date,
          isLate: attendance.isLate,
          isPresent: attendance.isPresent,
          status: attendance.status,
          justification: attendance.justification || "",
          documentUrl: attendance.documentUrl,
          learner: {
            firstName: attendance.learner.firstName,
            lastName: attendance.learner.lastName,
            matricule: attendance.learner.matricule || "",
            photoUrl: attendance.learner.photoUrl,
            referential: attendance.learner.referential
          }
        });
        setShowJustificationModal(true);
      }
    }
  
    return () => {
      window.removeEventListener('justificationRequest', handleJustificationRequest as EventListener);
    };
  }, [attendanceRecords]);

  // Filtrage des enregistrements
  const filteredRecords = attendanceRecords.filter(record => {
    const nameMatch = `${record.learner.firstName} ${record.learner.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const statusMatch = 
      statusFilter === 'all' || 
      !statusFilter || 
      (statusFilter === 'present' && record.isPresent && !record.isLate) ||
      (statusFilter === 'late' && record.isLate) ||
      (statusFilter === 'absent' && !record.isPresent);

    return nameMatch && statusMatch;
  });

  // Pagination
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle exporting attendance data
  const handleExport = () => {
    alert("Fonctionnalité d'export à implémenter")
  }

  const handleSubmit = async () => {
    try {
      // ...existing code...
      toast.success("Présences enregistrées avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement des présences");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0D9488]">Présences</h1>
        <span className="ml-4 px-2 py-1 bg-[#F59E0B] text-white text-sm rounded-full">{stats.total} apprenants</span>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-orange-500 text-white"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}>
          <div className="p-6 flex items-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mr-4">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.total}</p>
              <p className="text-sm">Apprenants</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white text-emerald-500"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}>
          <div className="p-6 flex items-center">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.present}</p>
              <p className="text-sm">Présence(s)</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white text-amber-500"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}>
          <div className="p-6 flex items-center">
            <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center mr-4">
              <Clock className="h-8 w-8" />
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.late}</p>
              <p className="text-sm">Retard(s)</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white text-red-500"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}>
          <div className="p-6 flex items-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.absent}</p>
              <p className="text-sm">Absence(s)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Date Filter */}
        <div className="flex gap-4">
          <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilterType)}>
            <SelectTrigger className="w-[150px] bg-white">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Journalier</SelectItem>
              <SelectItem value="week">Hebdomadaire</SelectItem>
              <SelectItem value="month">Mensuel</SelectItem>
              <SelectItem value="year">Annuel</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type={getDateInputType()}
            value={formatDateForInput(selectedDate, dateFilter)}
            onChange={(e) => {
              let newDate = e.target.value;
              
              switch (dateFilter) {
                case 'week': {
                  // Convert week format (YYYY-Www) to date
                  const [year, week] = newDate.split('-W');
                  const firstDayOfWeek = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                  newDate = firstDayOfWeek.toISOString().split('T')[0];
                  break;
                }
                case 'month': {
                  // Add day to month format (YYYY-MM)
                  newDate = `${newDate}-01`;
                  break;
                }
                case 'year': {
                  // Add month and day to year format (YYYY)
                  newDate = `${newDate}-01-01`;
                  break;
                }
              }
              
              setSelectedDate(newDate);
            }}
            className="w-[200px] bg-white"
          />
        </div>

        {/* Search */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-auto">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Rechercher un apprenant..."
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-white">
            <SelectValue placeholder="Filtre par status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Export Button */}
        <Button
          variant="default"
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Attendance table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded w-full mb-2"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun apprenant trouvé</h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter
              ? "Aucun apprenant ne correspond à vos critères de recherche"
              : "Il n'y a actuellement aucun apprenant dans la base de données"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#F97316]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                    Photo
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                    Matricule
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                    Nom Complet
                  </th>
                  
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                    Date & Heure
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                    Référentiel
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                    Statut
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                    Justification
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                        {record.learner.photoUrl ? (
                          <Image
                            src={record.learner.photoUrl}
                            alt={`${record.learner.firstName} ${record.learner.lastName}`}
                            width={40}
                            height={40}
                            className="h-10 w-10 object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-500 font-medium">
                            {record.learner.firstName?.charAt(0)}
                            {record.learner.lastName?.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.learner.matricule || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.learner.firstName} {record.learner.lastName}
                    </td>
                   
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {record.scanTime
                        ? new Date(record.scanTime).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        record.learner.referential?.name === "Développement web/mobile"
                          ? "bg-green-100 text-green-800"
                          : record.learner.referential?.name === "Référent digital"
                            ? "bg-blue-100 text-blue-800"
                            : record.learner.referential?.name === "Développement data"
                              ? "bg-purple-100 text-purple-800"
                              : record.learner.referential?.name === "AWS & DevOps"
                                ? "bg-yellow-100 text-yellow-800"
                                : record.learner.referential?.name === "Assistanat Digital (Hackeuse)"
                                  ? "bg-pink-100 text-pink-800"
                                  : "bg-gray-100 text-gray-800"
                      }`}>
                        {record.learner.referential?.name || "Non assigné"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record.isPresent ? (
                        record.isLate ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-500 text-white">
                            Retard
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-emerald-500 text-white">
                            Présent
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-500 text-white">
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record.isPresent && !record.isLate ? (
                        <span className="px-2 py-1 text-xs">
                          -
                        </span>
                      ) : record.status === "PENDING" ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-500 text-white">
                          En attente
                        </span>
                      ) : record.status === "APPROVED" ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-emerald-500 text-white">
                          Justifié
                        </span>
                      ) : record.status === "REJECTED" ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-500 text-white">
                          Non justifié
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {(record.isLate || !record.isPresent) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleJustificationClick({
                              id: record.id,
                              date: record.date,
                              isLate: record.isLate,
                              isPresent: record.isPresent,
                              status: record.status,
                              justification: record.justification || "",
                              documentUrl: record.documentUrl,
                              learner: {
                                firstName: record.learner.firstName,
                                lastName: record.learner.lastName,
                                matricule: record.learner.matricule || "",
                                photoUrl: record.learner.photoUrl,
                                referential: record.learner.referential
                              }
                            })
                          }}
                          className={`${
                            record.status === 'PENDING' 
                              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                          }`}
                        >
                          {record.status === 'PENDING' ? 'Voir la justification' : 'Vérifier'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-700">
              <span>Apprenants/page</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[70px] h-8 ml-2">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map(value => (
                    <SelectItem key={value} value={value.toString()}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Replace with our custom Pagination component */}
            <Pagination
              totalItems={filteredRecords.length}
              initialItemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">© 2025 Orange Digital Center. Tous droits réservés.</div>

      {/* Justification Review Modal */}
      <JustificationReviewModal
        isOpen={showJustificationModal}
        onClose={() => {
          handleCloseModal();
          // Update URL without the justify parameter
          const url = new URL(window.location.href);
          url.searchParams.delete('justify');
          window.history.pushState({}, '', url);
        }}
        attendance={selectedAttendance}
        onApprove={async (id, comment) => {
          try {
            await handleStatusUpdate(id, 'APPROVED', comment);
            handleCloseModal();
            // Refresh the data after approval
            fetchStats();
            // Update URL
            const url = new URL(window.location.href);
            url.searchParams.delete('justify');
            window.history.pushState({}, '', url);
          } catch (error) {
            console.error('Error approving:', error);
            toast.error('Erreur lors de l\'approbation');
          }
        }}
        onReject={async (id, comment) => {
          try {
            await handleStatusUpdate(id, 'REJECTED', comment);
            handleCloseModal();
            // Refresh the data after rejection
            fetchStats();
            // Update URL
            const url = new URL(window.location.href);
            url.searchParams.delete('justify');
            window.history.pushState({}, '', url);
          } catch (error) {
            console.error('Error rejecting:', error);
            toast.error('Erreur lors du rejet');
          }
        }}
      />

      {/* Test Notification Button */}
      <Button
        onClick={() => {
          toast.info('Test notification', {
            duration: 5000,
            action: {
              label: "Test",
              onClick: () => console.log('Test clicked')
            }
          });
        }}
      >
        Test Notification
      </Button>

      {/* Debug info - remove in production */}
      <div className="hidden">
        <p>Modal Open: {showJustificationModal ? 'Yes' : 'No'}</p>
        <p>Selected Attendance: {JSON.stringify(selectedAttendance, null, 2)}</p>
      </div>
    </div>
  )
}

