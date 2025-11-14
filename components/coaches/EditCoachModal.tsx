import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, User, Image, UserCircle } from 'lucide-react';
import { toast } from "sonner";
import { getImageUrl } from '@/lib/utils/imageUrl';

interface Coach {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string;
  refId?: string;
  referential?: {
    id: string;
    name: string;
  };
  user: {
    email: string;
  };
}

interface Referential {
  id: string;
  name: string;
}

interface EditCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  coach: Coach | null;
  referentials: Referential[];
  onSubmit: (id: string, data: any) => Promise<void>;
}

const editCoachSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string()
    .min(9, "Le numéro doit contenir au moins 9 chiffres")
    .regex(/^[0-9+]+$/, "Format de numéro invalide"),
  refId: z.string().optional(),
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

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue,
    reset
  } = useForm<EditCoachFormData>({
    resolver: zodResolver(editCoachSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isOpen && coach) {
      reset({
        firstName: coach.firstName,
        lastName: coach.lastName,
        phone: coach.phone || '',
        refId: coach.refId || '',
      });
      setPreviewUrl(coach.photoUrl ? getImageUrl(coach.photoUrl) : null);
    }
  }, [isOpen, coach, reset]);

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
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmitForm = async (data: EditCoachFormData) => {
    if (!coach) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(coach.id, data);
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
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
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
                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG ou GIF. Taille maximale 5MB.
                </p>
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

          {/* Référentiel */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Référentiel</h3>
            
            <Field label="Référentiel d'affectation" error={errors.refId?.message}>
              <select
                {...register("refId")}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Aucun référentiel assigné</option>
                {referentials.map(ref => (
                  <option key={ref.id} value={ref.id}>
                    {ref.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
            >
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