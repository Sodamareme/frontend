// app/reset-password/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    strength: 'weak' | 'medium' | 'strong';
    errors: string[];
  } | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast.error('Token manquant dans l\'URL');
      setTimeout(() => router.push('/forgot-password'), 2000);
    }
  }, [searchParams, router]);

  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    
    if (password.length >= 6) {
      const errors: string[] = [];
      let strength: 'weak' | 'medium' | 'strong' = 'weak';

      if (password.length < 8) errors.push('Au moins 8 caractères');
      if (!/[A-Z]/.test(password)) errors.push('Une majuscule');
      if (!/[a-z]/.test(password)) errors.push('Une minuscule');
      if (!/[0-9]/.test(password)) errors.push('Un chiffre');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Un caractère spécial');

      if (errors.length === 0) strength = 'strong';
      else if (errors.length <= 2) strength = 'medium';

      setPasswordStrength({ strength, errors });
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      
      await authAPI.resetPassword({
        token,
        newPassword,
        confirmPassword
      });

      setSuccess(true);
      toast.success('Mot de passe réinitialisé avec succès');
      
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (error: any) {
      console.error('Error resetting password:', error);
      const message = error.response?.data?.message || 'Erreur lors de la réinitialisation';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (!passwordStrength) return 'bg-gray-200';
    switch (passwordStrength.strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  const getStrengthWidth = () => {
    if (!passwordStrength) return '0%';
    switch (passwordStrength.strength) {
      case 'weak': return '33%';
      case 'medium': return '66%';
      case 'strong': return '100%';
      default: return '0%';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50"
           style={{ 
             background: 'url(https://res.cloudinary.com/drxouwbms/image/upload/v1743682062/pattern_kldzo3.png)',
             backgroundSize: 'cover'
           }}>
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Mot de passe réinitialisé !
          </h2>
          <p className="text-gray-600 mb-6">
            Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion...
          </p>
          <Link
            href="/"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Aller à la page de connexion
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50"
         style={{ 
           background: 'url(https://res.cloudinary.com/drxouwbms/image/upload/v1743682062/pattern_kldzo3.png)',
           backgroundSize: 'cover'
         }}>
      <motion.div 
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center mb-6">
          <Image 
            src="https://res.cloudinary.com/drxouwbms/image/upload/v1743507686/image_27_qtiin4.png" 
            alt="Sonatel Logo" 
            width={150} 
            height={40} 
            className="drop-shadow-sm"
          />
        </div>

        <div className="flex justify-center mb-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-3">
          Nouveau mot de passe
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Créez un nouveau mot de passe sécurisé pour votre compte.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Entrez votre nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {newPassword.length >= 6 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Force du mot de passe:</span>
                  <span className={`font-medium ${
                    passwordStrength?.strength === 'strong' ? 'text-green-600' :
                    passwordStrength?.strength === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength?.strength === 'strong' ? 'Fort' :
                     passwordStrength?.strength === 'medium' ? 'Moyen' : 'Faible'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getStrengthColor()} transition-all duration-300`}
                    style={{ width: getStrengthWidth() }}
                  />
                </div>
                {passwordStrength && passwordStrength.errors.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs space-y-1">
                    <p className="font-medium text-orange-900">Requis:</p>
                    {passwordStrength.errors.map((error, index) => (
                      <p key={index} className="flex items-center space-x-2 text-orange-700">
                        <AlertCircle className="w-3 h-3" />
                        <span>{error}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Confirmez votre mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>Les mots de passe ne correspondent pas</span>
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="mt-2 text-sm text-green-600 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Les mots de passe correspondent</span>
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Réinitialisation...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Réinitialiser le mot de passe</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}