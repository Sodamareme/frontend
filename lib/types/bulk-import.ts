export interface BulkCreateLearnerDto {
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
  tutorFirstName: string;
  tutorLastName: string;
  tutorPhone: string;
  tutorAddress: string;
  tutorEmail?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface LearnerImportResultDto {
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

export interface BulkImportResponseDto {
  totalProcessed: number;
  successfulImports: number;
  failedImports: number;
  results: LearnerImportResultDto[];
  summary?: {
    duplicateEmails: number;
    duplicatePhones: number;
    sessionCapacityWarnings: number;
    missingReferentials: number;
    invalidData: number;
  };
}