"use client"

import { useState, useEffect, useRef } from "react"
import { User, Phone, Mail, MapPin, Calendar, BookOpen, School, Package, FileText, CheckCircle, XCircle, Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { UserCircle, GraduationCap, PackageCheck, Files } from 'lucide-react'
import EditablePersonalInfo from '@/components/EditablePersonalInfo'
import { learnersAPI } from "@/lib/api"
import type { LearnerDetails } from "@/lib/api"
import { getAuthToken } from "@/lib/api"

// ─── URL de base de l'API ─────────────────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [learnerDetails, setLearnerDetails] = useState<LearnerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const fetchLearnerData = async () => {
      try {
        const userStr = localStorage.getItem('user')
        if (!userStr) throw new Error('Utilisateur non connecté')

        const user = JSON.parse(userStr)
        if (!user?.email) throw new Error('Email utilisateur introuvable')

        const details = await learnersAPI.getLearnerByEmail(user.email)
        setLearnerDetails(details)
      } catch (err: any) {
        console.error('Error fetching learner data:', err)
        setError(err.message || 'Impossible de charger les données du profil')
      } finally {
        setLoading(false)
      }
    }

    fetchLearnerData()
  }, [])

  // ── Sauvegarder les infos personnelles ──────────────────────────────────────
  const handleSaveLearnerData = async (formData: any) => {
    setSaveLoading(true)
    setSaveMessage(null)

    try {
      if (!learnerDetails?.id) throw new Error("ID de l'apprenant introuvable")

      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const token = user?.token || getAuthToken()

      if (!token) throw new Error("Token d'authentification manquant")

      const updateData = {
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        birthDate: formData.birthDate,
        birthPlace: formData.birthPlace,
      }

      const response = await fetch(`${API_BASE_URL}/learners/${learnerDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde')
      }

      const updatedLearner = await response.json()
      setLearnerDetails(updatedLearner)
      setSaveMessage({ type: 'success', message: 'Informations mises à jour avec succès' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      setSaveMessage({
        type: 'error',
        message: error.message || 'Erreur lors de la sauvegarde. Veuillez réessayer.',
      })
    } finally {
      setSaveLoading(false)
    }
  }

  // ── Mettre à jour la photo ───────────────────────────────────────────────────
  const handlePhotoUpdate = (newPhotoUrl: string) => {
    setLearnerDetails((prev) => prev ? { ...prev, photoUrl: newPhotoUrl } : prev)
  }

  // ── États de chargement / erreur ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
        <div className="bg-red-100 border border-red-200 text-red-700 p-6 rounded-lg text-center max-w-md">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-semibold mb-2">Erreur de chargement</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!learnerDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 p-4">
        <div className="bg-orange-100 border border-orange-200 text-orange-700 p-6 rounded-lg text-center max-w-md">
          <User className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-lg font-semibold mb-2">Profil non trouvé</h2>
          <p>Aucune donnée de profil disponible pour cet utilisateur</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Actualiser
          </button>
        </div>
      </div>
    )
  }

  return (
    <LearnerProfile
      learner={learnerDetails}
      onSave={handleSaveLearnerData}
      onPhotoUpdate={handlePhotoUpdate}
      saveLoading={saveLoading}
      saveMessage={saveMessage}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant LearnerProfile
// ─────────────────────────────────────────────────────────────────────────────
function LearnerProfile({
  learner,
  onSave,
  onPhotoUpdate,
  saveLoading,
  saveMessage,
}: {
  learner: LearnerDetails
  onSave: (formData: any) => Promise<void>
  onPhotoUpdate: (newPhotoUrl: string) => void
  saveLoading: boolean
  saveMessage: { type: 'success' | 'error'; message: string } | null
}) {
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Upload de la photo ───────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation côté client
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Seuls les formats JPG, PNG et WebP sont acceptés')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La photo ne doit pas dépasser 5 Mo')
      return
    }

    setPhotoError(null)
    setPhotoUploading(true)

    try {
      const token = getAuthToken()
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch(`${API_BASE_URL}/learners/${learner.id}/photo`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors de l'upload de la photo")
      }

      const updated = await response.json()
      // Le backend peut retourner { photoUrl } ou l'objet learner complet
      const newUrl = updated.photoUrl ?? updated?.learner?.photoUrl
      if (newUrl) onPhotoUpdate(newUrl)
    } catch (err: any) {
      console.error('Erreur upload photo:', err)
      setPhotoError(err.message || "Erreur lors de l'upload de la photo")
    } finally {
      setPhotoUploading(false)
      // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const getKitProgress = () => {
    if (!learner.kit) return 0
    const items = Object.values(learner.kit)
    const received = items.filter(Boolean).length
    return (received / items.length) * 100
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':   return 'bg-green-100 text-green-800 border-green-200'
      case 'INACTIVE': return 'bg-red-100 text-red-800 border-red-200'
      default:         return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Message de sauvegarde ─────────────────────────────────────────── */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.type === 'success'
              ? 'bg-green-100 border border-green-200 text-green-700'
              : 'bg-red-100 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              {saveMessage.type === 'success'
                ? <CheckCircle className="h-5 w-5" />
                : <XCircle className="h-5 w-5" />}
              <span>{saveMessage.message}</span>
            </div>
          </div>
        )}

        {/* ── Message d'erreur photo ────────────────────────────────────────── */}
        {photoError && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 border border-red-200 text-red-700">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 flex-shrink-0" />
                <span>{photoError}</span>
              </div>
              <button
                onClick={() => setPhotoError(null)}
                className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* ── Header avec bannière ──────────────────────────────────────────── */}
        <div className="relative mb-8">
          <div className="h-44 bg-gradient-to-r from-teal-600 to-orange-600 rounded-2xl shadow-lg" />

          <Card className="h-40 absolute top-2 left-1/2 transform -translate-x-1/2 w-full max-w-4xl border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">

                {/* ── Avatar + bouton modifier photo ──────────────────────── */}
                <div className="relative flex-shrink-0 group">
                  {/* Avatar */}
                  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-teal-100 to-orange-100">
                    {learner.photoUrl ? (
                      <img
                        src={learner.photoUrl}
                        alt={`${learner.firstName} ${learner.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-teal-600 to-orange-600 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                          {learner.firstName?.[0]}{learner.lastName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Overlay au hover */}
                  {!photoUploading && (
                    <label
                      htmlFor="photo-upload"
                      className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Changer la photo"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="h-7 w-7 text-white" />
                        <span className="text-white text-xs font-medium">Modifier</span>
                      </div>
                    </label>
                  )}

                  {/* Spinner pendant l'upload */}
                  {photoUploading && (
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Bouton caméra en bas à droite (toujours visible) */}
                  <label
                    htmlFor="photo-upload"
                    className={`absolute bottom-0 right-0 p-2 rounded-full border-2 border-white shadow-md cursor-pointer transition-colors ${
                      photoUploading
                        ? 'bg-gray-400 cursor-not-allowed pointer-events-none'
                        : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                    title="Changer la photo"
                  >
                    {photoUploading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </label>

                  {/* Input fichier caché */}
                  <input
                    id="photo-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={photoUploading}
                    onChange={handlePhotoChange}
                  />

                  {/* Badge statut */}
                  <div className={`absolute -bottom-2 left-0 px-3 py-1 rounded-full text-xs font-semibold border-2 border-white ${getStatusColor(learner.status)}`}>
                    {learner.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                  </div>
                </div>

                {/* ── Infos principales ────────────────────────────────────── */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {learner.firstName} {learner.lastName}
                  </h1>
                  <p className="text-lg text-gray-600 mb-4">
                    Matricule: <span className="font-mono font-semibold">{learner.matricule}</span>
                  </p>

                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 px-4 py-2">
                      <School className="h-4 w-4 mr-2" />
                      {learner.referential?.name}
                    </Badge>
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-4 py-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      {learner.promotion?.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Contenu principal avec tabs ───────────────────────────────────── */}
        <div className="mt-20">
          <Tabs defaultValue="personal" className="space-y-6">

            {/* Navigation */}
            <TabsList className="h-15 grid grid-cols-4 gap-2 bg-white p-2 rounded-xl shadow-sm border">
              <TabsTrigger
                value="personal"
                className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-800 data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
              >
                <span className="sm:hidden flex flex-col items-center">
                  <UserCircle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Infos</span>
                </span>
                <span className="hidden sm:flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Infos Personnelles
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="academic"
                className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
              >
                <span className="sm:hidden flex flex-col items-center">
                  <GraduationCap className="h-5 w-5 mb-1" />
                  <span className="text-xs">Études</span>
                </span>
                <span className="hidden sm:flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Infos Académiques
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="kit"
                className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-800 data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
              >
                <span className="sm:hidden flex flex-col items-center">
                  <PackageCheck className="h-5 w-5 mb-1" />
                  <span className="text-xs">Kit</span>
                </span>
                <span className="hidden sm:flex items-center gap-2">
                  <PackageCheck className="h-4 w-4" />
                  Kit ODC
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
              >
                <span className="sm:hidden flex flex-col items-center">
                  <Files className="h-5 w-5 mb-1" />
                  <span className="text-xs">Docs</span>
                </span>
                <span className="hidden sm:flex items-center gap-2">
                  <Files className="h-4 w-4" />
                  Documents
                </span>
              </TabsTrigger>
            </TabsList>

            {/* ── Tab : Infos personnelles ──────────────────────────────────── */}
            <TabsContent value="personal" className="space-y-6">
              <EditablePersonalInfo
                learner={learner}
                onSave={onSave}
                loading={saveLoading}
              />

              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-2 text-orange-800">
                    <User className="h-5 w-5" />
                    Informations du Tuteur
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <InfoItem
                      icon={<User />}
                      label="Nom complet"
                      value={`${learner.tutor?.firstName ?? ''} ${learner.tutor?.lastName ?? ''}`.trim() || undefined}
                    />
                    <InfoItem icon={<Phone />}  label="Téléphone" value={learner.tutor?.phone} />
                    <InfoItem icon={<Mail />}   label="Email"     value={learner.tutor?.email} />
                    <InfoItem icon={<MapPin />} label="Adresse"   value={learner.tutor?.address} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab : Académique ─────────────────────────────────────────── */}
            <TabsContent value="academic" className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-2 text-orange-800">
                    <GraduationCap className="h-5 w-5" />
                    Parcours Académique
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-orange-200 rounded-xl">
                          <School className="h-6 w-6 text-orange-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-orange-900 text-lg mb-2">Promotion</h3>
                          <p className="text-orange-800 font-medium mb-1">{learner.promotion?.name}</p>
                          <p className="text-orange-600 text-sm">
                            Début :{' '}
                            {learner.promotion?.startDate
                              ? new Date(learner.promotion.startDate).toLocaleDateString('fr-FR')
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-teal-200 rounded-xl">
                          <BookOpen className="h-6 w-6 text-teal-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-teal-900 text-lg mb-2">Référentiel</h3>
                          <p className="text-teal-800 font-medium mb-1">{learner.referential?.name}</p>
                          <p className="text-teal-600 text-sm">{learner.referential?.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab : Kit ────────────────────────────────────────────────── */}
            <TabsContent value="kit" className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-2 text-teal-800">
                    <Package className="h-5 w-5" />
                    Kit ODC
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-orange-50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-gray-800">Progression du kit</span>
                      <span className="text-2xl font-bold text-teal-600">{Math.round(getKitProgress())}%</span>
                    </div>
                    <Progress value={getKitProgress()} className="h-4 bg-gray-200" />
                    <p className="text-sm text-gray-600 mt-2">
                      {Object.values(learner.kit || {}).filter(Boolean).length} sur{' '}
                      {Object.values(learner.kit || {}).length} éléments reçus
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <KitItem icon="💻" name="Ordinateur portable" received={learner.kit?.laptop} />
                    <KitItem icon="🔌" name="Chargeur"            received={learner.kit?.charger} />
                    <KitItem icon="🎒" name="Sac"                 received={learner.kit?.bag} />
                    <KitItem icon="👕" name="Polo"                received={learner.kit?.polo} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab : Documents ──────────────────────────────────────────── */}
            <TabsContent value="documents" className="space-y-6">
              <Card className="shadow-xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 via-teal-600 to-emerald-600">
                  <CardTitle className="text-xl flex items-center gap-3 text-white">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    Justifications d'absence/retard
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {Array.isArray((learner as any).attendances) && (learner as any).attendances.length > 0 ? (
                    <div className="grid gap-4">
                      {(learner as any).attendances
                        .filter((a: any) => a.justification || a.documentUrl)
                        .map((attendance: any) => (
                          <JustificationItem key={attendance.id} attendance={attendance} />
                        ))}
                      {(learner as any).attendances.filter((a: any) => a.justification || a.documentUrl).length === 0 && (
                        <EmptyState message="Aucune justification soumise" />
                      )}
                    </div>
                  ) : (
                    <EmptyState message="Aucune donnée d'assiduité disponible" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | undefined
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="text-gray-500">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-gray-900 font-medium">{value || 'Non renseigné'}</p>
      </div>
    </div>
  )
}

function KitItem({
  icon,
  name,
  received,
}: {
  icon: string
  name: string
  received?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
        received
          ? 'bg-green-50 border-green-200 hover:bg-green-100'
          : 'bg-red-50 border-red-200 hover:bg-red-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-medium text-gray-900">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        {received
          ? <CheckCircle className="h-5 w-5 text-green-600" />
          : <XCircle   className="h-5 w-5 text-red-600" />}
        <Badge
          variant={received ? 'default' : 'secondary'}
          className={
            received
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }
        >
          {received ? 'Reçu' : 'Non reçu'}
        </Badge>
      </div>
    </div>
  )
}

function JustificationItem({ attendance }: { attendance: any }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT': return <Badge className="bg-green-100 text-green-800">Présent</Badge>
      case 'ABSENT':  return <Badge className="bg-red-100 text-red-800">Absent</Badge>
      case 'LATE':    return <Badge className="bg-orange-100 text-orange-800">Retard</Badge>
      default:        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-gradient-to-r from-orange-50 to-purple-100 rounded-xl hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Calendar className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {new Date(attendance.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm text-gray-500">
              {attendance.timeSlot === 'MORNING' ? 'Matin' : 'Après-midi'}
            </p>
          </div>
        </div>
        {getStatusBadge(attendance.status)}
      </div>

      {attendance.justification && (
        <div className="pl-11">
          <p className="text-sm font-medium text-gray-700 mb-1">Justification :</p>
          <p className="text-gray-600 text-sm bg-white p-3 rounded-lg">
            {attendance.justification}
          </p>
        </div>
      )}

      {attendance.documentUrl && (
        <div className="pl-11">
          <a
            href={attendance.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            <FileText className="h-4 w-4" />
            Voir le document justificatif
          </a>
        </div>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-200 to-teal-200 blur-2xl opacity-30" />
        <FileText className="relative h-20 w-20 text-gray-300 mx-auto mb-4" />
      </div>
      <p className="text-gray-500 text-lg font-medium">{message}</p>
    </div>
  )
}