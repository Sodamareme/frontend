"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { type Learner, learnersAPI, type ReplaceLearnerDto } from "@/lib/api"
import { Search, ArrowLeft, CheckCircle2, AlertCircle, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ReplaceLearnerPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { toast } = useToast()

  const [activeLearner, setActiveLearner] = useState<Learner | null>(null)
  const [waitingLearners, setWaitingLearners] = useState<Learner[]>([])
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reason, setReason] = useState("")
  const [isReplacing, setIsReplacing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError("")

        // First get the active learner
        const learnerData = await learnersAPI.getLearnerById(id)

        if (learnerData.status !== "ACTIVE") {
          throw new Error("Seuls les apprenants actifs peuvent être remplacés")
        }

        setActiveLearner(learnerData)

        if (!learnerData.promotion?.id) {
          throw new Error("L'apprenant n'est pas assigné à une promotion")
        }

        // Then get waiting list for the same promotion
        const waitingListData = await learnersAPI.getWaitingList(learnerData.promotion.id)

        // Filter waiting learners from the same referential
        const filteredWaitingLearners = waitingListData.filter(
          (learner) => learner.referential?.id === learnerData.referential?.id && learner.status === "WAITING",
        )

        if (filteredWaitingLearners.length === 0) {
          toast({
            title: "Information",
            description: "Aucun apprenant en liste d'attente pour ce référentiel",
            variant: "default",
          })
        }

        setWaitingLearners(filteredWaitingLearners)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        const errorMessage =
          err.response?.data?.message || err.message || "Une erreur est survenue lors du chargement des données"

        setError(errorMessage)
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id, toast])

  const filteredWaitingLearners = waitingLearners.filter((learner) => {
    const searchString = searchQuery.toLowerCase()
    return (
      learner.firstName.toLowerCase().includes(searchString) ||
      learner.lastName.toLowerCase().includes(searchString) ||
      learner.matricule?.toLowerCase().includes(searchString)
    )
  })

  const handleReplace = async () => {
    if (!selectedLearner || !reason || !activeLearner) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un remplaçant et fournir une raison",
        variant: "destructive",
      })
      return
    }

    try {
      setIsReplacing(true)
      const replacementData: ReplaceLearnerDto = {
        activeLearnerForReplacement: activeLearner.id,
        replacementLearnerId: selectedLearner.id,
        reason,
      }

      await learnersAPI.replaceLearner(replacementData)

      // Montrer l'animation de succès
      setShowSuccess(true)

      toast({
        title: "Succès",
        description: `${activeLearner.firstName} ${activeLearner.lastName} a été remplacé par ${selectedLearner.firstName} ${selectedLearner.lastName}`,
        variant: "default",
      })

      // Attendre que l'animation soit terminée avant la redirection
      setTimeout(() => {
        router.push("/dashboard/learners")
      }, 2000)
    } catch (err: any) {
      console.error("Error replacing learner:", err)
      toast({
        title: "Erreur",
        description: err.response?.data?.message || "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsReplacing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="flex flex-col items-center text-center gap-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800">Une erreur est survenue</h2>
            <p className="text-red-500">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Retour
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {isReplacing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="text-gray-700 font-medium">Remplacement en cours...</p>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-6 max-w-md w-full animate-in fade-in duration-300">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Remplacement réussi!</h2>
              <p className="text-gray-600">
                {activeLearner?.firstName} {activeLearner?.lastName} a été remplacé par {selectedLearner?.firstName}{" "}
                {selectedLearner?.lastName}
              </p>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-green-500 h-full animate-progress"></div>
            </div>
            <p className="text-sm text-gray-500">Redirection en cours...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Remplacement d'apprenant</h1>
            <p className="text-gray-500 text-sm mt-1">
              Sélectionnez un apprenant en liste d'attente pour remplacer l'apprenant actif
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Learner Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle>Apprenant à remplacer</CardTitle>
              <CardDescription className="text-orange-100">
                Cet apprenant sera désactivé après le remplacement
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="h-20 w-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-orange-200">
                  {activeLearner?.photoUrl ? (
                    <img
                      src={activeLearner.photoUrl || "/placeholder.svg"}
                      alt={`${activeLearner.firstName} ${activeLearner.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-orange-200 flex items-center justify-center text-orange-700 text-xl font-bold">
                      {`${activeLearner?.firstName?.[0] || ""}${activeLearner?.lastName?.[0] || ""}`}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {activeLearner?.firstName} {activeLearner?.lastName}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="font-medium">Matricule:</span>
                      {activeLearner?.matricule || "Non défini"}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="font-medium">Référentiel:</span>
                      {activeLearner?.referential?.name || "Non défini"}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="font-medium">Promotion:</span>
                      {activeLearner?.promotion?.name || "Non défini"}
                    </p>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Actif
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Replacement Selection */}
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-800 text-white">
              <CardTitle>Sélectionner le remplaçant</CardTitle>
              <CardDescription className="text-gray-300">Choisissez un apprenant en liste d'attente</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou matricule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300"
                />
              </div>

              {filteredWaitingLearners.length > 0 ? (
                <ScrollArea className="h-[320px] pr-4">
                  <div className="space-y-3">
                    {filteredWaitingLearners.map((learner) => (
                      <div
                        key={learner.id}
                        onClick={() => setSelectedLearner(learner)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedLearner?.id === learner.id
                            ? "border-orange-500 bg-orange-50 shadow-sm"
                            : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                            {learner.photoUrl ? (
                              <img
                                src={learner.photoUrl || "/placeholder.svg"}
                                alt={`${learner.firstName} ${learner.lastName}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-500">
                                <User className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">
                              {learner.firstName} {learner.lastName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-500">{learner.matricule || "Sans matricule"}</p>
                              <Badge
                                variant="outline"
                                className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                              >
                                En attente
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[320px] bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6 text-center">
                  <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                  <h3 className="text-gray-600 font-medium">Aucun apprenant trouvé</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {searchQuery
                      ? "Essayez de modifier votre recherche"
                      : "Aucun apprenant en liste d'attente pour ce référentiel"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reason and Action Buttons */}
        <Card className="mt-8 border-none shadow-md">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200">
            <CardTitle>Raison du remplacement</CardTitle>
            <CardDescription>Veuillez expliquer pourquoi cet apprenant doit être remplacé</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full resize-none border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              rows={4}
              placeholder="Expliquez la raison du remplacement (obligatoire)..."
            />

            <div className="mt-8">
              <Separator className="mb-6" />
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  {selectedLearner && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Remplacement:</span>{" "}
                      <span className="text-orange-600 font-medium">
                        {activeLearner?.firstName} {activeLearner?.lastName}
                      </span>{" "}
                      par{" "}
                      <span className="text-green-600 font-medium">
                        {selectedLearner.firstName} {selectedLearner.lastName}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => router.back()}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleReplace}
                    disabled={!selectedLearner || !reason || isReplacing}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isReplacing ? "En cours..." : "Confirmer le remplacement"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
