// lib/gradeService.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Grade {
  id: number;
  learnerId: number;
  moduleId: number;
  instructorId: number;
  value: number;
  comment: string;
  isValidated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradeData {
  learnerId: number;
  moduleId: number;
  instructorId: number;
  value: number;
  comment?: string;
}

export interface UpdateGradeData {
  value?: number;
  comment?: string;
}

export interface GradeStats {
  totalStudents: number;
  validatedStudents: number;
  validationRate: number;
  averageGrade: number;
}

class GradeService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/grades${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        // Ajoutez ici le token d'authentification si nécessaire
        // 'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Pour les réponses 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async createGrade(data: CreateGradeData): Promise<Grade> {
    return this.request<Grade>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async upsertGrade(data: CreateGradeData): Promise<Grade> {
    return this.request<Grade>('/upsert', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateGrade(id: number, data: UpdateGradeData): Promise<Grade> {
    return this.request<Grade>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getGradesByModule(moduleId: number): Promise<Grade[]> {
    return this.request<Grade[]>(`/module/${moduleId}`);
  }

  async getGradeByLearnerAndModule(
    learnerId: number,
    moduleId: number
  ): Promise<Grade | null> {
    try {
      return await this.request<Grade>(`/learner/${learnerId}/module/${moduleId}`);
    } catch (error) {
      // Si la note n'existe pas, retourner null
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async deleteGrade(id: number): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  async getModuleGradeStats(moduleId: number): Promise<GradeStats> {
    return this.request<GradeStats>(`/module/${moduleId}/stats`);
  }
}

export const gradeService = new GradeService();