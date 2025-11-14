import { useState, useEffect, useCallback } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Check, X } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from 'sonner'

interface JustificationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: {
    id: string;
    date: string;
    isLate: boolean;
    isPresent: boolean;
    status?: 'TO_JUSTIFY' | 'PENDING' | 'APPROVED' | 'REJECTED';
    justification?: string;
    documentUrl?: string;
    scanTime?: string;
    learner: {
      firstName: string;
      lastName: string;
      matricule: string;
      photoUrl?: string | null;
      referential?: {
        id?: string;
        name: string;
      };
    };
  } | null;
  onApprove: (id: string, comment: string) => Promise<void>;
  onReject: (id: string, comment: string) => Promise<void>;
}

export default function JustificationReviewModal({
  isOpen,
  onClose,
  attendance,
  onApprove,
  onReject
}: JustificationReviewModalProps) {
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setComment("")
        setSubmitting(false)
      }, 300) // Attendre que l'animation de fermeture soit terminée
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (submitting) return
    onClose()
  }, [submitting, onClose])

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!attendance) return

    try {
      setSubmitting(true)
      if (action === 'approve') {
        await onApprove(attendance.id, comment)
      } else {
        await onReject(attendance.id, comment)
      }
      handleClose()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error("Une erreur est survenue")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleClose}
    >
      <DialogContent 
        className="max-w-2xl"
        onInteractOutside={(e) => {
          if (submitting) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (submitting) e.preventDefault()
        }}
      >
        {attendance ? ( // Conditional rendering basé sur attendance
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Demande de justification
              </DialogTitle>
              <DialogDescription>
                Examinez la justification et prenez une décision
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informations de l'apprenant */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                  {attendance && (
                    <motion.img 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={attendance.learner?.photoUrl || "/default-avatar.png"} // Use a local default image
                      alt={`${attendance.learner?.firstName || ''} ${attendance.learner?.lastName || ''}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-avatar.png"; // Fallback if image fails to load
                      }}
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">
                    {attendance?.learner?.firstName} {attendance?.learner?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {attendance?.learner?.matricule || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Détails de l'absence/retard */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">
                    {format(new Date(attendance.date), 'PPP', { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">
                    {attendance.isLate ? 'Retard' : 'Absence'}
                  </span>
                </div>
              </div>

              {/* Justification */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <h4 className="font-medium">Justification</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {attendance.justification}
                  </p>
                </div>
              </motion.div>

              {/* Document justificatif */}
              {attendance.documentUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-900">Document justificatif</span>
                      <p className="text-xs text-blue-600">Cliquez pour visualiser</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    onClick={() => window.open(attendance.documentUrl, '_blank')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Voir
                  </Button>
                </motion.div>
              )}

              {/* Commentaire */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Commentaire (optionnel)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Actions */}
              <motion.div 
                className="flex justify-end space-x-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                  onClick={() => handleAction('reject')}
                  disabled={submitting}
                  aria-label="Rejeter la justification"
                >
                  <X className="mr-2 h-4 w-4" />
                  Rejeter
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                  onClick={() => handleAction('approve')}
                  disabled={submitting}
                  aria-label="Approuver la justification"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approuver
                </Button>
              </motion.div>
            </div>
          </>
        ) : (
          <div className="p-4 text-center text-gray-500">
            Chargement...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
