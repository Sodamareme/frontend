import { getUserFriendlyErrorMessage } from './error';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Grade {
  id: string;
  value: number;
  comment?: string;
  moduleId: string;
  learnerId: string;
  createdAt: string;
  updatedAt: string;
  module?: {
    id: string;
    name: string;
  };
  learner?: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    photoUrl?: string;
  };
}

export interface CreateGradeData {
  moduleId: string;
  learnerId: string;
  value: number;
  comment?: string;
}

export interface UpdateGradeData {
  value: number;
  comment?: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export const gradesAPI = {
  async createGrade(gradeData: CreateGradeData) {
    const response = await fetch(`${API_BASE_URL}/grades`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(gradeData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      throw new Error(
        getUserFriendlyErrorMessage(
          errorData,
          'Impossible de créer la note pour le moment.',
        ),
      );
    }

    return response.json();
  },

  async updateGrade(gradeId: string, gradeData: UpdateGradeData) {
    const response = await fetch(`${API_BASE_URL}/grades/${gradeId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(gradeData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      throw new Error(
        getUserFriendlyErrorMessage(
          errorData,
          'Impossible de mettre à jour la note pour le moment.',
        ),
      );
    }

    return response.json();
  },

  async getGradesByModule(moduleId: string) {
    const response = await fetch(`${API_BASE_URL}/grades/module/${moduleId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      throw new Error(
        getUserFriendlyErrorMessage(
          errorData,
          'Impossible de charger les notes pour le moment.',
        ),
      );
    }

    return response.json();
  },

  async deleteGrade(gradeId: string) {
    const response = await fetch(`${API_BASE_URL}/grades/${gradeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      throw new Error(
        getUserFriendlyErrorMessage(
          errorData,
          'Impossible de supprimer la note pour le moment.',
        ),
      );
    }

    return response.json();
  },
};
