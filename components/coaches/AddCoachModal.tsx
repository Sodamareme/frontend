import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Referential } from '@/lib/api';
import { AlertCircle, User, Image, UserCircle, Check } from 'lucide-react';
import { toast } from "sonner";

// Schéma de validation pour le coach
const coachSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  phone: z.string()
    .min(9, "Le numéro doit contenir au moins 9 chiffres")
    .regex(/^[0-9+]+$/, "Format de numéro invalide"),
  refId: z.string().optional(), // Référentiel optionnel
  photoFile: z.any().optional(), // Pour le fichier de photo
});

// Type pour les données du formulaire
type CoachFormData = z.infer<typeof coachSchema>;

interface AddCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  referentials: Referential[];
  onSubmit: (data: CoachFormData) => Promise<void>;
}

// Composants réutilisables
interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field = ({ label, error, required = false, children }: FieldProps) => (
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

export default function AddCoachModal({
  isOpen,
  onClose,
  referentials,
  onSubmit
}: AddCoachModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid }, 
    watch, 
    setValue,
    reset
  } = useForm<CoachFormData>({
    resolver: zodResolver(coachSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      refId: "",
    }
  });

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setPreviewUrl(null);
      reset();
    }
  }, [isOpen, reset]);

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

  const handleNext = async () => {
    // Valider les champs obligatoires de l'étape 1
    const fieldsToValidate: (keyof CoachFormData)[] = [
      'firstName', 'lastName', 'email', 'phone'
    ];
    
    const isStepValid = await Promise.all(
      fieldsToValidate.map(field => 
        new Promise(resolve => {
          const value = watch(field);
          const result = coachSchema.shape[field].safeParse(value);
          resolve(result.success);
        })
      )
    );

    const allValid = isStepValid.every(valid => valid);
    
    if (allValid) {
      setStep(2);
    } else {
      toast.error("Veuillez corriger les erreurs avant de continuer");
    }
  };

  const handlePrevious = () => {
    setStep(1);
  };

  // Fonction de soumission du formulaire
  const onSubmitForm = async (data: CoachFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await onSubmit(data);
      // Le modal sera fermé par le composant parent après succès
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue lors de l'enregistrement");
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden max-w-4xl w-11/12 max-h-[90vh] overflow-y-hidden bg-gray-50">
        <DialogHeader className="px-8 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-teal-700 text-center">
            Ajouter un nouveau coach
          </DialogTitle>
        </DialogHeader>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center py-4 px-8 mb-2">
          <div className="flex items-center max-w-md w-full">
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                transition-all duration-300 ${step >= 1 ? 'border-teal-500 bg-teal-500 text-white' : 'border-gray-300 bg-white'}`}
            >
              {step > 1 ? <Check size={20} /> : <span className="font-medium">1</span>}
            </div>
            <div 
              className={`h-1 flex-1 mx-2 transition-all duration-500 ${step > 1 ? 'bg-teal-500' : 'bg-gray-300'}`} 
            />
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2
                transition-all duration-300 ${step === 2 ? 'border-teal-500 bg-teal-500 text-white' : 'border-gray-300 bg-white'}`}
            >
              <span className="font-medium">2</span>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Contenu du formulaire */}
        <div className="px-8 pb-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            
            {step === 1 ? (
              /* Étape 1: Informations personnelles */
              <div className="space-y-6">
                {/* Photo de profil */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4 pb-3 border-b border-gray-100">
                    <div className="bg-teal-50 p-2 rounded-md text-teal-600 mr-3">
                      <Image size={18} />
                    </div>
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
                          <div className="text-center">
                            <UserCircle className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="text-xs text-gray-500 mt-2">Photo de profil</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-grow">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Photo (optionnelle)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-teal-50 file:text-teal-600
                            hover:file:bg-teal-100"
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500">
                        JPG, PNG ou GIF. Taille maximale 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informations personnelles */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4 pb-3 border-b border-gray-100">
                    <div className="bg-teal-50 p-2 rounded-md text-teal-600 mr-3">
                      <User size={18} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">Informations personnelles</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Prénom" error={errors.firstName?.message} required>
                      <Input 
                        {...register("firstName")} 
                        placeholder="Prénom du coach"
                        className={errors.firstName ? "border-red-300 focus:ring-red-500" : ""}
                      />
                    </Field>
                    
                    <Field label="Nom" error={errors.lastName?.message} required>
                      <Input 
                        {...register("lastName")} 
                        placeholder="Nom du coach"
                        className={errors.lastName ? "border-red-300 focus:ring-red-500" : ""}
                      />
                    </Field>

                    <Field label="Email" error={errors.email?.message} required>
                      <Input 
                        {...register("email")} 
                        type="email" 
                        placeholder="email@exemple.com"
                        className={errors.email ? "border-red-300 focus:ring-red-500" : ""}
                      />
                    </Field>
                    
                    <Field label="Téléphone" error={errors.phone?.message} required>
                      <Input 
                        {...register("phone")} 
                        placeholder="+221 XX XXX XX XX"
                        className={errors.phone ? "border-red-300 focus:ring-red-500" : ""}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ) : (
              /* Étape 2: Référentiel */
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4 pb-3 border-b border-gray-100">
                    <div className="bg-teal-50 p-2 rounded-md text-teal-600 mr-3">
                      <User size={18} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">Référentiel d'affectation</h3>
                  </div>

                  <Field label="Référentiel" error={errors.refId?.message}>
                    <select
                      {...register("refId")}
                      className={`w-full h-10 px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.refId ? "border-red-300" : "border-gray-300"}`}
                    >
                      <option value="">Aucun référentiel assigné</option>
                      {referentials.map(ref => (
                        <option key={ref.id} value={ref.id}>
                          {ref.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="mt-4 p-3 bg-blue-50 rounded-md text-blue-800 text-sm">
                    <div className="font-medium mb-1">Information</div>
                    <div>
                      Le référentiel peut être assigné plus tard si nécessaire. 
                      Le coach pourra être affecté à un ou plusieurs modules selon ses compétences.
                    </div>
                  </div>

                  {/* Résumé des informations saisies */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">Résumé des informations</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div><span className="font-medium">Nom complet:</span> {watch('firstName')} {watch('lastName')}</div>
                      <div><span className="font-medium">Email:</span> {watch('email')}</div>
                      <div><span className="font-medium">Téléphone:</span> {watch('phone')}</div>
                      <div>
                        <span className="font-medium">Référentiel:</span> {
                          watch('refId') 
                            ? referentials.find(ref => ref.id === watch('refId'))?.name || 'Non trouvé'
                            : 'Aucun'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              {step === 1 ? (
                <div className="flex justify-end w-full">
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    Suivant
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={handlePrevious}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Créer le coach'
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}