export interface Tutor {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt?: string;
}

export interface Learner {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate: string;
  birthPlace: string;
  promotionId: string;
  refId?: string;
  sessionId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'WAITING';
  matricule?: string;
  tutorFirstName: string;
  tutorLastName: string;
  tutorPhone: string;
  tutorAddress: string;
  tutorEmail?: string;
  createdAt?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface ImportResult {
  success: boolean;
  email: string;
  firstName?: string;
  lastName?: string;
  learnerId?: string;
  matricule?: string;
  error?: string;
  warnings?: string[];
  validationErrors?: ValidationError[];
}

export interface ImportResponse {
  totalProcessed: number;
  successfulImports: number;
  failedImports: number;
  results: ImportResult[];
  summary?: {
    duplicateEmails: number;
    duplicatePhones: number;
    sessionCapacityWarnings: number;
    missingReferentials: number;
    invalidData: number;
  };
}