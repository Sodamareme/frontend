"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authAPI, promotionsAPI, referentialsAPI, learnersAPI, Promotion, Referential } from '@/lib/api';
import { Eye, EyeOff, Mail, Lock, AlertCircle, UserPlus, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddLearnerModal from '../components/modals/AddLearnerModal';
import { toast } from "sonner";
import { LearnerFormSubmitData } from '@/lib/types';
import Link from 'next/link';
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  
  // États pour les promotions et référentiels
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [referentials, setReferentials] = useState<Referential[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string>('');

  // Charger les promotions et référentiels quand le modal s'ouvre
  useEffect(() => {
    const loadData = async () => {
      if (!isRegisterModalOpen) return;
      
      try {
        setLoadingData(true);
        setDataError('');
        
        console.log('Chargement des promotions et référentiels...');
        
        // Charger les promotions et référentiels en parallèle
        const [promotionsData, referentialsData] = await Promise.all([
          promotionsAPI.getAllPromotions().catch(err => {
            console.error('Erreur lors du chargement des promotions:', err);
            return [];
          }),
          referentialsAPI.getAllReferentials().catch(err => {
            console.error('Erreur lors du chargement des référentiels:', err);
            return [];
          })
        ]);
        
        console.log('Promotions chargées:', promotionsData);
        console.log('Référentiels chargés:', referentialsData);
        
        setPromotions(promotionsData);
        setReferentials(referentialsData);
        
        // Vérifier s'il y a une promotion active
        const hasActivePromotion = promotionsData.some(p => p.status === 'ACTIVE');
        if (!hasActivePromotion && promotionsData.length > 0) {
          setDataError('Aucune promotion active trouvée');
        } else if (promotionsData.length === 0) {
          setDataError('Aucune promotion disponible. Veuillez contacter l\'administrateur.');
        }
        
        if (referentialsData.length === 0) {
          setDataError(prev => prev ? `${prev} Aucun référentiel disponible.` : 'Aucun référentiel disponible.');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setDataError('Impossible de charger les données. Veuillez réessayer plus tard.');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [isRegisterModalOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setFieldErrors({});
    setError('');
    
    let hasErrors = false;
    const newFieldErrors: {email?: string; password?: string} = {};
    
    if (!email) {
      newFieldErrors.email = "L'email est requis";
      hasErrors = true;
    }
    
    if (!password) {
      newFieldErrors.password = "Le mot de passe est requis";
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('Attempting login with:', { email, password });
      const response = await authAPI.login(email, password);
      console.log('Login response:', response);
      
      if (response && response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('user', JSON.stringify({
          email: response.user.email,
          role: response.user.role,
        }));
        
        console.log('Login successful, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.error('Login failed: Invalid response format', response);
        setError('Connexion échouée. Veuillez réessayer.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.response?.data?.fieldErrors) {
        setFieldErrors(err.response.data.fieldErrors);
      } else if (err.response?.data?.error === 'invalid_credentials') {
        setError('Email ou mot de passe incorrect');
      } else if (err.response?.status === 401) {
        setError('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
      } else if (err.response?.status === 429) {
        setError('Trop de tentatives de connexion. Veuillez réessayer plus tard.');
      } else {
        const errorMessage = err.response?.data?.error || 
                            'Une erreur est survenue lors de la connexion';
        console.error('Error message:', errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched({ ...touched, [field]: true });
    
    if (field === 'email' && !email) {
      setFieldErrors({ ...fieldErrors, email: "L'email est requis" });
    } else if (field === 'password' && !password) {
      setFieldErrors({ ...fieldErrors, password: "Le mot de passe est requis" });
    }
  };

  // const handleRegisterSubmit = async (data: any) => {
  //   try {
  //     console.log('Début de l\'inscription avec les données:', data);
      
  //     // Créer un FormData pour envoyer la photo
  //     const formData = new FormData();
      
  //     // Ajouter tous les champs de l'apprenant (sauf photoFile et tutor)
  //     const learnerFields = [
  //       'firstName', 'lastName', 'email', 'phone', 'address',
  //       'gender', 'birthDate', 'birthPlace', 'promotionId', 'refId', 'status'
  //     ];
      
  //     learnerFields.forEach(field => {
  //       if (data[field] !== undefined && data[field] !== null) {
  //         formData.append(field, data[field]);
  //       }
  //     });
      
  //     // Ajouter les champs du tuteur avec le préfixe "tutor."
  //     if (data.tutor) {
  //       Object.keys(data.tutor).forEach(key => {
  //         if (data.tutor[key] !== undefined && data.tutor[key] !== null && data.tutor[key] !== '') {
  //           formData.append(`tutor.${key}`, data.tutor[key]);
  //         }
  //       });
  //     }
      
  //     // Ajouter la photo si elle existe
  //    if (data.photoFile) {
  //       formData.append('photoFile', data.photoFile);  // ✅ Correspond au backend
  //     }
      
  //     // Log pour debug
  //     console.log('FormData préparé pour envoi à l\'API');
  //     for (let pair of formData.entries()) {
  //       console.log(pair[0], pair[1]);
  //     }
      
  //     // Appeler l'API pour créer l'apprenant
  //     const response = await learnersAPI.createLearner(formData);
      
  //     console.log('Réponse de l\'API:', response);
      
  //     // Afficher un message de succès avec toast
  //     toast.success(
  //       'Inscription réussie !',
  //       {
  //         description: 'Vous recevrez vos identifiants de connexion par email dans quelques instants.',
  //         duration: 5000,
  //       }
  //     );
      
  //     // Fermer le modal
  //     setIsRegisterModalOpen(false);
      
  //     // Optionnel: Réinitialiser les états
  //     setPromotions([]);
  //     setReferentials([]);
      
  //   } catch (error: any) {
  //     console.error('Erreur lors de l\'inscription:', error);
      
  //     // Construire un message d'erreur détaillé
  //     let errorMessage = 'Une erreur est survenue lors de l\'inscription.';
      
  //     if (error.response?.data?.message) {
  //       errorMessage = error.response.data.message;
  //     } else if (error.response?.data?.error) {
  //       errorMessage = error.response.data.error;
  //     } else if (error.message) {
  //       errorMessage = error.message;
  //     }
      
  //     // Afficher l'erreur avec toast
  //     toast.error('Erreur d\'inscription', {
  //       description: errorMessage,
  //       duration: 5000,
  //     });
      
  //     // Relancer l'erreur pour que le modal puisse l'afficher
  //     throw new Error(errorMessage);
  //   }
  // };

  async function handleRegisterSubmit(data: LearnerFormSubmitData) {
      try {
        setIsSubmitting(true);
        
        const formData = new FormData();
        
        // Format de la date de naissance
        const birthDate = new Date(data.birthDate);
        const formattedBirthDate = birthDate.toISOString();
  
        // Ajouter la photo
        if (data.photoFile && data.photoFile instanceof File) {
          formData.append('photoFile', data.photoFile);
        }
  
        // Ajouter les champs de base de l'apprenant
        formData.append('firstName', data.firstName);
        formData.append('lastName', data.lastName);
        formData.append('email', data.email);
        formData.append('phone', data.phone);
        formData.append('address', data.address);
        formData.append('gender', data.gender);
        formData.append('birthDate', formattedBirthDate);
        formData.append('birthPlace', data.birthPlace);
        formData.append('promotionId', data.promotionId);
        formData.append('refId', data.refId);
        formData.append('status', data.status);
  
        // Ajouter les champs du tuteur
        formData.append('tutor[firstName]', data.tutor.firstName);
        formData.append('tutor[lastName]', data.tutor.lastName);
        formData.append('tutor[phone]', data.tutor.phone);
        formData.append('tutor[email]', data.tutor.email || '');
        formData.append('tutor[address]', data.tutor.address);
  
        console.log('Données envoyées:', {
          formData: Object.fromEntries(formData.entries()),
          photoFile: data.photoFile ? data.photoFile.name : 'Pas de photo'
        });
  
        const response = await learnersAPI.createLearner(formData);
        
        if (response) {
          // Afficher un message de succès avec toast
      toast.success(
        'Inscription réussie !',
        {
          description: 'Vous recevrez vos identifiants de connexion par email dans quelques instants.',
          duration: 5000,
        }
      );
     
       setIsRegisterModalOpen(false);
        }
      } catch (error: any) {
        console.error('Error details:', error);
        toast.error("Erreur lors de l'ajout de l'apprenant", {
          description: error.response?.data?.message || "Veuillez réessayer",
        });
      } finally {
        setIsSubmitting(false);
      }
    }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.6
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05, boxShadow: "0 10px 15px rgba(241, 101, 41, 0.2)" },
    tap: { scale: 0.95 }
  };

  const orangeCardVariants = {
    initial: { rotate: 1, x: -8, y: -8 },
    animate: {
      rotate: [1, 2, 1],
      x: [-8, -9, -8],
      y: [-8, -7, -8],
      transition: { 
        duration: 6, 
        repeat: Infinity, 
        repeatType: "mirror" as const
      }
    }
  };

  const greenCardVariants = {
    initial: { rotate: -1, x: 8, y: 8 },
    animate: {
      rotate: [-1, -2, -1],
      x: [8, 9, 8],
      y: [8, 7, 8],
      transition: { 
        duration: 6, 
        repeat: Infinity, 
        repeatType: "mirror" as const,
        delay: 0.5
      }
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const errorMessageVariants = {
    initial: { opacity: 0, height: 0, marginTop: 0 },
    animate: { opacity: 1, height: "auto", marginTop: 4, transition: { duration: 0.3 } },
    exit: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 overflow-hidden" 
         style={{ 
           background: 'url(https://res.cloudinary.com/drxouwbms/image/upload/v1743682062/pattern_kldzo3.png)',
           backgroundSize: 'cover'
         }}>
      <motion.div 
        className="relative max-w-sm w-full mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div 
          className="absolute -top-2 -left-2 w-full h-full bg-orange-500 rounded-2xl shadow-md"
          variants={orangeCardVariants}
          initial="initial"
          animate="animate"
        ></motion.div>
        
        <motion.div 
          className="absolute -bottom-2 -right-2 w-full h-full bg-teal-500 rounded-2xl shadow-md"
          variants={greenCardVariants}
          initial="initial"
          animate="animate"
        ></motion.div>
        
        <motion.div 
          className="relative bg-white rounded-2xl shadow-lg overflow-hidden z-10 border border-gray-100"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div 
            className="p-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="flex justify-center mb-4 -mx-6 -mt-6 pt-6 pb-4 bg-gradient-to-b from-gray-50 to-white"
              variants={itemVariants}
            >
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05, rotate: [0, -1, 1, -1, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Image 
                  src="https://res.cloudinary.com/drxouwbms/image/upload/v1743507686/image_27_qtiin4.png" 
                  alt="Sonatel Logo" 
                  width={130} 
                  height={35} 
                  className="drop-shadow-sm"
                />
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="text-center mb-4"
              variants={itemVariants}
            >
              <motion.h2 
                className="text-xs font-medium text-gray-600 mb-1"
                variants={fadeInUp}
              >
                Bienvenue sur
              </motion.h2>
              <motion.h3 
                className="text-lg font-bold text-orange-500 drop-shadow-sm"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
              >
                École du code Sonatel Academy
              </motion.h3>
            </motion.div>

            <motion.h1 
              className="text-xl font-bold text-gray-700 text-center mb-5"
              variants={itemVariants}
            >
              Se connecter
            </motion.h1>
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-xs border-l-3 border-red-500 shadow-sm flex items-start"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle size={14} className="mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                  Login
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-auto">
                    <Mail size={16} className={`transition-colors ${fieldErrors.email ? 'text-red-500' : 'text-gray-400 group-focus-within:text-orange-500'}`} />
                  </div>
                  <motion.input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touched.email && fieldErrors.email) {
                        setFieldErrors(prev => ({...prev, email: undefined}));
                      }
                    }}
                    onBlur={() => handleBlur('email')}
                    className={`w-full pl-9 pr-3 py-2 border ${fieldErrors.email ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500' : 'border-gray-300 bg-gray-50 focus:ring-orange-200 focus:border-orange-500'} rounded-lg focus:ring-1 transition-all duration-200 text-sm shadow-sm`}
                    placeholder="Matricule ou email"
                  />
                </div>
                <AnimatePresence>
                  {fieldErrors.email && (
                    <motion.p 
                      className="text-red-500 text-xs mt-1 flex items-center"
                      variants={errorMessageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <AlertCircle size={12} className="mr-1 flex-shrink-0" />
                      {fieldErrors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className={`transition-colors ${fieldErrors.password ? 'text-red-500' : 'text-gray-400 group-focus-within:text-orange-500'}`} />
                  </div>
                  <motion.input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password && fieldErrors.password) {
                        setFieldErrors(prev => ({...prev, password: undefined}));
                      }
                    }}
                    onBlur={() => handleBlur('password')}
                    className={`w-full pl-9 pr-9 py-2 border ${fieldErrors.password ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500' : 'border-gray-300 bg-gray-50 focus:ring-orange-200 focus:border-orange-500'} rounded-lg focus:ring-1 transition-all duration-200 text-sm shadow-sm`}
                    placeholder="Mot de passe"
                  />
                  <motion.button 
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {fieldErrors.password && (
                    <motion.p 
                      className="text-red-500 text-xs mt-1 flex items-center"
                      variants={errorMessageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <AlertCircle size={12} className="mr-1 flex-shrink-0" />
                      {fieldErrors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
              
            <motion.div 
  className="flex justify-end"
  variants={itemVariants}
>
  <Link 
    href="/forgot-password"  // ← Changez # par /forgot-password
    className="text-xs text-orange-500 hover:text-orange-600 hover:underline transition-all duration-200 font-medium"
  >
    Mot de passe oublié ?
  </Link>
</motion.div>
              
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-1 transition-all duration-200 disabled:opacity-70 font-medium text-sm shadow-md"
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </span>
                ) : 'Se connecter'}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1 transition-all duration-200 font-medium text-sm shadow-md flex items-center justify-center gap-2"
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
              >
                <UserPlus size={16} />
                Inscrire un apprenant
              </motion.button>
            </form>
            
            <motion.div 
              className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-500"
              variants={itemVariants}
            >
              © {new Date().getFullYear()} Orange Digital Center. Tous droits réservés.
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Modal avec message d'erreur si besoin */}
      {isRegisterModalOpen && (
        <>
          {loadingData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center gap-3">
                <svg className="animate-spin h-6 w-6 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-700">Chargement des données...</span>
              </div>
            </div>
          )}
          
          {dataError && !loadingData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
                    <p className="text-gray-600 text-sm">{dataError}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AddLearnerModal
        isOpen={isRegisterModalOpen && !loadingData && !dataError}
        onClose={() => setIsRegisterModalOpen(false)}
        promotions={promotions}
        referentials={referentials}
        onSubmit={handleRegisterSubmit}
      />
    </div>
  );
}