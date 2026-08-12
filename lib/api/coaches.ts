// src/lib/api/coaches.ts
import api from './axios-config';
import { getUserFriendlyErrorMessage } from './error';

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
      message: getUserFriendlyErrorMessage(error, 'Erreur serveur'),
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
      message: getUserFriendlyErrorMessage(error, 'Erreur inconnue'),
      data: null,
    };
  }
};

export const coachesAPI = {
  // GET ALL COACHES
  getAllCoaches: async (): Promise<Coach[]> => {
    try {
      console.log('🔄 Fetching all coaches...');
      const response = await api.get('/coaches');
      console.log('✅ Coaches received:', response.data);
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('❌ Failed to fetch coaches:', apiError);
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
      console.log('🚀 Sending coach creation request...');
      
      const response = await api.post('/coaches', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Coach created successfully:', response.data);
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('❌ Failed to create coach:', apiError);
      throw new Error(apiError.message);
    }
  },

  // UPDATE COACH
  updateCoach: async (id: string, formData: FormData): Promise<Coach> => {
    try {
      console.log('🔄 Updating coach:', id);
      const response = await api.put(`/coaches/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Coach updated successfully:', response.data);
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('❌ Failed to update coach:', apiError);
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
      console.log('📱 Scanning QR Code...');
      const response = await api.post('/coaches/scan-attendance', { qrData });
      console.log('✅ Scan successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Scan error:', error);
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
      console.log('🔄 Fetching attendance history for coach:', coachId);
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/coaches/${coachId}/attendance${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Request URL:', url);
      
      const response = await api.get(url);
      console.log('✅ Attendance history received:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching attendance history:', error);
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },

  // GET TODAY'S ATTENDANCE
  getTodayAttendance: async (): Promise<AttendanceRecord[]> => {
    try {
      console.log('🔄 Fetching today\'s attendance...');
      const response = await api.get('/coaches/attendance/today');
      console.log('✅ Today\'s attendance received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching today\'s attendance:', error);
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },
};
