// src/lib/api/coaches.ts
import api from './axios-config';

interface Coach {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string;
  qrCode?: string;
  refId?: string;
  referential?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  coach: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
    referential?: string;
  };
  checkIn?: {
    time: string;
    isLate: boolean;
  };
  checkOut?: {
    time: string;
  };
  isPresent: boolean;
  isLate: boolean;
}

const handleApiError = (error: any) => {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data?.message || 'Erreur serveur',
      data: error.response.data,
    };
  } else if (error.request) {
    return {
      status: 0,
      message: 'Pas de réponse du serveur',
      data: null,
    };
  } else {
    return {
      status: 0,
      message: error.message || 'Erreur inconnue',
      data: null,
    };
  }
};

export const coachesAPI = {
  // GET ALL COACHES
  getAllCoaches: async (): Promise<Coach[]> => {
    try {
      const response = await api.get('/coaches');
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },

  // GET ONE COACH
  getCoachById: async (id: string): Promise<Coach> => {
    try {
      const response = await api.get(`/coaches/${id}`);
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },

  // CREATE COACH
  createCoach: async (formData: FormData): Promise<Coach> => {
    try {
      const response = await api.post('/coaches', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },

  // UPDATE COACH
  updateCoach: async (id: string, formData: FormData): Promise<Coach> => {
    try {
      const response = await api.put(`/coaches/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },

  // DELETE COACH
  deleteCoach: async (id: string): Promise<void> => {
    try {
      await api.delete(`/coaches/${id}`);
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },

  // SCAN ATTENDANCE
  scanAttendance: async (qrData: string) => {
    try {
      const response = await api.post('/coaches/scan-attendance', { qrData });
      return response.data;
    } catch (error: any) {
      const apiError = handleApiError(error);
      throw apiError;
    }
  },

  // GET ATTENDANCE HISTORY
  getAttendanceHistory: async (
    coachId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<AttendanceRecord[]> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/coaches/${coachId}/attendance${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },

  // GET TODAY'S ATTENDANCE
  getTodayAttendance: async (): Promise<AttendanceRecord[]> => {
    try {
      const response = await api.get('/coaches/attendance/today');
      return response.data;
    } catch (error: any) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },
};
