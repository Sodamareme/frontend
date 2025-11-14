import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Promotion, Referential } from '@/lib/api';
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, User, Users, AlertCircle, Image, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast } from '@/components/ui/toast';
import { toast } from "sonner";

// Schéma de validation amélioré
const learnerSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  phone: z.string()
    .min(9, "Le numéro doit contenir au moins 9 chiffres")
    .regex(/^[0-9+]+$/, "Format de numéro invalide"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  gender: z.enum(["MALE", "FEMALE"], {
    required_error: "Veuillez sélectionner un genre"
  }),
  birthDate: z.string().refine(date => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 15 && age <= 35;
  }, { message: "L'âge doit être compris entre 15 et 35 ans" }),
  birthPlace: z.string().min(2, "Le lieu de naissance est requis"),
  promotionId: z.string().min(1, "La promotion est requise"),
  refId: z.string().min(1, "Le référentiel est requis"),
  status: z.enum(["ACTIVE", "WAITING"], {
    required_error: "Le statut est requis"
  }),
  tutor: z.object({
    firstName: z.string().min(2, "Le prénom du tuteur est requis"),
    lastName: z.string().min(2, "Le nom du tuteur est requis"),
    phone: z.string()
      .min(9, "Le numéro doit contenir au moins 9 chiffres")
      .regex(/^[0-9+]+$/, "Format de numéro invalide"),
    email: z.string().email("Format d'email invalide").optional().or(z.literal('')),
    address: z.string().min(5, "L'adresse est requise")
  }),
  photoFile: z.any().optional(), // Pour le fichier de photo
});

// Type pour les données du formulaire
type LearnerFormData = z.infer<typeof learnerSchema>;

// Props pour les composants
interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

interface AddLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotions: Promotion[];
  referentials: Referential[];
  onSubmit: (data: LearnerFormData) => Promise<void>;
}

// Composants réutilisables
const FormSection = ({ title, icon, children }: FormSectionProps) => (
  <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-100">
    <div className="flex items-center mb-4 pb-3 border-b border-gray-100">
      <div className="bg-teal-50 p-2 rounded-md text-teal-600 mr-3">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

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

// Composants de formulaire
const LearnerForm = ({ 
  register, 
  errors, 
  activePromotion, 
  availableReferentials, 
  watch,
  setValue 
}) => {
  const selectedRefId = watch("refId");
  const selectedRef = availableReferentials.find(ref => ref.id === selectedRefId);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <FormSection title="Photo de profil" icon={<Image size={18} />}>
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
      </FormSection>

      <FormSection title="Informations personnelles" icon={<User size={18} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Prénom" error={errors.firstName?.message} required>
            <Input 
              {...register("firstName")} 
              placeholder="Prénom de l'apprenant"
              className={errors.firstName ? "border-red-300 focus:ring-red-500" : ""}
            />
          </Field>
          
          <Field label="Nom" error={errors.lastName?.message} required>
            <Input 
              {...register("lastName")} 
              placeholder="Nom de l'apprenant"
              className={errors.lastName ? "border-red-300 focus:ring-red-500" : ""}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Date de naissance" error={errors.birthDate?.message} required>
            <Input 
              {...register("birthDate")} 
              type="date" 
              className={errors.birthDate ? "border-red-300 focus:ring-red-500" : ""}
            />
          </Field>
          
          <Field label="Lieu de naissance" error={errors.birthPlace?.message} required>
            <Input 
              {...register("birthPlace")} 
              placeholder="Lieu de naissance"
              className={errors.birthPlace ? "border-red-300 focus:ring-red-500" : ""}
            />
          </Field>
        </div>

        <Field label="Genre" error={errors.gender?.message} required>
          <div className="flex gap-6 mt-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                {...register("gender")}
                value="MALE"
                className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
              />
              <span>Homme</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                {...register("gender")}
                value="FEMALE"
                className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
              />
              <span>Femme</span>
            </label>
          </div>
        </Field>
      </FormSection>

      <FormSection title="Adresse et formation" icon={<Users size={18} />}>
        <Field label="Adresse" error={errors.address?.message} required>
          <Textarea 
            {...register("address")} 
            placeholder="Adresse complète de l'apprenant"
            className={`resize-none ${errors.address ? "border-red-300 focus:ring-red-500" : ""}`}
          />
        </Field>

        <div className="mt-4">
          <input 
            type="hidden" 
            {...register("promotionId")} 
            value={activePromotion?.id || ""} 
          />

          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-2">Promotion active</div>
            <div className="font-medium text-gray-900">
              {activePromotion ? (
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                    Active
                  </span>
                  {activePromotion.name} ({format(new Date(activePromotion.startDate), 'dd MMMM yyyy', { locale: fr })} - {format(new Date(activePromotion.endDate), 'dd MMMM yyyy', { locale: fr })})
                </div>
              ) : (
                <span className="text-orange-500">Aucune promotion active</span>
              )}
            </div>
          </div>

          {/* SECTION CORRIGÉE: Utilisation d'un vrai select HTML au lieu d'un composant personnalisé */}
          <Field label="Référentiel" error={errors.refId?.message} required>
            <select
              {...register("refId")}
              className={`w-full h-10 px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.refId ? "border-red-300" : "border-gray-300"}`}
            >
              <option value="">Sélectionner un référentiel</option>
              {availableReferentials.map(ref => (
                <option key={ref.id} value={ref.id}>
                  {ref.name}
                </option>
              ))}
            </select>
          </Field>

          {selectedRef && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md text-blue-800 text-sm">
              <div className="font-medium mb-1">Détails du référentiel</div>
              <div>{selectedRef.description}</div>
              <div className="mt-2">
                <span className="font-medium">Durée:</span> {selectedRef.duration} mois
              </div>
            </div>
          )}

          <Field label="Statut" error={errors.status?.message} required>
            <select
              {...register("status")}
              className={`w-full h-10 px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.status ? "border-red-300" : "border-gray-300"}`}
            >
              <option value="">Sélectionner un statut</option>
              <option value="ACTIVE">Actif</option>
              <option value="WAITING">En attente</option>
            </select>
          </Field>
        </div>
      </FormSection>
    </div>
  );
};

const TutorForm = ({ register, errors }) => (
  <div className="space-y-6">
    <FormSection title="Informations du tuteur légal" icon={<User size={18} />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="Prénom du tuteur" error={errors.tutor?.firstName?.message} required>
          <Input
            {...register("tutor.firstName")}
            placeholder="Prénom du tuteur"
            className={errors.tutor?.firstName ? "border-red-300 focus:ring-red-500" : ""}
          />
        </Field>
        
        <Field label="Nom du tuteur" error={errors.tutor?.lastName?.message} required>
          <Input
            {...register("tutor.lastName")}
            placeholder="Nom du tuteur"
            className={errors.tutor?.lastName ? "border-red-300 focus:ring-red-500" : ""}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="Téléphone du tuteur" error={errors.tutor?.phone?.message} required>
          <Input
            {...register("tutor.phone")}
            placeholder="+221 XX XXX XX XX"
            className={errors.tutor?.phone ? "border-red-300 focus:ring-red-500" : ""}
          />
        </Field>
        
        <Field label="Email du tuteur" error={errors.tutor?.email?.message}>
          <Input
            {...register("tutor.email")}
            type="email"
            placeholder="email.tuteur@exemple.com (optionnel)"
            className={errors.tutor?.email ? "border-red-300 focus:ring-red-500" : ""}
          />
        </Field>
      </div>

      <Field label="Adresse du tuteur" error={errors.tutor?.address?.message} required>
        <Textarea
          {...register("tutor.address")}
          placeholder="Adresse complète du tuteur"
          className={`resize-none ${errors.tutor?.address ? "border-red-300 focus:ring-red-500" : ""}`}
        />
      </Field>
    </FormSection>
  </div>
);

// Composant principal
export default function AddLearnerModal({
  isOpen,
  onClose,
  promotions,
  referentials,
  onSubmit
}: AddLearnerModalProps) {
  const [step, setStep] = useState(1);
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);
  const [availableReferentials, setAvailableReferentials] = useState<Referential[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid, isDirty }, 
    watch, 
    trigger,
    reset,
    setValue
  } = useForm<LearnerFormData>({
    resolver: zodResolver(learnerSchema),
    mode: 'onBlur',
    defaultValues: {
      gender: undefined,
      promotionId: "",
      refId: "",
      tutor: {
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        address: ""
      }
    }
  });

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      reset();
    }
  }, [isOpen, reset]);

  // Charger la promotion active et les référentiels disponibles
  useEffect(() => {
    const active = promotions.find(p => p.status === 'ACTIVE');
    setActivePromotion(active || null);

    if (active && active.referentials) {
      setAvailableReferentials(active.referentials);
    } else if (active) {
      // Si la promotion n'a pas de référentiels associés, utiliser tous les référentiels
      setAvailableReferentials(referentials);
    } else {
      setAvailableReferentials([]);
    }
  }, [promotions, referentials]);

  // Définir automatiquement l'ID de promotion
  useEffect(() => {
    if (activePromotion) {
      reset({
        ...watch(),
        promotionId: activePromotion.id
      });
    }
  }, [activePromotion, reset, watch]);

  // Fonction pour passer à l'étape suivante
  const handleNext = async () => {
    const fieldsToValidate: (keyof LearnerFormData)[] = [
      'firstName', 'lastName', 'email', 'phone', 'gender',
      'birthDate', 'birthPlace', 'address', 'promotionId', 'refId'
    ];
    
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setStep(2);
    }
  };

  // Fonction pour revenir à l'étape précédente
  const handlePrevious = () => {
    setStep(1);
  };

  // Fonction de soumission du formulaire
  const onSubmitForm = async (data: LearnerFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Vérifiez que tous les champs requis sont remplis
      const isValid = await trigger();
      if (!isValid) {
        throw new Error("Veuillez remplir tous les champs requis");
      }

      await onSubmit(data);
      // Le modal sera fermé par le composant parent après succès
    } catch (error) {
      setError(error.message || "Une erreur est survenue lors de l'enregistrement");
      // Ne pas fermer le modal en cas d'erreur
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animations pour les transitions entre étapes
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={onClose}
    >
      <DialogContent className="p-0 overflow-hidden max-w-6xl w-11/12 max-h-[90vh] overflow-y-hidden bg-gray-50">
        <DialogHeader className="px-8 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-teal-700 text-center">
            Inscription d'un nouvel apprenant
          </DialogTitle>
        </DialogHeader>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center py-4 px-8 mb-2">
          <div className="flex items-center max-w-md w-full">
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                transition-all duration-300 ${step >= 1 ? 'border-teal-500 bg-teal-500 text-white' : 'border-gray-300 bg-white'}`}
            >
              {step > 1 ? <CheckCircle2 size={20} /> : <span className="font-medium">1</span>}
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
            <AnimatePresence initial={false} custom={step > 1 ? 1 : -1}>
              {step === 1 ? (
                <motion.div
                  key="learner-form"
                  custom={1}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <LearnerForm
                    register={register}
                    errors={errors}
                    activePromotion={activePromotion}
                    availableReferentials={availableReferentials}
                    watch={watch}
                    setValue={setValue}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="tutor-form"
                  custom={-1}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <TutorForm
                    register={register}
                    errors={errors}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Boutons de navigation */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              {step === 2 ? (
                <>
                  <Button
                    type="button"
                    onClick={handlePrevious}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isSubmitting || !isValid}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white ml-auto"
                  disabled={!activePromotion}
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}