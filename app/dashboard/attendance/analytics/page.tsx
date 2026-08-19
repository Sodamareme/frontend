"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { attendanceAPI, promotionsAPI, referentialsAPI, type AtRiskLearnersResponse, type Promotion, type Referential } from "@/lib/api"
import { AlertTriangle, Award, Clock3, TrendingDown, Users } from "lucide-react"

type AnalyticsPeriod = "week" | "month" | "year" | "quarter" | "custom"

const PERIOD_OPTIONS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Depuis le début de l'année" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "custom", label: "Période personnalisée" },
]

const getDefaultCustomRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const defaultAnalytics: AtRiskLearnersResponse = {
  period: "month",
  range: {
    startDate: "",
    endDate: "",
  },
  filters: {
    promotionId: null,
    referentialId: null,
    limit: 5,
  },
  mostAbsent: [],
  mostLate: [],
  mostRegular: [],
}

const formatDate = (value: string) => {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("fr-FR")
}

function LeaderboardCard({
  title,
  subtitle,
  emptyLabel,
  rows,
  accentClass,
  valueLabel,
  metaLabel,
  returnTo,
}: {
  title: string
  subtitle: string
  emptyLabel: string
  rows: AtRiskLearnersResponse["mostAbsent"]
  accentClass: string
  valueLabel: (row: AtRiskLearnersResponse["mostAbsent"][number]) => string
  metaLabel?: (row: AtRiskLearnersResponse["mostAbsent"][number]) => string
  returnTo: string
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.learnerId}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${accentClass}`}>
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {row.firstName} {row.lastName}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {row.referential?.name || "Sans référentiel"} • {row.promotion?.name || "Sans promotion"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{valueLabel(row)}</p>
                  <p className="text-xs text-gray-500">{metaLabel ? metaLabel(row) : `${row.attendanceRate}% de présence`}</p>
                </div>
                <Link
                  href={`/dashboard/learners/${row.learnerId}?returnTo=${encodeURIComponent(returnTo)}`}
                  className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-100"
                >
                  Voir détail
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function AttendanceAnalyticsPage() {
  const searchParams = useSearchParams()
  const [analytics, setAnalytics] = useState<AtRiskLearnersResponse>(defaultAnalytics)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [referentials, setReferentials] = useState<Referential[]>([])
  const [period, setPeriod] = useState<AnalyticsPeriod>(() => {
    const value = searchParams.get("period")
    return value === "week" || value === "month" || value === "year" || value === "quarter" || value === "custom"
      ? value
      : "month"
  })
  const [promotionId, setPromotionId] = useState(() => searchParams.get("promotionId") || "")
  const [referentialId, setReferentialId] = useState(() => searchParams.get("referentialId") || "")
  const defaultCustomRange = useMemo(getDefaultCustomRange, [])
  const [customStartDate, setCustomStartDate] = useState(() => searchParams.get("startDate") || defaultCustomRange.startDate)
  const [customEndDate, setCustomEndDate] = useState(() => searchParams.get("endDate") || defaultCustomRange.endDate)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [promotionsData, referentialsData] = await Promise.all([
          promotionsAPI.getAllPromotions(),
          referentialsAPI.getAllReferentials(),
        ])

        setPromotions(promotionsData)
        setReferentials(referentialsData)
      } catch (err) {
        console.error("Error fetching attendance analytics filters:", err)
      }
    }

    fetchFilters()
  }, [])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError("")

        const data = await attendanceAPI.getAtRiskLearners({
          period,
          promotionId: promotionId || undefined,
          referentialId: referentialId || undefined,
          ...(period === "custom" ? { startDate: customStartDate, endDate: customEndDate } : {}),
          limit: 10,
        })

        setAnalytics(data)
      } catch (err) {
        console.error("Error fetching attendance analytics:", err)
        setError("Impossible de charger l'analyse d'assiduité pour le moment.")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [period, promotionId, referentialId, customStartDate, customEndDate])

  const summary = useMemo(() => {
    const totalFlaggedLearners = new Set([
      ...analytics.mostAbsent.map((learner) => learner.learnerId),
      ...analytics.mostLate.map((learner) => learner.learnerId),
    ]).size

    return {
      totalFlaggedLearners,
      totalAbsences: analytics.mostAbsent.reduce((sum, learner) => sum + learner.absenceCount, 0),
      totalLate: analytics.mostLate.reduce((sum, learner) => sum + learner.lateCount, 0),
      bestAttendanceRate: analytics.mostRegular[0]?.attendanceRate ?? 0,
    }
  }, [analytics])

  const returnTo = useMemo(() => {
    const params = new URLSearchParams()
    params.set("period", period)

    if (promotionId) {
      params.set("promotionId", promotionId)
    }

    if (referentialId) {
      params.set("referentialId", referentialId)
    }

    if (period === "custom") {
      params.set("startDate", customStartDate)
      params.set("endDate", customEndDate)
    }

    const queryString = params.toString()
    return queryString
      ? `/dashboard/attendance/analytics?${queryString}`
      : "/dashboard/attendance/analytics"
  }, [period, promotionId, referentialId, customStartDate, customEndDate])

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Analyse d&apos;assiduite</h1>
        <p className="text-sm text-gray-600">
          Identifie rapidement les apprenants les plus absents ou les plus souvent en retard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-orange-600">
            <Users size={20} />
            <span className="text-sm font-medium text-gray-600">Apprenants à surveiller</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">{summary.totalFlaggedLearners}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-red-500">
            <TrendingDown size={20} />
            <span className="text-sm font-medium text-gray-600">Absences dans le top</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">{summary.totalAbsences}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-amber-500">
            <Clock3 size={20} />
            <span className="text-sm font-medium text-gray-600">Retards dans le top</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">{summary.totalLate}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-orange-500">
            <Award size={20} />
            <span className="text-sm font-medium text-gray-600">Meilleur taux</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">{summary.bestAttendanceRate}%</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 md:col-span-4">
          <div className="flex items-center gap-3 text-orange-500">
            <AlertTriangle size={20} />
            <span className="text-sm font-medium text-gray-600">Période analysée</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-900">
            {formatDate(analytics.range.startDate)} au {formatDate(analytics.range.endDate)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Les classements ci-dessous affichent le top 10 de la période choisie.
          </p>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Période</label>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-orange-400 focus:outline-none"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Promotion</label>
            <select
              value={promotionId}
              onChange={(event) => setPromotionId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-orange-400 focus:outline-none"
            >
              <option value="">Promotion active</option>
              {promotions.map((promotion) => (
                <option key={promotion.id} value={promotion.id}>
                  {promotion.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Référentiel</label>
            <select
              value={referentialId}
              onChange={(event) => setReferentialId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-orange-400 focus:outline-none"
            >
              <option value="">Tous les référentiels</option>
              {referentials.map((referential) => (
                <option key={referential.id} value={referential.id}>
                  {referential.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {period === "custom" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Date de début</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(event) => setCustomStartDate(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-orange-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Date de fin</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(event) => setCustomEndDate(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-orange-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Classement assidus: moins d&apos;absences d&apos;abord, puis moins de retards,
          ensuite meilleur taux de présence, plus de présences, puis scan moyen le plus tôt.
        </p>
      </section>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-sm text-gray-500">
          Chargement de l&apos;analyse d&apos;assiduite...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <LeaderboardCard
            title="Top assidus"
            subtitle="Apprenants avec la meilleure régularité sur la période."
            emptyLabel="Aucune présence exploitable sur cette période."
            rows={analytics.mostRegular}
            accentClass="bg-orange-100 text-orange-700"
            valueLabel={(row) => `${row.presentCount} présence${row.presentCount > 1 ? "s" : ""}`}
            metaLabel={(row) => `${row.attendanceRate}% • scan moyen ${row.averageScanTime || "—"}`}
            returnTo={returnTo}
          />

          <LeaderboardCard
            title="Top absentéistes"
            subtitle="Apprenants avec le plus d'absences enregistrées sur la période."
            emptyLabel="Aucune absence enregistrée sur cette période."
            rows={analytics.mostAbsent}
            accentClass="bg-red-100 text-red-700"
            valueLabel={(row) => `${row.absenceCount} absence${row.absenceCount > 1 ? "s" : ""}`}
            returnTo={returnTo}
          />

          <LeaderboardCard
            title="Top retardataires"
            subtitle="Apprenants avec le plus de retards enregistrés sur la période."
            emptyLabel="Aucun retard enregistré sur cette période."
            rows={analytics.mostLate}
            accentClass="bg-amber-100 text-amber-700"
            valueLabel={(row) => `${row.lateCount} retard${row.lateCount > 1 ? "s" : ""}`}
            returnTo={returnTo}
          />
        </div>
      )}
    </div>
  )
}
