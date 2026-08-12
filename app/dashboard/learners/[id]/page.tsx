"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { learnersAPI, type Learner, type AttendanceStats, attendanceAPI, LearnerAttendance } from "@/lib/api"
import { Calendar, CheckCircle, Clock, Edit, AlertTriangle, ArrowLeft, Save, X } from "lucide-react"
import { toast } from "sonner"
import { getUserFriendlyErrorMessage } from "@/lib/error"

// Add these helper functions at the top of your component
const getReferentialBadgeClass = (referentialName: string) => {
  switch (referentialName) {
    case "AWS & DevOps":
      return "bg-orange-100 text-orange-800";
    case "Développement web/mobile":
      return "bg-green-100 text-green-800";
    case "Assistanat Digital (Hackeuse)":
      return "bg-pink-100 text-pink-800";
    case "Développement data":
      return "bg-purple-100 text-purple-800";
    case "Référent digital":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getReferentialAlias = (referentialName: string) => {
  switch (referentialName) {
    case "AWS & DevOps":
      return "AWS";
    case "Développement web/mobile":
      return "DEV WEB/MOBILE";
    case "Assistanat Digital (Hackeuse)":
      return "HACKEUSE";
    case "Développement data":
      return "DEV DATA";
    case "Référent digital":
      return "REF DIG";
    default:
      return referentialName || "Non assigné";
  }
};

export default function LearnerDetailsPage() {
  const { id } = useParams() || {}
  const learnerId = Array.isArray(id) ? id[0] : id
  const router = useRouter()
  const searchParams = useSearchParams()

  const [learner, setLearner] = useState<Learner | null>(null)
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attendances, setAttendances] = useState<LearnerAttendance[]>([])
  const [isEditingLearner, setIsEditingLearner] = useState(false)
  const [isSavingLearner, setIsSavingLearner] = useState(false)
  const [learnerForm, setLearnerForm] = useState({
    firstName: "",
    lastName: "",
    gender: "MALE",
    birthDate: "",
    birthPlace: "",
    address: "",
    phone: "",
  })

  const returnTo = searchParams.get("returnTo")
  const listSearchParams = new URLSearchParams(searchParams.toString())
  listSearchParams.delete("returnTo")

  const backHref = returnTo
    ? decodeURIComponent(returnTo)
    : listSearchParams.toString()
      ? `/dashboard/learners?${listSearchParams.toString()}`
      : "/dashboard/learners"

  useEffect(() => {
    const fetchLearnerData = async () => {
      try {
        setLoading(true);
        setError("");

        const [learnerData, attendanceData, learnerAttendanceStats] = await Promise.all([
          learnersAPI.getLearnerById(learnerId ?? ""),
          attendanceAPI.getAttendanceByLearner(learnerId ?? ""),
          learnersAPI.getLearnerAttendanceStats(learnerId ?? ""),
        ]);

        setLearner(learnerData);
        setLearnerForm({
          firstName: learnerData.firstName || "",
          lastName: learnerData.lastName || "",
          gender: learnerData.gender || "MALE",
          birthDate: learnerData.birthDate ? new Date(learnerData.birthDate).toISOString().split("T")[0] : "",
          birthPlace: learnerData.birthPlace || "",
          address: learnerData.address || "",
          phone: learnerData.phone || "",
        })
        
        if (Array.isArray(attendanceData)) {
          setAttendances(attendanceData);

          const stats = {
            attendance: attendanceData,
            present: learnerAttendanceStats.presentDays ?? attendanceData.filter(a => a.isPresent && !a.isLate).length,
            late: learnerAttendanceStats.lateDays ?? attendanceData.filter(a => a.isPresent && a.isLate).length,
            absent: learnerAttendanceStats.absentDays ?? attendanceData.filter(a => !a.isPresent).length,
            totalDays: learnerAttendanceStats.totalDays ?? attendanceData.length,
            total: learnerAttendanceStats.totalDays ?? attendanceData.length,
            justifiedAbsentDays: learnerAttendanceStats.justifiedAbsentDays ?? 0,
            unjustifiedAbsentDays:
              learnerAttendanceStats.unjustifiedAbsentDays ??
              Math.max(
                (learnerAttendanceStats.absentDays ?? attendanceData.filter(a => !a.isPresent).length) -
                  (learnerAttendanceStats.justifiedAbsentDays ?? 0),
                0
              ),
          };
          setAttendanceStats(stats);
        } else {
          console.error('Unexpected attendance data format:', attendanceData);
          setAttendances([]);
          setAttendanceStats({
            attendance: [],
            present: 0,
            late: 0,
            absent: 0,
            totalDays: 0,
            total: 0,
            justifiedAbsentDays: 0,
            unjustifiedAbsentDays: 0,
          });
        }

      } catch (err) {
        console.error("Error fetching learner data:", err);
        setError(getUserFriendlyErrorMessage(err, "Une erreur est survenue lors du chargement des données"));
      } finally {
        setLoading(false);
      }
    };

    if (learnerId) {
      fetchLearnerData();
    }
  }, [learnerId]);

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"

    try {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
      return new Date(dateString).toLocaleDateString("fr-FR", options)
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  // Format status
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return "Actif"
      case "INACTIVE":
        return "Inactif"
      case "SUSPENDED":
        return "Suspendu"
      case "REPLACED":
        return "Remplacé"
      case "WAITING_LIST":
        return "Liste d'attente"
      default:
        return status
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "INACTIVE":
        return "bg-gray-100 text-gray-800"
      case "SUSPENDED":
        return "bg-yellow-100 text-yellow-800"
      case "REPLACED":
        return "bg-orange-100 text-orange-800"
      case "WAITING_LIST":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleLearnerFormChange = (field: keyof typeof learnerForm, value: string) => {
    setLearnerForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCancelEditLearner = () => {
    if (!learner) return

    setLearnerForm({
      firstName: learner.firstName || "",
      lastName: learner.lastName || "",
      gender: learner.gender || "MALE",
      birthDate: learner.birthDate ? new Date(learner.birthDate).toISOString().split("T")[0] : "",
      birthPlace: learner.birthPlace || "",
      address: learner.address || "",
      phone: learner.phone || "",
    })
    setIsEditingLearner(false)
  }

  const handleSaveLearner = async () => {
    if (!learner) return

    try {
      setIsSavingLearner(true)
      const updatedLearner = await learnersAPI.updateLearner(learner.id, {
        firstName: learnerForm.firstName.trim(),
        lastName: learnerForm.lastName.trim(),
        gender: learnerForm.gender as "MALE" | "FEMALE",
        birthDate: learnerForm.birthDate,
        birthPlace: learnerForm.birthPlace.trim(),
        address: learnerForm.address.trim(),
        phone: learnerForm.phone.trim(),
      })

      setLearner(updatedLearner as Learner)
      setLearnerForm({
        firstName: updatedLearner.firstName || "",
        lastName: updatedLearner.lastName || "",
        gender: updatedLearner.gender || "MALE",
        birthDate: updatedLearner.birthDate ? new Date(updatedLearner.birthDate).toISOString().split("T")[0] : "",
        birthPlace: updatedLearner.birthPlace || "",
        address: updatedLearner.address || "",
        phone: updatedLearner.phone || "",
      })
      setIsEditingLearner(false)
      toast.success("Informations de l'apprenant mises à jour")
    } catch (error: any) {
      console.error("Error updating learner:", error)
      toast.error(getUserFriendlyErrorMessage(error, "Erreur lors de la mise à jour de l'apprenant"))
    } finally {
      setIsSavingLearner(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with return button */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.push(backHref)}
            className="mr-4 p-2  hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
            <div className="flex items-center">
            <h1 className="text-2xl font-bold text-teal-600">Apprenants</h1>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-orange-500">Détails</span>
            </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex mb-6">
              <div className="rounded-full bg-gray-200 h-20 w-20"></div>
              <div className="ml-4 space-y-3 flex-1">
                <div className="h-7 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 rounded w-1/5"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        ) : learner ? (
          <>
            {/* Learner header with stats */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="flex flex-col md:flex-row">
                {/* Learner info */}
                <div className="p-6 flex items-start justify-between w-fit">
                  {/* Left side with photo and basic info */}
                  <div className="flex items-start">
                    <div className="h-24 w-24 rounded-full overflow-hidden mr-4 border-4 border-white shadow-md">
                      {learner.photoUrl ? (
                        <img
                          src={learner.photoUrl || "/placeholder.svg"}
                          alt={`${learner.firstName} ${learner.lastName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-teal-600 flex items-center justify-center text-white text-xl font-bold">
                          {`${learner.firstName.charAt(0)}${learner.lastName.charAt(0)}`}
                        </div>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800">
                        {learner.firstName} {learner.lastName}
                      </h1>
                      <div className="mt-2 space-y-2">
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-lg ${
                          getReferentialBadgeClass(learner.referential?.name || "")
                        }`}>
                          {getReferentialAlias(learner.referential?.name || "")}
                        </span>
                        <span className={`ml-2 inline-flex px-3 py-1 text-sm font-medium rounded-lg ${
                          getStatusColor(learner.status)
                        }`}>
                          {getStatusLabel(learner.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side with action button */}
                  {learner.status === 'ACTIVE' && (
                    <button
                      onClick={() => router.push(`/dashboard/learners/${learner.id}/replace`)}
                      className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                      Remplacer l'apprenant
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="flex-1 flex flex-wrap md:flex-nowrap border-t md:border-t-0 md:border-l border-gray-100">
                  {/* Counted days */}
                  <div className="flex-1 p-6 flex items-center justify-center border-r border-gray-100 bg-gray-50 bg-opacity-50">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                        <Calendar className="h-6 w-6 text-blue-500" />
                      </div>
                      <span className="text-3xl font-bold text-blue-500">{attendanceStats?.totalDays || 0}</span>
                      <span className="text-sm text-gray-500">Jour(s) comptabilisé(s)</span>
                    </div>
                  </div>

                  {/* Present */}
                  <div className="flex-1 p-6 flex items-center justify-center border-r border-gray-100 bg-gray-50 bg-opacity-50">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                      <span className="text-3xl font-bold text-green-500">{attendanceStats?.present || 0}</span>
                      <span className="text-sm text-gray-500">Présence(s)</span>
                    </div>
                  </div>

                  {/* Late */}
                  <div className="flex-1 p-6 flex items-center justify-center border-r border-gray-100 bg-gray-50 bg-opacity-50">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                        <Clock className="h-6 w-6 text-orange-500" />
                      </div>
                      <span className="text-3xl font-bold text-orange-500">{attendanceStats?.late || 0}</span>
                      <span className="text-sm text-gray-500">Retard(s)</span>
                    </div>
                  </div>

                  {/* Absent */}
                  <div className="flex-1 p-6 flex items-center justify-center bg-gray-50 bg-opacity-50">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                      </div>
                      <span className="text-3xl font-bold text-red-500">{attendanceStats?.absent || 0}</span>
                      <span className="text-sm text-gray-500">Absence(s)</span>
                      <span className="text-xs text-gray-400 mt-1">
                        Dont {attendanceStats?.justifiedAbsentDays || 0} justifiée(s)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Learner personal information */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Informations de l'apprenant</h2>
                {isEditingLearner ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveLearner}
                      disabled={isSavingLearner}
                      className="inline-flex items-center rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={16} className="mr-2" />
                      {isSavingLearner ? "Enregistrement..." : "Enregistrer"}
                    </button>
                    <button
                      onClick={handleCancelEditLearner}
                      disabled={isSavingLearner}
                      className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X size={16} className="mr-2" />
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingLearner(true)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Modifier les informations"
                  >
                    <Edit size={18} />
                  </button>
                )}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Prénom(s)</label>
                      {isEditingLearner ? (
                        <input
                          type="text"
                          value={learnerForm.firstName}
                          onChange={(event) => handleLearnerFormChange("firstName", event.target.value)}
                          className="w-full rounded-md border border-gray-200 bg-white p-3 text-gray-700 focus:border-orange-400 focus:outline-none"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md text-gray-700">{learner.firstName}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Nom</label>
                      {isEditingLearner ? (
                        <input
                          type="text"
                          value={learnerForm.lastName}
                          onChange={(event) => handleLearnerFormChange("lastName", event.target.value)}
                          className="w-full rounded-md border border-gray-200 bg-white p-3 text-gray-700 focus:border-orange-400 focus:outline-none"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md text-gray-700">{learner.lastName}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm text-gray-500 mb-1">Date de naissance</label>
                      {isEditingLearner ? (
                        <input
                          type="date"
                          value={learnerForm.birthDate}
                          onChange={(event) => handleLearnerFormChange("birthDate", event.target.value)}
                          className="w-full rounded-md border border-gray-200 bg-white p-3 text-gray-700 focus:border-orange-400 focus:outline-none"
                        />
                      ) : (
                        <>
                          <div className="p-3 bg-gray-50 rounded-md text-gray-700 pr-10">
                            {formatDate(learner.birthDate)}
                          </div>
                          <div className="absolute right-3 top-9 text-orange-500">
                            <Calendar size={16} />
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Lieu de naissance</label>
                      {isEditingLearner ? (
                        <input
                          type="text"
                          value={learnerForm.birthPlace}
                          onChange={(event) => handleLearnerFormChange("birthPlace", event.target.value)}
                          className="w-full rounded-md border border-gray-200 bg-white p-3 text-gray-700 focus:border-orange-400 focus:outline-none"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md text-gray-700">{learner.birthPlace || "N/A"}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Adresse</label>
                    {isEditingLearner ? (
                      <input
                        type="text"
                        value={learnerForm.address}
                        onChange={(event) => handleLearnerFormChange("address", event.target.value)}
                        className="w-full rounded-md border border-gray-200 bg-white p-3 text-gray-700 focus:border-orange-400 focus:outline-none"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">{learner.address || "N/A"}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Téléphone</label>
                    {isEditingLearner ? (
                      <input
                        type="tel"
                        value={learnerForm.phone}
                        onChange={(event) => handleLearnerFormChange("phone", event.target.value)}
                        className="w-full rounded-md border border-gray-200 bg-white p-3 text-gray-700 focus:border-orange-400 focus:outline-none"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">{learner.phone}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Sexe</label>
                    {isEditingLearner ? (
                      <select
                        value={learnerForm.gender}
                        onChange={(event) => handleLearnerFormChange("gender", event.target.value)}
                        className="w-full rounded-md border border-gray-200 bg-white p-3 text-gray-700 focus:border-orange-400 focus:outline-none"
                      >
                        <option value="MALE">Masculin</option>
                        <option value="FEMALE">Féminin</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                        {learner.gender === "FEMALE" ? "Féminin" : "Masculin"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tutor information */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Informations du tuteur</h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit size={18} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Prénom(s)</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                      {learner.tutor?.firstName || "Non renseigné"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Nom</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                      {learner.tutor?.lastName || "Non renseigné"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Lien de parenté</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                        {learner.tutor?.relationship || "Non renseigné"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Adresse</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                        {learner.tutor?.address || "Non renseigné"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Téléphone</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                        {learner.tutor?.phone || "Non renseigné"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kit Status */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Kit de l'apprenant</h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit size={18} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Laptop */}
                  <div className={`p-4 rounded-lg border-2 ${
                    learner.kit?.laptop 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <svg 
                        className={`w-8 h-8 ${
                          learner.kit?.laptop ? 'text-green-500' : 'text-red-500'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-700">Laptop</p>
                        <p className={`text-sm ${
                          learner.kit?.laptop ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {learner.kit?.laptop ? 'Reçu' : 'Non reçu'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Charger */}
                  <div className={`p-4 rounded-lg border-2 ${
                    learner.kit?.charger 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <svg 
                        className={`w-8 h-8 ${
                          learner.kit?.charger ? 'text-green-500' : 'text-red-500'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-700">Chargeur</p>
                        <p className={`text-sm ${
                          learner.kit?.charger ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {learner.kit?.charger ? 'Reçu' : 'Non reçu'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bag */}
                  <div className={`p-4 rounded-lg border-2 ${
                    learner.kit?.bag 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <svg 
                        className={`w-8 h-8 ${
                          learner.kit?.bag ? 'text-green-500' : 'text-red-500'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-700">Sac</p>
                        <p className={`text-sm ${
                          learner.kit?.bag ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {learner.kit?.bag ? 'Reçu' : 'Non reçu'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Polo */}
                  <div className={`p-4 rounded-lg border-2 ${
                    learner.kit?.polo 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <svg 
                        className={`w-8 h-8 ${
                          learner.kit?.polo ? 'text-green-500' : 'text-red-500'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-700">Polo</p>
                        <p className={`text-sm ${
                          learner.kit?.polo ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {learner.kit?.polo ? 'Reçu' : 'Non reçu'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 mt-10">
              © 2025 Orange Digital Center. Tous droits réservés.
            </div>
          </>
        ) : (
          <div className="bg-gray-50 text-gray-600 p-4 rounded-lg text-center">
            Aucun apprenant trouvé avec cet identifiant
          </div>
        )}
      </div>
    </div>
  )
}
