"use client";

import { useEffect, useState } from "react";
import {
  attendanceAPI,
  learnersAPI,
  modulesAPI,
  referentialsAPI,
} from "@/lib/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type {
  AttendanceStats,
  LearnerDetailsExtended,
  LearnerRegularityLeaderboardResponse,
  Module,
} from "@/lib/api";
import ModuleCard from "@/components/modules/ModuleCard";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Flame,
  Medal,
  QrCode,
  ShieldAlert,
  Sparkles,
  Star,
  User2,
  Trophy,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

type LearnerDashboardDetails = Omit<LearnerDetailsExtended, "documents"> & {
  qrCode?: string;
  documents?: unknown[];
};

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

type LearnerRegularityPeriod = "month" | "year";

const REGULARITY_PERIOD_LABELS: Record<LearnerRegularityPeriod, string> = {
  month: "Mensuel",
  year: "Depuis le début",
};

type RegularityMessage = {
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
  iconClass: string;
};

type RegularityRowStyle = {
  badgeClass: string;
  shellClass: string;
  titleClass: string;
};

const leaderboardVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const leaderboardItemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

function getRegularityMessage(rank?: number, attendanceRate = 0): RegularityMessage {
  if (!rank) {
    return {
      title: "✨ En route",
      description: "Le classement se prépare. Continuez à pointer régulièrement.",
      icon: Sparkles,
      accentClass: "bg-indigo-50 text-indigo-600",
      iconClass: "bg-indigo-50 text-indigo-600",
    };
  }

  if (rank === 1) {
    return {
      title: "🏆 Boss du pointage",
      description: "Vous êtes en tête dans votre référentiel. Impressionnant.",
      icon: Trophy,
      accentClass: "bg-amber-50 text-amber-600",
      iconClass: "bg-amber-50 text-amber-600",
    };
  }

  if (rank <= 3) {
    return {
      title: "🔥 Podium en vue",
      description: "Vous êtes tout près du podium. Un dernier effort et c’est gagné.",
      icon: Flame,
      accentClass: "bg-orange-50 text-orange-600",
      iconClass: "bg-orange-50 text-orange-600",
    };
  }

  if (attendanceRate >= 85) {
    return {
      title: "✨ En route",
      description: "La régularité est là. Continuez sur ce bon rythme.",
      icon: Medal,
      accentClass: "bg-emerald-50 text-emerald-600",
      iconClass: "bg-emerald-50 text-emerald-600",
    };
  }

  return {
    title: "✨ En route",
    description: "Chaque pointage compte. Gardez le cap, la progression continue.",
    icon: Star,
    accentClass: "bg-slate-50 text-slate-600",
    iconClass: "bg-slate-50 text-slate-600",
  };
}

function getLeaderboardRowStyle(index: number): RegularityRowStyle {
  if (index === 0) {
    return {
      badgeClass: "bg-[#F16E00] text-white shadow-[0_10px_26px_rgba(241,110,0,0.24)] ring-4 ring-orange-100",
      shellClass: "border-orange-200 bg-gradient-to-r from-orange-50 via-white to-white shadow-[0_10px_34px_rgba(241,110,0,0.08)]",
      titleClass: "text-[#F16E00]",
    };
  }

  return {
    badgeClass: "bg-[#F16E00] text-white shadow-[0_10px_26px_rgba(241,110,0,0.18)] ring-4 ring-orange-100",
    shellClass: "border-slate-100 bg-white",
    titleClass: "text-slate-700",
  };
}

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
    <div className="group relative overflow-hidden rounded-[1.8rem] border border-orange-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#F16E00]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{note}</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-3 text-[#F16E00] shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function LearnerDashboard() {
  const [learnerDetails, setLearnerDetails] = useState<LearnerDashboardDetails | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [regularity, setRegularity] = useState<LearnerRegularityLeaderboardResponse | null>(null);
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
  const [regularityLoading, setRegularityLoading] = useState(true);
  const [regularityError, setRegularityError] = useState("");
  const [regularityPeriod, setRegularityPeriod] = useState<LearnerRegularityPeriod>("year");
  const [showQRCode, setShowQRCode] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);

  const getFriendlyLearnerError = (err: any) => {
    const status = err?.response?.status;

    if (status === 401 || status === 403) {
      return "Votre espace est temporairement indisponible. Veuillez vous reconnecter ou reessayer plus tard.";
    }

    return "Impossible de charger votre espace apprenant pour le moment.";
  };

  const fetchData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading({
          learner: true,
          stats: true,
          modules: true,
        });
      }

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
        setLearnerDetails({
          ...details,
          documents: Array.isArray((details as unknown as { documents?: unknown }).documents)
            ? ((details as unknown as { documents?: unknown[] }).documents ?? [])
            : [],
          qrCode: (details as { qrCode?: string }).qrCode,
        });

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
          attendanceRate: statsData.attendanceRate ?? 0,
        });

        if (details.referential?.id) {
          try {
            const referentialData = await referentialsAPI.getReferentialByIdSimple(details.referential.id);
            if (Array.isArray(referentialData.modules) && referentialData.modules.length > 0) {
              setModules(referentialData.modules);
            } else {
              const learnerModules = await modulesAPI.getActiveModulesByLearner(details.id);
              setModules(Array.isArray(learnerModules) ? learnerModules : []);
            }
            setError((prev) => ({ ...prev, modules: "" }));
          } catch {
            if (Array.isArray(details.referential?.modules) && details.referential.modules.length > 0) {
              setModules(details.referential.modules);
            } else {
              try {
                const learnerModules = await modulesAPI.getActiveModulesByLearner(details.id);
                setModules(Array.isArray(learnerModules) ? learnerModules : []);
              } catch {
                setModules([]);
              }
            }
            setError((prev) => ({ ...prev, modules: "" }));
          }
        } else {
          setModules([]);
          setError((prev) => ({ ...prev, modules: "" }));
        }
      }
    } catch (err: any) {
      setError({
        learner: getFriendlyLearnerError(err),
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

  const fetchRegularity = async (silent = false) => {
    try {
      if (!silent) {
        setRegularityLoading(true);
      }

      const promotionStartDate = learnerDetails?.promotion?.startDate;
      if (regularityPeriod === "year" && !promotionStartDate) {
        return;
      }
      const params =
        regularityPeriod === "year" && promotionStartDate
          ? {
              period: "custom" as const,
              startDate: promotionStartDate,
              endDate: new Date().toISOString(),
            }
          : {
              period: regularityPeriod,
            };

      const data = await attendanceAPI.getLearnerRegularityRanking(params);
      setRegularity(data);
      setRegularityError("");
    } catch (err) {
      console.error("Error fetching learner regularity:", err);
      setRegularity(null);
      setRegularityError("Impossible de charger votre classement pour le moment.");
    } finally {
      setRegularityLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useAutoRefresh(() => fetchData(true), { intervalMs: 20_000 });
  useEffect(() => {
    void fetchRegularity();
  }, [regularityPeriod, learnerDetails?.promotion?.startDate]);
  useAutoRefresh(() => fetchRegularity(true), { intervalMs: 30_000 });

  const attendanceRate = (() => {
    if (!attendanceStats) return 0;
    return Math.round(attendanceStats.attendanceRate ?? 0);
  })();

  const learnerRank = regularity?.learner?.rank ?? null;
  const learnerRegularityRate = regularity?.learner?.attendanceRate ?? 0;
  const regularityMessage = getRegularityMessage(learnerRank ?? undefined, learnerRegularityRate);
  const RegularityIcon = regularityMessage.icon;

  if (loading.learner) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-white">
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
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm"
          >
            <div className="h-2 w-full bg-[#F16E00]" />
            <div className="grid gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.95fr)] lg:px-8 lg:py-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[#F16E00]">
                  Dashboard apprenant
                </div>

                <div className="max-w-3xl">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    {learnerDetails?.firstName || "Apprenant"} {learnerDetails?.lastName || ""}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm text-slate-700">
                    <BookOpen className="h-4 w-4 text-[#F16E00]" />
                    {learnerDetails?.referential?.name || "Référentiel non renseigné"}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm text-slate-700">
                    <User2 className="h-4 w-4 text-[#F16E00]" />
                    {learnerDetails?.matricule || "Matricule non renseigné"}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    onClick={() => setShowQRCode(true)}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#F16E00] px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#d95f00] sm:w-auto"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Afficher mon QR code
                  </button>
                  <a
                    href="/dashboard/attendance/my"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-orange-100 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-orange-50 sm:w-auto"
                  >
                    Voir ma présence
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-orange-100 bg-gradient-to-br from-white to-orange-50/40 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Taux de présence</p>
                    <p className="mt-2 text-5xl font-semibold tracking-tight text-[#F16E00]">
                      {attendanceRate}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-[#F16E00] shadow-sm">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#F16E00] transition-all duration-500"
                    style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                  />
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                  <span>{attendanceStats?.totalDays || 0} jours suivis</span>
                  <span>{attendanceStats?.justifiedAbsentDays || 0} absences justifiées</span>
                </div>
              </div>
            </div>
          </motion.section>

          <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm"
            >
              <motion.div
                aria-hidden="true"
                animate={{ y: [0, -8, 0], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-orange-100/60 blur-3xl"
              />
              <motion.div
                aria-hidden="true"
                animate={{ y: [0, 10, 0], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-amber-100/60 blur-3xl"
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#F16E00]">Classement</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Assiduité</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Classement mensuel ou depuis le début, trié par absences, retards, taux de présence, puis scan moyen le plus tôt.
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.06, 1] }}
                  transition={{ duration: 4.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                  className={`rounded-2xl p-3 ${regularityMessage.iconClass}`}
                >
                  <RegularityIcon className="h-6 w-6" />
                </motion.div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(["month", "year"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setRegularityPeriod(period)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      regularityPeriod === period
                        ? "bg-[#F16E00] text-white"
                        : "bg-orange-50 text-[#F16E00] hover:bg-orange-100"
                    }`}
                  >
                    {REGULARITY_PERIOD_LABELS[period]}
                  </button>
                ))}
              </div>

              <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Votre rang</p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-3xl font-semibold text-slate-900">
                      {regularityLoading ? "..." : learnerRank ?? "—"}
                    </p>
                    <div className="mb-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#F16E00] shadow-sm">
                      {regularity?.totalLearners ? `sur ${regularity.totalLearners}` : "—"}
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Taux</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {regularityLoading ? "..." : `${learnerRegularityRate}%`}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100">
                    <div
                      className="h-full rounded-full bg-[#F16E00] transition-all duration-700"
                      style={{ width: `${Math.min(learnerRegularityRate, 100)}%` }}
                    />
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Référentiel</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {regularity?.referential?.name || learnerDetails?.referential?.name || "—"}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Période analysée</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {regularity?.range?.startDate && regularity?.range?.endDate
                      ? `${new Date(regularity.range.startDate).toLocaleDateString("fr-FR")} au ${new Date(regularity.range.endDate).toLocaleDateString("fr-FR")}`
                      : "—"}
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                className="mt-5 rounded-[1.5rem] border border-orange-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl p-2.5 ${regularityMessage.accentClass}`}>
                    <RegularityIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F16E00]">{regularityMessage.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {regularityMessage.description}
                    </p>
                  </div>
                </div>
              </motion.div>

              {regularityError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {regularityError}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm"
            >
              <motion.div
                aria-hidden="true"
                animate={{ scale: [1, 1.08, 1], opacity: [0.22, 0.38, 0.22] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-100/50 blur-3xl"
              />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#F16E00]">Top 5</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Les plus réguliers</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Le classement du moment dans votre référentiel.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F16E00] text-sm font-bold text-white shadow-[0_12px_30px_rgba(241,110,0,0.25)]">
                  05
                </div>
              </div>

              <motion.ul
                variants={leaderboardVariants}
                initial="hidden"
                animate="show"
                className="relative mt-6 space-y-3"
              >
                {regularityLoading ? (
                  [...Array(5)].map((_, index) => (
                    <li
                      key={index}
                      className="h-24 animate-pulse rounded-[1.4rem] bg-slate-100"
                    />
                  ))
                ) : regularity?.topRegular?.length ? (
                  regularity.topRegular.map((learner, index) => {
                    const rowStyle = getLeaderboardRowStyle(index);

                    return (
                      <motion.li
                        key={learner.learnerId}
                        variants={leaderboardItemVariants}
                        whileHover={{ y: -3, scale: 1.01 }}
                        className={`rounded-[1.4rem] border px-4 py-4 shadow-sm ${rowStyle.shellClass}`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rowStyle.badgeClass}`}>
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-slate-900">
                                {learner.firstName} {learner.lastName}
                              </p>
                              <p className={`truncate text-sm ${rowStyle.titleClass}`}>
                                {learner.referential?.name || "Référentiel non renseigné"}
                              </p>
                              <div className="mt-2 grid gap-2 sm:flex sm:flex-wrap">
                                <span className="inline-flex w-full items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-600 shadow-sm sm:w-auto sm:text-xs">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  {learner.presentCount} présents
                                </span>
                                <span className="inline-flex w-full items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-600 shadow-sm sm:w-auto sm:text-xs">
                                  <Clock3 className="h-3.5 w-3.5 text-orange-500" />
                                  {learner.lateCount} retards
                                </span>
                                <span className="inline-flex w-full items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-600 shadow-sm sm:w-auto sm:text-xs">
                                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                                  {learner.absenceCount} absences
                                </span>
                                <span className="inline-flex w-full items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-600 shadow-sm sm:w-auto sm:text-xs">
                                  <Clock3 className="h-3.5 w-3.5 text-sky-500" />
                                  Scan moyen {learner.averageScanTime || "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:ml-auto sm:flex-col sm:items-end sm:justify-center">
                            <p className="text-sm font-semibold text-[#F16E00] sm:text-base">
                              {learner.attendanceRate}%
                            </p>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                              Présence
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Le classement se prépare.
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Dès qu’il y aura assez de pointages, votre rang apparaîtra ici.
                    </p>
                  </div>
                )}
              </motion.ul>
            </motion.div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.92fr_1.28fr]">
            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#F16E00]">QR Code</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Accès rapide</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Gardez votre code sous la main pour les pointages et les accès.
                  </p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-3 text-[#F16E00]">
                  <QrCode className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 rounded-[1.7rem] border border-orange-100 bg-white p-5">
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
                  <p className="text-sm font-medium text-[#F16E00]">Parcours</p>
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
          <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.2)]">
            <div className="border-b border-orange-100 bg-white px-8 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-[#F16E00] shadow-sm">
                <QrCode className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">Votre QR code</h2>
              <p className="mt-2 text-sm text-slate-600">
                Présentez ce code pour votre pointage et vos accès.
              </p>
            </div>

            <div className="p-8">
              <div className="rounded-[1.7rem] border border-orange-100 bg-white p-6 shadow-sm">
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
