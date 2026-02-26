import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, User, Image, UserCircle, BookOpen } from 'lucide-react';
import { toast } from "sonner";
import { getImageUrl } from '@/lib/utils/imageUrl';
import { Referential as ReferentialType } from '@/lib/api';
import { ReferentialBasic } from '@/lib/api';
interface Coach {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string;
  refId?: string;
  // ✅ Support multi-référentiels
  referentials?: Array<{ id: string; name: string }>;
  referential?: { id: string; name: string };
  user: {
    email: string;
  };
}



interface EditCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  coach: Coach | null;
  referentials: ReferentialBasic[];  // ← utiliser ReferentialType
  onSubmit: (id: string, data: any) => Promise<void>;
}


const editCoachSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string()
    .min(9, "Le numéro doit contenir au moins 9 chiffres")
    .regex(/^[0-9+]+$/, "Format de numéro invalide"),
  refIds: z.array(z.string()).optional(), // ✅ tableau de référentiels
  photoFile: z.any().optional(),
});

type EditCoachFormData = z.infer<typeof editCoachSchema>;

const Field = ({ label, error, required = false, children }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700 flex items-center">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-red-500 text-xs flex items-center">
        <AlertCircle className="w-3 h-3 mr-1" />
        {error}
      </p>
    )}
  </div>
);

export default function EditCoachModal({
  isOpen,
  onClose,
  coach,
  referentials,
  onSubmit
}: EditCoachModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedRefIds, setSelectedRefIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<EditCoachFormData>({
    resolver: zodResolver(editCoachSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isOpen && coach) {
      // ✅ Récupérer les référentiels existants du coach
      const existingRefIds = coach.referentials
        ? coach.referentials.map(r => r.id)
        : coach.refId
          ? [coach.refId]
          : [];

      setSelectedRefIds(existingRefIds);
      setValue('refIds', existingRefIds);

      reset({
        firstName: coach.firstName,
        lastName: coach.lastName,
        phone: coach.phone || '',
        refIds: existingRefIds,
      });

      setPreviewUrl(coach.photoUrl ? getImageUrl(coach.photoUrl) : null);
    }
  }, [isOpen, coach, reset, setValue]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La photo ne doit pas dépasser 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Le fichier doit être une image");
        return;
      }
      setValue('photoFile', file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleReferential = (refId: string) => {
    const updated = selectedRefIds.includes(refId)
      ? selectedRefIds.filter(id => id !== refId)
      : [...selectedRefIds, refId];
    setSelectedRefIds(updated);
    setValue('refIds', updated);
  };

  const onSubmitForm = async (data: EditCoachFormData) => {
    if (!coach) return;
    try {
      setIsSubmitting(true);
      await onSubmit(coach.id, { ...data, refIds: selectedRefIds });
      onClose();
    } catch (error: any) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!coach) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle className="text-2xl font-bold text-orange-600">
      Modifier le coach
    </DialogTitle>
    {/* ✅ Ajouter DialogDescription pour supprimer le warning */}
    <DialogDescription className="sr-only">
      Formulaire de modification du coach
    </DialogDescription>
  </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          {/* Photo */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Image className="w-5 h-5 mr-2 text-orange-500" />
              <h3 className="text-lg font-medium text-gray-800">Photo de profil</h3>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 relative overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex-grow">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-orange-50 file:text-orange-600
                    hover:file:bg-orange-100"
                />
                <p className="mt-2 text-xs text-gray-500">JPG, PNG ou GIF. Taille maximale 5MB.</p>
              </div>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 mr-2 text-orange-500" />
              <h3 className="text-lg font-medium text-gray-800">Informations personnelles</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Prénom" error={errors.firstName?.message} required>
                <Input
                  {...register("firstName")}
                  placeholder="Prénom du coach"
                  className={errors.firstName ? "border-red-300" : ""}
                />
              </Field>

              <Field label="Nom" error={errors.lastName?.message} required>
                <Input
                  {...register("lastName")}
                  placeholder="Nom du coach"
                  className={errors.lastName ? "border-red-300" : ""}
                />
              </Field>

              <Field label="Email" required>
                <Input
                  value={coach.user.email}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </Field>

              <Field label="Téléphone" error={errors.phone?.message} required>
                <Input
                  {...register("phone")}
                  placeholder="+221 XX XXX XX XX"
                  className={errors.phone ? "border-red-300" : ""}
                />
              </Field>
            </div>
          </div>

          {/* ✅ Référentiels multi-sélection */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-2">
              <BookOpen className="w-5 h-5 mr-2 text-orange-500" />
              <h3 className="text-lg font-medium text-gray-800">Référentiels d'affectation</h3>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Sélectionnez un ou plusieurs référentiels pour ce coach.
            </p>

            {/* Badge compteur */}
            {selectedRefIds.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedRefIds.map(id => {
                  const ref = referentials.find(r => r.id === id);
                  return ref ? (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"
                    >
                      {ref.name}
                      <button
                        type="button"
                        onClick={() => toggleReferential(id)}
                        className="ml-1 hover:text-orange-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {referentials.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  Aucun référentiel disponible
                </p>
              ) : (
                referentials.map(ref => {
                  const isSelected = selectedRefIds.includes(ref.id);
                  return (
                    <label
                      key={ref.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/30'
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-orange-500"
                        checked={isSelected}
                        onChange={() => toggleReferential(ref.id)}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">{ref.name}</span>
                        {ref.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{ref.description}</p>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-xs text-orange-500 font-semibold">✓ Sélectionné</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {selectedRefIds.length === 0 && (
              <p className="mt-3 text-xs text-gray-400 italic">
                Aucun référentiel sélectionné — le coach ne sera affecté à aucun référentiel.
              </p>
            )}
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" onClick={onClose} variant="outline" disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}