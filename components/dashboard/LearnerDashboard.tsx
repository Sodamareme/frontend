"use client";

import { useEffect, useState } from "react";
import { learnersAPI, referentialsAPI } from "@/lib/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { AttendanceStats, LearnerDetails, Module } from "@/lib/api";
import ModuleCard from "@/components/modules/ModuleCard";
import { BookOpen, CheckCircle2, Clock3, GraduationCap, QrCode, ShieldAlert, User2, XCircle } from "lucide-react";

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

function StatPanel({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  icon: typeof CheckCircle2;
  tone: "emerald" | "amber" | "red" | "slate";
}) {
  const tones = {
    emerald: {
      iconWrap: "bg-[#fff1e8] text-[#d36b2c]",
      value: "text-slate-900",
    },
    amber: {
      iconWrap: "bg-[#fff1e8] text-[#d36b2c]",
      value: "text-slate-900",
    },
    red: {
      iconWrap: "bg-[#fff1e8] text-[#d36b2c]",
      value: "text-slate-900",
    },
    slate: {
      iconWrap: "bg-[#fff1e8] text-[#d36b2c]",
      value: "text-slate-800",
    },
  } as const;

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-semibold ${tones[tone].value}`}>{value}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{note}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone].iconWrap}`}>
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

  useEffect(() => {
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

    fetchData();
  }, []);

  const attendanceRate = (() => {
    if (!attendanceStats) return 0;
    const total = attendanceStats.present + attendanceStats.late + attendanceStats.absent;
    return total > 0 ? Math.round((attendanceStats.present / total) * 100) : 0;
  })();

  if (loading.learner) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f5f1e8]">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d36b2c] border-t-transparent" />
          <p className="text-sm text-slate-500">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (error.learner) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error.learner}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <section className="rounded-[2rem] border border-[#e7dccb] bg-[#fbf8f2] shadow-sm">
            <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.45fr_0.8fr] lg:px-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#d36b2c]">
                    Dashboard apprenant
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    {learnerDetails?.firstName || "Apprenant"} {learnerDetails?.lastName || ""}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-[#eadbc5] bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#d36b2c]">Referentiel</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {learnerDetails?.referential?.name || "Non renseigne"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#eadbc5] bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#d36b2c]">Matricule</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {learnerDetails?.matricule || "Non renseigne"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-[#eadbc5] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Taux de presence</p>
                    <p className="mt-2 text-4xl font-semibold text-[#d36b2c]">{attendanceRate}%</p>
                  </div>
                  <div className="rounded-2xl bg-[#f3eadc] p-3 text-[#d36b2c]">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#d36b2c] transition-all duration-500"
                    style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-slate-500">Jours comptabilises</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {attendanceStats?.totalDays || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-slate-500">Absences justifiees</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {attendanceStats?.justifiedAbsentDays || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatPanel label="Presences" value={attendanceStats?.present || 0} note="Valides" icon={CheckCircle2} tone="emerald" />
            <StatPanel label="Retards" value={attendanceStats?.late || 0} note="Cumules" icon={Clock3} tone="amber" />
            <StatPanel label="Absences" value={attendanceStats?.absent || 0} note={`${attendanceStats?.unjustifiedAbsentDays || 0} non justifiees`} icon={XCircle} tone="red" />
            <StatPanel label="Modules" value={modules.length} note="Actifs" icon={BookOpen} tone="slate" />
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#d36b2c]">QR Code</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Acces rapide</h2>
                </div>
                <div className="rounded-2xl bg-[#f3eadc] p-3 text-[#d36b2c]">
                  <QrCode className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-[#eadbc5] bg-[#fcfaf6] p-5">
                <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-[1.5rem] bg-white p-4 shadow-sm">
                  {learnerDetails?.qrCode ? (
                    <img
                      src={learnerDetails.qrCode}
                      alt="QR Code"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-sm text-slate-400">
                      QR Code indisponible
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowQRCode(true)}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#d36b2c] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#bb5c22]"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Ouvrir en grand
                </button>
                <a
                  href="/dashboard/attendance/my"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Voir mes presences
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#d36b2c]">Parcours</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Modules</h2>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6">
                {loading.modules ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="h-56 animate-pulse rounded-3xl bg-slate-100" />
                    ))}
                  </div>
                ) : error.modules ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error.modules}
                  </div>
                ) : modules.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-base font-medium text-slate-700">
                      Aucun module disponible
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Les modules de votre referentiel apparaitront ici des qu'ils seront rattaches.
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
        <DialogContent className="border-0 bg-[#fbf8f2] p-0 shadow-2xl sm:max-w-2xl">
          <div className="rounded-[1.75rem] p-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3eadc] text-[#d36b2c]">
                <QrCode className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">Votre QR code</h2>
              <p className="mt-2 text-sm text-slate-600">
                Presentez ce code pour votre pointage et vos acces.
              </p>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-[#eadbc5] bg-white p-6 shadow-sm">
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

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-xl font-semibold text-slate-900">
                {learnerDetails?.firstName} {learnerDetails?.lastName}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {learnerDetails?.matricule || "Matricule indisponible"}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                <User2 className="h-4 w-4" />
                {learnerDetails?.referential?.name || "Referentiel non renseigne"}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
