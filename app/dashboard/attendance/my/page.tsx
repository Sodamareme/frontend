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

// ── Types ─────────────────────────────────────────────────────────────────────

type AttendanceStatus = "TO_JUSTIFY" | "PENDING" | "REJECTED" | "APPROVED"

interface AttendanceRecord {
  id: string
  date: string
  isPresent: boolean
  isLate: boolean
  scanTime: string | null
  justification?: string
  status: AttendanceStatus
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStatusBadge(status: AttendanceStatus | undefined) {
  switch (status) {
    case 'TO_JUSTIFY':
      return (
        <Badge variant="outline" className="border-[#eadbc5] bg-[#fff1e8] text-[#8b5a2b] text-xs font-medium">
          <AlertCircle className="w-3 h-3 mr-1" />
          À justifier
        </Badge>
      )
    case 'PENDING':
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium">
          <Clock className="w-3 h-3 mr-1" />
          En attente
        </Badge>
      )
    case 'APPROVED':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs font-medium">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Justifié
        </Badge>
      )
    case 'REJECTED':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs font-medium">
          <XCircle className="w-3 h-3 mr-1" />
          Rejeté
        </Badge>
      )
    default:
      return null
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState("")
  const [submitting, setSubmitting]   = useState(false)

  // Modal
  const [showJustifyModal, setShowJustifyModal]   = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null)
  const [justification, setJustification]         = useState("")
  const [file, setFile]                           = useState<File | undefined>(undefined)

  // Stats
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    totalDays: 0,
    justifiedAbsentDays: 0,
  })

  // Filters
  const [searchDate, setSearchDate]   = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // ✅ Pagination contrôlée
  const [currentPage, setCurrentPage]   = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const userStr = localStorage.getItem('user')
      if (!userStr) throw new Error('User not found')
      const user = JSON.parse(userStr)
      const learnerDetails = await learnersAPI.getLearnerByEmail(user.email)
      const attendanceData = await attendanceAPI.getAttendanceByLearner(learnerDetails.id)
      const attendanceStatsData = await learnersAPI.getLearnerAttendanceStats(learnerDetails.id)
      const justifiedAbsenceCount = attendanceData.filter(
        (attendance) => !attendance.isPresent && attendance.status === "APPROVED"
      ).length
      setAttendances(
        [...attendanceData].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      )
      setStats({
        present: attendanceStatsData.presentDays ?? 0,
        late: attendanceStatsData.lateDays ?? 0,
        absent: attendanceStatsData.absentDays ?? 0,
        total: attendanceStatsData.totalDays ?? 0,
        totalDays: attendanceStatsData.totalDays ?? 0,
        justifiedAbsentDays: Math.max(
          attendanceStatsData.justifiedAbsentDays ?? 0,
          justifiedAbsenceCount
        ),
      })
    } catch (err) {
      console.error('Error fetching attendance:', err)
      setError('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAttendance() }, [])

  // Notification absences à justifier
  useEffect(() => {
    const count = attendances.filter(a => a.status === 'TO_JUSTIFY').length
    if (count > 0) {
      toast.warning(`Vous avez ${count} absence(s)/retard(s) à justifier`, { duration: 5000 })
    }
  }, [attendances])

  // Reset page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [searchDate, statusFilter])

  // ── Filtering & pagination ───────────────────────────────────────────────────

  const filteredAttendances = attendances
    .filter(a => {
      const matchesDate   = !searchDate || format(new Date(a.date), 'yyyy-MM-dd') === searchDate
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "present"    && a.isPresent && !a.isLate) ||
        (statusFilter === "late"       && a.isLate) ||
        (statusFilter === "absent"     && !a.isPresent) ||
        (statusFilter === "to_justify" && a.status === "TO_JUSTIFY")
      return matchesDate && matchesStatus
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // ✅ Découpage dans le parent
  const paginatedAttendances = filteredAttendances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleJustify = (attendance: AttendanceRecord) => {
    setSelectedAttendance(attendance)
    setJustification(attendance.justification || "")
    setFile(undefined)
    setShowJustifyModal(true)
  }

  const handleCloseModal = () => {
    setShowJustifyModal(false)
    setJustification("")
    setFile(undefined)
    setSelectedAttendance(null)
  }

  const submitJustification = async () => {
    if (!selectedAttendance || !justification.trim()) {
      toast.error("Veuillez saisir une justification")
      return
    }
    try {
      setSubmitting(true)
      await attendanceAPI.submitJustification(
        selectedAttendance.id,
        justification,
        format(new Date(selectedAttendance.date), 'yyyy-MM-dd'),
        file
      )
      await fetchAttendance()
      handleCloseModal()
      toast.success("Justification soumise avec succès")
    } catch (err) {
      console.error('Error submitting justification:', err)
      toast.error("Erreur lors de la soumission de la justification")
    } finally {
      setSubmitting(false)
    }
  }

  const getAttendanceRate = () => {
    if (stats.total === 0) return 0
    return Math.round((stats.present / stats.total) * 100)
  }

  const clearFilters = () => {
    setSearchDate("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  // ── Loading / Error ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#f5f1e8]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-medium text-slate-600">Chargement de vos données d'assiduité...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#f5f1e8]">
        <Card className="mx-auto max-w-md border border-red-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#d36b2c]">Ma présence</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Historique d'assiduité</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <TrendingUp className="h-4 w-4 text-[#d36b2c]" />
              <span>{getAttendanceRate()}% de présence</span>
            </div>
          </div>
          <Separator className="bg-gray-200" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Présences', value: stats.present, pct: stats.present, Icon: CheckCircle2, accent: 'emerald', hint: 'Jours validés'  },
            { label: 'Retards', value: stats.late, pct: stats.late, Icon: Clock, accent: 'orange', hint: 'À surveiller' },
            { label: 'Absences', value: stats.absent, pct: stats.absent, Icon: XCircle, accent: 'red', hint: `Dont ${stats.justifiedAbsentDays} justifiée(s)` },
            { label: 'Total jours', value: stats.totalDays, pct: null, Icon: Calendar, accent: 'slate', hint: 'Comptabilisés' },
          ].map(({ label, value, pct, Icon, accent, hint }) => {
            const accentClasses = {
              emerald: {
                iconWrap: 'bg-emerald-50 text-emerald-700',
              },
              orange: {
                iconWrap: 'bg-[#fff1e8] text-[#d36b2c]',
              },
              red: {
                iconWrap: 'bg-red-50 text-red-700',
              },
              slate: {
                iconWrap: 'bg-slate-100 text-slate-700',
              },
            } as const

            return (
            <Card key={label} className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-3xl font-semibold text-slate-900">{value}</p>
                    {hint ? (
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{hint}</p>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      {pct !== null
                        ? `${stats.total > 0 ? Math.round((pct / stats.total) * 100) : 0}% du total`
                        : 'Jours comptabilisés'}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-3 ${accentClasses[accent].iconWrap}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>

        {/* Filters */}
        <Card className="mb-6 rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
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
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#d36b2c] sm:w-auto"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="present">Présent</option>
                  <option value="late">En retard</option>
                  <option value="absent">Absent</option>
                  <option value="to_justify">À justifier</option>
                </select>
                {(searchDate || statusFilter !== "all") && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="text-gray-600">
                    Effacer
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="mr-2 h-6 w-6 text-[#d36b2c]" />
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
                <thead className="bg-[#fcfaf6]">
                  <tr>
                    {['Date', "Heure d'arrivée", 'Statut', 'Justification', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedAttendances.length > 0 ? (
                    paginatedAttendances.map((attendance) => (
                      <tr key={attendance.id} className="transition-colors duration-150 hover:bg-[#fcfaf6]">
                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {format(new Date(attendance.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                        </td>

                        {/* Heure */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {attendance.scanTime
                            ? format(new Date(attendance.scanTime), 'HH:mm')
                            : <span className="text-gray-400 italic">Non enregistré</span>}
                        </td>

                        {/* Statut présence */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attendance.isPresent && !attendance.isLate ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Présent
                            </Badge>
                          ) : attendance.isLate ? (
                            <Badge className="border-[#eadbc5] bg-[#fff1e8] text-[#8b5a2b]">
                              <Clock className="w-3 h-3 mr-1" /> En retard
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <XCircle className="w-3 h-3 mr-1" /> Absent
                            </Badge>
                          )}
                        </td>

                        {/* Statut justification */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {attendance.isPresent && !attendance.isLate
                            ? <span className="text-gray-400 italic">—</span>
                            : getStatusBadge(attendance.status)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {(attendance.isLate || !attendance.isPresent) && (
                            attendance.status === 'TO_JUSTIFY' ? (
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleJustify(attendance)}
                                className="border-[#eadbc5] text-[#8b5a2b] hover:bg-[#fff1e8] hover:text-[#8b5a2b]"
                              >
                                <FileText className="w-4 h-4 mr-1" /> Justifier
                              </Button>
                            ) : attendance.status === 'REJECTED' ? (
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleJustify(attendance)}
                                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                              >
                                <AlertCircle className="w-4 h-4 mr-1" /> Rejustifier
                              </Button>
                            ) : attendance.status === 'PENDING' ? (
                              <Button variant="outline" size="sm" disabled
                                className="text-yellow-600 border-yellow-200 cursor-not-allowed">
                                <Clock className="w-4 h-4 mr-1" /> En cours
                              </Button>
                            ) : (
                              <span className="text-gray-400 italic">—</span>
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
                          <p className="text-sm">Aucun enregistrement ne correspond à vos critères</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ Pagination contrôlée */}
            {filteredAttendances.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <Pagination
                  totalItems={filteredAttendances.length}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => setCurrentPage(page)}
                  onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1) }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Modal Justification ───────────────────────────────────────────── */}
        <Dialog open={showJustifyModal} onOpenChange={(open) => { if (!open) handleCloseModal() }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Justifier votre {selectedAttendance?.isLate ? 'retard' : 'absence'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {selectedAttendance
                  ? `${selectedAttendance.status === 'REJECTED' ? 'Nouvelle justification pour le' : 'Justification pour le'} ${format(new Date(selectedAttendance.date), 'dd MMMM yyyy', { locale: fr })}`
                  : ''}
              </DialogDescription>
            </DialogHeader>

            {submitting ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600">Envoi de la justification en cours...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Justification text */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Justification <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Expliquez les raisons de votre absence ou retard..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="min-h-[120px] resize-none rounded-2xl"
                  />
                </div>

                {/* Document */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Document justificatif <span className="text-gray-400">(optionnel)</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="cursor-pointer"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        if (!f.type.startsWith('image/')) {
                          toast.error("Veuillez sélectionner une image uniquement")
                          e.target.value = ''
                          return
                        }
                        if (f.size > 10 * 1024 * 1024) {
                          toast.error("La taille de l'image ne doit pas dépasser 10 MB")
                          e.target.value = ''
                          return
                        }
                        setFile(f)
                      }}
                    />
                    <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>

                  {file && (
                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setFile(undefined)}
                        className="h-6 w-6 p-0 hover:bg-gray-200">
                        <XCircle className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Formats acceptés : JPG, PNG, GIF, WebP (max 10 Mo)</p>
                </div>
              </div>
            )}

            <DialogFooter className="flex space-x-2">
              <Button variant="outline" onClick={handleCloseModal} disabled={submitting}>
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
                    Envoyer
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
