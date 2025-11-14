// API client pour les apprenants
import { ApiClient } from '../../lib/api/base';

export interface ValidationResponse {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errors?: string[];
  validationErrors?: Array<{
    field: string;
    message: string;
    value: any;
    line?: number;
  }>;
}

export interface BulkImportResponse {
  totalProcessed: number;
  successfulImports: number;
  failedImports: number;
  results: Array<{
    success: boolean;
    email: string;
    firstName?: string;
    lastName?: string;
    learnerId?: string;
    matricule?: string;
    error?: string;
    warnings?: string[];
    validationErrors?: Array<{
      field: string;
      message: string;
      value: any;
    }>;
  }>;
  summary?: {
    duplicateEmails: number;
    duplicatePhones: number;
    sessionCapacityWarnings: number;
    missingReferentials: number;
    invalidData: number;
  };
}

class LearnersAPI extends ApiClient {
  constructor() {
    super('learners');
  }

  // Valider un fichier CSV avant import
  async validateBulkImport(formData: FormData): Promise<ValidationResponse> {
    return this.request<ValidationResponse>('bulk-validate', {
      method: 'POST',
      body: formData,
      headers: {
        // Ne pas spécifier Content-Type pour FormData
      }
    });
  }

  // Import en masse depuis fichier CSV
  async bulkImport(formData: FormData): Promise<BulkImportResponse> {
    return this.request<BulkImportResponse>('bulk-import', {
      method: 'POST',
      body: formData,
      headers: {
        // Ne pas spécifier Content-Type pour FormData
      }
    });
  }

  // Créer des apprenants en masse depuis données JSON
  async bulkCreate(learners: any[]): Promise<BulkImportResponse> {
    return this.request<BulkImportResponse>('bulk-create', {
      method: 'POST',
      body: JSON.stringify({ learners }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Télécharger le template CSV
  async downloadCSVTemplate(): Promise<string> {
    const response = await fetch(`${this.baseURL}/csv-template`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.text();
  }

  // Méthodes existantes
  async getAll() {
    return this.request('');
  }

  async getById(id: string) {
    return this.request(`${id}`);
  }

  async create(data: any, photoFile?: File) {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        if (typeof data[key] === 'object') {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    if (photoFile) {
      formData.append('photoFile', photoFile);
    }

    return this.request('', {
      method: 'POST',
      body: formData,
      headers: {}  // Laisser le navigateur définir le Content-Type pour FormData
    });
  }

  async update(id: string, data: any) {
    return this.request(`${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateStatus(id: string, status: string) {
    return this.request(`${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async updateKit(id: string, kitData: any) {
    return this.request(`${id}/kit`, {
      method: 'PUT',
      body: JSON.stringify(kitData)
    });
  }

  async getAttendanceStats(id: string) {
    return this.request(`${id}/attendance-stats`);
  }

  async findByEmail(email: string) {
    return this.request(`email/${encodeURIComponent(email)}`);
  }

  async getWaitingList(promotionId?: string) {
    const params = promotionId ? `?promotionId=${promotionId}` : '';
    return this.request(`waiting-list${params}`);
  }

  async getStatusHistory(id: string) {
    return this.request(`${id}/status-history`);
  }

  async getDocuments(id: string) {
    return this.request(`${id}/documents`);
  }

  async getAttendance(id: string) {
    return this.request(`${id}/attendance`);
  }

  async uploadDocument(id: string, file: File, type: string, name: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('name', name);

    return this.request(`${id}/documents`, {
      method: 'POST',
      body: formData,
      headers: {}
    });
  }

  async patchUpdateStatus(id: string, data: { status: string; reason?: string }) {
    return this.request(`${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async replaceLearner(data: { activeLearnerForReplacement: string; replacementLearnerId: string; reason: string }) {
    return this.request('replace', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  async findByMatricule(id: string) {
  return this.request(`matricule/${id}`);
  }
}

export const learnersAPI = new LearnersAPI();