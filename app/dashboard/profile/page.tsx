"use client"

import { useState, useEffect, useRef } from "react"
import { User, Phone, Mail, MapPin, Calendar, BookOpen, School, Package, FileText, CheckCircle, XCircle, Camera, ShieldCheck, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { UserCircle, GraduationCap, PackageCheck, Files } from 'lucide-react'
import EditablePersonalInfo from '@/components/EditablePersonalInfo'
import { learnersAPI } from "@/lib/api"
import type { LearnerDetailsExtended } from "@/lib/api"
import { getAuthToken } from "@/lib/api"
import { useAutoRefresh } from "@/hooks/useAutoRefresh"

type ProfileLearnerDetails = Omit<LearnerDetailsExtended, "documents"> & {
  documents?: unknown[];
  qrCode?: string;
}

// ─── URL de base de l'API ─────────────────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [learnerDetails, setLearnerDetails] = useState<ProfileLearnerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchLearnerData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const userStr = localStorage.getItem('user')
      if (!userStr) throw new Error('Utilisateur non connecté')

      const user = JSON.parse(userStr)
      if (!user?.email) throw new Error('Email utilisateur introuvable')

      const details = await learnersAPI.getLearnerByEmail(user.email)
      setLearnerDetails({
        ...details,
        documents: Array.isArray((details as unknown as { documents?: unknown }).documents)
          ? ((details as unknown as { documents?: unknown[] }).documents ?? [])
          : [],
        qrCode: (details as { qrCode?: string }).qrCode,
      })
    } catch (err: any) {
      console.error('Error fetching learner data:', err)
      setError(err.message || 'Impossible de charger les données du profil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchLearnerData()
  }, [])

  useAutoRefresh(() => fetchLearnerData(true), { intervalMs: 20_000 })

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
        firstName: formData.firstName,
        lastName: formData.lastName,
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-[#d36b2c] border-t-transparent" />
          <p className="text-slate-600">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
        <div className="max-w-md rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-semibold mb-2">Erreur de chargement</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-2xl bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!learnerDetails) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
        <div className="max-w-md rounded-3xl border border-orange-100 bg-white p-6 text-center text-slate-700 shadow-sm">
          <User className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-lg font-semibold mb-2">Profil non trouvé</h2>
          <p>Aucune donnée de profil disponible pour cet utilisateur</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-2xl bg-[#F16E00] px-4 py-2 text-white transition-colors hover:bg-[#d95f00]"
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
  learner: ProfileLearnerDetails
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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Message de sauvegarde ─────────────────────────────────────────── */}
        {saveMessage && (
          <div className={`mb-6 rounded-2xl p-4 ${
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
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-100 p-4 text-red-700">
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
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
          <div className="h-2 w-full bg-[#F16E00]" />
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="p-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">

                {/* ── Avatar + bouton modifier photo ──────────────────────── */}
                <div className="relative flex-shrink-0 group">
                  {/* Avatar */}
                  <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm">
                    {learner.photoUrl ? (
                      <img
                        src={learner.photoUrl}
                        alt={`${learner.firstName} ${learner.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#F16E00]">
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
                        : 'bg-[#F16E00] hover:bg-[#d95f00]'
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
                  <div className={`absolute -bottom-2 left-0 rounded-full border-2 border-white px-3 py-1 text-xs font-semibold shadow-sm ${getStatusColor(learner.status)}`}>
                    {learner.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                  </div>
                </div>

                {/* ── Infos principales ────────────────────────────────────── */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[#F16E00]">
                    Mon profil
                  </div>
                  <h1 className="mb-2 mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
                    {learner.firstName} {learner.lastName}
                  </h1>
                  <p className="mb-4 text-lg text-slate-600">
                    Matricule : <span className="font-mono font-semibold text-slate-900">{learner.matricule}</span>
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3 justify-center sm:justify-start">
                    <Badge className="border border-orange-100 bg-white px-4 py-2 text-[#F16E00] hover:bg-orange-50">
                      <School className="h-4 w-4 mr-2" />
                      {learner.referential?.name}
                    </Badge>
                    <Badge className="border border-orange-100 bg-white px-4 py-2 text-[#F16E00] hover:bg-orange-50">
                      <Calendar className="h-4 w-4 mr-2" />
                      {learner.promotion?.name}
                    </Badge>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-orange-100 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Statut</p>
                      <p className="mt-2 font-semibold text-slate-900">{learner.status === "ACTIVE" ? "Apprenant actif" : learner.status}</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Référentiel</p>
                      <p className="mt-2 font-semibold text-slate-900">{learner.referential?.name || "Non renseigné"}</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Promotion</p>
                      <p className="mt-2 font-semibold text-slate-900">{learner.promotion?.name || "Non renseignée"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Contenu principal avec tabs ───────────────────────────────────── */}
        <div className="mt-8">
          <Tabs defaultValue="personal" className="space-y-6">

            {/* Navigation */}
            <TabsList className="grid h-auto grid-cols-2 gap-2 rounded-[1.7rem] border border-orange-100 bg-white p-2 shadow-sm sm:grid-cols-4">
              <TabsTrigger
                value="personal"
                className="rounded-[1rem] py-3 transition-all data-[state=active]:bg-orange-50 data-[state=active]:text-[#F16E00] data-[state=active]:shadow-none"
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
                className="rounded-[1rem] py-3 transition-all data-[state=active]:bg-orange-50 data-[state=active]:text-[#F16E00] data-[state=active]:shadow-none"
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
                className="rounded-[1rem] py-3 transition-all data-[state=active]:bg-orange-50 data-[state=active]:text-[#F16E00] data-[state=active]:shadow-none"
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
                className="rounded-[1rem] py-3 transition-all data-[state=active]:bg-orange-50 data-[state=active]:text-[#F16E00] data-[state=active]:shadow-none"
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
              />

              <Card className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
                <CardHeader className="rounded-t-[2rem] border-b border-orange-100 bg-white">
                  <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
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
              <Card className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
                <CardHeader className="rounded-t-[2rem] border-b border-orange-100 bg-white">
                  <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                    <GraduationCap className="h-5 w-5" />
                    Parcours Académique
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-[1.6rem] border border-orange-100 bg-white p-6 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-orange-50 p-3">
                          <School className="h-6 w-6 text-[#F16E00]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-2 text-lg font-semibold text-slate-900">Promotion</h3>
                          <p className="mb-1 font-medium text-slate-800">{learner.promotion?.name}</p>
                          <p className="text-sm text-slate-500">
                            Début :{' '}
                            {learner.promotion?.startDate
                              ? new Date(learner.promotion.startDate).toLocaleDateString('fr-FR')
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-slate-100 p-3">
                          <BookOpen className="h-6 w-6 text-slate-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-2 text-lg font-semibold text-slate-900">Référentiel</h3>
                          <p className="mb-1 font-medium text-slate-800">{learner.referential?.name}</p>
                          <p className="text-sm text-slate-500">{learner.referential?.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab : Kit ────────────────────────────────────────────────── */}
            <TabsContent value="kit" className="space-y-6">
              <Card className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
                <CardHeader className="rounded-t-[2rem] border-b border-orange-100 bg-white">
                  <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                    <Package className="h-5 w-5" />
                    Kit ODC
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-8 rounded-[1.7rem] border border-orange-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-800">Progression du kit</span>
                    <span className="text-2xl font-bold text-[#F16E00]">{Math.round(getKitProgress())}%</span>
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
              <Card className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
                <CardHeader className="border-b border-orange-100 bg-white">
                  <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
                    <div className="rounded-lg bg-orange-50 p-2 text-[#F16E00]">
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
    <div className="flex items-center gap-3 rounded-[1.3rem] border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50">
      <div className="rounded-xl bg-orange-50 p-2 text-[#F16E00]">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="font-medium text-slate-900">{value || 'Non renseigné'}</p>
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
      className={`flex items-center justify-between rounded-[1.4rem] border p-4 transition-all ${
        received
          ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-medium text-gray-900">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        {received
          ? <CheckCircle className="h-5 w-5 text-green-600" />
          : <XCircle   className="h-5 w-5 text-slate-400" />}
        <Badge
          variant={received ? 'default' : 'secondary'}
          className={
            received
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
      case 'ABSENT':  return <Badge className="bg-slate-100 text-slate-800">Absent</Badge>
      case 'LATE':    return <Badge className="bg-amber-100 text-amber-800">Retard</Badge>
      default:        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-50 p-2 shadow-sm">
            <Calendar className="h-5 w-5 text-[#F16E00]" />
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
          <p className="mb-1 text-sm font-medium text-slate-700">Justification :</p>
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
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
            className="inline-flex items-center gap-2 rounded-2xl bg-[#F16E00] px-4 py-2 text-sm text-white transition-colors hover:bg-[#d95f00]"
          >
            <FileText className="h-4 w-4" />
            Voir le document justificatif
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
        <ShieldCheck className="h-10 w-10 text-[#F16E00]" />
      </div>
      <p className="mt-4 text-lg font-medium text-slate-500">{message}</p>
    </div>
  )
}
