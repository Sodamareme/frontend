// Types pour l'authentification et les utilisateurs
export interface User {
  id: string
  email: string
  role: 'ADMIN' | 'COACH' | 'APPRENANT' | 'RESTAURATEUR' | 'VIGIL'
  profile?: {
    firstName: string
    lastName: string
    phone: string
  }
}

export interface UserExtended extends User {
  photoUrl?: string
}

// Types pour les référentiels et promotions
export interface Referential {
  id: string
  name: string
  description?: string
  photoUrl?: string
  capacity: number
  category: string
  status: string
}

export interface Promotion {
  id: string
  name: string
  startDate: string
  endDate: string
  photoUrl?: string
  status: 'ACTIVE' | 'INACTIVE'
  learnerCount: number
}

// Types pour les apprenants
export type LearnerStatus = 'ACTIVE' | 'WAITING' | 'ABANDONED' | 'REPLACEMENT' | 'REPLACED'

export interface Learner {
  id: string
  firstName: string
  lastName: string
  email: string
  address?: string
  gender: 'MALE' | 'FEMALE'
  birthDate: string
  birthPlace: string
  phone: string
  photoUrl?: string
  status: LearnerStatus
  qrCode: string
  matricule: string
  userId: string
  refId?: string
  promotionId: string
  createdAt: string
  updatedAt: string
  referential?: Referential
  promotion?: Promotion
  attendances?: LearnerAttendance[]
  kit?: Kit
}

// Types pour les kits
export interface Kit {
  id: string
  laptop: boolean
  charger: boolean
  bag: boolean
  polo: boolean
  learnerId: string
}

// Types pour les présences
export type AttendanceStatus = 'TO_JUSTIFY' | 'PENDING' | 'APPROVED' | 'REJECTED'

export interface LearnerAttendance {
  id: string
  learnerId: string
  date: string
  scanTime?: string
  isPresent: boolean
  isLate: boolean
  status: AttendanceStatus
  justification?: string
  documentUrl?: string
  justificationComment?: string
  learner: {
    id: string
    firstName: string
    lastName: string
    matricule: string
    photoUrl?: string
    address?: string
    referential?: {
      id: string
      name: string
    }
  }
}

// Types pour les statistiques de présence
export interface AttendanceStats {
  present: number
  late: number
  absent: number
  total: number
  attendance?: LearnerAttendance[]
  totalDays?: number
}

// Types pour les filtres
export type DateFilterType = 'day' | 'week' | 'month' | 'year'

export interface AttendanceFilters {
  dateFilter: DateFilterType
  selectedDate: string
  searchQuery: string
  statusFilter: string
}

// Types pour les modules
export interface Module {
  id: string
  name: string
  description?: string
  photoUrl?: string
  startDate: string
  endDate: string
  refId: string
  coachId: string
  coach?: {
    id: string
    firstName: string
    lastName: string
    photoUrl?: string
  }
  referential?: {
    id: string
    name: string
  }
}

// Types pour les notes
export interface Grade {
  id: string
  value: number
  comment?: string
  createdAt: string
  moduleId: string
  learnerId: string
  learner: {
    id: string
    firstName: string
    lastName: string
    matricule: string
    photoUrl?: string
    referential: {
      id: string
      name: string
    } | null
  }
}

// Types pour les notifications
export interface NotificationResponse {
  id: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  attendanceId?: string
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}
// src/lib/types.ts
export interface LearnerFormSubmitData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
  promotionId: string;
  refId: string;
  status: string;
  photoFile?: File;
  tutor: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address: string;
  };
}

export interface ScanResponse {
  type: 'LEARNER' | 'COACH'
  scanTime: Date
  attendanceStatus: 'PRESENT' | 'LATE' | 'ABSENT'
  isAlreadyScanned: boolean
  learner?: {
    id: string
    matricule: string
    firstName: string
    lastName: string
    photoUrl: string | null
    referential: { name: string } | null
    promotion: { name: string }
  }
  coach?: {
    id: string
    matricule: string
    firstName: string
    lastName: string
    photoUrl: string | null
    referential: { name: string } | null
  }
}

// Constantes
export const DATE_FILTER_OPTIONS = [
  { value: 'day', label: 'Journalier' },
  { value: 'week', label: 'Hebdomadaire' },
  { value: 'month', label: 'Mensuel' },
  { value: 'year', label: 'Annuel' }
] as const

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'present', label: 'Présent' },
  { value: 'late', label: 'En retard' },
  { value: 'absent', label: 'Absent' }
] as const

export const LEARNER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'WAITING', label: 'En attente' },
  { value: 'ABANDONED', label: 'Abandonné' },
  { value: 'REPLACEMENT', label: 'Remplaçant' },
  { value: 'REPLACED', label: 'Remplacé' }
] as const