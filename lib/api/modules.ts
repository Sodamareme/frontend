const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface Grade {
  id: string;
  value: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  photoUrl?: string;
  refId: string;
  coachId: string;
  createdAt: string;
  updatedAt: string;
  referential?: {
    id: string;
    name: string;
  };
  coach?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  grades?: Grade[];
}

export interface CreateModuleData {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  refId: string;
  coachId: string;
  photoUrl?: string;
}

export interface UpdateModuleData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  refId?: string;
  coachId?: string;
  photoUrl?: string;
}

export interface CreateGradeData {
  learnerId: string;
  value: number;
  comment?: string;
}

export interface UpdateGradeData {
  value: number;
  comment?: string;
}

// Fonction pour obtenir le token d'authentification
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export const modulesAPI = {
  // Créer un nouveau module
  async createModule(data: CreateModuleData): Promise<Module> {
    console.log('API: Creating module with data:', data);

    const response = await fetch(`${API_BASE_URL}/modules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      console.error('API Error:', response.status, errorData);
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Module created successfully:', result);
    return result;
  },

  // Mettre à jour un module
  async updateModule(id: string, data: UpdateModuleData): Promise<Module> {
    console.log('API: Updating module:', id, data);

    const response = await fetch(`${API_BASE_URL}/modules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      console.error('API Error:', response.status, errorData);
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Module updated successfully:', result);
    return result;
  },

  // Récupérer tous les modules
  async getAllModules(): Promise<Module[]> {
    const response = await fetch(`${API_BASE_URL}/modules`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    return response.json();
  },

  // Récupérer un module par ID
  async getModuleById(id: string): Promise<Module> {
    console.log('API: Getting module by ID:', id);

    const response = await fetch(`${API_BASE_URL}/modules/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      console.error('API Error:', response.status, errorData);
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Module retrieved successfully:', result);
    return result;
  },

  // Récupérer les modules par référentiel
  async getModulesByReferential(refId: string): Promise<Module[]> {
    const response = await fetch(`${API_BASE_URL}/modules/referential/${refId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    return response.json();
  },

  // Supprimer un module
  async deleteModule(id: string): Promise<void> {
    console.log('API: Deleting module:', id);

    const response = await fetch(`${API_BASE_URL}/modules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      console.error('API Error:', response.status, errorData);
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    console.log('API: Module deleted successfully');
  },

  // Ajouter une note (grade) à un module
  async addGrade(moduleId: string, gradeData: CreateGradeData): Promise<Grade> {
    console.log('API: Adding grade to module:', moduleId, gradeData);

    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/grades`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(gradeData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      console.error('API Error:', response.status, errorData);
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Grade added successfully:', result);
    return result;
  },

  // Mettre à jour une note (grade)
  async updateGrade(moduleId: string, gradeId: string, gradeData: UpdateGradeData): Promise<Grade> {
    console.log('API: Updating grade:', gradeId, gradeData);

    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/grades/${gradeId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(gradeData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      console.error('API Error:', response.status, errorData);
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Grade updated successfully:', result);
    return result;
  },

  // Récupérer les notes (grades) d'un module
  async getGradesByModule(moduleId: string): Promise<Grade[]> {
    console.log('API: Getting grades for module:', moduleId);

    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/grades`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      console.error('API Error:', response.status, errorData);
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Grades retrieved successfully:', result);
    return result;
  },
};
