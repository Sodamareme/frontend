"use client";

import { useEffect, useState } from "react";
import { learnersAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Search,
  TrendingUp,
  Upload,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Pagination from "@/components/common/Pagination";
import { toast } from "sonner";
import { attendanceAPI } from "@/lib/api";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

type AttendanceStatus = "TO_JUSTIFY" | "PENDING" | "REJECTED" | "APPROVED";

interface AttendanceRecord {
  id: string;
  date: string;
  isPresent: boolean;
  isLate: boolean;
  scanTime?: string | null;
  justification?: string;
  status: AttendanceStatus;
}

function getStatusBadge(status: AttendanceStatus | undefined) {
  switch (status) {
    case "TO_JUSTIFY":
      return (
        <Badge variant="outline" className="border-orange-100 bg-white text-[#F16E00] text-xs font-medium">
          <AlertCircle className="mr-1 h-3 w-3" />
          À justifier
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium">
          <Clock className="mr-1 h-3 w-3" />
          En attente
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 text-xs font-medium">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Justifié
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-xs font-medium">
          <XCircle className="mr-1 h-3 w-3" />
          Rejeté
        </Badge>
      );
    default:
      return null;
  }
}

function getPresenceBadge(attendance: AttendanceRecord) {
  if (attendance.isPresent && !attendance.isLate) {
    return (
      <Badge className="border-green-200 bg-green-100 text-green-800">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Présent
      </Badge>
    );
  }

  if (attendance.isLate) {
    return (
      <Badge className="border-orange-100 bg-white text-[#F16E00]">
        <Clock className="mr-1 h-3 w-3" />
        En retard
      </Badge>
    );
  }

  return (
    <Badge className="border-red-200 bg-red-100 text-red-800">
      <XCircle className="mr-1 h-3 w-3" />
      Absent
    </Badge>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: typeof Calendar;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[1.7rem] border border-orange-100 bg-white p-5 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#F16E00]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{hint}</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-3 text-[#F16E00]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function MyAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [justification, setJustification] = useState("");
  const [file, setFile] = useState<File | undefined>(undefined);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    totalDays: 0,
    justifiedAbsentDays: 0,
  });
  const [searchDate, setSearchDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchAttendance = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("User not found");
      const user = JSON.parse(userStr);
      const learnerDetails = await learnersAPI.getLearnerByEmail(user.email);
      const attendanceData = await attendanceAPI.getAttendanceByLearner(learnerDetails.id);
      const attendanceStatsData = await learnersAPI.getLearnerAttendanceStats(learnerDetails.id);
      const justifiedAbsenceCount = attendanceData.filter(
        (attendance) => !attendance.isPresent && attendance.status === "APPROVED",
      ).length;

      setAttendances(
        [...attendanceData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      );
      setStats({
        present: attendanceStatsData.presentDays ?? 0,
        late: attendanceStatsData.lateDays ?? 0,
        absent: attendanceStatsData.absentDays ?? 0,
        total: attendanceStatsData.totalDays ?? 0,
        totalDays: attendanceStatsData.totalDays ?? 0,
        justifiedAbsentDays: Math.max(
          attendanceStatsData.justifiedAbsentDays ?? 0,
          justifiedAbsenceCount,
        ),
      });
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAttendance();
  }, []);

  useAutoRefresh(() => fetchAttendance(true), { intervalMs: 15_000 });

  useEffect(() => {
    const count = attendances.filter((a) => a.status === "TO_JUSTIFY").length;
    if (count > 0) {
      toast.warning(`Vous avez ${count} absence(s)/retard(s) à justifier`, { duration: 5000 });
    }
  }, [attendances]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchDate, statusFilter]);

  const filteredAttendances = attendances
    .filter((a) => {
      const matchesDate = !searchDate || format(new Date(a.date), "yyyy-MM-dd") === searchDate;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "present" && a.isPresent && !a.isLate) ||
        (statusFilter === "late" && a.isLate) ||
        (statusFilter === "absent" && !a.isPresent) ||
        (statusFilter === "to_justify" && a.status === "TO_JUSTIFY");
      return matchesDate && matchesStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const paginatedAttendances = filteredAttendances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleJustify = (attendance: AttendanceRecord) => {
    setSelectedAttendance(attendance);
    setJustification(attendance.justification || "");
    setFile(undefined);
    setShowJustifyModal(true);
  };

  const handleCloseModal = () => {
    setShowJustifyModal(false);
    setJustification("");
    setFile(undefined);
    setSelectedAttendance(null);
  };

  const submitJustification = async () => {
    if (!selectedAttendance || !justification.trim()) {
      toast.error("Veuillez saisir une justification");
      return;
    }

    try {
      setSubmitting(true);
      await attendanceAPI.submitJustification(
        selectedAttendance.id,
        justification,
        format(new Date(selectedAttendance.date), "yyyy-MM-dd"),
        file,
      );
      await fetchAttendance(true);
      handleCloseModal();
      toast.success("Justification soumise avec succès");
    } catch (err) {
      console.error("Error submitting justification:", err);
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
      <div className="flex min-h-[80vh] items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="font-medium text-slate-600">Chargement de vos données d&apos;assiduité...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-white">
        <Card className="mx-auto max-w-md rounded-[2rem] border border-red-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Erreur de chargement</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
            <div className="h-2 w-full bg-[#F16E00]" />
            <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.3fr_0.95fr] lg:px-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[#F16E00]">
                  Ma présence
                </div>

                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Historique d&apos;assiduité
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm text-slate-700">
                    <TrendingUp className="h-4 w-4 text-[#F16E00]" />
                    {getAttendanceRate()}% de présence
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-[#F16E00]" />
                    {filteredAttendances.length} résultat(s)
                  </div>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-orange-100 bg-white p-5">
                <p className="text-sm font-medium text-slate-500">Lecture rapide</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Présences</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.present}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Absences justifiées</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.justifiedAbsentDays}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Jours comptabilisés</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.totalDays}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Présences" value={stats.present} hint="Jours validés" icon={CheckCircle2} />
            <SummaryCard label="Retards" value={stats.late} hint="À surveiller" icon={Clock} />
            <SummaryCard
              label="Absences"
              value={stats.absent}
              hint={`Dont ${stats.justifiedAbsentDays} justifiée(s)`}
              icon={XCircle}
            />
            <SummaryCard label="Total jours" value={stats.totalDays} hint="Comptabilisés" icon={Calendar} />
          </section>

          <Card className="rounded-[2rem] border border-orange-100 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <Filter className="h-5 w-5 text-[#F16E00]" />
                  <span className="text-sm font-medium">Filtres</span>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[auto_auto_auto]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="h-11 rounded-2xl border-slate-200 pl-10"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none ring-0 focus:border-[#F16E00]"
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
                      onClick={clearFilters}
                      className="h-11 rounded-2xl border-slate-200"
                    >
                      Effacer
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
            <CardHeader className="border-b border-orange-100 bg-white">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center text-xl font-semibold text-slate-900">
                  <FileText className="mr-2 h-6 w-6 text-[#F16E00]" />
                  Historique des présences
                </CardTitle>
                <Badge variant="outline" className="w-fit rounded-full border-orange-100 bg-white text-[#F16E00]">
                  {filteredAttendances.length} résultat(s)
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead className="bg-white">
                    <tr>
                      {["Date", "Heure d'arrivée", "Statut", "Justification", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedAttendances.length > 0 ? (
                      paginatedAttendances.map((attendance) => (
                        <tr key={attendance.id} className="transition-colors duration-150 hover:bg-orange-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {format(new Date(attendance.date), "EEEE dd MMMM yyyy", { locale: fr })}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            {attendance.scanTime ? (
                              format(new Date(attendance.scanTime), "HH:mm")
                            ) : (
                              <span className="italic text-gray-400">Non enregistré</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">{getPresenceBadge(attendance)}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {attendance.isPresent && !attendance.isLate ? (
                              <span className="italic text-gray-400">—</span>
                            ) : (
                              getStatusBadge(attendance.status)
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {(attendance.isLate || !attendance.isPresent) &&
                              (attendance.status === "TO_JUSTIFY" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleJustify(attendance)}
                                  className="border-orange-100 text-[#F16E00] hover:bg-orange-50 hover:text-[#F16E00]"
                                >
                                  <FileText className="mr-1 h-4 w-4" />
                                  Justifier
                                </Button>
                              ) : attendance.status === "REJECTED" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleJustify(attendance)}
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <AlertCircle className="mr-1 h-4 w-4" />
                                  Rejustifier
                                </Button>
                              ) : attendance.status === "PENDING" ? (
                                <Button variant="outline" size="sm" disabled className="cursor-not-allowed border-yellow-200 text-yellow-600">
                                  <Clock className="mr-1 h-4 w-4" />
                                  En cours
                                </Button>
                              ) : (
                                <span className="italic text-gray-400">—</span>
                              ))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center space-y-3">
                            <Calendar className="h-12 w-12 text-gray-300" />
                            <p className="text-lg font-medium">Aucune donnée trouvée</p>
                            <p className="text-sm">Aucun enregistrement ne correspond à vos critères</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 lg:hidden">
                {paginatedAttendances.length > 0 ? (
                  paginatedAttendances.map((attendance) => (
                    <div
                      key={attendance.id}
                      className="rounded-[1.6rem] border border-orange-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {format(new Date(attendance.date), "EEEE dd MMMM yyyy", { locale: fr })}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {attendance.scanTime
                              ? `Arrivée à ${format(new Date(attendance.scanTime), "HH:mm")}`
                              : "Heure non enregistrée"}
                          </p>
                        </div>
                        {getPresenceBadge(attendance)}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {attendance.isPresent && !attendance.isLate ? (
                          <Badge variant="outline" className="border-slate-200 text-slate-500">
                            Aucun justificatif requis
                          </Badge>
                        ) : (
                          getStatusBadge(attendance.status)
                        )}
                      </div>

                      <div className="mt-4">
                        {(attendance.isLate || !attendance.isPresent) &&
                          (attendance.status === "TO_JUSTIFY" ? (
                            <Button
                              variant="outline"
                              onClick={() => handleJustify(attendance)}
                              className="w-full rounded-2xl border-orange-100 text-[#F16E00] hover:bg-orange-50 hover:text-[#F16E00]"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Justifier
                            </Button>
                          ) : attendance.status === "REJECTED" ? (
                            <Button
                              variant="outline"
                              onClick={() => handleJustify(attendance)}
                              className="w-full rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Rejustifier
                            </Button>
                          ) : attendance.status === "PENDING" ? (
                            <Button variant="outline" disabled className="w-full rounded-2xl border-yellow-200 text-yellow-600">
                              <Clock className="mr-2 h-4 w-4" />
                              En cours de validation
                            </Button>
                          ) : null)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-lg font-medium">Aucune donnée trouvée</p>
                    <p className="mt-1 text-sm">Aucun enregistrement ne correspond à vos critères</p>
                  </div>
                )}
              </div>

              {filteredAttendances.length > itemsPerPage && (
                <div className="border-t border-gray-200 bg-white px-6 py-4">
                  <Pagination
                    totalItems={filteredAttendances.length}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onPageChange={(page) => setCurrentPage(page)}
                    onItemsPerPageChange={(n) => {
                      setItemsPerPage(n);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog
            open={showJustifyModal}
            onOpenChange={(open) => {
              if (!open) handleCloseModal();
            }}
          >
            <DialogContent className="overflow-hidden rounded-[2rem] border-orange-100 bg-white p-0 shadow-[0_25px_80px_rgba(15,23,42,0.16)] sm:max-w-md">
              <div className="border-b border-orange-100 bg-white px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-slate-900">
                    Justifier votre {selectedAttendance?.isLate ? "retard" : "absence"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    {selectedAttendance
                      ? `${selectedAttendance.status === "REJECTED" ? "Nouvelle justification pour le" : "Justification pour le"} ${format(new Date(selectedAttendance.date), "dd MMMM yyyy", { locale: fr })}`
                      : ""}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6">
                {submitting ? (
                  <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
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
                        className="min-h-[120px] resize-none rounded-2xl border-slate-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Document justificatif <span className="text-gray-400">(optionnel)</span>
                      </label>
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
                        <Input
                          type="file"
                          accept="image/*"
                          className="cursor-pointer border-0 px-0 shadow-none focus-visible:ring-0"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (!f.type.startsWith("image/")) {
                              toast.error("Veuillez sélectionner une image uniquement");
                              e.target.value = "";
                              return;
                            }
                            if (f.size > 10 * 1024 * 1024) {
                              toast.error("La taille de l'image ne doit pas dépasser 10 MB");
                              e.target.value = "";
                              return;
                            }
                            setFile(f);
                          }}
                        />
                        <Upload className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      </div>

                      {file && (
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="max-w-[200px] truncate">{file.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFile(undefined)}
                            className="h-7 w-7 rounded-full p-0 hover:bg-slate-200"
                          >
                            <XCircle className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Formats acceptés : JPG, PNG, GIF, WebP (max 10 Mo)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="border-t border-orange-100 bg-white px-6 py-4">
                <Button variant="outline" onClick={handleCloseModal} disabled={submitting} className="rounded-2xl">
                  Annuler
                </Button>
                <Button
                  onClick={submitJustification}
                  disabled={!justification.trim() || submitting}
                  className="rounded-2xl bg-orange-500 text-white hover:bg-orange-600"
                >
                  {submitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
