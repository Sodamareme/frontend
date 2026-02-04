
import { StudentType } from '@/types/student';
import axios from 'axios';
import { ReactNode } from 'react';
import { AxiosError } from 'axios';

// Types pour les données
export interface User {
  id: string
  email: string
  role: 'ADMIN' | 'APPRENANT'
  profile?: {
    firstName: string
    lastName: string
    phone: string
  }
}

export interface Promotion {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  photoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  learnerCount: number;
  learners?: Learner[];
  referentials?: ReferentialExtended[];
}

export interface Referential {
  id: string
  name: string
  description?: string  // ✅ Optionnel
  photoUrl?: string
  capacity: number
  category: string
  status: string
  modules?: Module[]
}
export interface Kit {
  laptop?: boolean
  charger?: boolean
  bag?: boolean
  polo?: boolean
}

export interface Document {
  id: string
  name: string
  type: string
  url: string
}

export interface Tutor {
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
}

export interface LearnerDetails {
  id: string
  firstName: string
  lastName: string
  phone: string
  matricule: string
  address: string
  gender: 'MALE' | 'FEMALE'
  birthDate: string
  birthPlace: string
  photoUrl?: string
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'DROPPED_OUT'
  user?: User
  promotion?: Promotion
  referential?: Referential
  kit?: Kit
  documents?: Document[]
  tutor?: Tutor
}

// Configuration de l'API
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com/api'
  : 'http://localhost:3000'

// Fonction utilitaire pour récupérer le token (standardisée)
const getAuthToken = () => {
  return localStorage.getItem('accessToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
}

// Fonction utilitaire pour définir le token (standardisée)
const setAuthToken = (token: string) => {
  localStorage.setItem('accessToken', token);
  // Nettoyer les autres clés pour éviter la confusion
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
}

// Fonction utilitaire pour supprimer le token (standardisée)
const removeAuthToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
}

// Fonction utilitaire pour les requêtes HTTP
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Token expiré ou invalide
      removeAuthToken();
      window.location.href = '/login';
      return;
    }
    
    let errorMessage = `Erreur HTTP ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      errorMessage = 'Erreur réseau';
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Move these interfaces to the top of the file and export them
export interface LearnerDetailsExtended {
  documents: boolean;
  tutor: any;
  kit: any;
  referential: any;
  promotion: any;
  user: any;
  attendances: any[];
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  matricule: string;
  address: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  photoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'DROPPED_OUT';
}

interface AttendanceStats {
  attendance: any[];
  present: number;
  absent: number;
  late: number;
  totalDays: number;
  total:number;
}

interface ReplaceLearnerDto {
  originalLearnerId: string;
  newLearnerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    birthPlace: string;
  };
  reason: string;
}



interface ReplacementResponse {
  originalLearner: any;
  newLearner: any;
  message: string;
}

// interface NotificationResponse {
//   id: string;
//   message: string;
//   type: string;
//   isRead: boolean;
//   createdAt: string;
//   attendanceId?: string;
// }

// Configure axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeAuthToken();
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      console.log('API call: Attempting login with:', { email });
      console.log('API URL being used:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
      
      const response = await axios.post('/api/auth/login', { email, password });
      console.log('API response received:', response.status);
      
      if (response.data && response.status === 200) {
        // Standardiser le stockage du token
        if (response.data.token) {
          setAuthToken(response.data.token);
        }
        return response.data;
      } else {
        console.error('Unexpected API response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  loginSimple: async (email: string, password: string): Promise<{ token: string, user: User }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }))
      throw new Error(error.message || 'Erreur de connexion')
    }

    const data = await response.json();
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  register: async (userData: any): Promise<{ token: string, user: User }> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }))
      throw new Error(error.message || 'Erreur lors de l\'inscription')
    }

    const data = await response.json();
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },
 /**
   * Changer le mot de passe
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      console.log('🔐 Changing password...');
      const response = await api.put('/auth/change-password', data);
      console.log('✅ Password changed successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Password change failed:', error.response?.data);
      throw error;
    }
  },
   /**
   * Demander la réinitialisation du mot de passe
   */
  forgotPassword: async (email: string) => {
    try {
      console.log('📧 Requesting password reset for:', email);
      const response = await api.post('/auth/forgot-password', { email });
      console.log('✅ Password reset email sent');
      return response.data;
    } catch (error: any) {
      console.error('❌ Password reset request failed:', error.response?.data);
      throw error;
    }
  },

  /**
   * Réinitialiser le mot de passe avec le token
   */
  resetPassword: async (data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      console.log('🔐 Resetting password...');
      const response = await api.post('/auth/reset-password', data);
      console.log('✅ Password reset successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Password reset failed:', error.response?.data);
      throw error;
    }
  },

  /**
   * Valider la force du mot de passe
   */
  validatePasswordStrength: async (password: string) => {
    try {
      const response = await api.post('/auth/validate-password-strength', { password });
      return response.data;
    } catch (error: any) {
      console.error('❌ Password validation failed:', error);
      return {
        isValid: false,
        errors: ['Erreur de validation'],
        strength: 'weak' as const
      };
    }
  },
  logout: async (): Promise<void> => {
    removeAuthToken();
    localStorage.removeItem('user');
  },

  getCurrentUser: async (): Promise<User> => {
    return fetchWithAuth('/auth/me')
  },
};


// Types based on database schema
export interface UserExtended {
  id: string;
  email: string;
  role: 'ADMIN' | 'COACH' | 'APPRENANT' | 'RESTAURATEUR' | 'VIGIL';
}

export type LearnerStatus = 'ACTIVE' | 'WAITING' | 'ABANDONED' | 'REPLACEMENT' | 'REPLACED';

export interface Learner {
  [x: string]: any;
  email: ReactNode;
  id: string;
  firstName: string;
  lastName: string;
  address?: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  phone: string;
  photoUrl?: string;
  status: LearnerStatus;
  qrCode: string;
  userId: string;
  refId?: string;
  promotionId: string;
  createdAt: string;
  updatedAt: string;
  referential?: ReferentialExtended;
  promotion?: PromotionExtended;
  attendances?: LearnerAttendance[];
  kit?: KitExtended;
  matricule?: string;
}

export interface PromotionExtended {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  photoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  learnerCount: number;
  referentials: ReferentialExtended[];
  learners?: Learner[];
}

export interface ReferentialExtended {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string;
  capacity: number;
  category: string;
  status: string;
  learners?: Learner[];
  modules?: Module[];
  promotions?: PromotionExtended[];
  coaches?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
  }>;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string;
  startDate: string;
  endDate: string;
  refId: string;
  coachId: string;
  coach?: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
  };
  referential?: {
    id: string;
    name: string;
  };
}

type AbsenceStatus = 'TO_JUSTIFY' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LearnerAttendance {
  id: string;
  learnerId: string;
  date: string;
  scanTime?: string;
  isPresent: boolean;
  isLate: boolean;
  status: AbsenceStatus;
  justification?: string;
  documentUrl?: string;
  justificationComment?: string;
  learner: {
    id: string;
    firstName: string;
    lastName: string;
    matricule?: string;
    photoUrl?: string;
    address?: string;
    referential?: {
      id: string;
      name: string;
    };
  };
}

export interface KitExtended {
  id: string;
  laptop: boolean;
  charger: boolean;
  bag: boolean;
  polo: boolean;
  learnerId?: string;
}

export interface Grade {
  id: string;
  value: number;
  comment?: string;
  createdAt: string;
  moduleId: string;
  learnerId: string;
  learner: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    photoUrl?: string;
    referential: {
      id: string;
      name: string;
    } | null;
  };
}
// export interface Grade {
//   id: string;
//   value: number;
//   comment?: string;
//   createdAt: string;
//   updatedAt?: string;
//   moduleId: string;
//   learnerId: string;
//   learner: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     matricule: string;
//     email: string;
//     photoUrl?: string;
//   };
// }

interface LatestScansResponse {
  learnerScans: Array<{
    id: string;
    scanTime: string;
    isLate: boolean;
    isPresent: boolean;
    learner: {
      firstName: string;
      lastName: string;
      matricule: string;
      photoUrl?: string;
      referential?: {
        name: string;
      }
    }
  }>;
  coachScans: Array<{
    id: string;
    scanTime: string;
    isLate: boolean;
    isPresent: boolean;
    coach: {
      firstName: string;
      lastName: string;
      matricule: string;
      photoUrl?: string;
    }
  }>;
}

// Learners API calls
export const learnersAPI = {
  getAllLearners: async () => {
    try {
      const response = await api.get('/learners');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getLearnerById: async (id: string): Promise<Learner> => {
    try {
      const response = await api.get(`/learners/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching learner:', error);
      throw error;
    }
  },
  
  getLearnerAttendanceStats: async (id: string) => {
    try {
      const response = await api.get(`/learners/${id}/attendance-stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getGenderDistribution: async () => {
    try {
      const response = await api.get('/learners/stats/gender');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateLearnerStatus: async (id: string, status: string, reason?: string) => {
    try {
      const response = await api.patch(`/learners/${id}/status`, { status, reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateLearnerKit: async (id: string, kitData: Partial<KitExtended>) => {
    try {
      const response = await api.put(`/learners/${id}/kit`, kitData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getWaitingList: async (promotionId?: string): Promise<Learner[]> => {
    try {
      const url = `/learners/waiting-list${promotionId ? `?promotionId=${promotionId}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching waiting list:', error);
      throw error;
    }
  },
  // Dans promotionsAPI
removeReferentialFromPromotion: async (promotionId: string, referentialId: string) => {
  const response = await api.delete(`/promotions/${promotionId}/referentials/${referentialId}`);
  return response.data;
},
  
  replaceLearner: async (data: ReplaceLearnerDto): Promise<ReplacementResponse> => {
    try {
      const response = await api.post('/learners/replace', data);
      return response.data;
    } catch (error) {
      console.error('Error replacing learner:', error);
      throw error;
    }
  },

  getLearnerByEmail: async (email: string): Promise<LearnerDetailsExtended> => {
    try {
      const response = await api.get(`/learners/email/${email}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching learner by email:', error);
      throw error;
    }
  },

  getLearnerByIdSimple: async (id: string): Promise<LearnerDetails> => {
    return fetchWithAuth(`/learners/${id}`)
  },

  updateLearner: async (id: string, data: Partial<LearnerDetails>): Promise<LearnerDetails> => {
    return fetchWithAuth(`/learners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  getAllLearnersSimple: async (): Promise<LearnerDetails[]> => {
    return fetchWithAuth('/learners')
  },

  createLearnerSimple: async (data: Partial<LearnerDetails>): Promise<LearnerDetails> => {
    return fetchWithAuth('/learners', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateLearnerStatusSimple: async (id: string, status: string, reason?: string): Promise<LearnerDetails> => {
    return fetchWithAuth(`/learners/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    })
  },

  updateLearnerKitSimple: async (id: string, kitData: Kit): Promise<LearnerDetails> => {
    return fetchWithAuth(`/learners/${id}/kit`, {
      method: 'PUT',
      body: JSON.stringify(kitData),
    })
  },

  uploadDocumentSimple: async (id: string, file: File, type: string, name: string): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    formData.append('name', name)

    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/learners/${id}/documents`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }))
      throw new Error(error.message || `Erreur HTTP ${response.status}`)
    }

    return response.json()
  },

  getLearnerDocuments: async (id: string): Promise<Document[]> => {
    return fetchWithAuth(`/learners/${id}/documents`)
  },

  getAttendanceStatsSimple: async (id: string): Promise<{
    totalDays: number
    presentDays: number
    attendanceRate: number
  }> => {
    return fetchWithAuth(`/learners/${id}/attendance-stats`)
  },

  getAttendanceHistory: async (id: string): Promise<any[]> => {
    return fetchWithAuth(`/learners/${id}/attendance`)
  },

  getStatusHistory: async (id: string): Promise<any[]> => {
    return fetchWithAuth(`/learners/${id}/status-history`)
  },

  getWaitingListSimple: async (promotionId?: string): Promise<LearnerDetails[]> => {
    const params = promotionId ? `?promotionId=${promotionId}` : ''
    return fetchWithAuth(`/learners/waiting-list${params}`)
  },

  calculateAttendanceStats: (attendances: LearnerDetailsExtended['attendances']): AttendanceStats => {
    const stats = {
      attendance: attendances,
      present: 0,
      absent: 0,
      late: 0,
      totalDays: attendances.length,
      total:0
    };

    attendances.forEach(attendance => {
      if (attendance.isPresent) {
        if (attendance.isLate) {
          stats.late++;
        } else {
          stats.present++;
        }
      } else {
        stats.absent++;
      }
    });
    return stats;
  },

  createLearner: async (formData: FormData) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        transformRequest: [function (data) {
          return data;
        }],
        timeout: 30000
      };

      console.log('Envoi de la requête avec les données :', 
        Array.from(formData.entries()).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {})
      );

      const response = await api.post('/learners', formData, config);
      
      if (!response.data) {
        throw new Error('Pas de données reçues du serveur');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating learner:', error);
      if (error.response) {
        console.error('Server error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  },
   async validateBulkImport(formData: FormData) {
    try {
      const response = await fetch('/api/learners/validate-bulk-import', {
        method: 'POST',
        body: formData,
        // Ne pas définir Content-Type, le browser le fait automatiquement pour FormData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Validate bulk import error:', error);
      throw error;
    }
  },

  // Effectuer l'import en masse
  async bulkImport(formData: FormData) {
    try {
      const response = await fetch('/api/learners/bulk-import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Bulk import error:', error);
      throw error;
    }
  },
  

  // Télécharger le template CSV
  async downloadCsvTemplate() {
    try {
      const response = await fetch('/api/learners/download-csv-template', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Retourner la réponse pour traitement par le composant
      return response;
    } catch (error) {
      console.error('Download template error:', error);
      throw error;
    }
  },

  // Debug des QR codes
  async debugQrCodes() {
    try {
      const response = await fetch('/api/learners/debug/qr-codes', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Debug QR codes error:', error);
      throw error;
    }
  },

  // Corriger les QR codes manquants
  async fixMissingQrCodes() {
    try {
      const response = await fetch('/api/learners/fix-missing-qr-codes', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Fix QR codes error:', error);
      throw error;
    }
  },

  // Régénérer le QR code d'un apprenant spécifique
  async regenerateQrCode(learnerId: string) {
    try {
      const response = await fetch(`/api/learners/${learnerId}/regenerate-qr-code`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Regenerate QR code error:', error);
      throw error;
    }
  }
};

// Types pour TypeScript
export interface ValidationResponse {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errors: string[];
  warnings: string[];
  preview: any[];
}

export interface ImportResult {
  success: boolean;
  matricule?: string;
  email: string;
  firstName: string;
  lastName: string;
  error?: string;
  warnings?: string[];
}

export interface ImportResponse {
  totalProcessed: number;
  successfulImports: number;
  failedImports: number;
  results: ImportResult[];
  summary: {
    duplicateEmails: number;
    duplicatePhones: number;
    sessionCapacityWarnings: number;
    missingReferentials: number;
    invalidData: number;
  };
};

// Modules API calls
export const modulesAPI = {
  getAllModules: async () => {
    try {
      const response = await api.get('/modules');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getModuleById: async (id: string) => {
    try {
      const response = await api.get(`/modules/${id}?include=coach,referential`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getActiveModulesByLearner: async (learnerId: string) => {
    try {
      const response = await api.get(`/modules/active/learner/${learnerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateModule: async (id: string, moduleData: Partial<Module>) => {
    try {
      const response = await api.put(`/modules/${id}`, moduleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deleteModule: async (id: string) => {
    try {
      console.log('Tentative de suppression du module:', id);
      console.log('Token utilisé:', getAuthToken());
      
      const response = await api.delete(`/modules/${id}`);
      
      console.log('Réponse de suppression réussie:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Vous n\'êtes pas autorisé à effectuer cette action');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Module non trouvé');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions pour supprimer ce module');
      }
      
      throw error;
    }
  },

  createModule: async (formData: FormData) => {
    try {
      const response = await api.post('/modules', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  },
};

// Referentials API calls
export const referentialsAPI = {
  getAllReferentials: async () => {
    try {
      const response = await api.get('/referentials');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getReferentialById: async (id: string): Promise<ReferentialExtended> => {
    try {
      const response = await api.get(`/referentials/${id}?include=modules,learners,promotions`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching referential:', error);
      throw error;
    }
  },
  
  createReferential: async (referentialData: {
    name: string;
    description?: string;
    photo?: File;
    capacity: number;
    numberOfSessions: number;
    sessionLength?: number;
  }) => {
    try {
      const formData = new FormData();
      
      Object.keys(referentialData).forEach(key => {
        if (key === 'photo') {
          if (referentialData.photo) {
            formData.append('photoUrl', referentialData.photo);
          }
        } else if (referentialData[key] !== undefined) {
          formData.append(key, referentialData[key].toString());
        }
      });

      const response = await api.post('/referentials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating referential:', error);
      throw error;
    }
  },

  addReferentialsToPromotion: async (promotionId: string, referentialIds: string[]) => {
    try {
      const response = await api.post(`/promotions/${promotionId}/referentials`, {
        referentialIds
      });
      return response.data;
    } catch (error) {
      console.error('Error adding referentials to promotion:', error);
      throw error;
    }
  },
  
  updateReferential: async (id: string, referentialData: Partial<ReferentialExtended>) => {
    try {
      const response = await api.put(`/referentials/${id}`, referentialData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deleteReferential: async (id: string) => {
    try {
      const response = await api.delete(`/referentials/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllReferentialsSimple: async (): Promise<Referential[]> => {
    return fetchWithAuth('/referentials')
  },

  getReferentialByIdSimple: async (id: string): Promise<Referential> => {
    return fetchWithAuth(`/referentials/${id}`)
  },

  createReferentialSimple: async (data: Partial<Referential>): Promise<Referential> => {
    return fetchWithAuth('/referentials', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateReferentialSimple: async (id: string, data: Partial<Referential>): Promise<Referential> => {
    return fetchWithAuth(`/referentials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteReferentialSimple: async (id: string): Promise<void> => {
    return fetchWithAuth(`/referentials/${id}`, {
      method: 'DELETE',
    })
  },
};
export const pendingLearnersAPI = {
  // Soumettre une demande d'inscription (public)
  register: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/pending-learners`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(error.message || `Erreur HTTP ${response.status}`);
    }
    
    return response.json();
  },

  // Obtenir toutes les demandes (admin uniquement)
  getAll: async (status?: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    const token = getAuthToken();
    const url = status 
      ? `${API_BASE_URL}/pending-learners?status=${status}`
      : `${API_BASE_URL}/pending-learners`;
    
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(error.message || `Erreur HTTP ${response.status}`);
    }
    
    return response.json();
  },

  // Obtenir une demande par ID (admin uniquement)
  getById: async (id: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/pending-learners/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(error.message || `Erreur HTTP ${response.status}`);
    }
    
    return response.json();
  },

  // Approuver une demande (admin uniquement)
  approve: async (id: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/pending-learners/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(error.message || `Erreur HTTP ${response.status}`);
    }
    
    return response.json();
  },

  // Rejeter une demande (admin uniquement)
  reject: async (id: string, reason?: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/pending-learners/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ reason }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(error.message || `Erreur HTTP ${response.status}`);
    }
    
    return response.json();
  },
};
// Grades API calls
// lib/api.ts
export const gradesAPI = {
  // ✅ CORRECTION : Utiliser le bon endpoint
  getGradesByModule: async (moduleId: string): Promise<Grade[]> => {
    try {
      console.log('🔄 Fetching grades for module:', moduleId);
      
      // CHANGEMENT ICI : utiliser /grades/module/ au lieu de /modules/
      const response = await api.get(`/grades/module/${moduleId}`);
      
      console.log('✅ Grades received:', response.data);
      
      // S'assurer que la réponse est un tableau
      if (!Array.isArray(response.data)) {
        console.warn('⚠️ Response is not an array:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching grades for module:', error);
      
      // Si c'est une erreur 404, retourner un tableau vide au lieu de throw
      if (error.response?.status === 404) {
        console.log('ℹ️ No grades found for this module (404)');
        return [];
      }
      
      throw error;
    }
  },

  getGradesByLearner: async (learnerId: string): Promise<Grade[]> => {
    try {
      const response = await api.get(`/grades/learner/${learnerId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },
  
  createGrade: async (gradeData: {
    moduleId: string;
    learnerId: string;
    value: number;
    comment?: string;
  }): Promise<Grade> => {
    try {
      console.log('📤 Sending grade data:', gradeData);
      
      if (!gradeData.moduleId || !gradeData.learnerId) {
        throw new Error('moduleId et learnerId sont requis');
      }
      
      if (gradeData.value < 0 || gradeData.value > 20) {
        throw new Error('La note doit être entre 0 et 20');
      }
      
      const response = await api.post('/grades', {
        moduleId: gradeData.moduleId,
        learnerId: gradeData.learnerId,
        value: gradeData.value,
        comment: gradeData.comment || ''
      });
      
      console.log('✅ Grade created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating grade:', error);
      throw error;
    }
  },
  
  updateGrade: async (id: string, gradeData: {
    moduleId?: string;
    learnerId?: string;
    value?: number;
    comment?: string;
  }): Promise<Grade> => {
    try {
      console.log('📤 Updating grade:', id, gradeData);
      const response = await api.put(`/grades/${id}`, gradeData);
      console.log('✅ Grade updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating grade:', error);
      throw error;
    }
  },
  
  deleteGrade: async (id: string): Promise<void> => {
    try {
      await api.delete(`/grades/${id}`);
    } catch (error) {
      throw error;
    }
  },
};

// Attendance API calls
interface AttendanceScanResponse {
  success: boolean;
  message: string;
  data?: {
    learner?: {
      firstName: string;
      lastName: string;
      matricule: string;
      photoUrl?: string;
      referential?: {
        name: string;
      };
    };
    coach?: {
      firstName: string;
      lastName: string;
      matricule: string;
      photoUrl?: string;
    };
    scanTime: string;
    isLate: boolean;
    isPresent: boolean;
  };
}

interface BaseScanResponse {
  type: 'LEARNER' | 'COACH';
  scanTime: Date;
  attendanceStatus: 'PRESENT' | 'LATE' | 'ABSENT';
  isAlreadyScanned: boolean;
}

interface LearnerScanResponse extends BaseScanResponse {
  type: 'LEARNER';
  learner: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    referential: {
      name: string;
    } | null;
    promotion: {
      name: string;
    };
  };
}

interface CoachScanResponse extends BaseScanResponse {
  type: 'COACH';
  coach: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    referential: {
      name: string;
    } | null;
  };
}

type ApiScanResponse = {
  success: boolean;
  message: string;
  data?: LearnerScanResponse | CoachScanResponse;
};
export interface Coach {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string;
  qrCode?: string;
  userId: string;
  refId?: string;
  createdAt: string;
  updatedAt: string;
  referential?: {
    id: string;
    name: string;
    description?: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
  };
  attendances?: CoachAttendance[];
  modules?: Module[];
}

export interface CoachAttendance {
  id: string;
  date: string;
  isPresent: boolean;
  isLate: boolean;
  scanTime?: string;
  coachId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoachData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  refId?: string;
}

// API client pour les coaches
// lib/api.ts
export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    console.error('❌ API Error:', {
      status,
      statusText: error.response?.statusText,
      data,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Erreurs spécifiques par code HTTP
    switch (status) {
      case 400:
        return {
          message: data?.message || 'Données invalides',
          statusCode: 400,
          details: data,
        };
      
      case 401:
        return {
          message: 'Non autorisé. Veuillez vous reconnecter.',
          statusCode: 401,
        };
      
      case 403:
        return {
          message: 'Accès refusé',
          statusCode: 403,
        };
      
      case 404:
        return {
          message: data?.message || 'Ressource non trouvée',
          statusCode: 404,
        };
      
      case 409:
        return {
          message: data?.message || 'Conflit: Cette ressource existe déjà',
          statusCode: 409,
          details: data,
        };
      
      case 422:
        return {
          message: data?.message || 'Erreur de validation',
          statusCode: 422,
          details: data,
        };
      
      case 500:
        return {
          message: 'Erreur serveur. Veuillez réessayer plus tard.',
          statusCode: 500,
        };
      
      default:
        return {
          message: data?.message || error.message || 'Une erreur est survenue',
          statusCode: status,
          details: data,
        };
    }
  }

  // Erreur réseau ou autre
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'Une erreur inconnue est survenue',
  };
};

// Version améliorée de coachesAPI avec gestion d'erreur
export const coachesAPI = {
 getAllCoaches: async (): Promise<Coach[]> => {
    try {
      console.log('🔄 Fetching all coaches...');
      const response = await api.get('/coaches');
      console.log('✅ Coaches received:', response.data);
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },

  getCoachById: async (id: string): Promise<Coach> => {
    try {
      const response = await api.get(`/coaches/${id}`);
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },

  /**
   * 🆕 Obtenir le profil du coach connecté (avec QR Code)
   */
 
  createCoach: async (formData: FormData): Promise<Coach> => {
    try {
      console.log('🚀 Sending coach creation request...');
      
      // Log FormData contents
      console.log('📋 FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      const response = await api.post('/coaches', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Coach created successfully:', response.data);
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('❌ Failed to create coach:', apiError);
      throw new Error(apiError.message);
    }
  },

  updateCoach: async (id: string, formData: FormData): Promise<Coach> => {
    try {
      console.log('🔄 Updating coach:', id);
      const response = await api.put(`/coaches/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Coach updated successfully:', response.data);
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('❌ Failed to update coach:', apiError);
      throw new Error(apiError.message);
    }
  },

  deleteCoach: async (id: string): Promise<void> => {
    try {
      await api.delete(`/coaches/${id}`);
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },
  scanAttendance: async (qrData: string) => {
    try {
      const response = await api.post('/coaches/scan-attendance', { qrData });
      return response.data;
    } catch (error) {
      console.error('Error scanning attendance:', error);
      throw error;
    }
  },

  getAttendanceHistory: async (coachId: string, startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/coaches/${coachId}/attendance?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },

  getTodayAttendance: async () => {
    try {
      const response = await api.get('/coaches/attendance/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      throw error;
    }
  },
 getMyProfile: async () => {
    try {
      console.log('👤 Calling GET /coaches/me');
      const response = await api.get('/coaches/me');
      console.log('✅ Coach profile received:', {
        id: response.data.id,
        name: `${response.data.firstName} ${response.data.lastName}`,
        matricule: response.data.matricule,
        hasQrCode: !!response.data.qrCode
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error in getMyProfile:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtenir l'historique de présence du coach connecté
   */
  getMyAttendance: async (startDate?: string, endDate?: string) => {
    try {
      console.log('📍 Calling GET /coaches/me/attendance', { startDate, endDate });
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/coaches/me/attendance${params.toString() ? '?' + params.toString() : ''}`;
      const response = await api.get(url);
      
      console.log('✅ Attendance data received:', response.data.length, 'records');
      
      // S'assurer que les données sont au bon format
      return response.data.map((att: any) => ({
        id: att.id,
        date: att.date,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        isPresent: att.isPresent ?? true, // Par défaut true si non défini
        isLate: att.isLate ?? false,      // Par défaut false si non défini
        duration: att.duration
      }));
    } catch (error: any) {
      console.error('❌ Error in getMyAttendance:', error.response?.data || error.message);
      // Retourner un tableau vide en cas d'erreur plutôt que de throw
      return [];
    }
  },

  /**
   * Obtenir les statistiques de présence du coach connecté
   */
  getMyAttendanceStats: async (month?: number, year?: number) => {
    try {
      console.log('📊 Calling GET /coaches/me/attendance/stats', { month, year });
      
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const url = `/coaches/me/attendance/stats${params.toString() ? '?' + params.toString() : ''}`;
      const response = await api.get(url);
      
      console.log('✅ Stats data received:', response.data);
      
      // S'assurer que toutes les propriétés existent avec des valeurs par défaut
      return {
        presentDays: response.data.presentDays ?? 0,
        lateDays: response.data.lateDays ?? 0,
        completedDays: response.data.completedDays ?? 0,
        totalHoursWorked: response.data.totalHoursWorked ?? '0.0',
        averageHoursPerDay: response.data.averageHoursPerDay ?? '0.0',
        attendanceRate: response.data.attendanceRate ?? 0,
        totalDays: response.data.totalDays ?? 0
      };
    } catch (error: any) {
      console.error('❌ Error in getMyAttendanceStats:', error.response?.data || error.message);
      // Retourner des stats vides en cas d'erreur
      return {
        presentDays: 0,
        lateDays: 0,
        completedDays: 0,
        totalHoursWorked: '0.0',
        averageHoursPerDay: '0.0',
        attendanceRate: 0,
        totalDays: 0
      };
    }
  },

  /**
   * Obtenir la présence d'aujourd'hui du coach connecté
   */
  getMyTodayAttendance: async () => {
    try {
      console.log('📅 Calling GET /coaches/me/attendance/today');
      const response = await api.get('/coaches/me/attendance/today');
      
      if (!response.data) {
        console.log('ℹ️ No attendance found for today');
        return null;
      }
      
      console.log('✅ Today attendance received:', response.data);
      
      return {
        id: response.data.id,
        date: response.data.date,
        checkIn: response.data.checkIn,
        checkOut: response.data.checkOut,
        isPresent: response.data.isPresent ?? false,
        isLate: response.data.isLate ?? false
      };
    } catch (error: any) {
      // Si pas de données aujourd'hui (404), retourner null
      if (error.response?.status === 404) {
        console.log('ℹ️ No attendance record for today (404)');
        return null;
      }
      
      console.error('❌ Error in getMyTodayAttendance:', error.response?.data || error.message);
      return null;
    }
  },

 selfCheckIn: async () => {
  const response = await api.post('/coaches/me/self-checkin');
  return response.data;
}

};


export const attendanceAPI = {
  getAttendanceByLearner: async (learnerId: string): Promise<LearnerAttendance[]> => {
    try {
      console.log('Fetching attendance for learner:', learnerId);
      const response = await api.get(`/learners/${learnerId}/attendance`);
      console.log('Attendance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching learner attendance:', error);
      throw error;
    }
  },
  
 getAbsentsByReferential: async (date: string, referentialId: string) => {
    try {
      const response = await api.get(`/attendance/absents/${referentialId}?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching absents by referential:', error);
      throw error;
    }
  },

  getDailyStats: async (date: string, referentialId?: string) => {
    try {
      const url = referentialId 
        ? `/attendance/stats/daily?date=${date}&referentialId=${referentialId}`
        : `/attendance/stats/daily?date=${date}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      throw error;
    }
  },
  getWeeklyStats: async (date: string): Promise<AttendanceStats> => {
    try {
      const [year, week] = date.split('-W');
      const response = await api.get('/attendance/stats/weekly', {
        params: { year: parseInt(year), week: parseInt(week) }
      });

      const weekStats = response.data.weeks[parseInt(week) - 1] || {
        present: 0,
        late: 0,
        absent: 0
      };

      return {
        present: weekStats.present,
        late: weekStats.late,
        absent: weekStats.absent,
        total: weekStats.present + weekStats.late + weekStats.absent,
        attendance: response.data.attendance || [],
        totalDays: response.data.attendance?.length || 0
      };
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      throw error;
    }
  },

  getMonthlyStats: async (year: number, month: number): Promise<AttendanceStats> => {
    const response = await api.get('/attendance/stats/monthly', {
      params: { year, month }
    });
    return response.data;
  },

  getYearlyStats: async (year: number): Promise<AttendanceStats> => {
    const response = await api.get('/attendance/stats/yearly', {
      params: { year }
    });
    return response.data;
  },

  getLatestScans: async (limit: number = 10) => {
    try {
      const response = await api.get(`/attendance/scans/latest?limit=${limit}`);
      return {
        learnerScans: response.data.learnerScans?.map((scan: LearnerScanResponse) => ({
          id: scan.learner.id,
          scanTime: scan.scanTime,
          isLate: scan.attendanceStatus === 'LATE',
          isPresent: scan.attendanceStatus === 'PRESENT',
          learner: {
            firstName: scan.learner.firstName,
            lastName: scan.learner.lastName,
            matricule: scan.learner.matricule,
            photoUrl: scan.learner.photoUrl,
            referential: scan.learner.referential
          }
        })) || [],
        coachScans: response.data.coachScans?.map((scan: CoachScanResponse) => ({
          id: scan.coach.id,
          scanTime: scan.scanTime,
          isLate: scan.attendanceStatus === 'LATE',
          isPresent: scan.attendanceStatus === 'PRESENT',
          coach: {
            firstName: scan.coach.firstName,
            lastName: scan.coach.lastName,
            matricule: scan.coach.matricule,
            photoUrl: scan.coach.photoUrl
          }
        })) || []
      };
    } catch (error) {
      console.error('Error fetching latest scans:', error);
      return {
        learnerScans: [],
        coachScans: []
      };
    }
  },
  
  scanLearner: async (qrCode: string) => {
    try {
      const response = await api.post('/attendance/scan', { qrCode });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  approveJustification: async (attendanceId: string, approved: boolean, comment?: string) => {
    try {
      const response = await api.patch(`/attendance/${attendanceId}/justify`, { 
        status: approved ? 'APPROVED' : 'REJECTED',
        comment
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  scanLearnerQR: async (matricule: string): Promise<ApiScanResponse> => {
    try {
      const response = await api.post('/attendance/scan/learner', { matricule });
      const data = response.data;

      if (data.isAlreadyScanned) {
        return {
          success: false,
          message: 'Cette personne a déjà été scannée aujourd\'hui'
        };
      }

      return {
        success: true,
        data: data,
        message: data.attendanceStatus === 'LATE' 
          ? 'Présence enregistrée (En retard)' 
          : 'Présence enregistrée'
      };
    } catch (error: any) {
      console.error('Error scanning learner QR:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors du scan'
      };
    }
  },

  scanCoachQR: async (matricule: string): Promise<ApiScanResponse> => {
    try {
      const response = await api.post('/attendance/scan/coach', { matricule });
      const data = response.data;

      if (data.isAlreadyScanned) {
        return {
          success: false,
          message: 'Cette personne a déjà été scannée aujourd\'hui'
        };
      }

      return {
        success: true,
        data: data,
        message: data.attendanceStatus === 'LATE' 
          ? 'Présence enregistrée (En retard)' 
          : 'Présence enregistrée'
      };
    } catch (error: any) {
      console.error('Error scanning coach QR:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors du scan'
      };
    }
  },

  getScanHistory: async (startDate: string): Promise<LearnerAttendance[]> => {
    const response = await api.get('/attendance/history', {
      params: { date: startDate }
    });
    return response.data;
  },

  submitJustification: async (
    attendanceId: string,
    justification: string,
    document?: File
  ) => {
    const formData = new FormData();
    formData.append('justification', justification);
    if (document) {
      formData.append('document', document);
    }

    const response = await api.post(`/attendance/absence/${attendanceId}/justify`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
 
async updateJustificationStatus(
  attendanceId: string,
  status: 'APPROVED' | 'REJECTED',
  comment?: string
) {
  const response = await api.put(
    `/attendance/absence/${attendanceId}/status`,
    { status, comment } // ✅ Assurez-vous que le body est correct
  );
  return response.data;
},

  getJustificationRequests: async () => {
    const response = await api.get('/attendance/justification-requests');
    return response.data;
  },

  // getUnreadNotifications: async () => {
  //   const response = await api.get('/notifications');
  //   return response.data;
  // },

  // markNotificationAsRead: async (notificationId: string) => {
  //   const response = await api.patch(`/notifications/${notificationId}/read`);
  //   return response.data;
  // },
};

// export const notificationsAPI = {
//   getUnread: async (): Promise<NotificationResponse[]> => {
//     try {
//       const response = await api.get('/api/notifications');
//       return response.data;
//     } catch (error) {
//       console.error('Erreur lors de la récupération des notifications:', error);
      
//       // ✅ Gestion gracieuse en attendant l'implémentation de l'API
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 404) {
//           console.warn('⚠️ API notifications non implémentée, retour de données vides');
//           return []; // Retourne un tableau vide au lieu de planter
//         }
//       }
      
//       // ✅ Pour les autres erreurs, retourner un tableau vide aussi
//       return [];
//     }
//   },
  
//   markAsRead: async (notificationId: string): Promise<void> => {
//     try {
//       await api.patch(`/api/notifications/${notificationId}/read`);
//     } catch (error) {
//       console.error('Erreur lors du marquage de la notification:', error);
//       if (axios.isAxiosError(error) && error.response?.status === 404) {
//         console.warn('⚠️ Endpoint markAsRead non implémenté');
//         return; // Ne pas throw pour éviter de casser l'app
//       }
//       throw error;
//     }
//   },

//   getNotificationsByAttendance: async (attendanceId: string): Promise<NotificationResponse[]> => {
//     try {
//       const response = await api.get(`/api/notifications/attendance/${attendanceId}`);
//       return response.data;
//     } catch (error) {
//       console.error('Erreur lors de la récupération des notifications par présence:', error);
//       throw error;
//     }
//   },

//   testNotification: async (): Promise<void> => {
//     try {
//       await api.post('/api/notifications/test');
//     } catch (error) {
//       console.error('Erreur lors du test de notification:', error);
//       throw error;
//     }
//   }
// };

// Promotions API calls
export const promotionsAPI = {
  getAllPromotions: async () => {
    try {
      const response = await api.get('/promotions');
      
      const promotions = response.data.map(promotion => ({
        ...promotion,
        learnerCount: promotion.learners?.length || 0
      }));
      
      return promotions;
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw error;
    }
  },
  
  getPromotionById: async (id: string) => {
    try {
      const response = await api.get(`/promotions/${id}`);
      
      return {
        ...response.data,
        learnerCount: response.data.learners?.length || 0
      };
    } catch (error) {
      console.error('Error fetching promotion:', error);
      throw error;
    }
  },
  
  createPromotion: async (formData: FormData) => {
    try {
      const response = await api.post('/promotions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  },

  updatePromotionStatus: async (promotionId: string, status: 'ACTIVE' | 'INACTIVE') => {
    try {
      const response = await api.patch(`/promotions/${promotionId}/status`, { status });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating promotion status:', error);
      throw error;
    }
  },
  updatePromotion: async (id: string, formData: FormData) => {
  const response = await api.put(`/promotions/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
},

removeReferentialFromPromotion: async (promotionId: string, referentialId: string) => {
  const response = await api.delete(`/promotions/${promotionId}/referentials/${referentialId}`);
  return response.data;
},

  getAllPromotionsSimple: async (): Promise<Promotion[]> => {
    return fetchWithAuth('/promotions')
  },

  getPromotionByIdSimple: async (id: string): Promise<Promotion> => {
    return fetchWithAuth(`/promotions/${id}`)
  },

  createPromotionSimple: async (data: Partial<Promotion>): Promise<Promotion> => {
    return fetchWithAuth('/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updatePromotionSimple: async (id: string, data: Partial<Promotion>): Promise<Promotion> => {
    return fetchWithAuth(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deletePromotionSimple: async (id: string): Promise<void> => {
    return fetchWithAuth(`/promotions/${id}`, {
      method: 'DELETE',
    })
  },
};

export async function deleteModule(id: string) {
  return await axios.delete(`/modules/${id}`);
}


// Users API calls
export const usersAPI = {
  getUserByEmail: async (email: string) => {
    try {
      const response = await api.get(`/users/email/${email}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  },

  getUserById: async (id: string) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user by id:', error);
      return null;
    }
  },

  getUserDetailsWithPhoto: async (email: string) => {
    try {
      const response = await api.get(`/users/email/${email}`);
      const user = response.data;
      
      if (!user || !user.details) {
        console.log('No user details found for:', email);
        return null;
      }

      let photoUrl = null;
      if (user.details) {
        photoUrl = user.details.photoUrl;
      }

      return {
        ...user,
        photoUrl
      };
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  },

  getUserPhoto: async (email: string) => {
    try {
      const token = getAuthToken();
      const response = await api.get(`/users/photo/${email}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.photoUrl;
    } catch (error) {
      console.error('Error fetching user photo:', error);
      return null;
    }
  }
};
export type MealType = 'BREAKFAST' | 'LUNCH'

export interface MealScan {
  id: string
  learnerId: string
  type: MealType
  scannedAt: string
  restaurateurId: string
  learner?: {
    id: string
    firstName: string
    lastName: string
    matricule: string
    photoUrl?: string
  }
  restaurateur?: {
    id: string
    firstName: string
    lastName: string
  }
}

// ---------------------
// APIs
// ---------------------

// 1. Scanner un repas
export async function scanMeal(learnerId: string, type: MealType): Promise<MealScan> {
  return fetchWithAuth('/meal-scans', {
    method: 'POST',
    body: JSON.stringify({ learnerId, type }),
  })
}

// 2. Récupérer tous les repas scannés aujourd’hui
export async function getTodayMealScans(): Promise<MealScan[]> {
  return fetchWithAuth('/meal-scans/today', { method: 'GET' })
}

// 2. Récupérer tous les repas scannés aujourd’hui
export async function findbyQRcode(code: string): Promise<StudentType> {
  return fetchWithAuth(`/learners/matricule/${code}`, { method: 'GET' })
}

// 3. Récupérer l’historique des repas d’un apprenant
export async function getMealScansByLearner(learnerId: string): Promise<MealScan[]> {
  return fetchWithAuth(`/meal-scans/learner/${learnerId}`, { method: 'GET' })
};
// 📌 AJOUTEZ CES EXPORTS À LA FIN DE VOTRE FICHIER /lib/api.ts

// ==========================================
// Schedule API
// ==========================================
export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  promotionId: string;
  moduleId?: string;
  coachId?: string;
  createdAt: string;
  updatedAt: string;
}

export const scheduleAPI = {
  /**
   * Récupérer le planning d'une promotion
   */
  getScheduleByPromotionId: async (promotionId: string): Promise<ScheduleEvent[]> => {
    try {
      console.log('📅 Fetching schedule for promotion:', promotionId);
      const response = await api.get(`/schedules/promotion/${promotionId}`);
      console.log('✅ Schedule received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching schedule:', error);
      
      // Si l'endpoint n'existe pas encore, retourner un tableau vide
      if (error.response?.status === 404) {
        console.warn('⚠️ Schedule endpoint not found, returning empty array');
        return [];
      }
      
      throw error;
    }
  },

  /**
   * Créer un événement dans le planning
   */
  createScheduleEvent: async (eventData: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleEvent> => {
    try {
      const response = await api.post('/schedules', eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating schedule event:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un événement
   */
  updateScheduleEvent: async (id: string, eventData: Partial<ScheduleEvent>): Promise<ScheduleEvent> => {
    try {
      const response = await api.put(`/schedules/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error('Error updating schedule event:', error);
      throw error;
    }
  },

  /**
   * Supprimer un événement
   */
  deleteScheduleEvent: async (id: string): Promise<void> => {
    try {
      await api.delete(`/schedules/${id}`);
    } catch (error) {
      console.error('Error deleting schedule event:', error);
      throw error;
    }
  },
};

// ==========================================
// Projects API
// ==========================================
export interface Project {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  promotionId: string;
  moduleId?: string;
  referentialId?: string;
  createdAt: string;
  updatedAt: string;
  learners?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
  }>;
}

export const projectsAPI = {
  /**
   * Récupérer tous les projets d'une promotion
   */
  getProjectsByPromotionId: async (promotionId: string): Promise<Project[]> => {
    try {
      console.log('📂 Fetching projects for promotion:', promotionId);
      const response = await api.get(`/projects/promotion/${promotionId}`);
      console.log('✅ Projects received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching projects:', error);
      
      // Si l'endpoint n'existe pas encore, retourner un tableau vide
      if (error.response?.status === 404) {
        console.warn('⚠️ Projects endpoint not found, returning empty array');
        return [];
      }
      
      throw error;
    }
  },

  /**
   * Récupérer un projet par ID
   */
  getProjectById: async (id: string): Promise<Project> => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau projet
   */
  createProject: async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un projet
   */
  updateProject: async (id: string, projectData: Partial<Project>): Promise<Project> => {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  /**
   * Supprimer un projet
   */
  deleteProject: async (id: string): Promise<void> => {
    try {
      await api.delete(`/projects/${id}`);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  /**
   * Assigner des apprenants à un projet
   */
  assignLearnersToProject: async (projectId: string, learnerIds: string[]): Promise<Project> => {
    try {
      const response = await api.post(`/projects/${projectId}/learners`, { learnerIds });
      return response.data;
    } catch (error) {
      console.error('Error assigning learners to project:', error);
      throw error;
    }
  },
};
// Ajout des fonctions utilitaires exportées
export { getAuthToken, setAuthToken, removeAuthToken };

export default api;