const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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

// Fonction pour obtenir le token d'authentification
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

// Dans votre fichier lib/api.ts, vérifiez que les méthodes gradesAPI sont correctement définies

// Option 1: Si l'endpoint devrait être /api/grades
export const gradesAPI = {
  // Créer une nouvelle note
  createGrade: async (gradeData: {
    moduleId: string;
    learnerId: string;
    value: number;
    comment: string;
  }) => {
    const response = await fetch('/api/grades', {  // Assurez-vous que c'est /api/grades
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gradeData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Mettre à jour une note existante
  updateGrade: async (gradeId: string, gradeData: {
    moduleId: string;
    learnerId: string;
    value: number;
    comment: string;
  }) => {
    const response = await fetch(`/api/grades/${gradeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gradeData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Récupérer les notes par module
  getGradesByModule: async (moduleId: string) => {
    const response = await fetch(`/api/grades?moduleId=${moduleId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Supprimer une note
  deleteGrade: async (gradeId: string) => {
    const response = await fetch(`/api/grades/${gradeId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

// Option 2: Si l'endpoint est différent, par exemple /api/modules/grades
export const gradesAPI_Alternative = {
  createGrade: async (gradeData: {
    moduleId: string;
    learnerId: string;
    value: number;
    comment: string;
  }) => {
    const response = await fetch('/api/modules/grades', {  // Endpoint alternatif
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gradeData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  updateGrade: async (gradeId: string, gradeData: {
    moduleId: string;
    learnerId: string;
    value: number;
    comment: string;
  }) => {
    const response = await fetch(`/api/modules/grades/${gradeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gradeData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  getGradesByModule: async (moduleId: string) => {
    const response = await fetch(`/api/modules/${moduleId}/grades`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

// Option 3: Utilisation d'une instance Axios avec gestion d'erreur améliorée
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const gradesAPI_Axios = {
  createGrade: async (gradeData: {
    moduleId: string;
    learnerId: string;
    value: number;
    comment: string;
  }) => {
    const response = await api.post('/grades', gradeData);
    return response.data;
  },

  updateGrade: async (gradeId: string, gradeData: {
    moduleId: string;
    learnerId: string;
    value: number;
    comment: string;
  }) => {
    const response = await api.put(`/grades/${gradeId}`, gradeData);
    return response.data;
  },

  getGradesByModule: async (moduleId: string) => {
    const response = await api.get(`/grades`, {
      params: { moduleId }
    });
    return response.data;
  }
};

// CORRECTION pour le composant ModuleDetailsPage
// Modifiez la fonction handleSaveGrade pour une meilleure gestion d'erreur

const handleSaveGrade = async (learnerId: string) => {
  const editingGrade = editingGrades[learnerId];
  if (!editingGrade || !module?.id) {
    toast.error('Données manquantes pour sauvegarder la note');
    return;
  }

  // Validation renforcée
  if (isNaN(editingGrade.value) || editingGrade.value < 0 || editingGrade.value > 20) {
    toast.error('La note doit être un nombre valide entre 0 et 20');
    return;
  }

  try {
    setSavingGrades(prev => new Set(prev).add(learnerId));

    const gradeData = {
      moduleId: module.id,
      learnerId,
      value: Number(editingGrade.value), // Assurez-vous que c'est un nombre
      comment: editingGrade.comment.trim()
    };

    console.log('Saving grade data:', gradeData); // Debug

    let savedGrade;
    if (editingGrade.id) {
      // Mise à jour d'une note existante
      console.log('Updating existing grade:', editingGrade.id);
      savedGrade = await gradesAPI.updateGrade(editingGrade.id, gradeData);
    } else {
      // Création d'une nouvelle note
      console.log('Creating new grade');
      savedGrade = await gradesAPI.createGrade(gradeData);
    }

    console.log('Grade saved successfully:', savedGrade);

    // Mettre à jour la liste des notes
    setGrades(prev => {
      const filtered = prev.filter(g => g.learnerId !== learnerId);
      return [...filtered, savedGrade];
    });

    // Arrêter l'édition
    handleCancelEditGrade(learnerId);
    
    toast.success(`Note ${editingGrade.id ? 'mise à jour' : 'créée'} avec succès`);
  } catch (err: any) {
    console.error('Erreur lors de la sauvegarde de la note:', err);
    
    // Gestion d'erreur plus détaillée
    if (err.response?.status === 404) {
      toast.error('Endpoint non trouvé. Vérifiez la configuration de l\'API');
    } else if (err.response?.status === 400) {
      toast.error('Données invalides. Vérifiez les champs');
    } else if (err.response?.status === 401) {
      toast.error('Non autorisé. Vérifiez votre authentification');
    } else if (err.response?.status === 500) {
      toast.error('Erreur serveur. Contactez l\'administrateur');
    } else if (err.response?.data?.message) {
      toast.error(`Erreur: ${err.response.data.message}`);
    } else {
      toast.error('Erreur réseau. Vérifiez votre connexion');
    }
  } finally {
    setSavingGrades(prev => {
      const newSet = new Set(prev);
      newSet.delete(learnerId);
      return newSet;
    });
  }
};

// DEBUGGING: Ajoutez cette fonction pour tester manuellement l'API
const testGradeAPI = async () => {
  try {
    console.log('Testing grade API endpoints...');
    
    // Test GET
    const testModuleId = 'your-test-module-id';
    const grades = await fetch(`/api/grades?moduleId=${testModuleId}`);
    console.log('GET grades status:', grades.status);
    
    // Test POST (commentez après le test)
    /*
    const testGrade = {
      moduleId: 'test-module',
      learnerId: 'test-learner',
      value: 15,
      comment: 'Test comment'
    };
    
    const createResponse = await fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testGrade)
    });
    
    console.log('POST grades status:', createResponse.status);
    console.log('POST grades response:', await createResponse.text());
    */
  } catch (error) {
    console.error('API test failed:', error);
  }
};

// Appelez cette fonction dans useEffect pour debug
// useEffect(() => {
//   testGradeAPI();
// }, []);