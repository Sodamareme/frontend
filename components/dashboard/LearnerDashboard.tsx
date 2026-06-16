"use client";

import { useEffect, useState } from "react";
import { learnersAPI, referentialsAPI } from "@/lib/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { AttendanceStats, LearnerDetails, Module } from "@/lib/api";
import ModuleCard from "@/components/modules/ModuleCard";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  QrCode,
  ShieldAlert,
  Sparkles,
  User2,
  XCircle,
} from "lucide-react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

type LoadingState = {
  learner: boolean;
  stats: boolean;
  modules: boolean;
};

type ErrorState = {
  learner: string;
  stats: string;
  modules: string;
};

function DashboardStatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: number;
  note: string;
  icon: typeof CheckCircle2;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#d36b2c] via-[#f59e0b] to-[#f7c77d]" />
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#fff1e8] transition-transform duration-500 group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{note}</p>
        </div>
        <div className="rounded-2xl bg-[#fff1e8] p-3 text-[#d36b2c] shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function LearnerDashboard() {
  const [learnerDetails, setLearnerDetails] = useState<LearnerDetails | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    learner: true,
    stats: true,
    modules: true,
  });
  const [error, setError] = useState<ErrorState>({
    learner: "",
    stats: "",
    modules: "",
  });
  const [showQRCode, setShowQRCode] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);

  const fetchData = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error("User data not found");
      }

      const user = JSON.parse(userStr);
      if (!user?.email) {
        throw new Error("User email not found");
      }

      const details = await learnersAPI.getLearnerByEmail(user.email);

      if (details) {
        setLearnerDetails(details);

        const statsData = await learnersAPI.getLearnerAttendanceStats(details.id);
        setAttendanceStats({
          attendance: details.attendances || [],
          present: statsData.presentDays ?? 0,
          late: statsData.lateDays ?? 0,
          absent: statsData.absentDays ?? 0,
          totalDays: statsData.totalDays ?? 0,
          total: statsData.totalDays ?? 0,
          justifiedAbsentDays: statsData.justifiedAbsentDays ?? 0,
          unjustifiedAbsentDays: statsData.unjustifiedAbsentDays ?? 0,
        });

        if (details.referential?.id) {
          const referentialData = await referentialsAPI.getReferentialById(details.referential.id);
          setModules(referentialData.modules || []);
        } else {
          setModules([]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching learner dashboard:", err);
      setError({
        learner: err.response?.data?.message || "Impossible de charger le profil apprenant",
        stats: "Impossible de charger les statistiques de presence",
        modules: "Impossible de charger les modules",
      });
    } finally {
      setLoading({
        learner: false,
        stats: false,
        modules: false,
      });
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useAutoRefresh(fetchData, { intervalMs: 20_000 });

  const attendanceRate = (() => {
    if (!attendanceStats) return 0;
    const total = attendanceStats.present + attendanceStats.late + attendanceStats.absent;
    return total > 0 ? Math.round((attendanceStats.present / total) * 100) : 0;
  })();

  if (loading.learner) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed,_#f7f0e6_55%,_#efe5d4)]">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d36b2c] border-t-transparent" />
          <p className="text-sm text-slate-500">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (error.learner) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        {error.learner}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f7f0e6_45%,_#efe5d4)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-[2.25rem] border border-[#f1d7b4] bg-slate-950 text-white shadow-[0_25px_80px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.32),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.28),_transparent_30%),linear-gradient(135deg,_#0f172a,_#1e293b_58%,_#7c2d12_130%)]" />
            <div className="absolute -right-12 top-8 h-40 w-40 rounded-full border border-white/10 bg-white/5 blur-2xl" />
            <div className="absolute left-10 top-16 h-20 w-20 rounded-full bg-[#f59e0b]/20 blur-2xl" />

            <div className="relative grid gap-8 px-6 py-7 lg:grid-cols-[1.4fr_0.95fr] lg:px-8 lg:py-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-orange-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Dashboard apprenant
                </div>

                <div className="max-w-3xl">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                    {learnerDetails?.firstName || "Apprenant"} {learnerDetails?.lastName || ""}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Un espace plus clair pour suivre votre présence, retrouver votre QR code et voir votre parcours sans vous perdre.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-orange-200">Référentiel</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {learnerDetails?.referential?.name || "Non renseigne"}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-orange-200">Matricule</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {learnerDetails?.matricule || "Non renseigne"}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur sm:col-span-2 xl:col-span-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-orange-200">Modules</p>
                    <p className="mt-2 text-base font-semibold text-white">{modules.length}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowQRCode(true)}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#d36b2c] px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#bb5c22]"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Afficher mon QR code
                  </button>
                  <a
                    href="/dashboard/attendance/my"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-white/15"
                  >
                    Voir ma présence
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-orange-100">Taux de présence</p>
                    <p className="mt-2 text-5xl font-semibold tracking-tight text-white">
                      {attendanceRate}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-orange-200">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#d36b2c] via-[#f59e0b] to-[#fed7aa] transition-all duration-500"
                    style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Jours comptabilisés</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {attendanceStats?.totalDays || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Absences justifiées</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {attendanceStats?.justifiedAbsentDays || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#f59e0b]/20 bg-[#f59e0b]/10 p-4 text-sm text-orange-50">
                  Votre espace se met à jour automatiquement pour refléter les nouveaux pointages sans recharger la page.
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              label="Présences"
              value={attendanceStats?.present || 0}
              note="Validées"
              icon={CheckCircle2}
            />
            <DashboardStatCard
              label="Retards"
              value={attendanceStats?.late || 0}
              note="À surveiller"
              icon={Clock3}
            />
            <DashboardStatCard
              label="Absences"
              value={attendanceStats?.absent || 0}
              note={`${attendanceStats?.unjustifiedAbsentDays || 0} non justifiées`}
              icon={XCircle}
            />
            <DashboardStatCard
              label="Modules"
              value={modules.length}
              note="Parcours actif"
              icon={Layers3}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.92fr_1.28fr]">
            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#d36b2c]">QR Code</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Accès rapide</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Gardez votre code sous la main pour les pointages et les accès.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#fff1e8] p-3 text-[#d36b2c]">
                  <QrCode className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 rounded-[1.7rem] border border-[#f1d7b4] bg-[linear-gradient(180deg,_#fffaf5,_#fff)] p-5">
                <div className="mx-auto flex h-56 w-full max-w-[18rem] items-center justify-center rounded-[1.5rem] bg-white p-4 shadow-sm">
                  {learnerDetails?.qrCode ? (
                    <img
                      src={learnerDetails.qrCode}
                      alt="QR Code"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-sm text-slate-400">QR Code indisponible</div>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Référentiel</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {learnerDetails?.referential?.name || "Non renseigne"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Identité</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {learnerDetails?.firstName} {learnerDetails?.lastName}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#d36b2c]">Parcours</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Modules</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Les modules de votre référentiel sont regroupés ici dans une vue plus lisible.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6">
                {loading.modules ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="h-56 animate-pulse rounded-[1.7rem] bg-slate-100" />
                    ))}
                  </div>
                ) : error.modules ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error.modules}
                  </div>
                ) : modules.length === 0 ? (
                  <div className="rounded-[1.7rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-base font-medium text-slate-700">
                      Aucun module disponible
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Les modules de votre référentiel apparaîtront ici dès qu&apos;ils seront rattachés.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {modules.map((module) => (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        onClick={() => console.log(`Module clicked: ${module.name}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-2xl">
          <div className="overflow-hidden rounded-[2rem] border border-[#f1d7b4] bg-[linear-gradient(180deg,_#fffaf5,_#fff)] shadow-[0_25px_80px_rgba(15,23,42,0.2)]">
            <div className="border-b border-[#f4e3cd] bg-[#fff3e6] px-8 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#d36b2c] shadow-sm">
                <QrCode className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">Votre QR code</h2>
              <p className="mt-2 text-sm text-slate-600">
                Présentez ce code pour votre pointage et vos accès.
              </p>
            </div>

            <div className="p-8">
              <div className="rounded-[1.7rem] border border-[#f1d7b4] bg-white p-6 shadow-sm">
                <div className="mx-auto flex max-w-md items-center justify-center">
                  {learnerDetails?.qrCode ? (
                    <img
                      src={learnerDetails.qrCode}
                      alt="QR Code"
                      className="h-auto w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-sm text-slate-400">QR Code indisponible</div>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-center">
                <p className="text-xl font-semibold text-slate-900">
                  {learnerDetails?.firstName} {learnerDetails?.lastName}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {learnerDetails?.matricule || "Matricule indisponible"}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                  <User2 className="h-4 w-4" />
                  {learnerDetails?.referential?.name || "Référentiel non renseigné"}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
