"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { attendanceAPI, learnersAPI, type Learner, type LearnerAttendance } from "@/lib/api"
import { Search, Download, Users, CheckCircle, Clock, AlertTriangle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Pagination from '@/components/common/Pagination'
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

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'all',     label: 'Tous les statuts' },
  { value: 'present', label: 'Présent' },
  { value: 'late',    label: 'En retard' },
  { value: 'absent',  label: 'Absent' },
] as const

const EDITABLE_STATUS_OPTIONS = [
  {
    value: 'present',
    label: 'Présent',
    icon: '✅',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    hoverBg: 'hover:bg-emerald-50',
  },
  {
    value: 'late',
    label: 'Retard',
    icon: '⏰',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    hoverBg: 'hover:bg-amber-50',
  },
  {
    value: 'absent',
    label: 'Absent',
    icon: '❌',
    bg: 'bg-red-50',
    text: 'text-red-700',
    hoverBg: 'hover:bg-red-50',
  },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDateForInput = (date: string, filterType: DateFilterType): string => {
  const d = new Date(date)
  switch (filterType) {
    case 'week': {
      const day = d.getUTCDate() - d.getUTCDay() + (d.getUTCDay() === 0 ? -6 : 1)
      const week = new Date(d.setUTCDate(day))
      const year = week.getUTCFullYear()
      const weekNum = Math.ceil((((week.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7)
      return `${year}-W${weekNum.toString().padStart(2, '0')}`
    }
    case 'month':
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
    case 'year':
      return `${d.getFullYear()}`
    default:
      return date
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string
  date: string
  isLate: boolean
  isPresent: boolean
  scanTime?: string
  status?: 'TO_JUSTIFY' | 'PENDING' | 'APPROVED' | 'REJECTED'
  justification?: string
  documentUrl?: string
  learner: {
    firstName: string
    lastName: string
    matricule: string
    photoUrl?: string
    referential?: { name: string }
  }
}

type EditableStatus = 'present' | 'late' | 'absent'

// ── StatusBadge ───────────────────────────────────────────────────────────────

function getStatusStyle(isPresent: boolean, isLate: boolean) {
  if (!isPresent) return { badge: 'bg-red-100 text-red-700 border border-red-200',   label: 'Absent',  icon: '❌' }
  if (isLate)     return { badge: 'bg-amber-100 text-amber-700 border border-amber-200', label: 'Retard',  icon: '⏰' }
  return              { badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'Présent', icon: '✅' }
}

// ── StatusDropdown ────────────────────────────────────────────────────────────

interface StatusDropdownProps {
  recordId: string
  isPresent: boolean
  isLate: boolean
  updating: boolean
  onUpdate: (id: string, newStatus: EditableStatus) => Promise<void>
}

function StatusDropdown({ recordId, isPresent, isLate, updating, onUpdate }: StatusDropdownProps) {
  const style = getStatusStyle(isPresent, isLate)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={updating}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all
            ${style.badge}
            ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80 hover:shadow-sm'}`}
        >
          <span>{style.icon}</span>
          <span>{style.label}</span>
          {updating
            ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-0.5" />
            : <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
          }
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-44 p-1 shadow-lg border border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 py-1.5 mb-0.5">
          Changer le statut
        </p>
        {EDITABLE_STATUS_OPTIONS.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onUpdate(recordId, opt.value)}
            className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm font-medium
              ${opt.text} ${opt.hoverBg} transition-colors`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── JustificationBadge ────────────────────────────────────────────────────────

function JustificationBadge({
  record,
  onReview,
  onAuthorize,
  authorizing,
}: {
  record: AttendanceRecord
  onReview: (r: AttendanceRecord) => void
  onAuthorize: (id: string) => Promise<void>
  authorizing: boolean
}) {
  if (record.isPresent && !record.isLate) {
    return <span className="text-gray-300 text-xs">—</span>
  }

  return (
    <div className="flex flex-col gap-1.5">
      {record.status === 'PENDING' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          En attente
        </span>
      )}
      {record.status === 'APPROVED' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
          ✓ Autorisé
        </span>
      )}
      {record.status === 'REJECTED' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
          ✗ Rejeté
        </span>
      )}

      <div className="flex gap-1 flex-wrap">
        {(record.status === 'PENDING' || record.status === 'TO_JUSTIFY') && (
          <button
            onClick={() => onReview(record)}
            className="text-xs px-2 py-0.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors font-medium"
          >
            {record.status === 'PENDING' ? 'Voir' : 'Vérifier'}
          </button>
        )}

        {record.status !== 'APPROVED' && (
          <button
            onClick={() => onAuthorize(record.id)}
            disabled={authorizing}
            className="text-xs px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authorizing
              ? <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ...
                </span>
              : '✓ Autoriser'
            }
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [dateFilter, setDateFilter]         = useState<DateFilterType>('day')
  const [selectedDate, setSelectedDate]     = useState<string>(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery]       = useState("")
  const [statusFilter, setStatusFilter]     = useState("")

  const [stats, setStats]                   = useState<AttendanceStats>({ present: 0, late: 0, absent: 0, total: 0 })
  const [attendanceRecords, setAttendanceRecords] = useState<LearnerAttendance[]>([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState("")

  const [currentPage, setCurrentPage]       = useState(1)
  const [itemsPerPage, setItemsPerPage]     = useState(10)

  const [isLoadingStats, setIsLoadingStats]     = useState(true)
  const [isLoadingRecords, setIsLoadingRecords] = useState(true)

  const [updatingStatus, setUpdatingStatus]     = useState<Record<string, boolean>>({})
  const [authorizingId, setAuthorizingId]       = useState<string | null>(null)

  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null)
  const [showJustificationModal, setShowJustificationModal] = useState(false)
useEffect(() => {
  setCurrentPage(1)
}, [searchQuery, statusFilter, dateFilter, selectedDate])
  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCloseModal = useCallback(() => {
    setShowJustificationModal(false)
    setTimeout(() => setSelectedAttendance(null), 300)
  }, [])

  const handleJustificationClick = useCallback((attendance: AttendanceRecord) => {
    setSelectedAttendance(attendance)
    setShowJustificationModal(true)
  }, [])

  // ✅ FIX : handleStatusChange — utilise forceApprove pour les absences/retards
  // et mise à jour optimiste locale pour présent (pas d'endpoint dédié nécessaire)
const handleStatusChange = async (id: string, newStatus: EditableStatus) => {
  setUpdatingStatus(prev => ({ ...prev, [id]: true }));
  try {
    // ✅ Persister en base de données
    await attendanceAPI.updateAttendanceStatus(id, newStatus);

    // ✅ Mise à jour locale après succès
    const isPresent = newStatus !== 'absent';
    const isLate = newStatus === 'late';

    setAttendanceRecords(prev =>
      prev.map(r =>
        r.id === id
          ? { 
              ...r, 
              isPresent, 
              isLate, 
              status: isPresent ? 'APPROVED' as const : 'TO_JUSTIFY' as const 
            }
          : r
      )
    );

    const labels = { present: 'Présent', late: 'Retard', absent: 'Absent' };
    toast.success(`Statut mis à jour : ${labels[newStatus]}`);
    
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut');
  } finally {
    setUpdatingStatus(prev => ({ ...prev, [id]: false }));
  }
};

  // ✅ Autoriser directement via /force-approve
  const handleAuthorize = async (id: string) => {
    setAuthorizingId(id)
    try {
      await (attendanceAPI as any).forceApprove(id)
      setAttendanceRecords(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'APPROVED' as const } : r)
      )
      toast.success('Absence autorisée ✓')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'autorisation")
    } finally {
      setAuthorizingId(null)
    }
  }

  const handleStatusUpdate = async (attendanceId: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    try {
      await attendanceAPI.updateJustificationStatus(attendanceId, status, comment)
      setIsLoadingRecords(true)
      await fetchStats()
      toast.success(status === 'APPROVED' ? 'Justification approuvée' : 'Justification rejetée')
      handleCloseModal()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour')
    } finally {
      setIsLoadingRecords(false)
    }
  }

  // ── Data fetching ──────────────────────────────────────────────────────────

  const getDateInputType = () => {
    switch (dateFilter) {
      case 'day':   return 'date'
      case 'week':  return 'week'
      case 'month': return 'month'
      case 'year':  return 'month'
      default:      return 'date'
    }
  }

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true)
      let data: any

      switch (dateFilter) {
        case 'day':
          data = await attendanceAPI.getDailyStats(selectedDate)
          break
        case 'week': {
          const weekDate = formatDateForInput(selectedDate, 'week')
          data = await attendanceAPI.getWeeklyStats(weekDate)
          break
        }
        case 'month': {
          const [year, month] = selectedDate.split('-')
          data = await attendanceAPI.getMonthlyStats(parseInt(year), parseInt(month))
          break
        }
        case 'year': {
          const year = selectedDate.split('-')[0]
          data = await attendanceAPI.getYearlyStats(parseInt(year))
          break
        }
        default:
          data = await attendanceAPI.getDailyStats(selectedDate)
      }

      const processedStats = {
        present: data.present || 0,
        late:    data.late    || 0,
        absent:  data.absent  || 0,
        total:   data.total   || (data.present + data.late + data.absent) || 0,
        attendance: data.attendance || [],
      }

      setStats(processedStats)
      setAttendanceRecords(processedStats.attendance)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Erreur lors du chargement des statistiques')
    } finally {
      setIsLoadingStats(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        await fetchStats()
      } catch (err) {
        setError('Une erreur est survenue lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [dateFilter, selectedDate])

  useEffect(() => {
    const justifyId = searchParams?.get('justify')
    if (justifyId) {
      const attendance = attendanceRecords.find(r => r.id === justifyId)
      if (attendance) {
        setSelectedAttendance({
          id: attendance.id,
          date: attendance.date,
          isLate: attendance.isLate,
          isPresent: attendance.isPresent,
          status: attendance.status,
          justification: attendance.justification || '',
          documentUrl: attendance.documentUrl,
          learner: {
            firstName: attendance.learner.firstName,
            lastName: attendance.learner.lastName,
            matricule: attendance.learner.matricule || '',
            photoUrl: attendance.learner.photoUrl,
            referential: attendance.learner.referential,
          },
        })
        setShowJustificationModal(true)
      }
    }
  }, [searchParams, attendanceRecords])

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredRecords = attendanceRecords.filter(record => {
    const nameMatch = `${record.learner.firstName} ${record.learner.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())

    const statusMatch =
      statusFilter === 'all' ||
      !statusFilter ||
      (statusFilter === 'present' && record.isPresent && !record.isLate) ||
      (statusFilter === 'late'    && record.isLate) ||
      (statusFilter === 'absent'  && !record.isPresent)

    return nameMatch && statusMatch
  })

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0D9488]">Présences</h1>
        <span className="ml-4 px-2 py-1 bg-[#F59E0B] text-white text-sm rounded-full">
          {stats.total} apprenants
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Apprenants', value: stats.total,   Icon: Users,         bg: 'bg-orange-500', text: 'text-white',     iconBg: 'bg-white/20' },
          { label: 'Présence(s)', value: stats.present, Icon: CheckCircle,  bg: 'bg-white',      text: 'text-emerald-500', iconBg: 'bg-emerald-500/20' },
          { label: 'Retard(s)',   value: stats.late,    Icon: Clock,        bg: 'bg-white',      text: 'text-amber-500',   iconBg: 'bg-amber-500/20'   },
          { label: 'Absence(s)', value: stats.absent,  Icon: AlertTriangle, bg: 'bg-white',      text: 'text-red-500',     iconBg: 'bg-red-500/20'     },
        ].map(({ label, value, Icon, bg, text, iconBg }) => (
          <Card
            key={label}
            className={`${bg} ${text}`}
            style={{
              backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="p-6 flex items-center">
              <div className={`w-14 h-14 ${iconBg} rounded-full flex items-center justify-center mr-4`}>
                <Icon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-4xl font-bold">{value}</p>
                <p className="text-sm">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-4">
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilterType)}>
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
              let newDate = e.target.value
              switch (dateFilter) {
                case 'week': {
                  const [year, week] = newDate.split('-W')
                  const firstDay = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7)
                  newDate = firstDay.toISOString().split('T')[0]
                  break
                }
                case 'month': newDate = `${newDate}-01`; break
                case 'year':  newDate = `${newDate}-01-01`; break
              }
              setSelectedDate(newDate)
            }}
            className="w-[200px] bg-white"
          />
        </div>

        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un apprenant..."
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-white">
            <SelectValue placeholder="Filtre par statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="default" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => alert('Export à implémenter')}>
          <Download className="h-4 w-4 mr-2" /> Exporter
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-full mb-4" />
          {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded w-full mb-2" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun apprenant trouvé</h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter
              ? 'Aucun apprenant ne correspond à vos critères de recherche'
              : "Il n'y a actuellement aucun apprenant dans la base de données"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#F97316]">
                <tr>
                  {['Photo', 'Matricule', 'Nom Complet', 'Date & Heure', 'Référentiel', 'Statut', 'Justification'].map(h => (
                    <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    {/* Photo */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                        {record.learner.photoUrl ? (
                          <Image
                            src={record.learner.photoUrl}
                            alt={`${record.learner.firstName} ${record.learner.lastName}`}
                            width={40} height={40}
                            className="h-10 w-10 object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-500 font-medium text-sm">
                            {record.learner.firstName?.charAt(0)}{record.learner.lastName?.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Matricule */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.learner.matricule || '—'}
                    </td>

                    {/* Nom */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.learner.firstName} {record.learner.lastName}
                    </td>

                 <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  <div className="flex flex-col">
    {/* Date — toujours depuis record.date */}
    <span className="font-medium text-gray-700">
      {record.date
        ? new Date(record.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '—'}
    </span>
    {/* Heure — seulement si présent */}
    <span className="text-xs text-gray-400">
      {record.scanTime
        ? new Date(record.scanTime).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Absent'}
    </span>
  </div>
</td>

                    {/* Référentiel */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record.learner.referential?.name ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                          {record.learner.referential.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Non assigné</span>
                      )}
                    </td>

                    {/* Statut — dropdown */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusDropdown
                        recordId={record.id}
                        isPresent={record.isPresent}
                        isLate={record.isLate}
                        updating={!!updatingStatus[record.id]}
                        onUpdate={handleStatusChange}
                      />
                    </td>

                    {/* Justification */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <JustificationBadge
                        record={{
                          id: record.id,
                          date: record.date,
                          isLate: record.isLate,
                          isPresent: record.isPresent,
                          status: record.status,
                          justification: record.justification || '',
                          documentUrl: record.documentUrl,
                          learner: {
                            firstName: record.learner.firstName,
                            lastName: record.learner.lastName,
                            matricule: record.learner.matricule || '',
                            photoUrl: record.learner.photoUrl,
                            referential: record.learner.referential,
                          },
                        }}
                        onReview={handleJustificationClick}
                        onAuthorize={handleAuthorize}
                        authorizing={authorizingId === record.id}
                      />
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
      onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1) }}
    >
      <SelectTrigger className="w-[70px] h-8 ml-2">
        <SelectValue placeholder="10" />
      </SelectTrigger>
      <SelectContent>
        {[5, 10, 20, 50].map(v => (
          <SelectItem key={v} value={v.toString()}>{v}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  <Pagination
    totalItems={filteredRecords.length}
    currentPage={currentPage}
    itemsPerPage={itemsPerPage}
    onPageChange={(page) => setCurrentPage(page)}
    onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1) }}
  />
</div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        © 2025 Orange Digital Center. Tous droits réservés.
      </div>

      {/* Modal justification */}
      <JustificationReviewModal
        isOpen={showJustificationModal}
        onClose={() => {
          handleCloseModal()
          const url = new URL(window.location.href)
          url.searchParams.delete('justify')
          window.history.pushState({}, '', url)
        }}
        attendance={selectedAttendance}
        onApprove={async (id, comment) => {
          await handleStatusUpdate(id, 'APPROVED', comment)
          const url = new URL(window.location.href)
          url.searchParams.delete('justify')
          window.history.pushState({}, '', url)
        }}
        onReject={async (id, comment) => {
          await handleStatusUpdate(id, 'REJECTED', comment)
          const url = new URL(window.location.href)
          url.searchParams.delete('justify')
          window.history.pushState({}, '', url)
        }}
      />
    </div>
  )
}