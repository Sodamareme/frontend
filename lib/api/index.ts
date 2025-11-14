// Re-export des API existantes
export * from './modules';
export * from './grades';

// Import des types depuis les modules spécifiques
export type { Module, CreateModuleData, UpdateModuleData } from './modules';
export type { Grade, CreateGradeData, UpdateGradeData } from './grades';

// Types pour les autres entités
export interface Referential {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Learner {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  photoUrl?: string;
  email?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

// APIs factices pour les autres entités (à remplacer par les vraies)
export const referentialsAPI = {
  async getAllReferentials(): Promise<Referential[]> {
    // Implémentation à compléter selon votre backend
    return [];
  }
};

export const promotionsAPI = {
  async getAllPromotions(): Promise<any[]> {
    // Implémentation à compléter selon votre backend
    return [];
  }
};