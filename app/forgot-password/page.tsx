// app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [token, setToken] = useState(''); // Pour le développement

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Veuillez entrer votre adresse email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    try {
      setLoading(true);
      
      const response = await authAPI.forgotPassword(email);
      
      // En développement, le token est retourné
      if (response.token) {
        setToken(response.token);
      }
      
      setEmailSent(true);
      toast.success('Email envoyé avec succès');
      
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      const message = error.response?.data?.message || 'Une erreur est survenue';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50"
           style={{ 
             background: 'url(https://res.cloudinary.com/drxouwbms/image/upload/v1743682062/pattern_kldzo3.png)',
             backgroundSize: 'cover'
           }}>
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </motion.div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
            Email envoyé !
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
          </p>

          {/* En développement uniquement */}
          {token && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Mode développement - Token de test :
              </p>
              <Link
                href={`/reset-password?token=${token}`}
                className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
              >
                Cliquez ici pour réinitialiser votre mot de passe
              </Link>
            </div>
          )}
          
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">
              Vous n'avez pas reçu l'email ? Vérifiez vos spams ou
            </p>
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="w-full text-orange-500 hover:text-orange-600 font-medium text-sm"
            >
              Renvoyer l'email
            </button>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 mt-6 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
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
        transition={{ duration: 0.5 }}
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

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-3">
          Mot de passe oublié ?
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="votre.email@example.com"
                required
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !email}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                <span>Envoyer le lien de réinitialisation</span>
              </>
            )}
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </div>
      </motion.div>
    </div>
  );
}