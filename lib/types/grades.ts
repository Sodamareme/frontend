// Types pour les grades
export interface CreateGradeDto {
  moduleId: string;
  learnerId: string;
  value: number;
  comment?: string;
}

export interface UpdateGradeDto {
  value?: number;
  comment?: string;
}

export interface Grade {
  id: string;
  value: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
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
  module?: {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
  };
}

// Validation des données
export function validateGradeData(data: any): { isValid: boolean; error?: string } {
  if (!data.moduleId || !data.learnerId || data.value === undefined) {
    return { isValid: false, error: 'moduleId, learnerId et value sont requis' };
  }

  if (data.value < 0 || data.value > 20) {
    return { isValid: false, error: 'La note doit être comprise entre 0 et 20' };
  }

  if (data.comment && data.comment.length > 500) {
    return { isValid: false, error: 'Le commentaire ne peut pas dépasser 500 caractères' };
  }

  return { isValid: true };
}